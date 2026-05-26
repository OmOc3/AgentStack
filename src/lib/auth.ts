import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

const authSecret =
  process.env.NEXTAUTH_SECRET ??
  (process.env.NODE_ENV === "development"
    ? "agentstack-local-development-secret"
    : undefined);
const githubClientId = process.env.GITHUB_CLIENT_ID;
const githubClientSecret = process.env.GITHUB_CLIENT_SECRET;

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  ...(authSecret !== undefined ? { secret: authSecret } : {}),
  providers: [
    GitHub({
      ...(githubClientId !== undefined ? { clientId: githubClientId } : {}),
      ...(githubClientSecret !== undefined
        ? { clientSecret: githubClientSecret }
        : {}),
      authorization: {
        params: {
          scope: "read:user user:email repo",
        },
      },
    }),
  ],
  callbacks: {
    jwt({ token, account }) {
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }

      return token;
    },
    session({ session, token }) {
      session.accessToken =
        typeof token.accessToken === "string" ? token.accessToken : undefined;

      return session;
    },
  },
});
