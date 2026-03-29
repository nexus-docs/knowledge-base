import type { Metadata } from "next";
import Link from "next/link";
import {
  BookOpen,
  Shield,
  Search as SearchIcon,
  Zap,
  Code,
  ArrowRight,
} from "lucide-react";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://docs.qoliber.com";

export const metadata: Metadata = {
  title: "Documentation",
  description: "Browse documentation — getting started, features, guides, and content authoring examples.",
  alternates: {
    canonical: `${siteUrl}/docs`,
  },
};

const sections = [
  {
    title: "Getting Started",
    description: "Install, configure, and start using Nexus Docs in minutes.",
    href: "/docs/getting-started",
    icon: Zap,
    categories: [
      { label: "Installation", href: "/docs/getting-started", icon: Code },
      { label: "Adding Content", href: "/docs/getting-started/content", icon: BookOpen },
    ],
  },
  {
    title: "Features",
    description: "Access control, search, inline protection, SEO, and navigation.",
    href: "/docs/features",
    icon: Shield,
    categories: [
      { label: "Access Control", href: "/docs/features/access-control", icon: Shield },
      { label: "Inline Protection", href: "/docs/features/inline-protection", icon: Shield },
      { label: "Search", href: "/docs/features/search", icon: SearchIcon },
      { label: "SEO", href: "/docs/features/seo", icon: Zap },
      { label: "Navigation", href: "/docs/features/navigation", icon: BookOpen },
    ],
  },
  {
    title: "Guides",
    description: "Step-by-step tutorials for customisation and advanced usage.",
    href: "/docs/guides",
    icon: BookOpen,
    categories: [
      { label: "Customise Branding", href: "/docs/guides/branding", icon: Code },
    ],
  },
  {
    title: "Examples",
    description: "Content authoring examples — MDX components, tables, code blocks.",
    href: "/docs/examples",
    icon: Code,
    categories: [
      { label: "MDX Components", href: "/docs/examples/components", icon: Code },
    ],
  },
];

export default function DocsIndexPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Documentation
        </h1>
        <p className="mt-3 text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto">
          Everything you need to set up, customise, and get the most out of
          Nexus Docs.
        </p>
      </div>

      <div className="space-y-8">
        {sections.map((section) => (
          <div
            key={section.href}
            className="rounded-xl border border-[var(--color-border)] overflow-hidden"
          >
            <div className="flex items-center justify-between bg-[var(--color-surface-secondary)] px-6 py-4">
              <div className="flex items-center gap-3">
                <section.icon className="h-5 w-5 text-qoliber-600" />
                <div>
                  <h2 className="text-lg font-semibold">{section.title}</h2>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    {section.description}
                  </p>
                </div>
              </div>
              <Link
                href={section.href}
                className="text-sm font-medium text-qoliber-600 hover:text-qoliber-700 transition-colors flex items-center gap-1"
              >
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-0 divide-x divide-y divide-[var(--color-border)]">
              {section.categories.map((cat) => (
                <Link
                  key={cat.href}
                  href={cat.href}
                  className="flex items-center gap-3 px-5 py-4 hover:bg-[var(--color-surface-secondary)] transition-colors"
                >
                  <cat.icon className="h-4 w-4 text-[var(--color-text-muted)]" />
                  <span className="text-sm font-medium">{cat.label}</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
