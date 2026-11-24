"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const path = usePathname();
  const active = href === "/admin" ? path === href : path.startsWith(href);
  return (
    <Link
      href={href}
      className={`whitespace-nowrap rounded-md px-3 py-1.5 font-medium ${active ? "bg-ink text-white" : "text-muted hover:bg-paper hover:text-ink"}`}
    >
      {children}
    </Link>
  );
}
