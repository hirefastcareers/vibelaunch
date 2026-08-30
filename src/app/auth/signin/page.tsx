export const dynamic = "force-dynamic";

import SignInForm from "./signin-form";
import { isDemoMode } from "@/lib/demo";

export default function SignInPage() {
  return <SignInForm demoMode={isDemoMode()} />;
}
