import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import type { User } from "next-auth"
import { createClient } from "@supabase/supabase-js"
// Note: bcrypt disabled temporarily while DB stores plaintext passwords

// Initialize Supabase client with error handling
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    "Missing Supabase environment variables. Please check your .env.local file:\n" +
    "- NEXT_PUBLIC_SUPABASE_URL\n" +
    "- SUPABASE_SERVICE_ROLE_KEY"
  )
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Helper function to check if Google OAuth is configured
const isGoogleConfigured = () => {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
}

export const authOptions: NextAuthOptions = {
  providers: [
    // Google Provider for STUDENTS (basic profile/email scopes only)
    ...(isGoogleConfigured() ? [
      GoogleProvider({
        id: "google-student",
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        authorization: {
          params: {
            scope: "openid https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile"
          }
        }
      })
    ] : []),

    // Google Provider for PROFESSORS (includes Classroom scopes)
    ...(isGoogleConfigured() ? [
      GoogleProvider({
        id: "google-professor",
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        authorization: {
          params: {
            scope: "openid https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/classroom.courses.readonly https://www.googleapis.com/auth/classroom.coursework.students https://www.googleapis.com/auth/classroom.student-submissions.students.readonly https://www.googleapis.com/auth/classroom.rosters.readonly https://www.googleapis.com/auth/classroom.profile.emails https://www.googleapis.com/auth/userinfo.profile"
          }
        }
      })
    ] : []),

    // Admin Credentials Provider
    CredentialsProvider({
      id: "admin-credentials",
      name: "admin-credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, _req) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Query the accounts table for admin only
          const { data: account, error } = await supabase
            .from('accounts')
            .select('*')
            .eq('email', credentials.email)
            .eq('role', 'admin')
            .eq('status', 'active')
            .single()

          if (error || !account) {
            return null
          }

          // TEMP: Plaintext password check until passwords are hashed in DB
          if (credentials.password !== account.password_hash) {
            return null
          }

          return {
            id: account.account_id.toString(),
            email: account.email,
            role: account.role,
            status: account.status,
            account_id: account.account_id.toString()
          } as unknown as User
        } catch (error) {
          console.error("Admin auth error:", error)
          return null
        }
      }
    }),

    // Professor Credentials Provider
    CredentialsProvider({
      id: "professor-credentials",
      name: "professor-credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, _req) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Query the accounts table for professor only
          const { data: account, error } = await supabase
            .from('accounts')
            .select('*')
            .eq('email', credentials.email)
            .eq('role', 'professor')
            .eq('status', 'active')
            .single()

          if (error || !account) {
            return null
          }

          // TEMP: Plaintext password check until passwords are hashed in DB
          if (credentials.password !== account.password_hash) {
            return null
          }

          return {
            id: account.account_id.toString(),
            email: account.email,
            role: account.role,
            status: account.status,
            account_id: account.account_id.toString()
          } as unknown as User
        } catch (error) {
          console.error("Professor auth error:", error)
          return null
        }
      }
    }),

    // Student Credentials Provider
    CredentialsProvider({
      id: "student-credentials",
      name: "student-credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, _req) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Query the accounts table for student only
          const { data: account, error } = await supabase
            .from('accounts')
            .select('*')
            .eq('email', credentials.email)
            .eq('role', 'student')
            .eq('status', 'active')
            .single()

          if (error || !account) {
            return null
          }

          // TEMP: Plaintext password check until passwords are hashed in DB
          if (credentials.password !== account.password_hash) {
            return null
          }

          return {
            id: account.account_id.toString(),
            email: account.email,
            role: account.role,
            status: account.status,
            account_id: account.account_id.toString()
          } as unknown as User
        } catch (error) {
          console.error("Student auth error:", error)
          return null
        }
      }
    })
  ],

  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google-student" || account?.provider === "google-professor") {
        try {
          // Check if user exists in accounts table
          const { data: existingAccount, error } = await supabase
            .from('accounts')
            .select('*')
            .eq('email', user.email)
            .eq('status', 'active')
            .single()

          if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
            console.error("Database error:", error)
            return false
          }

          if (!existingAccount) {
            // User doesn't exist in our database
            return account.provider === 'google-professor'
              ? '/professor?error=AccessDenied'
              : '/student?error=AccessDenied'
          }

          // Enforce role by provider
          if (account.provider === 'google-student' && existingAccount.role !== 'student') {
            return '/student?error=AccessDenied'
          }
          if (account.provider === 'google-professor' && existingAccount.role !== 'professor') {
            return '/professor?error=AccessDenied'
          }

          // Store additional user info
          user.role = existingAccount.role
          user.account_id = existingAccount.account_id.toString()
          user.status = existingAccount.status

          // Store/update token metadata for professors only
          if (existingAccount.role === 'professor' && account.access_token) {
            // Update or create token storage (you might want to create a separate tokens table)
            await supabase
              .from('accounts')
              .update({
                updated_at: new Date().toISOString()
              })
              .eq('account_id', existingAccount.account_id)
          }

          return true
        } catch (error) {
          console.error("SignIn error:", error)
          return false
        }
      }

      return true
    },

    async jwt({ token, user, account }) {
      // Initial sign in
      if (user) {
        token.role = user.role
        token.account_id = user.account_id
        token.status = user.status
      }

      // Store Google tokens for professors (professor provider only)
      if (account?.provider === "google-professor" && account.access_token) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.accessTokenExpires = account.expires_at
      }

      // Handle Google OAuth token refresh (only for Google logins)
      if (token.accessTokenExpires) {
        // Return token if not expired yet
        if (Date.now() < (token.accessTokenExpires as number) * 1000) {
          return token
        }

        // Access token has expired, try to refresh it
        if (token.refreshToken) {
          try {
            const response = await fetch("https://oauth2.googleapis.com/token", {
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: new URLSearchParams({
                client_id: process.env.GOOGLE_CLIENT_ID!,
                client_secret: process.env.GOOGLE_CLIENT_SECRET!,
                grant_type: "refresh_token",
                refresh_token: token.refreshToken as string,
              }),
              method: "POST",
            })

            const tokens = await response.json()

            if (!response.ok) throw tokens

            return {
              ...token,
              accessToken: tokens.access_token,
              accessTokenExpires: Date.now() / 1000 + tokens.expires_in,
              refreshToken: tokens.refresh_token ?? token.refreshToken,
            }
          } catch (error) {
            console.error("Error refreshing access token", error)
            return { ...token, error: "RefreshAccessTokenError" }
          }
        }
      }

      // For credentials login or if no token refresh needed, return token as-is
      return token
    },

    async session({ session, token }) {
      session.user.role = token.role as string
      session.user.account_id = token.account_id as string
      session.user.status = token.status as string
      session.accessToken = token.accessToken as string
      session.error = token.error as string

      return session
    }
  },

  pages: {
    signIn: "/", // Redirect to landing page for sign in
    error: "/", // Redirect to landing page for errors
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  secret: process.env.NEXTAUTH_SECRET,
}
