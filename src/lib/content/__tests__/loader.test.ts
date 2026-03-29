import { describe, it, expect, beforeEach, vi } from "vitest";
import path from "path";

// Set CONTENT_DIR before importing loader
const testContentDir = path.join(__dirname, "../../../../content");
vi.stubEnv("CONTENT_DIR", testContentDir);

import { getDocBySlug, getAllDocs, getDocsByProduct, invalidateCache, getContentDir } from "../loader";

describe("getContentDir", () => {
  it("returns CONTENT_DIR env var when set", () => {
    expect(getContentDir()).toBe(testContentDir);
  });
});

describe("getDocBySlug", () => {
  beforeEach(() => {
    invalidateCache();
  });

  it("loads a doc by slug parts", async () => {
    const doc = await getDocBySlug(["extensions", "compliance", "gdpr-suite"]);
    expect(doc).not.toBeNull();
    expect(doc!.title).toBe("GDPR Compliance Suite");
    expect(doc!.access_tier).toBe("public");
    expect(doc!.product).toBe("qoliber/gdpr-suite");
    expect(doc!.slug).toBe("extensions/compliance/gdpr-suite");
  });

  it("loads index.md for directory slugs", async () => {
    const doc = await getDocBySlug(["open-source"]);
    expect(doc).not.toBeNull();
    expect(doc!.title).toBe("Open Source");
  });

  it("loads root index.md with empty slug", async () => {
    const doc = await getDocBySlug(["index"]);
    expect(doc).not.toBeNull();
    expect(doc!.slug).toBe("");
  });

  it("returns null for non-existent slug", async () => {
    const doc = await getDocBySlug(["non", "existent", "page"]);
    expect(doc).toBeNull();
  });

  it("loads client-tier doc with extensions", async () => {
    const doc = await getDocBySlug(["extensions", "compliance", "gdpr-suite", "configuration"]);
    expect(doc).not.toBeNull();
    expect(doc!.access_tier).toBe("client");
    expect(doc!.extensions).toContain("qoliber/gdpr-suite");
  });

  it("loads partner-tier doc", async () => {
    const doc = await getDocBySlug(["extensions", "compliance", "gdpr-suite", "roadmap"]);
    expect(doc).not.toBeNull();
    expect(doc!.access_tier).toBe("partner");
  });

  it("returns content body", async () => {
    const doc = await getDocBySlug(["extensions", "compliance", "gdpr-suite"]);
    expect(doc!.content).toContain("GDPR Compliance Suite");
    expect(doc!.content.length).toBeGreaterThan(0);
  });

  it("includes lastModified as ISO string", async () => {
    const doc = await getDocBySlug(["extensions", "compliance", "gdpr-suite"]);
    expect(doc!.lastModified).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

describe("getAllDocs", () => {
  beforeEach(() => {
    invalidateCache();
  });

  it("returns all markdown docs", async () => {
    const docs = await getAllDocs();
    expect(docs.length).toBeGreaterThanOrEqual(7);
  });

  it("returns docs with valid frontmatter", async () => {
    const docs = await getAllDocs();
    for (const doc of docs) {
      expect(doc.title).toBeTruthy();
      expect(doc.summary).toBeTruthy();
      expect(doc.access_tier).toBeTruthy();
      expect(doc.product).toBeTruthy();
      expect(doc.status).toBeTruthy();
      expect(doc.owner).toBeTruthy();
    }
  });

  it("caches results on second call", async () => {
    const first = await getAllDocs();
    const second = await getAllDocs();
    expect(first).toStrictEqual(second);
  });

  it("invalidates cache correctly", async () => {
    const first = await getAllDocs();
    invalidateCache();
    const second = await getAllDocs();
    expect(first).not.toBe(second);
    expect(first.length).toBe(second.length);
  });
});

describe("getDocsByProduct", () => {
  beforeEach(() => {
    invalidateCache();
  });

  it("filters docs by product", async () => {
    const docs = await getDocsByProduct("qoliber/gdpr-suite");
    expect(docs.length).toBeGreaterThanOrEqual(3);
    for (const doc of docs) {
      expect(doc.product).toBe("qoliber/gdpr-suite");
    }
  });

  it("returns empty array for unknown product", async () => {
    const docs = await getDocsByProduct("unknown-product");
    expect(docs).toEqual([]);
  });
});
