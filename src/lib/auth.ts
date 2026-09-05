import { NextAuthOptions } from "next-auth";
import TwitterProvider from "next-auth/providers/twitter";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import type { Adapter } from "next-auth/adapters";
import { ensureAuthEnv, getXOauthCredentials } from "./env";

ensureAuthEnv();

const { clientId, clientSecret } = getXOauthCredentials();

const X_OAUTH_SCOPES = "tweet.read tweet.write users.read offline.access";

const twitterProvider = TwitterProvider({
  clientId,
  clientSecret,
  version: "2.0",
  checks: ["pkce", "state"],
  // Current X OAuth 2.0 hosts. twitter.com/i/oauth2/authorize often renders
  // X's generic "You weren't able to give access to the App" page.
  authorization: {
    url: "https://x.com/i/oauth2/authorize",
    params: {
      scope: X_OAUTH_SCOPES,
    },
  },
  token: {
    url: "https://api.x.com/2/oauth2/token",
    async request({ client, params, checks, provider }) {
      const tokens = await client.oauthCallback(
        provider.callbackUrl,
        params,
        checks,
        { exchangeBody: { client_id: clientId } },
      );
      return { tokens };
    },
  },
  userinfo: {
    url: "https://api.x.com/2/users/me",
    params: {
      "user.fields": "profile_image_url,username",
    },
  },
});

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: [twitterProvider],
  debug: process.env.NODE_ENV === "development",
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { xUsername: true, xUserId: true },
        });
        session.user.xUsername = dbUser?.xUsername ?? undefined;
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      if (account?.provider === "twitter" && profile && user.id) {
        const twitterProfile = profile as {
          data?: { id?: string; username?: string };
        };
        const xUserId = twitterProfile.data?.id ?? account.providerAccountId;
        const xUsername = twitterProfile.data?.username;
        if (xUserId) {
          await prisma.user.update({
            where: { id: user.id },
            data: { xUserId, xUsername },
          });
        }
      }
      return true;
    },
  },
  pages: { signIn: "/auth/signin" },
  session: { strategy: "database" },
  secret: process.env.NEXTAUTH_SECRET,
};
