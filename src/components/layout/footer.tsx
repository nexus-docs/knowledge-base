import Link from "next/link";

const footerLinks = {
  Product: [
    { label: "Extensions", href: "/docs/extensions" },
    { label: "Open Source", href: "/docs/open-source" },
    { label: "Partnership", href: "/docs/partnership" },
  ],
  Resources: [
    { label: "Documentation", href: "/docs" },
    { label: "Development Guidelines", href: "/docs/development-guidelines" },
    { label: "Search", href: "/search" },
  ],
  Company: [
    { label: "About", href: "https://qoliber.com" },
    { label: "Twitter", href: "https://x.com/qoliberDev" },
    { label: "LinkedIn", href: "https://www.linkedin.com/company/qoliber/" },
    { label: "YouTube", href: "https://www.youtube.com/@qoliber" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface-secondary)]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div>
            <span className="text-lg font-bold text-qoliber-600">qoliber</span>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              Magento 2 extensions built for performance, SEO, and compliance.
            </p>
          </div>
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                {title}
              </h3>
              <ul className="mt-3 space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-8 border-t border-[var(--color-border)] pt-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-[var(--color-text-muted)]">
          <span>
            Copyright &copy; {new Date().getFullYear()}. All rights
            reserved.
          </span>
          <span>
            Powered by{" "}
            <span className="font-medium text-[var(--color-text-secondary)]">
              nexus-docs
            </span>
            {" "}@ qoliber
          </span>
        </div>
      </div>
    </footer>
  );
}
