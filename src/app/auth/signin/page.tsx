export const dynamic = "force-dynamic";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import SignInForm from "./signin-form";
import {
  applyRequestAuthUrl,
  getXOauthCallbackAllowlist,
  isXOauthConfigured,
} from "@/lib/env";
import { getSignInErrorMessage, shouldShowXPortalHelp } from "@/lib/auth-errors";
import { getSession } from "@/lib/session";

type PageProps = {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
};

function safeCallbackUrl(value?: string): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }
  return value;
}

export default async function SignInPage({ searchParams }: PageProps) {
  const { error, callbackUrl: rawCallbackUrl } = await searchParams;
  const callbackUrl = safeCallbackUrl(rawCallbackUrl);
  const origin = applyRequestAuthUrl(await headers());
  const configured = isXOauthConfigured();
  const callbackUrls = getXOauthCallbackAllowlist(origin);

  const session = await getSession();
  if (session?.user?.id) {
    redirect(callbackUrl);
  }

  return (
    <SignInForm
      configured={configured}
      callbackUrls={callbackUrls}
      errorMessage={getSignInErrorMessage(error, configured, callbackUrls)}
      callbackUrl={callbackUrl}
      showCallbackHelp={shouldShowXPortalHelp(error)}
    />
  );
}
