import { createClient } from "@supabase/supabase-js"

// Server-side Supabase client using Service Role key. Do NOT import in client components.
export const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

