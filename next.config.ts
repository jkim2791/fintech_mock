import type { NextConfig } from "next";

// Origins allowed to submit Server Actions when the request arrives through a
// forwarding proxy whose `x-forwarded-host` differs from the browser's `origin`
// (e.g. a tunnelled demo URL). Comma-separated `Origin` host values.
const allowedOrigins = (process.env.SERVER_ACTIONS_ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  experimental: allowedOrigins.length ? { serverActions: { allowedOrigins } } : undefined,
};

export default nextConfig;
