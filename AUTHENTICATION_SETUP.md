# Authentication Setup Guide

This guide explains how to set up and use the new NextAuth-based authentication system for the Academic Management System.

## Overview

The system supports three types of users with different authentication methods:

- **Admin**: Email/password authentication
- **Professor**: Google Sign-In (with Google Classroom scopes)
- **Student**: Google Sign-In (basic scopes)

## Environment Variables

Create a `.env.local` file in your project root with the following variables:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-here

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

## Google OAuth Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API and Google Classroom API
4. Go to "Credentials" and create OAuth 2.0 Client IDs
5. Set authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://yourdomain.com/api/auth/callback/google` (production)

## Database Setup

The system uses your existing `accounts` table. Make sure you have admin users with hashed passwords:

```sql
-- Example: Insert admin user with hashed password
INSERT INTO accounts (email, password_hash, role, status)
VALUES ('admin@school.edu', '$2a$12$hashedpassword', 'admin', 'active');
```

You can use the setup script:

```bash
npm run setup-admin
```

## File Structure

```
├── lib/
│   └── auth.ts                    # NextAuth configuration
├── middleware.ts                  # Route protection middleware
├── types/
│   └── next-auth.d.ts            # TypeScript declarations
├── app/
│   ├── api/
│   │   └── auth/
│   │       └── [...nextauth]/
│   │           └── route.ts       # NextAuth API route
│   ├── admin/
│   │   ├── page.tsx              # Admin login (email/password)
│   │   └── dashboard/
│   │       └── page.tsx          # Admin dashboard
│   ├── professor/
│   │   ├── page.tsx              # Professor login (Google)
│   │   └── dashboard/
│   │       └── page.tsx          # Professor dashboard
│   └── student/
│       ├── page.tsx              # Student login (Google)
│       └── dashboard/
│           └── page.tsx          # Student dashboard
└── components/
    └── providers/
        └── session-provider.tsx  # Session provider wrapper
```

## Usage

### Admin Login

1. Navigate to `/admin`
2. Enter email and password
3. Redirected to `/admin/dashboard` on success

### Professor Login

1. Navigate to `/professor`
2. Click "Continue with Google"
3. Authenticate with Google (requires existing professor account in database)
4. Redirected to `/professor/dashboard` on success

### Student Login

1. Navigate to `/student`
2. Click "Sign in with Google"
3. Authenticate with Google (requires existing student account in database)
4. Redirected to `/student/dashboard` on success

## Route Protection

The middleware automatically protects routes based on user roles:

- `/admin/**` → Admin only
- `/professor/**` → Professor only
- `/student/**` → Student only
- `/api/admin/**` → Admin API only
- `/api/professor/**` → Professor API only
- `/api/student/**` → Student API only

## Google Classroom Integration

For professors, the system requests additional Google Classroom scopes:

- `https://www.googleapis.com/auth/classroom.courses.readonly`
- `https://www.googleapis.com/auth/classroom.coursework.students`
- `https://www.googleapis.com/auth/classroom.student-submissions.students.readonly`
- `https://www.googleapis.com/auth/classroom.rosters.readonly`

Access tokens are automatically refreshed and stored in the session.

## API Usage

### Get User Session

```typescript
import { useSession } from "next-auth/react"

function Component() {
  const { data: session, status } = useSession()
  
  if (status === "loading") return <p>Loading...</p>
  if (!session) return <p>Not signed in</p>
  
  return <p>Signed in as {session.user.email} ({session.user.role})</p>
}
```

### Server-side Session

```typescript
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET() {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== "admin") {
    return Response.json({ error: "Unauthorized" }, { status: 403 })
  }
  
  // Your API logic here
}
```

### Google Classroom API

```typescript
// Fetch Google Classroom courses
const response = await fetch("/api/professor/google-classroom?action=courses")
const data = await response.json()
```

## Security Features

1. **JWT Sessions**: Secure token-based sessions
2. **Token Refresh**: Automatic Google token refresh
3. **Role-based Access**: Middleware enforces role permissions
4. **Password Hashing**: bcrypt for admin passwords
5. **CSRF Protection**: Built-in NextAuth CSRF protection

## Troubleshooting

### Common Issues

1. **"Unauthorized" errors**: Check user exists in database with correct role
2. **Google OAuth errors**: Verify client ID/secret and redirect URIs
3. **Database connection issues**: Check Supabase credentials
4. **Token refresh failures**: Ensure Google OAuth setup is correct

### Debug Mode

Set `debug: true` in `authOptions` for detailed logging:

```typescript
export const authOptions: NextAuthOptions = {
  debug: process.env.NODE_ENV === "development",
  // ... other options
}
```

## Migration from Old System

The old Google Classroom authentication files have been removed:
- `app/api/auth/callback/google`
- `app/api/professor/generate-token`
- `app/api/professor/google-*` routes

The new system provides equivalent functionality through:
- `/api/professor/google-classroom` (unified endpoint)
- Automatic token management via NextAuth

## Next Steps

1. Set up environment variables
2. Configure Google OAuth
3. Test login flows for each user type
4. Customize dashboard pages as needed
5. Implement additional protected routes

For questions or issues, refer to the [NextAuth.js documentation](https://next-auth.js.org/) or create an issue in the project repository.
