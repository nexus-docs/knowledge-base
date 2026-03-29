import { searchClient, DOCS_INDEX } from "./client";
import { getAllDocs, getDocBySlug, stripMdx } from "@/lib/content";

interface MeiliDoc {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  access_tier: string;
  extensions: string[];
  product: string;
  version: string;
  status: string;
  tags: string[];
  owner: string;
  nav_order: number;
  last_verified_at: string | null;
  lastModified: string;
}

export async function indexAllDocs(): Promise<number> {
  const docs = await getAllDocs();
  const meiliDocs: MeiliDoc[] = [];

  for (const meta of docs) {
    if (meta.status === "draft") continue;

    const full = await getDocBySlug(meta.slug.split("/"));
    if (!full) continue;

    meiliDocs.push({
      id: meta.slug.replace(/\//g, "-"),
      slug: meta.slug,
      title: meta.title,
      summary: meta.summary,
      content: stripMdx(full.content).slice(0, 10000),
      access_tier: meta.access_tier,
      extensions: meta.extensions,
      product: meta.product,
      version: meta.version,
      status: meta.status,
      tags: meta.tags,
      owner: meta.owner,
      nav_order: meta.nav_order,
      last_verified_at: meta.last_verified_at || null,
      lastModified: meta.lastModified,
    });
  }

  const index = searchClient.index(DOCS_INDEX);
  await index.addDocuments(meiliDocs, { primaryKey: "id" });

  console.log(`Indexed ${meiliDocs.length} documents.`);
  return meiliDocs.length;
}

export async function indexDoc(slug: string): Promise<void> {
  const doc = await getDocBySlug(slug.split("/"));
  if (!doc) return;

  const index = searchClient.index(DOCS_INDEX);
  await index.addDocuments([
    {
      id: slug.replace(/\//g, "-"),
      slug,
      title: doc.title,
      summary: doc.summary,
      content: stripMdx(doc.content).slice(0, 10000),
      access_tier: doc.access_tier,
      extensions: doc.extensions,
      product: doc.product,
      version: doc.version,
      status: doc.status,
      tags: doc.tags,
      owner: doc.owner,
      nav_order: doc.nav_order,
      last_verified_at: doc.last_verified_at || null,
      lastModified: doc.lastModified,
    },
  ]);
}

export async function removeDoc(slug: string): Promise<void> {
  const index = searchClient.index(DOCS_INDEX);
  await index.deleteDocument(slug.replace(/\//g, "-"));
}
