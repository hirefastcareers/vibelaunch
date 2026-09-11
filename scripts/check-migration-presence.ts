import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();

async function main() {
  const checks: Array<[string, string]> = [
    [
      `SELECT 1 FROM information_schema.columns WHERE table_name='Project' AND column_name='lastCaptureUrl'`,
      "m1_lastCaptureUrl",
    ],
    [
      `SELECT 1 FROM information_schema.columns WHERE table_name='Project' AND column_name='lastCapturedAt'`,
      "m1_lastCapturedAt",
    ],
    [`SELECT 1 FROM pg_type WHERE typname='PlanTier'`, "m2_PlanTier"],
    [
      `SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='planTier'`,
      "m2_planTier",
    ],
    [
      `SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='dodoCustomerId'`,
      "m2_dodoCustomerId",
    ],
    [
      `SELECT 1 FROM pg_indexes WHERE indexname='User_dodoCustomerId_key'`,
      "m2_dodo_idx",
    ],
    [
      `SELECT 1 FROM information_schema.tables WHERE table_name='TrackedQuery'`,
      "m3_TrackedQuery",
    ],
    [
      `SELECT 1 FROM information_schema.tables WHERE table_name='CitationRun'`,
      "m3_CitationRun",
    ],
    [
      `SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='scorecardPublic'`,
      "m9_scorecard",
    ],
    [`SELECT 1 FROM information_schema.tables WHERE table_name='Alert'`, "m12_Alert"],
    [
      `SELECT 1 FROM information_schema.tables WHERE table_name='_prisma_migrations'`,
      "prisma_migrations",
    ],
  ];
  for (const [sql, name] of checks) {
    const rows = (await p.$queryRawUnsafe(sql)) as unknown[];
    console.log(name, rows.length > 0 ? "PRESENT" : "ABSENT");
  }
  const userCount = await p.user.count();
  const projectCount = await p.project.count();
  const sessionCount = await p.session.count();
  console.log(JSON.stringify({ userCount, projectCount, sessionCount }));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => p.$disconnect());
