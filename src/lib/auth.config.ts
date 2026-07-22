import type { NextAuthConfig } from "next-auth";
import type { Role } from "@/generated/prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: Role;
    };
  }
}

// Edge-safe config shared by middleware (session read only) and the full auth.ts (adds the
// Prisma-backed Credentials provider). Keeping providers out of this file is what lets
// middleware run without bundling Prisma/bcrypt into the Edge runtime.
export const authConfig = {
  // Auth.js trusts the request's Host header automatically on Vercel; anywhere else (Netlify
  // included) this needs to be explicit, or every auth request fails with an "UntrustedHost"
  // server error — which is exactly what login was hitting.
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role: Role }).role;
        token.firstName = (user as { firstName: string }).firstName;
        token.lastName = (user as { lastName: string }).lastName;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as Role;
      session.user.firstName = token.firstName as string;
      session.user.lastName = token.lastName as string;
      return session;
    },
  },
} satisfies NextAuthConfig;
