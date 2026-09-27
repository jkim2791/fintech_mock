import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/shell/AppShell";
import { getAuthProvider, isDemoMode, requireUser } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { LocaleProvider } from "@/lib/i18n/client";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
// Self-hosted Hangul fallback so Korean UI text does not depend on client system fonts.
const notoSansKr = Noto_Sans_KR({ variable: "--font-noto-kr", subsets: ["latin"], weight: "variable", display: "swap", preload: false });

export const metadata: Metadata = {
  title: "Ops Portal · Internal",
  description: "Internal operations portal prototype (synthetic data only)",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await requireUser();
  const [switchableUsers, locale] = await Promise.all([getAuthProvider().listSwitchableUsers(), getLocale()]);
  return (
    <html lang={locale} className={`${geistSans.variable} ${geistMono.variable} ${notoSansKr.variable}`}>
      <body>
        <LocaleProvider locale={locale}>
          <AppShell user={user} switchableUsers={switchableUsers} demoMode={isDemoMode()}>
            {children}
          </AppShell>
        </LocaleProvider>
      </body>
    </html>
  );
}
