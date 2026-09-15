import assert from 'node:assert/strict';
import test from 'node:test';
import { GitHubPublisher } from '../src/github.js';
import { avatarPreviews } from '../src/image.js';
import { diagramFixture } from './diagram-fixtures.js';

for (const selection of ['original', 'cleaned'] as const) {
  test(`GitHub page bundle contains only Markdown and selected ${selection}`, async t => {
    const calls: { url: string; method: string; body: any }[] = [];
    t.mock.method(globalThis, 'fetch', async (input: string, init: RequestInit = {}) => {
      const url = String(input), method = init.method || 'GET';
      const body = init.body ? JSON.parse(String(init.body)) : undefined;
      calls.push({ url, method, body });
      if (url.includes('/search/code')) return Response.json({ items: [] });
      if (url.includes('/contents/')) return new Response(null, { status: 404 });
      if (url.includes('/git/ref/heads/')) return Response.json({ object: { sha: 'parent' } });
      if (url.endsWith('/git/commits/parent')) return Response.json({ tree: { sha: 'base-tree' } });
      return Response.json({ sha: `sha-${calls.length}` });
    });
    const choices = await avatarPreviews(await diagramFixture('marker'), 'image/png');
    const selected = choices[selection]!;
    const publisher = new GitHubPublisher({ token: 'test-token', owner: 'test', repo: 'handbook', publicBaseUrl: 'https://example.test' });
    await publisher.publish({ captureId: '123', name: 'Pass the pen', context: 'mapping', problem: 'dominance', solution: 'turns', attributionKind: 'anonymous', avatarAlt: 'Two boxes and an arrow' }, selected);
    const blobs = calls.filter(call => call.url.endsWith('/git/blobs'));
    assert.equal(blobs.length, 2);
    assert.match(Buffer.from(blobs[0].body.content, 'base64').toString(), /avatar_alt: "Two boxes and an arrow"/);
    assert.deepEqual(Buffer.from(blobs[1].body.content, 'base64'), selected.bytes);
    const tree = calls.find(call => call.url.endsWith('/git/trees'))!.body.tree;
    assert.deepEqual(tree.map((entry: { path: string }) => entry.path), ['content/patterns/pass-the-pen/index.md', 'content/patterns/pass-the-pen/avatar.webp']);
    assert.equal(calls.at(-1)!.method, 'PATCH'); assert.equal(calls.at(-1)!.body.force, false);
  });
}
