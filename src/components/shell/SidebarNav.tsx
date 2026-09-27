"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface NavItem {
  href: string;
  label: string;
  group?: string;
}

export function isActivePath(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function SidebarNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const groups = items.reduce<Map<string, NavItem[]>>((acc, item) => {
    const key = item.group ?? "";
    acc.set(key, [...(acc.get(key) ?? []), item]);
    return acc;
  }, new Map());

  return (
    <nav className="flex flex-col gap-5 px-3 py-4">
      {[...groups.entries()].map(([group, groupItems]) => (
        <div key={group}>
          {group && <div className="mb-1 px-2.5 text-[10.5px] font-medium uppercase tracking-wider text-slate-400">{group}</div>}
          <ul className="flex flex-col gap-px">
            {groupItems.map((item) => {
              const active = isActivePath(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex h-8 items-center rounded-md px-2.5 text-[13px] transition-colors ${
                      active ? "bg-slate-100 font-medium text-slate-900" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
