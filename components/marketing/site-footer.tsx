import Link from "next/link";

const footerLinks = [
  {
    title: "Platform",
    links: [
      { label: "Overview", href: "/" },
      { label: "Solutions", href: "/solutions" },
      { label: "Pricing", href: "/pricing" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/company" },
      { label: "Careers", href: "/company#careers" },
      { label: "Press", href: "/company#press" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Docs", href: "/resources" },
      { label: "Blog", href: "/resources#blog" },
      { label: "Support", href: "/contact" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border/80 bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-base font-semibold text-foreground">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/15 text-base text-primary">
                BH
              </div>
              blockhashpro
            </div>
            <p className="text-sm text-muted-foreground">
              Institutional-grade crypto mining marketplace with real-time operations and
              automated settlements.
            </p>
          </div>
          {footerLinks.map((column) => (
            <div key={column.title} className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {column.title}
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="transition hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex flex-col-reverse items-center justify-between gap-4 pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} blockhashpro Labs. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/legal/privacy" className="hover:text-foreground">
              Privacy
            </Link>
            <Link href="/legal/terms" className="hover:text-foreground">
              Terms
            </Link>
            <Link href="/contact" className="hover:text-foreground">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

