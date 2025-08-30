require('dotenv').config({ path: '.env.local' })
const puppeteer = require('puppeteer')
const fs = require('fs')
const path = require('path')

class NavigationTester {
	constructor() {
		this.browser = null
		this.page = null
		this.results = {
			passed: [],
			failed: [],
			skipped: []
		}
		this.baseUrl = 'http://localhost:3000'
	}

	async init() {
		console.log('🚀 Iniciando pruebas de navegación...')
		this.browser = await puppeteer.launch({ 
			headless: true,
			args: ['--no-sandbox', '--disable-setuid-sandbox']
		})
		this.page = await this.browser.newPage()
		
		// Configurar viewport
		await this.page.setViewport({ width: 1280, height: 720 })
		
		// Configurar timeouts
		this.page.setDefaultTimeout(10000)
	}

	async login() {
		try {
			console.log('🔐 Realizando login...')
			await this.page.goto(`${this.baseUrl}/signin`)
			await this.page.waitForSelector('input[type="email"]')
			
			await this.page.type('input[type="email"]', 'demo@kairos.com')
			await this.page.type('input[type="password"]', 'demo123')
			
			await this.page.click('button[type="submit"]')
			await this.page.waitForNavigation({ waitUntil: 'networkidle0' })
			
			const currentUrl = this.page.url()
			if (currentUrl.includes('/dashboard')) {
				console.log('✅ Login exitoso')
				return true
			} else {
				console.log('❌ Login falló')
				return false
			}
		} catch (error) {
			console.log('❌ Error en login:', error.message)
			return false
		}
	}

	async testRoute(route, description, requiresAuth = false) {
		try {
			console.log(`🔍 Probando: ${description} (${route})`)
			
			// Si requiere autenticación y no estamos logueados, hacer login
			if (requiresAuth) {
				const currentUrl = this.page.url()
				if (!currentUrl.includes('/dashboard')) {
					const loginSuccess = await this.login()
					if (!loginSuccess) {
						this.results.failed.push({ route, description, error: 'Login falló' })
						return false
					}
				}
			}
			
			await this.page.goto(`${this.baseUrl}${route}`, { waitUntil: 'networkidle0' })
			
			// Verificar que no sea una página 404
			const pageContent = await this.page.content()
			const is404 = pageContent.includes('404') || pageContent.includes('Not Found') || pageContent.includes('Page not found')
			
			if (is404) {
				this.results.failed.push({ route, description, error: 'Página 404' })
				console.log(`❌ ${description}: Página 404`)
				return false
			}
			
			// Verificar que la página cargó correctamente
			const title = await this.page.title()
			if (title && title !== '') {
				this.results.passed.push({ route, description, title })
				console.log(`✅ ${description}: OK`)
				return true
			} else {
				this.results.failed.push({ route, description, error: 'Página sin título' })
				console.log(`❌ ${description}: Sin título`)
				return false
			}
			
		} catch (error) {
			this.results.failed.push({ route, description, error: error.message })
			console.log(`❌ ${description}: ${error.message}`)
			return false
		}
	}

	async testNavigation() {
		const routes = [
			// Rutas públicas
			{ route: '/', description: 'Página de inicio', requiresAuth: false },
			{ route: '/contact', description: 'Página de contacto', requiresAuth: false },
			{ route: '/pricing', description: 'Página de precios', requiresAuth: false },
			{ route: '/terms', description: 'Términos y condiciones', requiresAuth: false },
			{ route: '/privacy', description: 'Política de privacidad', requiresAuth: false },
			{ route: '/signin', description: 'Página de login', requiresAuth: false },
			{ route: '/signup', description: 'Página de registro', requiresAuth: false },
			
			// Rutas del dashboard
			{ route: '/dashboard', description: 'Dashboard principal', requiresAuth: true },
			{ route: '/dashboard/profile', description: 'Perfil de usuario', requiresAuth: true },
			{ route: '/dashboard/workouts', description: 'Rutinas de ejercicio', requiresAuth: true },
			{ route: '/dashboard/exercises', description: 'Ejercicios', requiresAuth: true },
			{ route: '/dashboard/progress', description: 'Progreso', requiresAuth: true },
			{ route: '/dashboard/calendar', description: 'Calendario', requiresAuth: true },
			{ route: '/dashboard/activities', description: 'Actividades', requiresAuth: true },
			{ route: '/dashboard/community', description: 'Comunidad', requiresAuth: true },
			{ route: '/dashboard/billing', description: 'Facturación', requiresAuth: true },
			{ route: '/dashboard/settings', description: 'Configuración', requiresAuth: true },
			
			// Rutas del trainer
			{ route: '/dashboard/trainer', description: 'Dashboard del entrenador', requiresAuth: true },
			{ route: '/dashboard/trainer/clients', description: 'Clientes del entrenador', requiresAuth: true },
			{ route: '/dashboard/trainer/workouts', description: 'Rutinas del entrenador', requiresAuth: true },
			{ route: '/dashboard/trainer/calendar', description: 'Calendario del entrenador', requiresAuth: true },
			{ route: '/dashboard/trainer/billing', description: 'Facturación del entrenador', requiresAuth: true }
		]
		
		console.log(`\n📋 Probando ${routes.length} rutas...\n`)
		
		for (const { route, description, requiresAuth } of routes) {
			await this.testRoute(route, description, requiresAuth)
			await new Promise(resolve => setTimeout(resolve, 500)) // Pequeña pausa entre tests
		}
	}

	async testLinks() {
		console.log('\n🔗 Probando enlaces en páginas principales...')
		
		// Probar enlaces en la página de inicio
		await this.testLinksOnPage('/', 'Página de inicio')
		
		// Probar enlaces en el dashboard (requiere login)
		const loginSuccess = await this.login()
		if (loginSuccess) {
			await this.testLinksOnPage('/dashboard', 'Dashboard')
			await this.testLinksOnPage('/dashboard/trainer', 'Dashboard del entrenador')
		}
	}

	async testLinksOnPage(route, pageName) {
		try {
			await this.page.goto(`${this.baseUrl}${route}`)
			await new Promise(resolve => setTimeout(resolve, 2000))
			
			// Encontrar todos los enlaces
			const links = await this.page.$$eval('a[href]', links => 
				links.map(link => ({
					href: link.getAttribute('href'),
					text: link.textContent.trim()
				}))
			)
			
			console.log(`\n🔍 Encontrados ${links.length} enlaces en ${pageName}`)
			
			for (const link of links) {
				if (link.href.startsWith('/') && !link.href.startsWith('/#')) {
					// Solo probar enlaces internos que no sean anclas
					await this.testRoute(link.href, `Enlace: ${link.text || link.href}`, true)
				}
			}
			
		} catch (error) {
			console.log(`❌ Error probando enlaces en ${pageName}:`, error.message)
		}
	}

	async generateReport() {
		const report = {
			timestamp: new Date().toISOString(),
			summary: {
				total: this.results.passed.length + this.results.failed.length + this.results.skipped.length,
				passed: this.results.passed.length,
				failed: this.results.failed.length,
				skipped: this.results.skipped.length,
				successRate: Math.round((this.results.passed.length / (this.results.passed.length + this.results.failed.length)) * 100)
			},
			results: this.results
		}
		
		// Guardar reporte
		const reportPath = path.join(__dirname, 'navigation-test-report.json')
		fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
		
		// Mostrar resumen en consola
		console.log('\n' + '='.repeat(60))
		console.log('📊 REPORTE DE PRUEBAS DE NAVEGACIÓN')
		console.log('='.repeat(60))
		console.log(`✅ Pruebas exitosas: ${report.summary.passed}`)
		console.log(`❌ Pruebas fallidas: ${report.summary.failed}`)
		console.log(`⏭️ Pruebas omitidas: ${report.summary.skipped}`)
		console.log(`📈 Tasa de éxito: ${report.summary.successRate}%`)
		
		if (this.results.failed.length > 0) {
			console.log('\n❌ PRUEBAS FALLIDAS:')
			this.results.failed.forEach((test, index) => {
				console.log(`${index + 1}. ${test.description} (${test.route})`)
				console.log(`   Error: ${test.error}`)
			})
		}
		
		console.log(`\n💾 Reporte completo guardado en: ${reportPath}`)
		
		return report
	}

	async cleanup() {
		if (this.browser) {
			await this.browser.close()
		}
	}
}

// Ejecutar pruebas
async function runTests() {
	const tester = new NavigationTester()
	
	try {
		await tester.init()
		await tester.testNavigation()
		await tester.testLinks()
		await tester.generateReport()
		
	} catch (error) {
		console.error('💥 Error en las pruebas:', error)
	} finally {
		await tester.cleanup()
	}
}

// Ejecutar si es llamado directamente
if (require.main === module) {
	runTests()
		.then(() => {
			console.log('\n🎉 Pruebas completadas')
			process.exit(0)
		})
		.catch((error) => {
			console.error('💥 Error:', error)
			process.exit(1)
		})
}

module.exports = NavigationTester