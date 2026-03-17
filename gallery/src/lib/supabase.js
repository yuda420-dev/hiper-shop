import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your-project-id')) {
  console.warn('Supabase credentials not configured. Running in demo mode (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY missing).')
}

/** @type {import('@supabase/supabase-js').SupabaseClient | null} */
export const supabase = supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('your-project-id')
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

/** @returns {boolean} */
export const isSupabaseConfigured = () => !!supabase
