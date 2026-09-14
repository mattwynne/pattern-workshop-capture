import sharp from "sharp";
import { parseBuffer } from "music-metadata";

export interface PatternSuggestions {
  name?: string;
  context?: string;
  problem?: string;
  solution?: string;
}

export interface SpeechInterpretation {
  transcript: string;
  suggestions: PatternSuggestions;
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
  ) {}

  private async callChat(model: string, content: unknown): Promise<PatternSuggestions> {
    const response = await this.fetcher("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
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
      return Object.fromEntries(Object.entries(parsed).filter(([key, value]) => key in schema.properties && typeof value === "string" && value.trim())) as PatternSuggestions;
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

  async interpretSpeech(bytes: Buffer, mimeType: string): Promise<SpeechInterpretation> {
    const format = audioFormat(mimeType);
    if (!format) throw new Error("This audio format is not supported");
    try {
      const metadata = await parseBuffer(bytes, { mimeType, size: bytes.length }, { duration: true });
      if (metadata.format.duration && metadata.format.duration > 125) {
        throw new Error("Recordings must be two minutes or shorter");
      }
    } catch (error) {
      if (error instanceof Error && /two minutes/.test(error.message)) throw error;
      // Some browser MediaRecorder containers omit duration metadata. Their client-side timer still enforces the limit.
    }
    const response = await this.fetcher("https://openrouter.ai/api/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: this.transcriptionModel, input_audio: { data: bytes.toString("base64"), format } }),
    });
    if (!response.ok) throw new Error(`Speech transcription failed (${response.status})`);
    const result = await response.json() as { text?: string };
    if (!result.text?.trim()) throw new Error("Speech transcription returned no text");
    const transcript = result.text.trim();
    const suggestions = await this.callChat(this.synthesisModel, `Turn this spoken workshop explanation into suggested Name, Context, Problem, and Solution fields. Preserve the speaker's meaning and wording. Do not invent missing details; use an empty string when the explanation does not provide a field.\n\nTranscript:\n${transcript}`);
    return { transcript, suggestions };
  }
}

export function audioFormat(mimeType: string): string | null {
  const type = mimeType.toLowerCase().split(";")[0];
  return ({
    "audio/webm": "webm", "audio/ogg": "ogg", "audio/mpeg": "mp3", "audio/mp3": "mp3",
    "audio/mp4": "m4a", "audio/x-m4a": "m4a", "audio/aac": "aac", "audio/wav": "wav", "audio/x-wav": "wav",
  } as Record<string, string>)[type] ?? null;
}
