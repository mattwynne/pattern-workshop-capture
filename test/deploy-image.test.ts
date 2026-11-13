import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const repository = 'us-central1-docker.pkg.dev/test-project/pattern-workshop/capture';
const digest = `sha256:${'a'.repeat(64)}`;
const workflow = readFileSync('.github/workflows/deploy.yml', 'utf8');
const match = workflow.match(/name: Push the tested container[\s\S]*?        run: \|\n([\s\S]*?)\n      - id: deploy/);
assert.ok(match, 'find the actual image-push workflow step');
const script = match[1].replace(/^          /gm, '').replaceAll('${{ github.sha }}', 'test-commit');

for (const valid of [true, false]) {
  test(`deployment ${valid ? 'uses the fully qualified registry digest' : 'rejects a local-only digest'}`, () => {
    const directory = mkdtempSync(join(tmpdir(), 'capture-deploy-test-'));
    try {
      // Reproduce a loaded Docker artifact whose first RepoDigest is local.
      writeFileSync(join(directory, 'docker'), '#!/bin/sh\nif [ "$1" = image ]; then echo "capture@$TEST_DIGEST"; fi\n', { mode: 0o755 });
      writeFileSync(join(directory, 'gcloud'), '#!/bin/sh\nprintf "%s\\n" "$TEST_REGISTRY_DIGEST"\n', { mode: 0o755 });
      const output = join(directory, 'output');
      const result = spawnSync('bash', ['-e', '-c', script], {
        encoding: 'utf8',
        env: {
          ...process.env, PATH: `${directory}:${process.env.PATH}`,
          IMAGE: `${repository}:test-commit`, GCP_PROJECT_ID: 'test-project', GITHUB_OUTPUT: output,
          TEST_DIGEST: digest, TEST_REGISTRY_DIGEST: `${valid ? repository : 'capture'}@${digest}`,
        },
      });
      assert.equal(result.error, undefined);
      if (valid) {
        assert.equal(result.status, 0, result.stderr);
        assert.equal(readFileSync(output, 'utf8'), `image=${repository}@${digest}\n`);
      } else {
        assert.notEqual(result.status, 0);
      }
    } finally { rmSync(directory, { recursive: true, force: true }); }
  });
}
