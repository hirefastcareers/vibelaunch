import { NextAuthOptions } from "next-auth";
import TwitterProvider from "next-auth/providers/twitter";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import type { Adapter } from "next-auth/adapters";
import { ensureAuthEnv, getXOauthCredentials } from "./env";

ensureAuthEnv();

const { clientId, clientSecret } = getXOauthCredentials();

const twitterProvider = TwitterProvider({
  clientId,
  clientSecret,
  version: "2.0",
  // Include authorization.url. Overriding only `params` can drop the URL
  // during NextAuth's provider merge and fail with ?error=twitter.
  authorization: {
    url: "https://twitter.com/i/oauth2/authorize",
    params: {
      scope: "tweet.read tweet.write users.read offline.access",
    },
  },
  userinfo: {
    url: "https://api.twitter.com/2/users/me",
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
