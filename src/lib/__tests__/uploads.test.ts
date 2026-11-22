/**
 * CALLBACX TECHNOLOGY — Unit tests for upload validation (src/services/uploads.ts)
 *
 * Pure logic tests: MIME type and file size validation per bucket.
 * No database, no storage required.
 */

import { validateFile } from "@/services/uploads";

describe("uploads — validateFile", () => {
  const validFile = (type: string, size: number): File =>
    new File([new ArrayBuffer(size)], "image.png", { type });

  it("brand-logos accepts JPEG under 5MB", () => {
    const file = validFile("image/jpeg", 1024 * 1024);
    expect(validateFile(file, "brand-logos")).toEqual({ valid: true });
  });

  it("brand-logos accepts PNG under 5MB", () => {
    const file = validFile("image/png", 4 * 1024 * 1024);
    expect(validateFile(file, "brand-logos")).toEqual({ valid: true });
  });

  it("brand-logos accepts WebP under 5MB", () => {
    const file = validFile("image/webp", 1024);
    expect(validateFile(file, "brand-logos")).toEqual({ valid: true });
  });

  it("brand-logos accepts SVG under 5MB", () => {
    const file = validFile("image/svg+xml", 1024);
    expect(validateFile(file, "brand-logos")).toEqual({ valid: true });
  });

  it("brand-logos rejects video/mp4", () => {
    const file = validFile("video/mp4", 1024);
    const result = validateFile(file, "brand-logos");
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.error.code).toBe("UPLOAD_INVALID_FILE");
  });

  it("brand-logos rejects PDF", () => {
    const file = validFile("application/pdf", 1024);
    const result = validateFile(file, "brand-logos");
    expect(result.valid).toBe(false);
  });

  it("brand-logos rejects file over 5MB", () => {
    const file = validFile("image/png", 6 * 1024 * 1024);
    const result = validateFile(file, "brand-logos");
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.error.code).toBe("UPLOAD_FILE_TOO_LARGE");
  });

  it("creator-avatars accepts JPEG/PNG/WebP under 5MB", () => {
    for (const type of ["image/jpeg", "image/png", "image/webp"]) {
      const file = validFile(type, 1024);
      expect(validateFile(file, "creator-avatars").valid).toBe(true);
    }
  });

  it("creator-avatars rejects GIF", () => {
    const file = validFile("image/gif", 1024);
    expect(validateFile(file, "creator-avatars").valid).toBe(false);
  });

  it("creator-portfolios accepts GIF and video", () => {
    const gif = validFile("image/gif", 1024);
    expect(validateFile(gif, "creator-portfolios").valid).toBe(true);

    const mp4 = validFile("video/mp4", 5 * 1024 * 1024);
    expect(validateFile(mp4, "creator-portfolios").valid).toBe(true);
  });

  it("campaign-assets accepts images and video under 20MB", () => {
    const jpg = validFile("image/jpeg", 1024);
    expect(validateFile(jpg, "campaign-assets").valid).toBe(true);

    const mp4 = validFile("video/mp4", 15 * 1024 * 1024);
    expect(validateFile(mp4, "campaign-assets").valid).toBe(true);
  });

  it("campaign-assets rejects file over 20MB", () => {
    const mp4 = validFile("video/mp4", 21 * 1024 * 1024);
    const result = validateFile(mp4, "campaign-assets");
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.error.code).toBe("UPLOAD_FILE_TOO_LARGE");
  });

  it("deliverable-submissions accepts PDF under 100MB", () => {
    const pdf = validFile("application/pdf", 50 * 1024 * 1024);
    expect(validateFile(pdf, "deliverable-submissions").valid).toBe(true);
  });

  it("contracts accepts PDF and images under 20MB", () => {
    const pdf = validFile("application/pdf", 1024);
    expect(validateFile(pdf, "contracts").valid).toBe(true);
    const jpg = validFile("image/jpeg", 1024);
    expect(validateFile(jpg, "contracts").valid).toBe(true);
  });

  it("contracts rejects video", () => {
    const mp4 = validFile("video/mp4", 1024);
    expect(validateFile(mp4, "contracts").valid).toBe(false);
  });

  it("messages accepts images, video, PDF, audio under 10MB", () => {
    for (const type of [
      "image/jpeg",
      "image/png",
      "image/webp",
      "video/mp4",
      "application/pdf",
      "audio/mpeg",
      "audio/wav",
    ]) {
      const file = validFile(type, 1024);
      expect(validateFile(file, "messages").valid).toBe(true);
    }
  });

  it("messages rejects file over 10MB", () => {
    const mp4 = validFile("video/mp4", 11 * 1024 * 1024);
    const result = validateFile(mp4, "messages");
    expect(result.valid).toBe(false);
  });

  it("rejects unknown bucket", () => {
    const file = validFile("image/png", 1024);
    const result = validateFile(file, "evil-bucket" as never);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.error.code).toBe("UPLOAD_INVALID_FILE");
  });

  it("empty file is allowed if within size and type limits", () => {
    const file = validFile("image/png", 0);
    expect(validateFile(file, "brand-logos").valid).toBe(true);
  });

  it("file exactly at size limit is allowed", () => {
    const file = validFile("image/png", 5 * 1024 * 1024);
    expect(validateFile(file, "brand-logos").valid).toBe(true);
  });

  it("file one byte over size limit is rejected", () => {
    const file = validFile("image/png", 5 * 1024 * 1024 + 1);
    const result = validateFile(file, "brand-logos");
    expect(result.valid).toBe(false);
  });

  it("all supported buckets are covered", () => {
    const buckets = [
      "brand-logos",
      "creator-avatars",
      "creator-portfolios",
      "campaign-assets",
      "deliverable-submissions",
      "contracts",
      "messages",
    ];
    buckets.forEach((bucket) => {
      const result = validateFile(validFile("image/png", 1024), bucket);
      // PNG is allowed in all buckets; none should throw
      expect(result.valid).toBe(true);
    });
  });
});
