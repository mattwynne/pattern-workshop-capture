import assert from "node:assert/strict";
import test from "node:test";
import { patternMarkdown, slugify, validatePattern } from "../src/pattern.js";

test("slugify creates stable readable slugs", () => {
  assert.equal(slugify("  Café: Pass the Pen!  "), "cafe-pass-the-pen");
  assert.equal(slugify("🤝"), "untitled-pattern");
});

test("validates complete patterns", () => {
  const pattern = validatePattern({
    captureId: "capture-1", name: "Pass the pen", context: "When mapping",
    problem: "One voice dominates", solution: "Take turns", attributionKind: "group",
    attributionName: "Table seven",
  });
  assert.equal(pattern.attributionName, "Table seven");
});

test("requires an attribution name unless anonymous", () => {
  assert.throws(() => validatePattern({
    captureId: "capture-1", name: "Pass the pen", context: "When mapping",
    problem: "One voice dominates", solution: "Take turns", attributionKind: "group",
  }), /Enter an individual or group name/);
});

test("renders the page bundle Markdown", () => {
  const markdown = patternMarkdown({
    captureId: "capture-1", name: "Pass the pen", context: "When mapping",
    problem: "One voice dominates", solution: "Take turns", attributionKind: "anonymous",
  });
  assert.match(markdown, /title: "Pass the pen"/);
  assert.match(markdown, /capture_id: "capture-1"/);
  assert.match(markdown, /## Context\n\nWhen mapping/);
  assert.match(markdown, /attribution: "Anonymous"/);
});
