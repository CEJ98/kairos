import { NextIntlClientProvider } from 'next-intl'
import { notFound } from 'next/navigation'
import { ReactNode } from 'react'
import { locales } from '@/i18n'

type Props = {
	children: ReactNode
	params: Promise<{ locale: string }>
}

// Static params disabled to avoid SSG conflicts

export default async function LocaleLayout({
	children,
	params
}: Props) {
	const { locale } = await params
	
  // Validar locale
  if (!(locales as readonly string[]).includes(locale as any)) notFound()

  // Cargar mensajes directamente sin depender de next-intl/server
  const messages = (await import(`../../../messages/${locale}.json`)).default

	return (
		<NextIntlClientProvider locale={locale} messages={messages}>
			{children}
		</NextIntlClientProvider>
	)
}
export const dynamic = 'force-dynamic'
