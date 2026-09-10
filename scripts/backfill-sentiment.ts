/**
 * Phase 5 sentiment backfill (ops / local).
 * Production uses /api/cron/backfill-sentiment on an hourly schedule after migrate.
 */
import { backfillSentimentBatch } from "../src/lib/geo/backfill-sentiment";

async function main() {
  let round = 0;
  while (round < 100) {
    round += 1;
    const stats = await backfillSentimentBatch(40);
    console.log(`round ${round}`, stats);
    if (stats.done) break;
    if (
      stats.brandRunsScanned === 0 &&
      stats.competitorMentionsCreated === 0 &&
      stats.competitorMentionsFailed === 0
    ) {
      break;
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
