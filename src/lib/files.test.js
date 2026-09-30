import { describe, expect, it } from "vitest";
import { MAX_FILE_BYTES, MAX_FILES_PER_UPLOAD, isSupported, validateFile, validateFiles } from "@/lib/files";

const PDF = [0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37];
const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const JPG = [0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0];
const EXE = [0x4d, 0x5a, 0x90, 0x00, 0x03, 0, 0, 0]; // "MZ" Windows executable

const makeFile = (name, type, bytes, size) => {
  const file = new File([new Uint8Array(bytes)], name, { type });
  if (size !== undefined) Object.defineProperty(file, "size", { value: size });
  return file;
};

describe("isSupported", () => {
  it("accepts PDF, JPEG and PNG with matching extensions", () => {
    expect(isSupported(makeFile("deed.pdf", "application/pdf", PDF))).toBe(true);
    expect(isSupported(makeFile("site.jpeg", "image/jpeg", JPG))).toBe(true);
    expect(isSupported(makeFile("plan.png", "image/png", PNG))).toBe(true);
  });

  it("rejects a MIME type that does not match the extension", () => {
    expect(isSupported(makeFile("deed.exe", "application/pdf", PDF))).toBe(false);
  });

  it("rejects unsupported types", () => {
    expect(isSupported(makeFile("notes.txt", "text/plain", [0x41]))).toBe(false);
  });
});

describe("validateFile", () => {
  it("passes a genuine PDF", async () => {
    expect(await validateFile(makeFile("deed.pdf", "application/pdf", PDF))).toBe("");
  });

  it("accepts a file exactly at the size limit", async () => {
    expect(await validateFile(makeFile("deed.pdf", "application/pdf", PDF, MAX_FILE_BYTES))).toBe("");
  });

  it("rejects a file over the size limit", async () => {
    expect(await validateFile(makeFile("deed.pdf", "application/pdf", PDF, MAX_FILE_BYTES + 1))).toMatch(/larger than 10 MB/);
  });

  it("rejects an executable renamed to .pdf", async () => {
    expect(await validateFile(makeFile("deed.pdf", "application/pdf", EXE))).toMatch(/does not look like a real PDF/);
  });

  it("rejects a PNG whose bytes are really a JPEG", async () => {
    expect(await validateFile(makeFile("plan.png", "image/png", JPG))).toMatch(/does not look like a real image/);
  });

  it("rejects an empty file", async () => {
    expect(await validateFile(makeFile("deed.pdf", "application/pdf", []))).toMatch(/is empty/);
  });
});

describe("validateFiles", () => {
  it("rejects too many files in total", async () => {
    const files = Array.from({ length: 2 }, (_, i) => makeFile(`p${i}.png`, "image/png", PNG));
    expect(await validateFiles(files, MAX_FILES_PER_UPLOAD - 1)).toMatch(/at most 5 files/);
  });

  it("reports the first invalid file", async () => {
    const files = [makeFile("ok.png", "image/png", PNG), makeFile("bad.pdf", "application/pdf", EXE)];
    expect(await validateFiles(files)).toMatch(/bad.pdf/);
  });
});
