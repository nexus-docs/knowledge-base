import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAllDocs } from "@/lib/content";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.tier !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const docs = await getAllDocs();

  const now = new Date();
  const content = docs.map((doc) => {
    const isStale =
      doc.status === "published" &&
      doc.last_verified_at &&
      new Date(doc.last_verified_at).getTime() +
        doc.review_interval_days * 86400000 <
        now.getTime();

    return {
      slug: doc.slug,
      title: doc.title,
      product: doc.product,
      status: doc.status,
      access_tier: doc.access_tier,
      owner: doc.owner,
      last_verified_at: doc.last_verified_at,
      review_interval_days: doc.review_interval_days,
      stale: isStale,
      lastModified: doc.lastModified,
    };
  });

  const stats = {
    total: docs.length,
    published: docs.filter((d) => d.status === "published").length,
    draft: docs.filter((d) => d.status === "draft").length,
    deprecated: docs.filter((d) => d.status === "deprecated").length,
    stale: content.filter((d) => d.stale).length,
    byProduct: Object.entries(
      docs.reduce(
        (acc, d) => {
          acc[d.product] = (acc[d.product] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      )
    ).map(([product, count]) => ({ product, count })),
  };

  return NextResponse.json({ content, stats });
}
