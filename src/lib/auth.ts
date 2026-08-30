import { NextAuthOptions } from "next-auth";
import TwitterProvider from "next-auth/providers/twitter";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import type { Adapter } from "next-auth/adapters";
import { ensureAuthEnv } from "./env";
import { isDemoMode } from "./demo-mode";
import { DEMO_USER } from "./mock-data";

ensureAuthEnv();

const demoProvider = CredentialsProvider({
  id: "demo",
  name: "Demo",
  credentials: {
    username: { label: "Username", type: "text" },
    password: { label: "Password", type: "password" },
  },
  async authorize(credentials) {
    if (
      credentials?.username === "demo" &&
      credentials?.password === "demo"
    ) {
      return {
        id: DEMO_USER.id,
        name: DEMO_USER.name,
        email: DEMO_USER.email,
      };
    }
    return null;
  },
});

const twitterProvider = TwitterProvider({
  clientId: process.env.X_CLIENT_ID ?? "test-x-client-id",
  clientSecret: process.env.X_CLIENT_SECRET ?? "test-x-client-secret",
  version: "2.0",
  authorization: {
    params: {
      scope: "tweet.read tweet.write users.read offline.access",
    },
  },
});

const demoAuthOptions: NextAuthOptions = {
  providers: [demoProvider],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.xUsername = DEMO_USER.xUsername;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.xUsername = token.xUsername as string;
      }
      return session;
    },
  },
  pages: { signIn: "/auth/signin" },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
};

const productionAuthOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: [twitterProvider],
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
      if (account?.provider === "twitter" && profile) {
        const twitterProfile = profile as { data?: { id?: string; username?: string } };
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

export const authOptions: NextAuthOptions = isDemoMode()
  ? demoAuthOptions
  : productionAuthOptions;
