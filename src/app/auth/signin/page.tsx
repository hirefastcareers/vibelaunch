export const dynamic = "force-dynamic";

import SignInForm from "./signin-form";
import { getXOauthCallbackAllowlist, isXOauthConfigured } from "@/lib/env";
import { getSignInErrorMessage } from "@/lib/auth-errors";

type PageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function SignInPage({ searchParams }: PageProps) {
  const { error } = await searchParams;
  const configured = isXOauthConfigured();
  const callbackUrls = getXOauthCallbackAllowlist();
  return (
    <SignInForm
      configured={configured}
      callbackUrls={callbackUrls}
      errorMessage={getSignInErrorMessage(error, configured, callbackUrls)}
    />
  );
}
