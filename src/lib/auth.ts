import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import { timingSafeEqual } from "node:crypto";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";

const authSecret =
  process.env.NEXTAUTH_SECRET ??
  (process.env.NODE_ENV === "development"
    ? "agentstack-local-development-secret"
    : undefined);
const githubClientId = process.env.GITHUB_CLIENT_ID;
const githubClientSecret = process.env.GITHUB_CLIENT_SECRET;
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const emailLoginCode = process.env.EMAIL_LOGIN_CODE;

const providers: NextAuthConfig["providers"] = [];

if (githubClientId && githubClientSecret) {
  providers.push(
    GitHub({
      clientId: githubClientId,
      clientSecret: githubClientSecret,
      authorization: {
        params: {
          scope: "read:user user:email repo",
        },
      },
    }),
  );
}

if (googleClientId && googleClientSecret) {
  providers.push(
    Google({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    }),
  );
}

if (emailLoginCode) {
  providers.push(
    Credentials({
      credentials: {
        code: { label: "Access code", type: "password" },
        email: { label: "Email", type: "email" },
      },
      id: "email",
      name: "Email",
      async authorize(credentials) {
        const email =
          typeof credentials.email === "string"
            ? credentials.email.trim().toLowerCase()
            : "";
        const code =
          typeof credentials.code === "string" ? credentials.code : "";

        if (!isEmail(email) || !isMatchingSecret(code, emailLoginCode)) {
          return null;
        }

        return {
          email,
          id: `email:${email}`,
          name: email.split("@")[0] ?? email,
        };
      },
    }),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  ...(authSecret !== undefined ? { secret: authSecret } : {}),
  providers,
  callbacks: {
    jwt({ token, account }) {
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }

      if (account?.provider) {
        token.authProvider = account.provider;
      }

      return token;
    },
    session({ session, token }) {
      session.accessToken =
        typeof token.accessToken === "string" ? token.accessToken : undefined;
      session.authProvider =
        typeof token.authProvider === "string" ? token.authProvider : undefined;

      return session;
    },
  },
});

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isMatchingSecret(value: string, secret: string) {
  const valueBuffer = Buffer.from(value);
  const secretBuffer = Buffer.from(secret);

  return (
    valueBuffer.length === secretBuffer.length &&
    timingSafeEqual(valueBuffer, secretBuffer)
  );
}
