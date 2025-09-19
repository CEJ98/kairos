import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Dumbbell, Users, Zap, BarChart3 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { LanguageSelector } from '@/components/ui/language-selector'

export default function LocalizedHomePage() {
	const t = useTranslations('homepage')
	const tAuth = useTranslations('auth')

	return (
		<div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50">
			{/* Header */}
			<header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-md">
				<nav className="container mx-auto px-4 py-4 flex justify-between items-center">
					<Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
						<div className="h-10 w-10 bg-gradient-to-r from-emerald-500 to-green-600 rounded-lg flex items-center justify-center">
							<Dumbbell className="h-6 w-6 text-white" aria-hidden="true" />
						</div>
						<span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
							Kairos
						</span>
					</Link>
					
					<div className="flex items-center gap-2 sm:gap-3">
						<LanguageSelector />
						<Link href="/es/signin">
							<Button variant="ghost" className="font-medium text-sm sm:text-base px-2 sm:px-4">
								{tAuth('signIn')}
							</Button>
						</Link>
						<Link href="/es/signup">
							<Button className="bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-600 hover:to-green-700 shadow-lg font-medium text-sm sm:text-base px-3 sm:px-4">
								{tAuth('signUp')}
							</Button>
						</Link>
					</div>
				</nav>
			</header>

			{/* Hero Section */}
			<section className="relative overflow-hidden">
				<div className="container mx-auto px-4 py-16 sm:py-20 text-center">
					<div className="max-w-4xl mx-auto">
						<h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
							<span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
								{t('title')}
							</span>
							<br />
							<span className="bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
								{t('subtitle')}
							</span>
						</h1>
						
						<p className="text-lg sm:text-xl md:text-2xl text-gray-600 mb-8 sm:mb-12 max-w-3xl mx-auto leading-relaxed">
							{t('description')}
						</p>
						
						<div className="flex flex-col sm:flex-row gap-4 justify-center">
							<Link href="/es/signup/client">
								<Button 
									size="xl" 
									className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-600 hover:to-green-700 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
								>
									{t('startFree')}
									<ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
								</Button>
							</Link>
							<Link href="/es/signup/trainer">
								<Button 
									size="xl" 
									variant="outline" 
									className="w-full sm:w-auto border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-700 transition-all duration-300"
								>
									{t('imTrainer')}
									<Users className="ml-2 h-5 w-5" aria-hidden="true" />
								</Button>
							</Link>
						</div>
					</div>
					
					{/* Decorative elements */}
					<div className="absolute top-20 left-10 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl" aria-hidden="true"></div>
					<div className="absolute top-40 right-10 w-32 h-32 bg-green-500/10 rounded-full blur-xl" aria-hidden="true"></div>
					<div className="absolute bottom-20 left-1/4 w-24 h-24 bg-emerald-400/10 rounded-full blur-xl" aria-hidden="true"></div>
				</div>
			</section>

			{/* Features Section */}
			<section id="features" className="py-16 sm:py-20 bg-white">
				<div className="container mx-auto px-4">
					<div className="text-center mb-12 sm:mb-16">
						<h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-6">
							{t('featuresTitle')}
						</h2>
						<p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
							{t('featuresSubtitle')}
						</p>
					</div>

					<div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
						<div className="group p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-white to-emerald-50 border border-emerald-100 hover:border-emerald-200 transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
							<div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl mb-4 sm:mb-6 shadow-lg group-hover:scale-110 transition-transform">
								<Zap className="h-6 w-6 sm:h-8 sm:w-8 text-white" aria-hidden="true" />
							</div>
							<h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-gray-900">{t('smartWorkouts')}</h3>
							<p className="text-gray-600 leading-relaxed text-sm sm:text-base">
								{t('smartWorkoutsDesc')}
							</p>
						</div>

						<div className="group p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-white to-green-50 border border-green-100 hover:border-green-200 transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
							<div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl mb-4 sm:mb-6 shadow-lg group-hover:scale-110 transition-transform">
								<BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-white" aria-hidden="true" />
							</div>
							<h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-gray-900">{t('advancedAnalytics')}</h3>
							<p className="text-gray-600 leading-relaxed text-sm sm:text-base">
								{t('advancedAnalyticsDesc')}
							</p>
						</div>

						<div className="group p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-white to-emerald-50 border border-emerald-100 hover:border-emerald-200 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 sm:col-span-2 md:col-span-1">
							<div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl mb-4 sm:mb-6 shadow-lg group-hover:scale-110 transition-transform">
								<Users className="h-6 w-6 sm:h-8 sm:w-8 text-white" aria-hidden="true" />
							</div>
							<h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-gray-900">{t('clientManagement')}</h3>
							<p className="text-gray-600 leading-relaxed text-sm sm:text-base">
								{t('clientManagementDesc')}
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className="relative py-16 sm:py-20 bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-600 overflow-hidden">
				<div className="absolute inset-0 bg-black/10"></div>
				<div className="container mx-auto px-4 text-center relative z-10">
					<h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6 text-balance">
						{t('ctaTitle')}
					</h2>
					<p className="text-lg sm:text-xl text-green-100 mb-8 sm:mb-10 max-w-2xl mx-auto text-balance">
						{t('ctaSubtitle')}
					</p>
					<Link href="/es/signup">
						<Button 
							size="xl" 
							className="w-full sm:w-auto bg-white text-emerald-600 hover:bg-gray-100 font-bold shadow-2xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 focus-visible"
						>
							{t('ctaButton')}
							<ArrowRight className="ml-2 h-5 w-5 sm:h-6 sm:w-6" />
						</Button>
					</Link>
				</div>
				
				{/* Decorative elements */}
				<div className="absolute top-10 left-10 w-40 h-40 bg-white/10 rounded-full blur-xl" aria-hidden="true"></div>
				<div className="absolute bottom-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-xl" aria-hidden="true"></div>
			</section>

			{/* Footer */}
			<footer className="bg-gray-900 text-white py-12 sm:py-16" role="contentinfo">
				<div className="container mx-auto px-4">
					<div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8">
						<div className="sm:col-span-2">
							<Link href="/" className="flex items-center gap-2 mb-6">
								<div className="h-10 w-10 bg-gradient-to-r from-emerald-500 to-green-600 rounded-lg flex items-center justify-center">
									<Dumbbell className="h-6 w-6 text-white" aria-hidden="true" />
								</div>
								<span className="text-2xl font-bold">Kairos</span>
							</Link>
							<p className="text-gray-300 text-base sm:text-lg mb-6 max-w-md">
								{t('footerDescription')}
							</p>
							<div className="flex space-x-4" role="list" aria-label="Redes sociales">
								<div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors cursor-pointer focus-visible" role="button" tabIndex={0} aria-label="Facebook">
									<span className="text-sm font-bold" aria-hidden="true">f</span>
								</div>
								<div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors cursor-pointer focus-visible" role="button" tabIndex={0} aria-label="Instagram">
									<span className="text-sm font-bold" aria-hidden="true">ig</span>
								</div>
								<div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors cursor-pointer focus-visible" role="button" tabIndex={0} aria-label="Twitter">
									<span className="text-sm font-bold" aria-hidden="true">tw</span>
								</div>
							</div>
						</div>
						
						<div>
							<h3 className="font-bold mb-4 sm:mb-6 text-lg">{t('product')}</h3>
							<ul className="space-y-2 sm:space-y-3 text-gray-300 text-sm sm:text-base">
								<li><Link href="#features" className="hover:text-white transition-colors focus-visible">{t('features')}</Link></li>
								<li><Link href="/pricing" className="hover:text-white transition-colors focus-visible">{t('pricing')}</Link></li>
								<li><Link href="/dashboard" className="hover:text-white transition-colors focus-visible">{t('demo')}</Link></li>
								<li><Link href="/contact" className="hover:text-white transition-colors focus-visible">{t('api')}</Link></li>
							</ul>
						</div>
						
						<div>
							<h3 className="font-bold mb-4 sm:mb-6 text-lg">{t('support')}</h3>
							<ul className="space-y-2 sm:space-y-3 text-gray-300 text-sm sm:text-base">
								<li><Link href="/contact" className="hover:text-white transition-colors focus-visible">{t('helpCenter')}</Link></li>
								<li><Link href="/contact" className="hover:text-white transition-colors focus-visible">{t('contact')}</Link></li>
								<li><Link href="/dashboard" className="hover:text-white transition-colors focus-visible">{t('status')}</Link></li>
								<li><Link href="/contact" className="hover:text-white transition-colors focus-visible">{t('community')}</Link></li>
							</ul>
						</div>
					</div>
					
					<div className="border-t border-gray-800 mt-8 sm:mt-12 pt-6 sm:pt-8 text-center">
						<p className="text-gray-400 text-sm sm:text-base">
							&copy; 2024 Kairos Fitness. {t('allRightsReserved')}. 
							<span className="mx-2">|</span>
							<Link href="/privacy" className="hover:text-white transition-colors focus-visible">{t('privacy')}</Link>
							<span className="mx-2">|</span>
							<Link href="/terms" className="hover:text-white transition-colors focus-visible">{t('terms')}</Link>
						</p>
					</div>
				</div>
			</footer>
		</div>
	)
}
