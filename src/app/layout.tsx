import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/shell/AppShell";
import { getAuthProvider, isDemoMode, requireUser } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { LocaleProvider } from "@/lib/i18n/client";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Ops Portal · Internal",
  description: "Internal operations portal prototype (synthetic data only)",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await requireUser();
  const [switchableUsers, locale] = await Promise.all([getAuthProvider().listSwitchableUsers(), getLocale()]);
  return (
    <html lang={locale}>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <LocaleProvider locale={locale}>
          <AppShell user={user} switchableUsers={switchableUsers} demoMode={isDemoMode()}>
            {children}
          </AppShell>
        </LocaleProvider>
      </body>
    </html>
  );
}
