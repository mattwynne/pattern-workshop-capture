import assert from 'node:assert/strict';
import test from 'node:test';
import { GitHubPublisher } from '../src/github.js';
import type { PatternInput } from '../src/pattern.js';

export const pattern = (captureId: string): PatternInput => ({ captureId, name: 'Same name', context: 'Private context', problem: 'Private problem', solution: 'Private solution', attributionKind: 'anonymous' });

// Stateful Git protocol double: immutable commits/trees, fast-forward-only ref updates,
// exact-ref content reads. Unlike a response queue it detects lost files and overwrites.
for (const failure of ['race', 'lost-response', 'server-error'] as const) {
  test(`concurrent same-name publication and ${failure} preserve every bundle and capture receipt`, async t => {
    let sequence = 0, head = 'initial', patches = 0;
    const blobs = new Map<string, string>();
    const trees = new Map<string, Record<string, string>>([['empty', {}]]);
    const commits = new Map([['initial', { tree: 'empty', parents: [] as string[] }]]);
    t.mock.method(globalThis, 'fetch', async (input: string, init: RequestInit = {}) => {
      const url = new URL(input), path = url.pathname;
      const body = init.body ? JSON.parse(String(init.body)) : undefined;
      const sha = () => `object-${++sequence}`;
      if (path.includes('/contents/')) {
        const file = path.split('/contents/')[1];
        const snapshot = commits.get(url.searchParams.get('ref')!)!;
        assert.ok(snapshot, 'reads use immutable commit refs');
        const blob = trees.get(snapshot.tree)![file];
        return blob ? Response.json({ content: blobs.get(blob) }) : new Response(null, { status: 404 });
      }
      if (path.includes('/git/ref/')) return Response.json({ object: { sha: head } });
      if (path.includes('/git/commits/') && !body) return Response.json({ tree: { sha: commits.get(path.split('/').at(-1)!)!.tree } });
      if (path.endsWith('/git/blobs')) { const id = sha(); blobs.set(id, body.content); return Response.json({ sha: id }); }
      if (path.endsWith('/git/trees')) {
        const id = sha(), tree = { ...trees.get(body.base_tree) };
        for (const entry of body.tree) {
          assert.equal(tree[entry.path], undefined, `must not overwrite ${entry.path}`);
          tree[entry.path] = entry.sha;
        }
        trees.set(id, tree); return Response.json({ sha: id });
      }
      if (path.endsWith('/git/commits')) { const id = sha(); commits.set(id, body); return Response.json({ sha: id }); }
      if (path.includes('/git/refs/')) {
        assert.equal(body.force, false);
        if (commits.get(body.sha)!.parents[0] !== head) return new Response(null, { status: 422 });
        head = body.sha; patches++;
        if (patches === 1 && failure === 'lost-response') throw new TypeError('connection reset');
        if (patches === 1 && failure === 'server-error') return new Response(null, { status: 502 });
        return Response.json({ object: { sha: head } });
      }
      throw new Error(`Unexpected Git request ${path}`);
    });
    const publisher = new GitHubPublisher({ token: 'secret', owner: 'test', repo: 'test', publicBaseUrl: 'https://handbook.test' });
    const results = await Promise.all([...Array.from({ length: 12 }, (_, i) => publisher.publish(pattern(`capture-${i}`))), publisher.publish(pattern('capture-0'))]);
    assert.equal(new Set(results.map(result => result.slug)).size, 12);
    const finalTree = trees.get(commits.get(head)!.tree)!;
    const pages = Object.entries(finalTree).filter(([path]) => path.endsWith('/index.md'));
    assert.equal(pages.length, 12);
    assert.equal(Object.keys(finalTree).filter(path => path.startsWith('.workshop-captures/')).length, 12);
    for (let i = 0; i < 12; i++) {
      assert.equal(pages.filter(([, sha]) => Buffer.from(blobs.get(sha)!, 'base64').toString().includes(`capture_id: "capture-${i}"`)).length, 1);
    }
    // A new publisher simulates restart and a changed name after an ambiguous response.
    const retry = await new GitHubPublisher({ token: 'secret', owner: 'test', repo: 'test', publicBaseUrl: 'https://handbook.test' }).publish({ ...pattern('capture-0'), name: 'Changed name' });
    assert.equal(retry.slug, results[0].slug); assert.equal(patches, 12);
  });
}

for (const status of [401, 403, 429, 503]) {
  test(`GitHub ${status} fails closed without writing`, async t => {
    t.mock.method(globalThis, 'fetch', async (_input: string, init?: RequestInit) => {
      assert.equal(init?.method, undefined);
      return new Response('sensitive provider detail', { status });
    });
    await assert.rejects(new GitHubPublisher({ token: 'secret', owner: 'test', repo: 'test', publicBaseUrl: 'https://handbook.test' }).publish(pattern('a')), new RegExp(String(status)));
  });
}
