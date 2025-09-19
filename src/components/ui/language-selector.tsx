'use client'

import { useState, useTransition } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Globe, Check } from 'lucide-react'
import { locales, type Locale } from '@/i18n'

interface LanguageOption {
	code: Locale
	label: string
	flag: string
}

const languages: LanguageOption[] = [
	{ code: 'es', label: 'Español', flag: '🇪🇸' },
	{ code: 'en', label: 'English', flag: '🇺🇸' }
]

export function LanguageSelector() {
	const t = useTranslations('settings')
	const locale = useLocale() as Locale
	const router = useRouter()
  const pathname = usePathname() || ''
	const [isPending, startTransition] = useTransition()
	const [isOpen, setIsOpen] = useState(false)

	const currentLanguage = languages.find(lang => lang.code === locale) || languages[0]

	const handleLanguageChange = (newLocale: Locale) => {
		if (newLocale === locale) return

		startTransition(() => {
			// Crear nueva URL con el locale
			const segments = (pathname || '').split('/')
			
			// Si ya hay un locale en la URL, reemplazarlo
			if (locales.includes(segments[1] as Locale)) {
				segments[1] = newLocale
			} else {
				// Si no hay locale, agregarlo
				segments.splice(1, 0, newLocale)
			}

			const newPath = segments.join('/')
			router.push(newPath)
			router.refresh()
		})

		setIsOpen(false)
	}

	return (
		<DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					size="sm"
					className="h-8 w-8 px-0"
					disabled={isPending}
					title={t('language')}
				>
					{isPending ? (
						<div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
					) : (
						<Globe className="h-4 w-4" />
					)}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-40">
				{languages.map((language) => (
					<DropdownMenuItem
						key={language.code}
						onClick={() => handleLanguageChange(language.code)}
						className="flex items-center justify-between cursor-pointer"
					>
						<div className="flex items-center gap-2">
							<span className="text-lg">{language.flag}</span>
							<span className="text-sm">{language.label}</span>
						</div>
						{locale === language.code && (
							<Check className="h-4 w-4 text-primary" />
						)}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	)
}

// Versión compacta para móviles
export function LanguageSelectorMobile() {
	const locale = useLocale() as Locale
	const router = useRouter()
	const pathname = usePathname()
	const [isPending, startTransition] = useTransition()

	const currentLanguage = languages.find(lang => lang.code === locale) || languages[0]

	const handleLanguageChange = (newLocale: Locale) => {
		if (newLocale === locale) return

		startTransition(() => {
      const segments = (pathname || '').split('/')
			
			if (locales.includes(segments[1] as Locale)) {
				segments[1] = newLocale
			} else {
				segments.splice(1, 0, newLocale)
			}

			const newPath = segments.join('/')
			router.push(newPath)
			router.refresh()
		})
	}

	return (
		<div className="flex items-center gap-2 p-2">
			<Globe className="h-4 w-4 text-muted-foreground" />
			<select
				value={locale}
				onChange={(e) => handleLanguageChange(e.target.value as Locale)}
				disabled={isPending}
				className="bg-transparent border-none text-sm focus:outline-none"
			>
				{languages.map((language) => (
					<option key={language.code} value={language.code}>
						{language.flag} {language.label}
					</option>
				))}
			</select>
		</div>
	)
}