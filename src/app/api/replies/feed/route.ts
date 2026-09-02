import { NextResponse } from "next/server";
import { isDemoMode, demoDelay } from "@/lib/demo-mode";
import { MOCK_SMART_REPLIES_FEED } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export async function GET() {
  if (isDemoMode()) {
    await demoDelay();
    return NextResponse.json({
      feeds: MOCK_SMART_REPLIES_FEED,
      configured: true,
    });
  }

  return NextResponse.json({ feeds: {}, configured: false });
}
