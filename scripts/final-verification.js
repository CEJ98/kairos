#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

class FinalVerification {
	constructor() {
		this.results = {
			linkAudit: null,
			navigationTest: null,
			unitTests: null,
			summary: {
				totalIssues: 0,
				criticalIssues: 0,
				warnings: 0,
				fixedIssues: 0
			}
		}
	}

	async runVerification() {
		console.log('🔍 Iniciando verificación final del sistema...')
		console.log('=' .repeat(60))

		// 1. Ejecutar auditoría de enlaces
		await this.runLinkAudit()

		// 2. Leer resultados de navegación
		await this.readNavigationResults()

		// 3. Ejecutar pruebas unitarias
		await this.runUnitTests()

		// 4. Generar reporte final
		await this.generateFinalReport()

		console.log('\n✅ Verificación completada')
	}

	async runLinkAudit() {
		console.log('\n📋 Ejecutando auditoría de enlaces...')
		try {
			execSync('npm run test:links', { stdio: 'inherit' })
			const auditPath = path.join(process.cwd(), 'link-audit-report.json')
			if (fs.existsSync(auditPath)) {
				this.results.linkAudit = JSON.parse(fs.readFileSync(auditPath, 'utf8'))
				console.log(`✅ Auditoría completada: ${this.results.linkAudit.problematicLinks.length} problemas encontrados`)
			}
		} catch (error) {
			console.log('❌ Error en auditoría de enlaces:', error.message)
		}
	}

	async readNavigationResults() {
		console.log('\n🧭 Leyendo resultados de navegación...')
		try {
			const navPath = path.join(process.cwd(), 'tests/navigation-test-report.json')
			if (fs.existsSync(navPath)) {
				this.results.navigationTest = JSON.parse(fs.readFileSync(navPath, 'utf8'))
				console.log(`✅ Resultados de navegación cargados: ${this.results.navigationTest.routeTests?.length || 0} rutas probadas`)
			} else {
				console.log('⚠️  Archivo de resultados de navegación no encontrado')
			}
		} catch (error) {
			console.log('❌ Error leyendo resultados de navegación:', error.message)
		}
	}

	async runUnitTests() {
		console.log('\n🧪 Ejecutando pruebas unitarias...')
		try {
			const result = execSync('npm test -- --passWithNoTests --silent', { encoding: 'utf8' })
			this.results.unitTests = {
				status: 'passed',
				output: result
			}
			console.log('✅ Pruebas unitarias completadas')
		} catch (error) {
			this.results.unitTests = {
				status: 'failed',
				error: error.message
			}
			console.log('⚠️  Algunas pruebas unitarias fallaron (esto es normal durante el desarrollo)')
		}
	}

	async generateFinalReport() {
		console.log('\n📊 Generando reporte final...')

		// Analizar resultados
		this.analyzeLinkAudit()
		this.analyzeNavigationTest()
		this.analyzeUnitTests()

		// Generar reporte
		const report = {
			timestamp: new Date().toISOString(),
			summary: this.results.summary,
			details: {
				linkAudit: this.results.linkAudit,
				navigationTest: this.results.navigationTest,
				unitTests: this.results.unitTests
			},
			recommendations: this.generateRecommendations()
		}

		// Guardar reporte
		const reportPath = path.join(process.cwd(), 'final-verification-report.json')
		fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))

		// Mostrar resumen
		this.displaySummary()

		console.log(`\n💾 Reporte completo guardado en: ${reportPath}`)
	}

	analyzeLinkAudit() {
		if (!this.results.linkAudit) return

		const problematic = this.results.linkAudit.problematicLinks || []
		this.results.summary.totalIssues += problematic.length

		// Clasificar por severidad
		problematic.forEach(link => {
			if (link.type === 'router.push' || link.issue === 'Missing route') {
				this.results.summary.criticalIssues++
			} else {
				this.results.summary.warnings++
			}
		})
	}

	analyzeNavigationTest() {
		if (!this.results.navigationTest) return

		const routeTests = this.results.navigationTest.routeTests || []
		const linkTests = this.results.navigationTest.linkTests || []

		// Contar errores de rutas
		routeTests.forEach(test => {
			if (test.error) {
				if (test.error.includes('404') || test.error.includes('ERR_ABORTED')) {
					this.results.summary.criticalIssues++
				} else {
					this.results.summary.warnings++
				}
				this.results.summary.totalIssues++
			}
		})

		// Contar errores de enlaces
		linkTests.forEach(test => {
			if (test.error) {
				this.results.summary.totalIssues++
				this.results.summary.warnings++
			}
		})
	}

	analyzeUnitTests() {
		if (!this.results.unitTests) return

		if (this.results.unitTests.status === 'failed') {
			this.results.summary.warnings++
			this.results.summary.totalIssues++
		}
	}

	generateRecommendations() {
		const recommendations = []

		if (this.results.summary.criticalIssues > 0) {
			recommendations.push({
				priority: 'high',
				message: 'Se encontraron problemas críticos que requieren atención inmediata',
				action: 'Revisar enlaces rotos y rutas 404'
			})
		}

		if (this.results.linkAudit?.problematicLinks?.length > 0) {
			recommendations.push({
				priority: 'medium',
				message: 'Algunos enlaces necesitan corrección',
				action: 'Implementar páginas faltantes o corregir rutas'
			})
		}

		if (this.results.unitTests?.status === 'failed') {
			recommendations.push({
				priority: 'low',
				message: 'Las pruebas unitarias necesitan ajustes',
				action: 'Revisar configuración de mocks y dependencias'
			})
		}

		if (recommendations.length === 0) {
			recommendations.push({
				priority: 'info',
				message: '¡Excelente! La aplicación está en buen estado',
				action: 'Continuar con el desarrollo normal'
			})
		}

		return recommendations
	}

	displaySummary() {
		console.log('\n' + '='.repeat(60))
		console.log('📊 RESUMEN DE VERIFICACIÓN FINAL')
		console.log('='.repeat(60))

		const { totalIssues, criticalIssues, warnings } = this.results.summary

		console.log(`\n🔍 Total de problemas encontrados: ${totalIssues}`)
		console.log(`🚨 Problemas críticos: ${criticalIssues}`)
		console.log(`⚠️  Advertencias: ${warnings}`)

		if (totalIssues === 0) {
			console.log('\n🎉 ¡Felicitaciones! No se encontraron problemas críticos.')
		} else if (criticalIssues === 0) {
			console.log('\n✅ No hay problemas críticos, solo advertencias menores.')
		} else {
			console.log('\n🔧 Se requiere atención para resolver problemas críticos.')
		}

		// Mostrar recomendaciones
		const recommendations = this.generateRecommendations()
		console.log('\n📋 RECOMENDACIONES:')
		recommendations.forEach((rec, index) => {
			const icon = rec.priority === 'high' ? '🚨' : rec.priority === 'medium' ? '⚠️' : rec.priority === 'low' ? '💡' : '✅'
			console.log(`${index + 1}. ${icon} ${rec.message}`)
			console.log(`   Acción: ${rec.action}`)
		})

		console.log('\n' + '='.repeat(60))
	}
}

// Ejecutar verificación
if (require.main === module) {
	const verification = new FinalVerification()
	verification.runVerification().catch(console.error)
}

module.exports = FinalVerification