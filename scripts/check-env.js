#!/usr/bin/env node

/**
 * Environment Variables Checker
 * Run this script to verify all required environment variables are set
 */

const requiredEnvVars = [
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET',
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY'
]

const optionalEnvVars = [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET'
]

console.log('🔍 Checking environment variables...\n')

let missingRequired = []
let missingOptional = []

// Check required variables
requiredEnvVars.forEach(varName => {
  const value = process.env[varName]
  if (!value || value.includes('your-') || value.includes('change-this')) {
    missingRequired.push(varName)
    console.log(`❌ ${varName}: Missing or placeholder value`)
  } else {
    console.log(`✅ ${varName}: Set`)
  }
})

// Check optional variables
optionalEnvVars.forEach(varName => {
  const value = process.env[varName]
  if (!value || value.includes('your-') || value.includes('change-this')) {
    missingOptional.push(varName)
    console.log(`⚠️  ${varName}: Missing or placeholder value (optional for basic setup)`)
  } else {
    console.log(`✅ ${varName}: Set`)
  }
})

console.log('\n' + '='.repeat(50))

if (missingRequired.length > 0) {
  console.log('\n❌ SETUP INCOMPLETE')
  console.log('\nRequired environment variables are missing:')
  missingRequired.forEach(varName => {
    console.log(`  - ${varName}`)
  })
  
  console.log('\n📝 Next steps:')
  console.log('1. Create a .env.local file in your project root')
  console.log('2. Add the missing environment variables')
  console.log('3. Get your Supabase URL and Service Role Key from https://supabase.com/dashboard')
  console.log('4. For Google OAuth, visit https://console.cloud.google.com/')
  
  process.exit(1)
} else if (missingOptional.length > 0) {
  console.log('\n⚠️  PARTIAL SETUP')
  console.log('\nOptional variables missing (Google OAuth will not work):')
  missingOptional.forEach(varName => {
    console.log(`  - ${varName}`)
  })
  console.log('\n✅ Basic authentication (admin login) should work')
} else {
  console.log('\n✅ ALL ENVIRONMENT VARIABLES SET')
  console.log('Your authentication system should work correctly!')
}

console.log('\n📖 For detailed setup instructions, see AUTHENTICATION_SETUP.md')
