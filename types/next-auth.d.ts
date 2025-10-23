import NextAuth, { DefaultSession, DefaultUser } from "next-auth"
import { JWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      role: string
      account_id: string
      status: string
    } & DefaultSession["user"]
    accessToken?: string
    error?: string
  }

  interface User extends DefaultUser {
    role: string
    account_id: string
    status: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string
    account_id: string
    status: string
    accessToken?: string
    refreshToken?: string
    accessTokenExpires?: number
    error?: string
  }
}
