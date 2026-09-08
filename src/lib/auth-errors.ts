export function getSignInErrorMessage(
  error: string | undefined,
  configured: boolean,
  callbackUrls: string[] = [],
): string | null {
  if (!configured) {
    return "X sign-in is not configured. Set X_CLIENT_ID and X_CLIENT_SECRET to the OAuth 2.0 Client ID and Client Secret from the X developer portal (User authentication settings).";
  }

  const callbackHelp =
    callbackUrls.length > 0
      ? `In the X developer portal, add this Callback URI exactly: ${callbackUrls.join(" and ")}. Type of app must be Web App.`
      : "In the X developer portal, add the Callback URI shown on this page. Type of app must be Web App.";

  switch (error) {
    case "twitter":
    case "OAuthSignin":
      return "Could not start X sign-in. Use the OAuth 2.0 Client ID and Client Secret (not the API Key), and confirm they have no extra quotes or spaces.";
    case "OAuthCallback":
    case "Callback":
      return `X rejected the callback. ${callbackHelp}`;
    case "OAuthCreateAccount":
      return "Signed in with X, but the account could not be saved. Check DATABASE_URL and that the database schema is up to date.";
    case "OAuthAccountNotLinked":
      return "This X account is already linked to another user. Sign in with that same X account.";
    case "AccessDenied":
      return "X access was denied. Approve the app on the X consent screen and make sure the app permissions are Read and write.";
    case "Configuration":
      return "Sign-in is missing configuration. Set NEXTAUTH_SECRET, then try again.";
    default:
      return error ? `X sign-in failed (${error}). ${callbackHelp}` : null;
  }
}
