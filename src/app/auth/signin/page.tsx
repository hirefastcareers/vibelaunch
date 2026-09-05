export const dynamic = "force-dynamic";

import SignInForm from "./signin-form";
import { isXOauthConfigured } from "@/lib/env";
import { getSignInErrorMessage } from "@/lib/auth-errors";

type PageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function SignInPage({ searchParams }: PageProps) {
  const { error } = await searchParams;
  const configured = isXOauthConfigured();
  return (
    <SignInForm
      configured={configured}
      errorMessage={getSignInErrorMessage(error, configured)}
    />
  );
}
