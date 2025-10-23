import { createClient } from "@supabase/supabase-js"
import bcrypt from "bcryptjs"

// This script helps set up an admin user with hashed password
// Run this script to create your first admin user

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function setupAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@school.edu"
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123"

  try {
    // Hash the password
    const passwordHash = await bcrypt.hash(adminPassword, 12)

    // Insert admin user
    const { data, error } = await supabase
      .from('accounts')
      .upsert({
        email: adminEmail,
        password_hash: passwordHash,
        role: 'admin',
        status: 'active'
      }, {
        onConflict: 'email'
      })
      .select()

    if (error) {
      console.error("Error creating admin user:", error)
      return
    }

    console.log("Admin user created successfully:")
    console.log("Email:", adminEmail)
    console.log("Password:", adminPassword)
    console.log("Please change the password after first login")
    
  } catch (error) {
    console.error("Setup failed:", error)
  }
}

// Run the setup if this file is executed directly
if (require.main === module) {
  setupAdmin()
}

export { setupAdmin }
