import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, writeFile, readdir, readFile, stat, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { chromium } from '@playwright/test';
import { patternMarkdown } from '../src/pattern.js';
import { avatarPreviews } from '../src/image.js';
import { diagramFixture } from '../test/diagram-fixtures.js';

// Pinned public handbook revision; never edits the participant handbook checkout.
const revision = 'b78895ee30cfa075c0ebeda475494e8204806d97';
const root = await mkdtemp(join(tmpdir(), 'workshop-hugo-'));
const source = join(root, 'handbook'), output = join(root, 'site');
let browser;
try {
  execFileSync('git', ['clone', '--quiet', process.env.HANDBOOK_CHECKOUT || 'https://github.com/mattwynne/explore-ddd-anti-authoritarian-team-practices-workshop.git', source]);
  execFileSync('git', ['-C', source, 'checkout', '--quiet', '--detach', revision]);
  const images = await avatarPreviews(await diagramFixture('marker'), 'image/png');
  for (const [i, attributionKind] of (['anonymous', 'group', 'individual'] as const).entries()) {
    const dir = join(source, 'content/patterns', `rehearsal-${i}`); await mkdir(dir, { recursive: true });
    await writeFile(join(dir, 'index.md'), patternMarkdown({ captureId: `rehearsal-${i}`, name: `Rehearsal ${i}`, context: 'A room & a team', problem: 'One voice dominates', solution: 'Take turns', attributionKind, attributionName: attributionKind === 'anonymous' ? undefined : 'Table seven', avatarAlt: i ? 'Boxes and an arrow' : undefined }));
    if (i) await writeFile(join(dir, 'avatar.webp'), (i === 1 ? images.original : images.cleaned!).bytes);
  }
  execFileSync(process.env.HUGO_BIN || 'hugo', ['--source', source, '--destination', output, '--cleanDestinationDir', '--minify'], { stdio: 'inherit' });
  browser = await chromium.launch(); const page = await browser.newPage();
  const htmlFiles: string[] = [];
  async function walk(dir: string) { for (const entry of await readdir(dir, { withFileTypes: true })) { const path = join(dir, entry.name); if (entry.isDirectory()) await walk(path); else if (entry.name.endsWith('.html')) htmlFiles.push(path); } }
  await walk(output);
  const base = new URL('https://mattwynne.github.io/explore-ddd-anti-authoritarian-team-practices-workshop/');
  let checked = 0;
  for (const file of htmlFiles) {
    const html = await readFile(file, 'utf8'); await page.setContent(html);
    const links = await page.locator('[href], [src]').evaluateAll(nodes => nodes.map(node => node.getAttribute('href') || node.getAttribute('src')!));
    const location = new URL(relative(output, file).replace(/index\.html$/, ''), base);
    for (const link of links) {
      const url = new URL(link, location);
      if (url.origin !== base.origin) continue;
      if (!url.pathname.startsWith(base.pathname)) throw new Error(`Link escapes handbook base: ${link}`);
      let target = join(output, decodeURIComponent(url.pathname.slice(base.pathname.length)));
      if ((await stat(target)).isDirectory()) target = join(target, 'index.html');
      await stat(target); checked++;
      if (url.hash && target.endsWith('.html')) {
        const targetPage = await browser.newPage(); await targetPage.setContent(await readFile(target, 'utf8'));
        const id = decodeURIComponent(url.hash.slice(1));
        if (!await targetPage.evaluate(id => !!document.getElementById(id) || !!document.getElementsByName(id).length, id)) throw new Error(`Broken fragment ${link}`);
        await targetPage.close();
      }
    }
    if (file.includes('rehearsal-')) {
      if (!await page.getByRole('heading', { name: 'Solution', exact: true }).count()) throw new Error('Pattern body missing');
      if (!file.includes('rehearsal-0') && !await page.getByRole('img', { name: 'Boxes and an arrow' }).count()) throw new Error('Selected avatar/alt text missing');
    }
  }
  console.log(`Hugo ${revision}: ${htmlFiles.length} HTML pages, ${checked} local links/assets checked; three attribution choices and both avatar variants rendered. External links are not crawled.`);
} finally { await browser?.close(); await rm(root, { recursive: true, force: true }); }
