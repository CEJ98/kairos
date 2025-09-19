import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key'

// Cliente simple para uso en el browser
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Función para crear cliente
export const createSupabaseClient = () => createClient(supabaseUrl, supabaseAnonKey)

