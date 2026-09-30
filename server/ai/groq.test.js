// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import Groq from "groq-sdk";
import { EXTRACTED_FIELDS } from "../schema.js";
import { chooseExtractor } from "./provider.js";
import { MAX_SCAN_PAGES, extractWithGroq, pdfPageImages, pdfText } from "./groq.js";

// Minimal PDF with one page per entry; each page has a real text layer (empty text = "scan").
function textPdf(...pageTexts) {
  const n = pageTexts.length;
  const pageIds = pageTexts.map((_, i) => 4 + i * 2);
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${n} >>`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  pageTexts.forEach((text, i) => {
    const stream = text.trim() ? `BT /F1 12 Tf 72 720 Td (${text}) Tj ET` : "";
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents ${pageIds[i] + 1} 0 R /Resources << /Font << /F1 3 0 R >> >> >>`);
    objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
  });
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
const pdfDoc = (...pages) => ({ filename: "deed.pdf", media_type: "application/pdf", data: textPdf(...(pages.length ? pages : [DEED])) });
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

describe("PDF helpers", () => {
  it("reads the text layer of a PDF", async () => {
    expect(await pdfText(textPdf(DEED))).toContain("Survey No. 123/4A");
  });

  it("renders at most the first pages of a scan as PNG data URLs", async () => {
    const { images, totalPages } = await pdfPageImages(textPdf(" ", " ", " ", " "));
    expect(totalPages).toBe(4);
    expect(images).toHaveLength(MAX_SCAN_PAGES);
    expect(images[0]).toMatch(/^data:image\/png;base64,/);
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

  it("sends scanned PDFs (no text layer) to the vision model as page images", async () => {
    const client = fakeClient(validJson());
    await extractWithGroq(pdfDoc(" ", " "), { client, config });
    const params = client.chat.completions.create.mock.calls[0][0];
    expect(params.model).toBe("qwen/qwen3.8-27b");
    const images = params.messages[1].content.filter((part) => part.type === "image_url");
    expect(images).toHaveLength(2);
    expect(images[0].image_url.url).toMatch(/^data:image\/png;base64,/);
  });

  it("tells the model when a long scan was cut to the first pages", async () => {
    const client = fakeClient(validJson());
    await extractWithGroq(pdfDoc(" ", " ", " ", " ", " "), { client, config });
    expect(client.chat.completions.create.mock.calls[0][0].messages[1].content[0].text).toMatch(/first 3 of 5 pages/);
  });

  it("needs a vision model for scanned PDFs", async () => {
    await expect(extractWithGroq(pdfDoc(" "), { client: fakeClient(validJson()), config: { ...config, visionModel: "" } }))
      .rejects.toMatchObject({ status: 503 });
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
