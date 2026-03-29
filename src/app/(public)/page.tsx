import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Shield, Zap, Code } from "lucide-react";
import { OrganizationJsonLd, WebSiteJsonLd } from "@/components/seo/json-ld";

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "Nexus Docs";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://docs.example.com";

export const metadata: Metadata = {
  title: `${siteName} — Documentation Portal`,
  description:
    "Documentation portal with tiered access control, inline content protection, and per-product gating. Built with Next.js, Meilisearch, and PostgreSQL.",
  alternates: {
    canonical: "/",
  },
};

const features = [
  {
    icon: Zap,
    title: "Getting Started",
    description:
      "Install and configure Nexus Docs — from clone to running portal in 5 minutes.",
    href: "/docs/getting-started",
  },
  {
    icon: Shield,
    title: "Access Control",
    description:
      "Flexible tier system with per-product gating and three visibility modes.",
    href: "/docs/features/access-control",
  },
  {
    icon: Code,
    title: "Inline Protection",
    description:
      "Mix public and protected content on the same page with the Protected component.",
    href: "/docs/features/inline-protection",
  },
  {
    icon: BookOpen,
    title: "Examples",
    description:
      "Content authoring examples — MDX components, admonitions, code tabs, and more.",
    href: "/docs/examples",
  },
];

export default function HomePage() {
  return (
    <>
      <OrganizationJsonLd />
      <WebSiteJsonLd siteUrl={siteUrl} siteName={siteName} />

      {/* Hero */}
      <section className="border-b border-[var(--color-border)] bg-gradient-to-b from-qoliber-50/50 to-[var(--color-surface)] dark:from-qoliber-950/30">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Nexus{" "}
            <span className="text-qoliber-600">Docs</span>
          </h1>
          <p className="mt-4 text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto">
            Documentation portal with tiered access control, inline content
            protection, and full-text search with permission filtering.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link
              href="/docs"
              className="inline-flex items-center gap-2 rounded-lg bg-qoliber-600 px-6 py-3 text-sm font-medium text-white hover:bg-qoliber-700 transition-colors"
            >
              Browse Docs
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/search"
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-6 py-3 text-sm font-medium hover:bg-[var(--color-surface-secondary)] transition-colors"
            >
              Search
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <Link
              key={feature.href}
              href={feature.href}
              className="group rounded-xl border border-[var(--color-border)] p-6 hover:border-qoliber-400 hover:shadow-sm transition-all"
            >
              <feature.icon className="h-8 w-8 text-qoliber-600" />
              <h2 className="mt-4 text-lg font-semibold group-hover:text-qoliber-600 transition-colors">
                {feature.title}
              </h2>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                {feature.description}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
