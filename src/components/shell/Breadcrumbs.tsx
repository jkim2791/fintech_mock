"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "./SidebarNav";

/** Derives "Module / ID" from the current path using the nav labels. */
export function Breadcrumbs({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const root = items
    .filter((i) => i.href !== "/" && pathname.startsWith(i.href))
    .sort((a, b) => b.href.length - a.href.length)[0];
  const rest = root ? pathname.slice(root.href.length).split("/").filter(Boolean) : [];

  return (
    <ol className="flex items-center gap-1.5 text-sm">
      <li>
        {root ? (
          <Link href={root.href} className="text-slate-500 hover:text-slate-900">
            {root.label}
          </Link>
        ) : (
          <span className="font-medium text-slate-900">Overview</span>
        )}
      </li>
      {rest.map((seg, i) => (
        <li key={seg} className="flex items-center gap-1.5">
          <span className="text-slate-300">/</span>
          <span className={`font-mono text-[13px] ${i === rest.length - 1 ? "text-slate-900" : "text-slate-500"}`}>{decodeURIComponent(seg)}</span>
        </li>
      ))}
    </ol>
  );
}
