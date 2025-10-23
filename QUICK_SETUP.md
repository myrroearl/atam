# 🚀 Quick Setup Guide

The authentication system is ready, but you need to configure environment variables to get started.

## ⚠️ Current Issue

You're seeing the error because environment variables are not set up. Follow these steps:

## 1️⃣ Create Environment File

Create a `.env.local` file in your project root with these variables:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-jwt-secret-change-this

# Supabase Configuration (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Google OAuth (Optional - for student/professor login)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## 2️⃣ Get Supabase Credentials

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Service Role Key** → `SUPABASE_SERVICE_ROLE_KEY`

## 3️⃣ Setup Google OAuth (Optional)

For student and professor Google login:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create/select a project
3. Enable **Google+ API** and **Google Classroom API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Set redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Secret to your `.env.local`

## 4️⃣ Generate NextAuth Secret

Run this command to generate a secure secret:

```bash
openssl rand -base64 32
```

Or use: `your-super-secret-jwt-secret-change-this-in-production`

## 5️⃣ Test the Setup

```bash
# Check environment variables
node scripts/check-env.js

# Start the development server
npm run dev
```

## 6️⃣ Create Admin User

Your database already has sample data, but to create a new admin:

```bash
# Edit scripts/setup-admin.ts with your admin credentials
npm run setup-admin
```

## 🎯 What Works After Setup

- **✅ Admin Login**: `/admin` (email/password)
- **✅ Professor Login**: `/professor` (Google OAuth)
- **✅ Student Login**: `/student` (Google OAuth)
- **✅ Role-based dashboards**
- **✅ Protected API routes**

## 🔍 Troubleshooting

### Common Issues:

1. **"Invalid supabaseUrl"** → Check `NEXT_PUBLIC_SUPABASE_URL` format
2. **"Configuration error"** → Check Google OAuth credentials
3. **"Unauthorized"** → User doesn't exist in database with correct role

### Debug Mode:

Add to your `.env.local`:
```env
NEXTAUTH_DEBUG=true
```

## 📁 Minimal Working Example

For testing, create `.env.local` with just these:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=test-secret-change-in-production
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

This will enable admin login. Add Google credentials later for full functionality.

## 🆘 Need Help?

1. Check the detailed `AUTHENTICATION_SETUP.md`
2. Run `node scripts/check-env.js` to verify setup
3. Check browser console and terminal for specific errors

---

**Next Step**: Create your `.env.local` file with the variables above! 🚀
