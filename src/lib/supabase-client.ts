import { createBrowserClient } from '@supabase/ssr'

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Función para crear cliente (compatible con tests)
export function createClient() {
	return createBrowserClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co',
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-key'
	)
}
