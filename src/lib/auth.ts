import { NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import { upsertUser, getUserByGithubId } from "./db";

export const authOptions: NextAuthOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "github" && profile) {
        const ghProfile = profile as { login?: string; avatar_url?: string; id?: number };
        await upsertUser(
          String(ghProfile.id || account.providerAccountId),
          ghProfile.login || user.name || "unknown",
          ghProfile.avatar_url || user.image || ""
        );
      }
      return true;
    },
    async session({ session, token }) {
      if (token.sub) {
        const dbUser = await getUserByGithubId(token.sub);
        if (dbUser) {
          (session as ExtendedSession).userId = dbUser.id;
          (session as ExtendedSession).credits = dbUser.credits;
          (session as ExtendedSession).username = dbUser.username;
        }
      }
      return session;
    },
    async jwt({ token, account, profile }) {
      if (account && profile) {
        const ghProfile = profile as { id?: number };
        token.sub = String(ghProfile.id || account.providerAccountId);
      }
      return token;
    },
  },
  pages: {
    signIn: "/",
  },
};

export interface ExtendedSession {
  userId: number;
  credits: number;
  username: string;
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  expires: string;
}
