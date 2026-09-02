import { CustomerPortal } from "@dodopayments/nextjs";

type DodoEnvironment = "test_mode" | "live_mode";

// Called as /customer-portal?customer_id=<dodoCustomerId>. Adapter returns 400
// if customer_id is missing — no pre-check needed here.
export const GET = CustomerPortal({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY,
  environment: process.env.DODO_PAYMENTS_ENVIRONMENT as DodoEnvironment | undefined,
});
