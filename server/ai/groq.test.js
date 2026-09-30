// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import Groq from "groq-sdk";
import { EXTRACTED_FIELDS } from "../schema.js";
import { chooseExtractor } from "./provider.js";
import { extractWithGroq, pdfText } from "./groq.js";

// Minimal one-page PDF with a real text layer.
function textPdf(text) {
  const stream = `BT /F1 12 Tf 72 720 Td (${text}) Tj ET`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let out = "%PDF-1.4\n";
  const offsets = objects.map((body, i) => {
    const offset = out.length;
    out += `${i + 1} 0 obj\n${body}\nendobj\n`;
    return offset;
  });
  const xref = out.length;
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("")}`;
  out += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(out, "latin1").toString("base64");
}

const DEED = "SALE DEED. Survey No. 123/4A, Kompally village, Medchal district. Seller Ravi Kumar, Buyer Asha Rani.";
const pdfDoc = (text = DEED) => ({ filename: "deed.pdf", media_type: "application/pdf", data: textPdf(text) });
const pngDoc = { filename: "deed.png", media_type: "image/png", data: Buffer.from([0x89, 0x50, 0x4e, 0x47]).toString("base64") };
const config = { apiKey: "test", textModel: "openai/gpt-oss-120b", visionModel: "qwen/qwen3.8-27b" };

const validJson = () => JSON.stringify({
  fields: Object.fromEntries(EXTRACTED_FIELDS.map((f) => [f, { value: "", confidence: 0, source_quote: "" }])),
  warnings: [],
  summary: "Sale deed.",
});
const fakeClient = (content, finish_reason = "stop") => ({
  chat: { completions: { create: vi.fn().mockResolvedValue({ model: "openai/gpt-oss-120b", choices: [{ finish_reason, message: { content } }] }) } },
});

describe("pdfText", () => {
  it("reads the text layer of a PDF", async () => {
    expect(await pdfText(textPdf(DEED))).toContain("Survey No. 123/4A");
  });
});

describe("extractWithGroq", () => {
  it("sends PDF text to the text model with a strict JSON schema", async () => {
    const client = fakeClient(validJson());
    const result = await extractWithGroq(pdfDoc(), { client, config });
    const params = client.chat.completions.create.mock.calls[0][0];
    expect(params.model).toBe("openai/gpt-oss-120b");
    expect(params.response_format.json_schema.strict).toBe(true);
    expect(params.messages[1].content).toContain("Survey No. 123/4A");
    expect(result.model).toBe("groq:openai/gpt-oss-120b");
    expect(result.disclaimer).toMatch(/surveyor must verify/);
  });

  it("sends images to the vision model as a data URL", async () => {
    const client = fakeClient(validJson());
    await extractWithGroq(pngDoc, { client, config });
    const params = client.chat.completions.create.mock.calls[0][0];
    expect(params.model).toBe("qwen/qwen3.8-27b");
    expect(params.messages[1].content[1].image_url.url).toMatch(/^data:image\/png;base64,/);
  });

  it("explains that scanned PDFs without text need to be uploaded as images", async () => {
    await expect(extractWithGroq(pdfDoc(" "), { client: fakeClient(validJson()), config })).rejects.toMatchObject({ status: 422 });
  });

  it("requires a vision model for images", async () => {
    await expect(extractWithGroq(pngDoc, { client: fakeClient(validJson()), config: { ...config, visionModel: "" } }))
      .rejects.toMatchObject({ status: 503 });
  });

  it("maps a cut-off answer and malformed output to 502", async () => {
    await expect(extractWithGroq(pdfDoc(), { client: fakeClient("{", "length"), config })).rejects.toMatchObject({ status: 502 });
    await expect(extractWithGroq(pdfDoc(), { client: fakeClient("not json"), config })).rejects.toMatchObject({ status: 502 });
  });

  it("maps Groq rate limits to 429", async () => {
    const error = new Groq.RateLimitError(429, { error: {} }, "rate limited", new Headers());
    const client = { chat: { completions: { create: vi.fn().mockRejectedValue(error) } } };
    await expect(extractWithGroq(pdfDoc(), { client, config })).rejects.toMatchObject({ status: 429 });
  });

  it("reports missing configuration clearly", async () => {
    await expect(extractWithGroq(pdfDoc(), { config: { ...config, apiKey: "" } })).rejects.toMatchObject({ status: 503 });
  });
});

describe("chooseExtractor", () => {
  it("prefers Claude when its key is set, falls back to Groq, and honours AI_PROVIDER", () => {
    expect(chooseExtractor({ ANTHROPIC_API_KEY: "a", GROQ_API_KEY: "g" }).name).toBe("claude");
    expect(chooseExtractor({ ANTHROPIC_API_KEY: "", GROQ_API_KEY: "g" }).name).toBe("groq");
    expect(chooseExtractor({ ANTHROPIC_API_KEY: "a", GROQ_API_KEY: "g", AI_PROVIDER: "groq" }).name).toBe("groq");
  });
});
