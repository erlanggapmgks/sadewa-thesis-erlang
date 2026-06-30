// Supabase client — single instance shared across all services.
// Import THIS file anywhere you need to talk to the database, never create a new client.
//
// Setup: add your keys to .env
//   VITE_SUPABASE_URL=https://your-project.supabase.co
//   VITE_SUPABASE_ANON_KEY=your-anon-key

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const isConfigured =
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project-ref.supabase.co' &&
  !supabaseUrl.includes('placeholder') &&
  supabaseAnonKey !== 'your-anon-public-key-here' &&
  !supabaseAnonKey.includes('placeholder')

if (!isConfigured) {
  console.warn('[SADEWA] Supabase not configured — running in demo mode. Add real VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env to enable database features.')
}

export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null
