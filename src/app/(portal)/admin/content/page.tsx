import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/admin/page-header";
import { getAllDocs } from "@/lib/content";

export const metadata: Metadata = { title: "Content" };
export const dynamic = "force-dynamic";

export default async function ContentPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = parseInt(pageParam || "1", 10);
  const limit = 25;

  const docs = await getAllDocs();
  const now = new Date();

  const enriched = docs.map((doc) => {
    const isStale =
      doc.status === "published" &&
      doc.last_verified_at &&
      new Date(doc.last_verified_at).getTime() +
        doc.review_interval_days * 86400000 <
        now.getTime();
    return { ...doc, stale: !!isStale };
  });

  const stats = {
    published: enriched.filter((d) => d.status === "published").length,
    draft: enriched.filter((d) => d.status === "draft").length,
    deprecated: enriched.filter((d) => d.status === "deprecated").length,
    stale: enriched.filter((d) => d.stale).length,
  };

  const totalPages = Math.ceil(enriched.length / limit);
  const paginatedDocs = enriched.slice((page - 1) * limit, page * limit);

  const statusColors: Record<string, string> = {
    published: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    draft: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
    deprecated: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  };

  return (
    <div>
      <PageHeader
        title="Content"
        description={`${docs.length} documents — ${stats.published} published, ${stats.draft} draft, ${stats.stale} stale`}
      />

      <div className="mt-4 overflow-x-auto rounded-lg border border-[var(--color-border)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-secondary)]">
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase">Title</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase">Product</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase">Tier</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase">Owner</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase">Last Verified</th>
            </tr>
          </thead>
          <tbody>
            {paginatedDocs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-[var(--color-text-muted)]">
                  No content found
                </td>
              </tr>
            ) : (
              paginatedDocs.map((doc) => (
                <tr key={doc.slug} className="border-b border-[var(--color-border)] hover:bg-[var(--color-surface-secondary)]">
                  <td className="px-4 py-3">
                    <Link href={`/docs/${doc.slug}`} className="text-qoliber-600 hover:underline">
                      {doc.title}
                    </Link>
                    {doc.stale && (
                      <span className="ml-2 rounded bg-orange-100 px-1.5 py-0.5 text-[10px] font-medium text-orange-700 dark:bg-orange-900 dark:text-orange-300">
                        STALE
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-text-muted)]">{doc.product}</td>
                  <td className="px-4 py-3 text-[var(--color-text-muted)]">{doc.access_tier}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[doc.status]}`}>
                      {doc.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--color-text-muted)]">{doc.owner}</td>
                  <td className="px-4 py-3 text-[var(--color-text-muted)]">
                    {doc.last_verified_at ? new Date(doc.last_verified_at).toLocaleDateString() : "---"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          {page > 1 && (
            <Link
              href={`/admin/content?page=${page - 1}`}
              className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm"
            >
              Previous
            </Link>
          )}
          <span className="px-3 py-1.5 text-sm text-[var(--color-text-muted)]">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/admin/content?page=${page + 1}`}
              className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm"
            >
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
