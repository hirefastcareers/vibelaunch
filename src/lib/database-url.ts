/**
 * Serverless Prisma needs a transaction pooler and one connection per instance.
 * Supabase session-mode (port 5432 on *.pooler.supabase.com) caps out at a
 * small pool and fails login with EMAXCONNSESSION.
 */
export function toServerlessDatabaseUrl(raw: string | undefined): string | undefined {
  if (!raw?.trim()) return raw;

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return raw;
  }

  const host = url.hostname.toLowerCase();
  const isSupabasePooler = host.includes("pooler.supabase.com");
  const isNeon = host.endsWith(".neon.tech");

  if (!isSupabasePooler && !isNeon) {
    return raw;
  }

  if (isSupabasePooler && (url.port === "5432" || url.port === "")) {
    url.port = "6543";
  }

  if (isNeon && !host.includes("-pooler.")) {
    url.hostname = url.hostname.replace(/^([^.]+)/, "$1-pooler");
  }

  if (!url.searchParams.has("pgbouncer")) {
    url.searchParams.set("pgbouncer", "true");
  }
  if (!url.searchParams.has("connection_limit")) {
    url.searchParams.set("connection_limit", "1");
  }

  return url.toString();
}
