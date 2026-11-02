import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { readAuthEnv } from "./env";

/**
 * Sessions are JWT-backed, so no database is required. The tradeoff, recorded
 * here because it is invisible in the code: a JWT session cannot be revoked
 * before it expires. A 24h ceiling bounds the blast radius. If instant
 * revocation is ever needed — account suspension, forced sign-out — the change
 * is `strategy: "database"` plus an adapter, and `getPrincipal()` in session.ts
 * is the seam that keeps callers unchanged.
 */
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24;

const env = readAuthEnv();

export const { handlers, auth, signIn, signOut } = NextAuth({
  // With no credentials present the provider list is empty rather than
  // half-configured. Sign-in then reports "not configured" instead of failing
  // with an opaque provider error.
  providers: env.ok
    ? [
        GitHub({
          clientId: env.value.AUTH_GITHUB_ID,
          clientSecret: env.value.AUTH_GITHUB_SECRET,
        }),
      ]
    : [],
  secret: env.ok ? env.value.AUTH_SECRET : undefined,
  session: { strategy: "jwt", maxAge: SESSION_MAX_AGE_SECONDS },
  pages: { signIn: "/sign-in" },
  callbacks: {
    jwt({ token, user }) {
      // Pin the provider account id onto the token once, at sign-in. Every
      // ownership check downstream reads this, so it must be stable.
      if (user?.id) token.sub = user.id;
      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub) {
        (session.user as { id?: string }).id = token.sub;
      }
      return session;
    },
  },
});
