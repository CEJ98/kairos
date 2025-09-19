'use client'

import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { ChatWidget } from '@/components/chat/chat-widget'

interface ChatLayoutProps {
	children: React.ReactNode
}

export function ChatLayout({ children }: ChatLayoutProps) {
	const { data: session } = useSession()
		const pathname = usePathname() || ''

	// No mostrar el chat en páginas públicas o de autenticación
		const isPublicPage = pathname === '/' || 
							 pathname.startsWith('/auth') || 
							 pathname.startsWith('/login') || 
							 pathname.startsWith('/register')

	// Solo mostrar el chat si el usuario está autenticado y no está en una página pública
	const shouldShowChat = session?.user && !isPublicPage

	return (
		<>
			{children}
			{shouldShowChat && <ChatWidget />}
		</>
	)
}
