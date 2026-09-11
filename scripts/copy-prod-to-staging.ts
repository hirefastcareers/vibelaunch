/**
 * Copy production foundation tables into local staging via raw SQL.
 * Avoids Prisma client schema drift (prod lacks GEO columns the tip client expects).
 */
import pg from "pg";

const { Client } = pg;

const TABLES = [
  "User",
  "Account",
  "Session",
  "VerificationToken",
  "Project",
  "Post",
  "PostAnalytics",
  "PostEmbedding",
  "GeoMetric",
  "ChangelogEntry",
  "EriSnapshot",
  "TestRun",
] as const;

async function main() {
  const prod = new Client({
    connectionString: process.env.PROD_DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  const staging = new Client({
    connectionString: process.env.STAGING_DATABASE_URL,
  });
  await prod.connect();
  await staging.connect();

  // Disable FK checks during load
  await staging.query("SET session_replication_role = replica");

  const counts: Record<string, number> = {};
  for (const table of TABLES) {
    const res = await prod.query(`SELECT * FROM "${table}"`);
    counts[table] = res.rows.length;
    if (res.rows.length === 0) continue;

    const cols = res.fields.map((f) => f.name);
    const colList = cols.map((c) => `"${c}"`).join(", ");
    for (const row of res.rows) {
      const values = cols.map((c) => row[c]);
      const placeholders = values.map((_, i) => `$${i + 1}`).join(", ");
      await staging.query(
        `INSERT INTO "${table}" (${colList}) VALUES (${placeholders})`,
        values
      );
    }
  }

  await staging.query("SET session_replication_role = DEFAULT");
  console.log(JSON.stringify(counts));
  await prod.end();
  await staging.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
