import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitLab from "next-auth/providers/gitlab";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import "@/lib/auth/types";

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma) as NextAuthConfig["adapter"],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/signin",
  },
  providers: [
    // GitLab OAuth (self-hosted or gitlab.com)
    ...(process.env.GITLAB_CLIENT_ID
      ? [
          GitLab({
            clientId: process.env.GITLAB_CLIENT_ID,
            clientSecret: process.env.GITLAB_CLIENT_SECRET!,
            // For self-hosted GitLab, override the issuer URL
            issuer: process.env.GITLAB_URL || "https://gitlab.com",
          }),
        ]
      : []),

    // Credentials (dev / fallback)
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            tier: true,
            passwordHash: true,
          },
        });

        if (!user || !user.passwordHash) return null;

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          tier: user.tier,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id!;

        // For OAuth users, look up tier from DB (new users default to "public")
        if (account?.provider === "gitlab") {
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id! },
            select: { tier: true },
          });
          token.tier = dbUser?.tier || "public";
        } else {
          token.tier = (user as { tier: string }).tier;
        }
      }
      return token;
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id as string,
          tier: token.tier as string,
        },
      };
    },
  },
};
