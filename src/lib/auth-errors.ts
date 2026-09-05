export function getSignInErrorMessage(
  error: string | undefined,
  configured: boolean,
): string | null {
  if (!configured) {
    return "X sign-in is not configured. Set X_CLIENT_ID and X_CLIENT_SECRET in .env and .env.local to the OAuth 2.0 Client ID and Client Secret from the X developer portal (User authentication settings), then restart npm run dev.";
  }

  switch (error) {
    case "twitter":
    case "OAuthSignin":
      return "Could not start X sign-in. Use the OAuth 2.0 Client ID and Client Secret (not the API Key), confirm they have no extra quotes or spaces, and restart the dev server.";
    case "OAuthCallback":
    case "Callback":
      return "X rejected the callback. In the X app, add exactly http://localhost:3000/api/auth/callback/twitter (and http://127.0.0.1:3000/api/auth/callback/twitter). NEXTAUTH_URL must be http://localhost:3000.";
    case "OAuthCreateAccount":
      return "Signed in with X, but the account could not be saved. Check DATABASE_URL and that prisma db push succeeded.";
    case "OAuthAccountNotLinked":
      return "This X account is already linked to another user. Sign in with that same X account, or clear the old User/Account rows and try again.";
    case "AccessDenied":
      return "X access was denied. Approve the app on the X consent screen and make sure the app permissions are Read and write.";
    case "Configuration":
      return "NextAuth is missing configuration. Set NEXTAUTH_SECRET and NEXTAUTH_URL, then restart the dev server.";
    default:
      return error
        ? `X sign-in failed (${error}). Check the terminal running npm run dev for [next-auth][error] lines.`
        : null;
  }
}
