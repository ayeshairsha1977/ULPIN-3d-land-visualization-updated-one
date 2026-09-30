// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import Anthropic from "@anthropic-ai/sdk";
import { EXTRACTED_FIELDS } from "./schema.js";
import { ExtractionError, MAX_DOCUMENT_BYTES, extractDocument, parseExtractRequest } from "./extract.js";
import { isRateLimited } from "./index.js";

const PDF_BYTES = Buffer.from("%PDF-1.7\n1 0 obj\n<<>>\nendobj\n");
const pdfRequest = (bytes = PDF_BYTES) => ({ filename: "deed.pdf", media_type: "application/pdf", data: bytes.toString("base64") });

const validResult = () => ({
  fields: Object.fromEntries(EXTRACTED_FIELDS.map((f) => [f, { value: "", confidence: 0, source_quote: "" }])),
  warnings: ["Stamp is partly illegible"],
  summary: "A sale deed.",
});

const fakeClient = (response) => ({ beta: { messages: { create: vi.fn().mockResolvedValue(response) } } });
const textResponse = (json, stop_reason = "end_turn") => ({
  model: "claude-opus-5-5",
  stop_reason,
  content: [{ type: "text", text: typeof json === "string" ? json : JSON.stringify(json) }],
});

describe("parseExtractRequest", () => {
  it("accepts a real PDF", () => {
    expect(parseExtractRequest(pdfRequest()).media_type).toBe("application/pdf");
  });

  it("rejects unsupported media types", () => {
    expect(() => parseExtractRequest({ ...pdfRequest(), media_type: "text/html" })).toThrow(ExtractionError);
  });

  it("rejects an executable disguised as a PDF", () => {
    const exe = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00]);
    expect(() => parseExtractRequest(pdfRequest(exe))).toThrow(/not a valid application\/pdf/);
  });

  it("rejects documents over 10 MB with 413", () => {
    const big = Buffer.concat([PDF_BYTES, Buffer.alloc(MAX_DOCUMENT_BYTES)]);
    try {
      parseExtractRequest(pdfRequest(big));
      expect.unreachable();
    } catch (error) {
      expect(error.status).toBe(413);
    }
  });

  it("rejects non-base64 data", () => {
    expect(() => parseExtractRequest({ ...pdfRequest(), data: "<script>" })).toThrow(/base64/);
  });
});

describe("extractDocument", () => {
  it("sends the PDF as a document block with a JSON schema and returns validated fields", async () => {
    const client = fakeClient(textResponse(validResult()));
    const result = await extractDocument(parseExtractRequest(pdfRequest()), { client });

    const params = client.beta.messages.create.mock.calls[0][0];
    expect(params.messages[0].content[0].type).toBe("document");
    expect(params.output_config.format.type).toBe("json_schema");
    expect(params.fallbacks).toBe("default");
    expect(result.warnings).toEqual(["Stamp is partly illegible"]);
    expect(result.disclaimer).toMatch(/surveyor must verify/);
  });

  it("sends images as image blocks", async () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
    const client = fakeClient(textResponse(validResult()));
    await extractDocument(parseExtractRequest({ filename: "plan.png", media_type: "image/png", data: png.toString("base64") }), { client });
    expect(client.beta.messages.create.mock.calls[0][0].messages[0].content[0].type).toBe("image");
  });

  it("clamps confidence into 0..1", async () => {
    const raw = validResult();
    raw.fields.parcel_number = { value: "123/4A", confidence: 7, source_quote: "Sy. No. 123/4A" };
    const result = await extractDocument(parseExtractRequest(pdfRequest()), { client: fakeClient(textResponse(raw)) });
    expect(result.fields.parcel_number.confidence).toBe(1);
  });

  it("maps a refusal to 422", async () => {
    const client = fakeClient({ model: "m", stop_reason: "refusal", content: [] });
    await expect(extractDocument(parseExtractRequest(pdfRequest()), { client })).rejects.toMatchObject({ status: 422 });
  });

  it("maps a truncated response to 502", async () => {
    const client = fakeClient(textResponse("{\"fields\":", "max_tokens"));
    await expect(extractDocument(parseExtractRequest(pdfRequest()), { client })).rejects.toMatchObject({ status: 502 });
  });

  it("rejects output that does not match the schema", async () => {
    const client = fakeClient(textResponse({ fields: {}, warnings: [], summary: "" }));
    await expect(extractDocument(parseExtractRequest(pdfRequest()), { client })).rejects.toThrow(/expected format/);
  });

  it("maps SDK rate limit errors to 429", async () => {
    const error = new Anthropic.RateLimitError(429, { type: "error" }, "rate limited", new Headers());
    const client = { beta: { messages: { create: vi.fn().mockRejectedValue(error) } } };
    await expect(extractDocument(parseExtractRequest(pdfRequest()), { client })).rejects.toMatchObject({ status: 429 });
  });
});

describe("extractDocument setup errors", () => {
  it("maps missing credentials to a clear 503", async () => {
    const client = { beta: { messages: { create: vi.fn().mockRejectedValue(new Error("Could not resolve authentication method.")) } } };
    await expect(extractDocument(parseExtractRequest(pdfRequest()), { client })).rejects.toMatchObject({ status: 503 });
  });

  it("does not disguise unrelated bugs as configuration problems", async () => {
    const client = { beta: { messages: { create: vi.fn().mockRejectedValue(new TypeError("boom")) } } };
    await expect(extractDocument(parseExtractRequest(pdfRequest()), { client })).rejects.toThrow(TypeError);
  });

  it("forwards the abort signal to the SDK", async () => {
    const client = fakeClient(textResponse(validResult()));
    const signal = new AbortController().signal;
    await extractDocument(parseExtractRequest(pdfRequest()), { client, signal });
    expect(client.beta.messages.create.mock.calls[0][1]).toEqual({ signal });
  });
});

describe("isRateLimited", () => {
  it("allows 10 requests per minute per IP, then blocks until the window passes", () => {
    const start = 5_000_000;
    for (let i = 0; i < 10; i += 1) expect(isRateLimited("10.0.0.1", start + i)).toBe(false);
    expect(isRateLimited("10.0.0.1", start + 20)).toBe(true);
    expect(isRateLimited("10.0.0.2", start + 20)).toBe(false);
    expect(isRateLimited("10.0.0.1", start + 61_000)).toBe(false);
  });
});
