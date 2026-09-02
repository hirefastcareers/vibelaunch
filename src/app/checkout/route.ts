import { Checkout } from "@dodopayments/nextjs";

type DodoEnvironment = "test_mode" | "live_mode";

// Static checkout. Query params like metadata_userId are passed through as
// Dodo metadata (any metadata_* prefix) so webhooks can map back to User.id.
export const GET = Checkout({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY,
  returnUrl: process.env.DODO_PAYMENTS_RETURN_URL,
  environment: process.env.DODO_PAYMENTS_ENVIRONMENT as DodoEnvironment | undefined,
  type: "static",
});
