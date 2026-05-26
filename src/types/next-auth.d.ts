import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    authProvider?: string | undefined;
    accessToken?: string | undefined;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    authProvider?: string;
    accessToken?: string;
  }
}
