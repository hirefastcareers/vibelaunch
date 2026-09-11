/**
 * Local (non-deployment) verification of plan-cap gates against a real Postgres DB.
 * Uses the same assert/gate helpers the API routes call — not HTTP against Vercel.
 *
 * Usage:
 *   DATABASE_URL=postgresql://... npx --yes tsx scripts/local-plan-cap-verify.ts
 */
import { PrismaClient } from "@prisma/client";
import {
  UsageLimitError,
  assertCanCreateCompetitors,
  assertCanCreateTrackedQueries,
  gateSuggestionGeneration,
} from "../src/lib/billing/limits";
import {
  PLAN_LIMITS,
  citationModelsForPlan,
  planRunsOnUtcWeekday,
} from "../src/lib/billing/plans";
import { validateAlertWebhookUrl } from "../src/lib/alerts/webhook-url";
import { buildScorecardPayload } from "../src/lib/geo/scorecard";

const prisma = new PrismaClient();

type Result = { name: string; ok: boolean; detail: string };

async function expectLimit(
  name: string,
  fn: () => Promise<unknown>,
  code: string
): Promise<Result> {
  try {
    await fn();
    return { name, ok: false, detail: `expected ${code}, but call succeeded` };
  } catch (err) {
    if (err instanceof UsageLimitError && err.code === code) {
      return { name, ok: true, detail: err.message };
    }
    return {
      name,
      ok: false,
      detail: `unexpected error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

async function seedUser(planTier: "FREE" | "STARTER" | "PRO", suffix: string) {
  return prisma.user.create({
    data: {
      email: `verify-${planTier.toLowerCase()}-${suffix}@example.com`,
      name: `Verify ${planTier}`,
      planTier,
    },
  });
}

async function fillTrackedQueries(userId: string, brandName: string, n: number) {
  for (let i = 0; i < n; i++) {
    await prisma.trackedQuery.create({
      data: {
        userId,
        brandName,
        promptText: `prompt ${i + 1} for ${brandName} verification`,
      },
    });
  }
}

async function fillCompetitors(userId: string, n: number) {
  for (let i = 0; i < n; i++) {
    await prisma.competitorBrand.create({
      data: { userId, brandName: `Competitor ${i + 1}` },
    });
  }
}

async function fillSuggestions(userId: string, n: number) {
  const tq = await prisma.trackedQuery.findFirst({ where: { userId } });
  if (!tq) throw new Error("need tracked query before suggestions");
  for (let i = 0; i < n; i++) {
    await prisma.contentSuggestion.create({
      data: {
        userId,
        trackedQueryId: tq.id,
        model: "openai",
        suggestionText: `Suggestion brief ${i + 1}`,
        status: "NEW",
      },
    });
  }
}

async function main() {
  const suffix = Date.now().toString(36);
  const results: Result[] = [];

  const free = await seedUser("FREE", suffix);
  await fillTrackedQueries(free.id, "FreeBrand", PLAN_LIMITS.FREE.trackedQueries);
  results.push(
    await expectLimit(
      "FREE trackedQueries hard cap",
      () => assertCanCreateTrackedQueries(free.id, 1),
      "TRACKED_QUERY_LIMIT"
    )
  );
  await fillCompetitors(free.id, PLAN_LIMITS.FREE.competitors);
  results.push(
    await expectLimit(
      "FREE competitors hard cap",
      () => assertCanCreateCompetitors(free.id, 1),
      "COMPETITOR_LIMIT"
    )
  );
  await fillSuggestions(free.id, PLAN_LIMITS.FREE.suggestionGenerationsPerMonth);
  results.push(
    await expectLimit(
      "FREE suggestions hard cap",
      () => gateSuggestionGeneration(free.id),
      "SUGGESTION_LIMIT"
    )
  );

  const freeModels = citationModelsForPlan("FREE");
  results.push({
    name: "FREE citation models (3)",
    ok:
      freeModels.length === 3 &&
      !freeModels.includes("anthropic") &&
      !freeModels.includes("grok"),
    detail: freeModels.join(","),
  });

  results.push({
    name: "FREE runs Mon only (not Thu)",
    ok: planRunsOnUtcWeekday("FREE", 1) && !planRunsOnUtcWeekday("FREE", 4),
    detail: `mon=${planRunsOnUtcWeekday("FREE", 1)} thu=${planRunsOnUtcWeekday("FREE", 4)}`,
  });
  results.push({
    name: "PRO runs Mon and Thu",
    ok: planRunsOnUtcWeekday("PRO", 1) && planRunsOnUtcWeekday("PRO", 4),
    detail: `mon=${planRunsOnUtcWeekday("PRO", 1)} thu=${planRunsOnUtcWeekday("PRO", 4)}`,
  });

  const starter = await seedUser("STARTER", suffix);
  await fillTrackedQueries(
    starter.id,
    "StarterBrand",
    PLAN_LIMITS.STARTER.trackedQueries
  );
  results.push(
    await expectLimit(
      "STARTER trackedQueries hard cap",
      () => assertCanCreateTrackedQueries(starter.id, 1),
      "TRACKED_QUERY_LIMIT"
    )
  );
  await fillCompetitors(starter.id, PLAN_LIMITS.STARTER.competitors);
  results.push(
    await expectLimit(
      "STARTER competitors hard cap",
      () => assertCanCreateCompetitors(starter.id, 1),
      "COMPETITOR_LIMIT"
    )
  );

  const starterModels = citationModelsForPlan("STARTER");
  results.push({
    name: "STARTER citation models (5)",
    ok: starterModels.length === 5,
    detail: starterModels.join(","),
  });

  // Webhook SSRF (same validator alerts API uses)
  const ssrfCases = [
    "http://127.0.0.1/hook",
    "http://169.254.169.254/latest/meta-data/",
    "http://[::ffff:127.0.0.1]/hook",
    "http://localhost/hook",
  ];
  for (const url of ssrfCases) {
    const v = validateAlertWebhookUrl(url);
    results.push({
      name: `SSRF reject ${url}`,
      ok: !v.ok,
      detail: v.ok ? "accepted (bad)" : v.error,
    });
  }
  const good = validateAlertWebhookUrl("https://hooks.example.com/xoopa");
  results.push({
    name: "SSRF allow public https",
    ok: good.ok,
    detail: good.ok ? good.url : good.error,
  });

  // Free cannot use webhooks per plan flag
  results.push({
    name: "FREE alertWebhooks=false",
    ok: PLAN_LIMITS.FREE.alertWebhooks === false,
    detail: String(PLAN_LIMITS.FREE.alertWebhooks),
  });
  results.push({
    name: "STARTER alertWebhooks=true",
    ok: PLAN_LIMITS.STARTER.alertWebhooks === true,
    detail: String(PLAN_LIMITS.STARTER.alertWebhooks),
  });

  // Scorecard payload privacy (builder used by public page)
  const scUser = await seedUser("PRO", `${suffix}-sc`);
  const tq = await prisma.trackedQuery.create({
    data: {
      userId: scUser.id,
      brandName: "ScoreBrand",
      promptText: "SECRET_PROMPT_SHOULD_NOT_LEAK",
    },
  });
  await prisma.citationRun.create({
    data: {
      trackedQueryId: tq.id,
      model: "openai",
      rawResponse: "SECRET_RAW_RESPONSE mentioning ScoreBrand",
      brandMentioned: true,
      citedUrls: ["https://example.com"],
      sentiment: "positive",
    },
  });
  await prisma.competitorBrand.create({
    data: { userId: scUser.id, brandName: "RivalCo" },
  });
  const payload = await buildScorecardPayload(scUser.id);
  const json = JSON.stringify(payload);
  const leaks = [
    "SECRET_PROMPT",
    "SECRET_RAW",
    "dodoCustomer",
    "planTier",
    "subscription",
    "billing",
  ].filter((s) => json.toLowerCase().includes(s.toLowerCase()));
  results.push({
    name: "Scorecard payload has no prompts/raw/billing",
    ok: leaks.length === 0 && !("promptText" in payload) && !("rawResponse" in (payload as object)),
    detail: leaks.length ? `leaks=${leaks.join(",")}` : `keys=${Object.keys(payload).join(",")}`,
  });
  // Competitor names ARE intentionally in ranking (open review question)
  results.push({
    name: "Scorecard ranking may include competitor names (by design)",
    ok: Array.isArray(payload.ranking),
    detail: payload.ranking.map((r) => r.brandName).join(",") || "(empty)",
  });

  console.log(JSON.stringify({ scope: "local-db-helpers-not-live-deploy", results }, null, 2));
  const failed = results.filter((r) => !r.ok);
  if (failed.length) {
    console.error(`FAILED ${failed.length}/${results.length}`);
    process.exit(1);
  }
  console.error(`PASSED ${results.length}/${results.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
