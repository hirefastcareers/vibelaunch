/**
 * Dump production schema facts for baselining (no secrets printed).
 */
import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();

async function main() {
  const tables = await p.$queryRawUnsafe<Array<{ table_name: string }>>(
    `SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY 1`
  );
  console.log("TABLES", tables.map((t) => t.table_name).join(","));

  for (const table of [
    "User",
    "Project",
    "Post",
    "Account",
    "Session",
    "GeoMetric",
    "PostEmbedding",
  ]) {
    const cols = await p.$queryRawUnsafe<Array<{ column_name: string; data_type: string; udt_name: string; is_nullable: string; column_default: string | null }>>(
      `SELECT column_name, data_type, udt_name, is_nullable, column_default
       FROM information_schema.columns
       WHERE table_schema='public' AND table_name=$1
       ORDER BY ordinal_position`,
      table
    );
    console.log(`\n== ${table} ==`);
    for (const c of cols) {
      console.log(
        `  ${c.column_name}\t${c.udt_name}\tnull=${c.is_nullable}\tdefault=${c.column_default ?? ""}`
      );
    }
  }

  const enums = await p.$queryRawUnsafe<Array<{ typname: string; enumlabel: string }>>(
    `SELECT t.typname, e.enumlabel
     FROM pg_type t
     JOIN pg_enum e ON t.oid = e.enumtypid
     JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
     WHERE n.nspname = 'public'
     ORDER BY t.typname, e.enumsortorder`
  );
  console.log("\n== ENUMS ==");
  const by: Record<string, string[]> = {};
  for (const row of enums) {
    (by[row.typname] ??= []).push(row.enumlabel);
  }
  for (const [k, v] of Object.entries(by)) {
    console.log(`  ${k}: ${v.join("|")}`);
  }

  const indexes = await p.$queryRawUnsafe<Array<{ tablename: string; indexname: string; indexdef: string }>>(
    `SELECT tablename, indexname, indexdef FROM pg_indexes WHERE schemaname='public' ORDER BY tablename, indexname`
  );
  console.log("\n== INDEXES ==");
  for (const i of indexes) {
    console.log(`  ${i.tablename}.${i.indexname}`);
  }

  const ext = await p.$queryRawUnsafe<Array<{ extname: string }>>(
    `SELECT extname FROM pg_extension ORDER BY 1`
  );
  console.log("\n== EXTENSIONS ==", ext.map((e) => e.extname).join(","));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => p.$disconnect());
