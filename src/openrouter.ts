import sharp from "sharp";
import { normalizeAudio } from "./audio.js";
export { audioFormat } from "./audio.js";

export interface PatternSuggestions {
  name?: string;
  context?: string;
  problem?: string;
  solution?: string;
}

export interface SpeechInterpretation {
  transcript: string;
  suggestions: PatternSuggestions;
  warning?: string;
}

type Fetch = typeof fetch;

const schema = {
  type: "object",
  properties: {
    name: { type: "string" }, context: { type: "string" },
    problem: { type: "string" }, solution: { type: "string" },
  },
  additionalProperties: false,
};

export class OpenRouter {
  constructor(
    private apiKey: string,
    private visionModel = "google/gemini-2.5-flash",
    private transcriptionModel = "openai/whisper-1",
    private synthesisModel = "google/gemini-2.5-flash",
    private fetcher: Fetch = fetch,
    private timeoutMs = 60_000,
  ) {}

  private async callChat(model: string, content: unknown, signal?: AbortSignal): Promise<PatternSuggestions> {
    const response = await this.fetcher("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      signal: AbortSignal.any([AbortSignal.timeout(this.timeoutMs), ...(signal ? [signal] : [])]),
      headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content }],
        response_format: { type: "json_schema", json_schema: { name: "pattern_suggestions", strict: true, schema } },
      }),
    });
    if (!response.ok) throw new Error(`AI interpretation failed (${response.status})`);
    const result = await response.json() as { choices?: Array<{ message?: { content?: string | Array<{ type: string; text?: string }> } }> };
    const contentValue = result.choices?.[0]?.message?.content;
    const text = typeof contentValue === "string"
      ? contentValue
      : contentValue?.map(part => part.text ?? "").join("");
    if (!text) throw new Error("AI interpretation returned no suggestions");
    try {
      const parsed = JSON.parse(text.replace(/^```json\s*|\s*```$/g, "")) as Record<string, unknown>;
      if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") throw new Error();
      return Object.fromEntries(Object.entries(parsed).filter(([key, value]) => Object.hasOwn(schema.properties, key) && typeof value === "string" && value.trim())) as PatternSuggestions;
    } catch {
      throw new Error("AI interpretation returned an unexpected response");
    }
  }

  async interpretPhoto(bytes: Buffer): Promise<PatternSuggestions> {
    let image: Buffer;
    try {
      image = await sharp(bytes, { limitInputPixels: 40_000_000 })
        .rotate().resize({ width: 1800, height: 1800, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 82 }).toBuffer();
    } catch {
      throw new Error("That card photo could not be read");
    }
    return this.callChat(this.visionModel, [
      { type: "text", text: "Read this workshop card and suggest a pattern using Name, Context, Problem, and Solution. Preserve the contributors' meaning and wording. Do not invent missing details; use an empty string when the card does not provide a field." },
      { type: "image_url", image_url: { url: `data:image/webp;base64,${image.toString("base64")}` } },
    ]);
  }

  async interpretSpeech(bytes: Buffer, mimeType: string, signal?: AbortSignal): Promise<SpeechInterpretation> {
    const audio = await normalizeAudio(bytes, mimeType, signal);
    const response = await this.fetcher("https://openrouter.ai/api/v1/audio/transcriptions", {
      method: "POST",
      signal: AbortSignal.any([AbortSignal.timeout(this.timeoutMs), ...(signal ? [signal] : [])]),
      headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: this.transcriptionModel, input_audio: { data: audio.toString("base64"), format: "wav" } }),
    });
    if (!response.ok) throw new Error(`Speech transcription failed (${response.status})`);
    const result = await response.json() as { text?: string };
    if (typeof result.text !== "string" || !result.text.trim()) throw new Error("Speech transcription returned no text");
    const transcript = result.text.trim();
    try {
      const suggestions = await this.callChat(this.synthesisModel, `Turn this spoken workshop explanation into suggested Name, Context, Problem, and Solution fields. Preserve the speaker's meaning and wording. Do not invent missing details; use an empty string when the explanation does not provide a field.\n\nTranscript:\n${transcript}`, signal);
      return { transcript, suggestions };
    } catch {
      if (signal?.aborted) throw new Error("Transcription cancelled");
      return { transcript, suggestions: {}, warning: "The transcript is ready, but field suggestions failed. Use the transcript to edit your fields manually." };
    }
  }
}
