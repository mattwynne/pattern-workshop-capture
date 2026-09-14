export type AttributionKind = "individual" | "group" | "anonymous";

export interface PatternInput {
  captureId: string;
  name: string;
  context: string;
  problem: string;
  solution: string;
  attributionKind: AttributionKind;
  attributionName?: string;
}

export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64)
    .replace(/-$/g, "") || "untitled-pattern";
}

export function validatePattern(value: unknown): PatternInput {
  if (!value || typeof value !== "object") throw new Error("Pattern details are required");
  const input = value as Record<string, unknown>;
  const required = ["captureId", "name", "context", "problem", "solution"] as const;
  for (const field of required) {
    if (typeof input[field] !== "string" || !input[field].trim()) {
      throw new Error(`${field[0].toUpperCase()}${field.slice(1)} is required`);
    }
  }
  const kind = input.attributionKind;
  if (kind !== "individual" && kind !== "group" && kind !== "anonymous") {
    throw new Error("Choose an attribution option");
  }
  if (kind !== "anonymous" && (typeof input.attributionName !== "string" || !input.attributionName.trim())) {
    throw new Error("Enter an individual or group name");
  }
  return {
    captureId: String(input.captureId).trim(),
    name: String(input.name).trim(),
    context: String(input.context).trim(),
    problem: String(input.problem).trim(),
    solution: String(input.solution).trim(),
    attributionKind: kind,
    attributionName: kind === "anonymous" ? undefined : String(input.attributionName).trim(),
  };
}

function yamlString(value: string): string {
  return JSON.stringify(value);
}

export function patternMarkdown(pattern: PatternInput): string {
  const attribution = pattern.attributionKind === "anonymous"
    ? "Anonymous"
    : pattern.attributionName!;
  return `---\ntitle: ${yamlString(pattern.name)}\ndraft: false\ncapture_id: ${yamlString(pattern.captureId)}\nattribution: ${yamlString(attribution)}\nattribution_kind: ${yamlString(pattern.attributionKind)}\n---\n\n## Context\n\n${pattern.context}\n\n## Problem\n\n${pattern.problem}\n\n## Solution\n\n${pattern.solution}\n`;
}
