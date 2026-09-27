import type { AuthUser } from "@/lib/auth/types";
import { can } from "@/lib/authz";
import { SidebarNav, type NavItem } from "./SidebarNav";
import { Breadcrumbs } from "./Breadcrumbs";
import { RoleSwitcher } from "./RoleSwitcher";
import { LanguageToggle } from "./LanguageToggle";
import { getT } from "@/lib/i18n";
import { RoleBadge } from "@/components/shared/StatusBadge";

/**
 * Navigation is derived from permissions, so a new module only needs a new
 * entry here plus its own permission strings.
 */
export async function AppShell({
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
  const t = await getT();
  const nav: NavItem[] = [
    { href: "/", label: t("nav.overview") },
    ...(can(user, "kyc:view") ? [{ href: "/kyc", label: t("nav.kyc"), group: t("nav.group.modules") }] : []),
    ...(can(user, "refund:view") ? [{ href: "/refunds", label: t("nav.refunds"), group: t("nav.group.modules") }] : []),
    ...(can(user, "audit:view") ? [{ href: "/audit", label: t("nav.audit"), group: t("nav.group.governance") }] : []),
    ...(can(user, "admin:access") ? [{ href: "/admin", label: t("nav.admin"), group: t("nav.group.governance") }] : []),
  ];
  const initials = user.name
    .split(/[\s-]+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 flex h-screen w-56 shrink-0 flex-col border-r border-slate-200 bg-white">
        <div className="flex h-14 items-center gap-2.5 border-b border-slate-200 px-4">
          <div className="grid h-6 w-6 place-items-center rounded bg-slate-900 text-[10px] font-semibold tracking-tight text-white">OP</div>
          <div className="leading-tight">
            <div className="text-[13px] font-semibold text-slate-900">{t("app.name")}</div>
            <div className="text-[11px] text-slate-500">{t("app.tagline")}</div>
          </div>
        </div>
        <SidebarNav items={nav} />
        <div className="mt-auto border-t border-slate-200 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-100 text-[11px] font-medium text-slate-700">{initials}</div>
            <div className="min-w-0 leading-tight">
              <div className="truncate text-[13px] font-medium text-slate-900">{user.name}</div>
              <div className="truncate text-[11px] text-slate-500">{t(`title.${user.role}`)}</div>
            </div>
          </div>
          <div className="mt-2">
            <RoleBadge role={user.role} />
          </div>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-slate-200 bg-white/95 px-6 backdrop-blur">
          <Breadcrumbs items={nav} />
          <div className="flex items-center gap-3">
            {demoMode && <RoleSwitcher users={switchableUsers} currentUserId={user.id} />}
            <span className="h-4 w-px bg-slate-200" />
            <LanguageToggle />
          </div>
        </header>
        <main className="flex-1 px-6 py-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1280px]">{children}</div>
        </main>
        <footer className="px-6 py-3 text-[11px] text-slate-400 lg:px-8">
          {t("shell.footer")}
        </footer>
      </div>
    </div>
  );
}
