import assert from "node:assert/strict";
import test from "node:test";
import type { AddressInfo } from "node:net";
import { createApp } from "../src/app.js";
import type { PatternPublisher } from "../src/github.js";

async function withServer(run: (baseUrl: string) => Promise<void>) {
  const published: Parameters<PatternPublisher["publish"]>[0][] = [];
  const publisher: PatternPublisher = {
    async publish(pattern) {
      published.push(pattern);
      return { slug: "pass-the-pen", commitUrl: "https://github.test/commit", publicUrl: "https://handbook.test/patterns/pass-the-pen/" };
    },
  };
  const server = createApp(publisher).listen(0);
  await new Promise<void>(resolve => server.once("listening", resolve));
  try { await run(`http://127.0.0.1:${(server.address() as AddressInfo).port}`); }
  finally { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
  return published;
}

test("creates a live draft and publishes it", async () => {
  const published = await withServer(async baseUrl => {
    const created = await fetch(`${baseUrl}/api/drafts`, { method: "POST" });
    assert.equal(created.status, 201);
    const draft = await created.json() as { id: string };

    const renamed = await fetch(`${baseUrl}/api/drafts/${draft.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: "Pass the pen" }),
    });
    assert.equal(renamed.status, 200);

    const response = await fetch(`${baseUrl}/api/patterns`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ captureId: draft.id, name: "Pass the pen", context: "Mapping", problem: "Dominance", solution: "Take turns", attributionKind: "anonymous" }),
    });
    assert.equal(response.status, 201);
    const result = await response.json() as { publicUrl: string };
    assert.equal(result.publicUrl, "https://handbook.test/patterns/pass-the-pen/");
  });
  assert.equal(published.length, 1);
});

test("refuses publication for an expired draft", async () => {
  await withServer(async baseUrl => {
    const response = await fetch(`${baseUrl}/api/patterns`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ captureId: "missing", name: "Pass the pen", context: "Mapping", problem: "Dominance", solution: "Take turns", attributionKind: "anonymous" }),
    });
    assert.equal(response.status, 409);
  });
});
