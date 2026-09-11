import { PrismaClient } from "@prisma/client";
import { randomBytes } from "crypto";

const prisma = new PrismaClient();
const suffix = Date.now().toString(36);
const expires = new Date(Date.now() + 7 * 24 * 3600 * 1000);

async function makeUser(planTier: "FREE" | "STARTER" | "PRO") {
  const sessionToken = randomBytes(32).toString("hex");
  const user = await prisma.user.create({
    data: {
      email: `live-verify-${planTier.toLowerCase()}-${suffix}@xoopa-test.local`,
      name: `LiveVerify ${planTier}`,
      planTier,
      sessions: { create: { sessionToken, expires } },
    },
  });

  if (planTier === "FREE") {
    for (let i = 0; i < 5; i++) {
      await prisma.trackedQuery.create({
        data: {
          userId: user.id,
          brandName: "LiveVerifyFreeBrand",
          promptText: `live verify free prompt ${i + 1} ${suffix}`,
        },
      });
    }
    await prisma.competitorBrand.create({
      data: { userId: user.id, brandName: `LiveVerifyRival-${suffix}` },
    });
    const tq = await prisma.trackedQuery.findFirstOrThrow({
      where: { userId: user.id },
    });
    for (let i = 0; i < 5; i++) {
      await prisma.contentSuggestion.create({
        data: {
          userId: user.id,
          trackedQueryId: tq.id,
          model: "openai",
          suggestionText: `live verify suggestion ${i + 1}`,
          status: "NEW",
        },
      });
    }
  }

  if (planTier === "STARTER") {
    for (let i = 0; i < 15; i++) {
      await prisma.trackedQuery.create({
        data: {
          userId: user.id,
          brandName: "LiveVerifyStarterBrand",
          promptText: `live verify starter prompt ${i + 1} ${suffix}`,
        },
      });
    }
    for (let i = 0; i < 3; i++) {
      await prisma.competitorBrand.create({
        data: { userId: user.id, brandName: `StarterRival${i}-${suffix}` },
      });
    }
  }

  if (planTier === "PRO") {
    await prisma.trackedQuery.create({
      data: {
        userId: user.id,
        brandName: "Xoopa",
        promptText: `best AI citation tracking tools for indie SaaS founders ${suffix}`,
      },
    });
    await prisma.competitorBrand.create({
      data: { userId: user.id, brandName: `PeecAI-${suffix}` },
    });
  }

  return { planTier, userId: user.id, sessionToken, email: user.email };
}

async function main() {
  const out = {
    free: await makeUser("FREE"),
    starter: await makeUser("STARTER"),
    pro: await makeUser("PRO"),
    suffix,
  };
  console.log(JSON.stringify(out));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
