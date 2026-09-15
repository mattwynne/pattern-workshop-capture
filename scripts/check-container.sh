#!/usr/bin/env bash
set -euo pipefail
IMAGE="${1:?Usage: scripts/check-container.sh IMAGE}"
CONTAINER=""
cleanup() { if [[ -n "$CONTAINER" ]]; then docker rm -f "$CONTAINER" >/dev/null; fi; }
trap cleanup EXIT

# No published ports or external network. Read-only storage catches accidental
# media persistence. Exercise the Dockerfile's actual CMD and non-default PORT.
CONTAINER="$(docker run -d --network none --read-only --tmpfs /tmp:rw,noexec,nosuid,size=16m \
  -e PORT=18080 -e GITHUB_TOKEN=SMOKE_DUMMY_GITHUB_TOKEN \
  -e OPENROUTER_API_KEY=SMOKE_DUMMY_OPENROUTER_KEY \
  -e HANDBOOK_OWNER=smoke -e HANDBOOK_REPO=smoke \
  -e HANDBOOK_URL=https://handbook.example.invalid/ "$IMAGE")"
docker exec -i "$CONTAINER" node --input-type=module < scripts/smoke-runtime.mjs
# Validate the actual process log stream without printing it on failure.
docker logs "$CONTAINER" 2>&1 | node --input-type=module -e '
  import assert from "node:assert/strict";
  let input = ""; for await (const chunk of process.stdin) input += chunk;
  assert.ok(!input.includes("SMOKE_"), "private markers must not enter logs");
  const records = input.trim().split("\n").map(line => JSON.parse(line));
  assert.ok(records.some(record => record.event === "server_started"));
  assert.ok(records.some(record => record.route === "/health" && record.status === 200));
  for (const record of records) {
    const keys = record.event === "server_started" ? ["event", "port"]
      : ["event", "requestId", "method", "route", "status", "durationMs"];
    assert.deepEqual(Object.keys(record).sort(), keys.sort());
  }
  console.log("Production log allowlist passed.");
'
cleanup
CONTAINER=""
# A missing publishing token must fail before listening, with a safe message.
if OUTPUT="$(docker run --rm --network none --read-only "$IMAGE" 2>&1)"; then
  echo 'Startup unexpectedly accepted a missing GITHUB_TOKEN' >&2
  exit 1
fi
[[ "$OUTPUT" == *'GITHUB_TOKEN is required'* ]]
echo 'Missing-credential startup check passed.'
