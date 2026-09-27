import type { AuthUser } from "@/lib/auth/types";
import { can } from "@/lib/authz";
import { SidebarNav, type NavItem } from "./SidebarNav";
import { RoleSwitcher } from "./RoleSwitcher";
import { RoleBadge } from "@/components/shared/StatusBadge";

/**
 * Navigation is derived from permissions, so a new module only needs a new
 * entry here plus its own permission strings.
 */
export function AppShell({
  user,
  switchableUsers,
  demoMode,
  children,
}: {
  user: AuthUser;
  switchableUsers: AuthUser[];
  demoMode: boolean;
  children: React.ReactNode;
}) {
  const nav: NavItem[] = [
    { href: "/", label: "Overview" },
    ...(can(user, "kyc:view") ? [{ href: "/kyc", label: "KYC Review" }] : []),
    ...(can(user, "refund:view") ? [{ href: "/refunds", label: "Refund Operations" }] : []),
    ...(can(user, "audit:view") ? [{ href: "/audit", label: "Audit Log" }] : []),
    ...(can(user, "admin:access") ? [{ href: "/admin", label: "Administration" }] : []),
  ];

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 shrink-0 flex-col border-r border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <div className="text-sm font-semibold tracking-tight">Ops Portal</div>
          <div className="text-xs text-slate-500">Internal tools · prototype</div>
        </div>
        <SidebarNav items={nav} />
        <div className="mt-auto border-t border-slate-200 px-5 py-3 text-[11px] leading-relaxed text-slate-400">
          Synthetic data only. Authorization is enforced server-side; the UI only hints.
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-6">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">{user.name}</span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-500">{user.title}</span>
            <RoleBadge role={user.role} />
          </div>
          {demoMode && <RoleSwitcher users={switchableUsers} currentUserId={user.id} />}
        </header>
        <main className="flex-1 px-8 py-6">{children}</main>
      </div>
    </div>
  );
}
