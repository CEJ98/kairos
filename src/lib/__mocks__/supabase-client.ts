// @ts-nocheck
// Mock de Supabase para testing
export function createClient() {
	return {
		auth: {
			signUp: jest.fn(),
			signInWithPassword: jest.fn(),
			signInWithOAuth: jest.fn(),
			signOut: jest.fn(),
			getSession: jest.fn(),
			getUser: jest.fn(),
			onAuthStateChange: jest.fn(),
			resetPasswordForEmail: jest.fn(),
			updateUser: jest.fn(),
			verifyOtp: jest.fn()
		},
		from: jest.fn(() => ({
			select: jest.fn().mockReturnThis(),
			insert: jest.fn().mockReturnThis(),
			update: jest.fn().mockReturnThis(),
			delete: jest.fn().mockReturnThis(),
			eq: jest.fn().mockReturnThis(),
			neq: jest.fn().mockReturnThis(),
			gt: jest.fn().mockReturnThis(),
			lt: jest.fn().mockReturnThis(),
			gte: jest.fn().mockReturnThis(),
			lte: jest.fn().mockReturnThis(),
			like: jest.fn().mockReturnThis(),
			ilike: jest.fn().mockReturnThis(),
			in: jest.fn().mockReturnThis(),
			is: jest.fn().mockReturnThis(),
			order: jest.fn().mockReturnThis(),
			limit: jest.fn().mockReturnThis(),
			range: jest.fn().mockReturnThis(),
			single: jest.fn().mockResolvedValue({ data: null, error: null }),
			maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null })
		})),
		storage: {
			from: jest.fn(() => ({
				upload: jest.fn(),
				download: jest.fn(),
				remove: jest.fn(),
				list: jest.fn(),
				getPublicUrl: jest.fn()
			}))
		},
		rpc: jest.fn()
	}
}

export function createSupabaseBrowserClient() {
	return createClient()
}
// @ts-nocheck
