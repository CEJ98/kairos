#!/usr/bin/env node

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

/**
 * Script de despliegue automatizado para Vercel
 * Incluye validaciones previas y configuración de variables de entorno
 */

const colors = {
	reset: '\x1b[0m',
	bright: '\x1b[1m',
	red: '\x1b[31m',
	green: '\x1b[32m',
	yellow: '\x1b[33m',
	blue: '\x1b[34m',
	magenta: '\x1b[35m',
	cyan: '\x1b[36m'
}

function log(message, color = colors.reset) {
	console.log(`${color}${message}${colors.reset}`)
}

function logStep(step, message) {
	log(`\n${colors.bright}[${step}]${colors.reset} ${colors.cyan}${message}${colors.reset}`)
}

function logSuccess(message) {
	log(`✅ ${message}`, colors.green)
}

function logError(message) {
	log(`❌ ${message}`, colors.red)
}

function logWarning(message) {
	log(`⚠️  ${message}`, colors.yellow)
}

function runCommand(command, description) {
	try {
		log(`Ejecutando: ${command}`, colors.blue)
		const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' })
		logSuccess(description)
		return output
	} catch (error) {
		logError(`Error en: ${description}`)
		logError(error.message)
		process.exit(1)
	}
}

function checkPrerequisites() {
	logStep('1', 'Verificando prerequisitos')
	
	// Verificar que estamos en el directorio correcto
	if (!fs.existsSync('package.json')) {
		logError('No se encontró package.json. Ejecuta este script desde la raíz del proyecto.')
		process.exit(1)
	}
	
	// Verificar que existe vercel.json
	if (!fs.existsSync('vercel.json')) {
		logError('No se encontró vercel.json. Asegúrate de que esté configurado.')
		process.exit(1)
	}
	
	// Verificar variables de entorno críticas
	if (!fs.existsSync('.env.local')) {
		logWarning('No se encontró .env.local. Asegúrate de configurar las variables en Vercel.')
	}
	
	// Verificar que Vercel CLI esté instalado
	try {
		execSync('vercel --version', { stdio: 'pipe' })
		logSuccess('Vercel CLI encontrado')
	} catch (error) {
		logError('Vercel CLI no está instalado. Instálalo con: npm i -g vercel')
		process.exit(1)
	}
	
	logSuccess('Todos los prerequisitos están listos')
}

function runTests() {
	logStep('2', 'Ejecutando tests')
	
	try {
		// Ejecutar linting
		runCommand('npm run lint', 'Linting completado')
		
		// Ejecutar type checking
		runCommand('npm run type-check', 'Type checking completado')
		
		// Ejecutar tests unitarios
		runCommand('npm run test:run', 'Tests unitarios completados')
		
	} catch (error) {
		logError('Los tests fallaron. Corrige los errores antes de desplegar.')
		process.exit(1)
	}
}

function buildProject() {
	logStep('3', 'Construyendo el proyecto')
	
	// Limpiar build anterior
	if (fs.existsSync('.next')) {
		runCommand('rm -rf .next', 'Build anterior limpiado')
	}
	
	// Construir proyecto
	runCommand('npm run build', 'Proyecto construido exitosamente')
}

function deployToVercel() {
	logStep('4', 'Desplegando a Vercel')
	
	const isProduction = process.argv.includes('--production')
	const command = isProduction ? 'vercel --prod' : 'vercel'
	
	log(`Desplegando en modo: ${isProduction ? 'PRODUCCIÓN' : 'PREVIEW'}`, colors.magenta)
	
	const output = runCommand(command, 'Despliegue completado')
	
	// Extraer URL del despliegue
	const urlMatch = output.match(/https:\/\/[^\s]+/)
	if (urlMatch) {
		const deployUrl = urlMatch[0]
		logSuccess(`Aplicación desplegada en: ${deployUrl}`)
		
		// Verificar que el despliegue esté funcionando
		logStep('5', 'Verificando despliegue')
		try {
			const healthCheck = `curl -f ${deployUrl}/api/health`
			runCommand(healthCheck, 'Health check exitoso')
		} catch (error) {
			logWarning('Health check falló, pero el despliegue se completó')
		}
	}
}

function showPostDeploymentInfo() {
	logStep('6', 'Información post-despliegue')
	
	log('\n📋 Checklist post-despliegue:', colors.bright)
	log('□ Verificar que la aplicación carga correctamente')
	log('□ Probar autenticación (login/registro)')
	log('□ Verificar conexión a base de datos')
	log('□ Probar funcionalidades críticas')
	log('□ Verificar variables de entorno en Vercel Dashboard')
	log('□ Configurar dominio personalizado (si aplica)')
	log('□ Configurar alertas de monitoreo')
	
	log('\n🔗 Enlaces útiles:', colors.bright)
	log('• Vercel Dashboard: https://vercel.com/dashboard')
	log('• Supabase Dashboard: https://supabase.com/dashboard')
	log('• Documentación: ./docs/')
}

function main() {
	log('🚀 Iniciando despliegue automatizado de Kairos Fitness', colors.bright)
	log('=' .repeat(60), colors.cyan)
	
	try {
		checkPrerequisites()
		runTests()
		buildProject()
		deployToVercel()
		showPostDeploymentInfo()
		
		log('\n🎉 ¡Despliegue completado exitosamente!', colors.green)
		
	} catch (error) {
		logError('El despliegue falló')
		logError(error.message)
		process.exit(1)
	}
}

// Ejecutar script
if (require.main === module) {
	main()
}

module.exports = {
	checkPrerequisites,
	runTests,
	buildProject,
	deployToVercel
}