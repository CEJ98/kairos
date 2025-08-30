#!/usr/bin/env node

/**
 * Guía paso a paso para integrar Kairos Fitness con GitHub y Vercel
 * Este script proporciona instrucciones detalladas para una integración exitosa
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
};

function log(message, color = 'reset') {
	console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, title) {
	log(`\n${step}. ${title}`, 'cyan');
	log('='.repeat(50), 'cyan');
}

function logSuccess(message) {
	log(`✅ ${message}`, 'green');
}

function logWarning(message) {
	log(`⚠️  ${message}`, 'yellow');
}

function logError(message) {
	log(`❌ ${message}`, 'red');
}

function logInfo(message) {
	log(`ℹ️  ${message}`, 'blue');
}

function showWelcome() {
	log('🚀 Guía de Integración GitHub + Vercel', 'bright');
	log('=====================================', 'bright');
	log('\nEsta guía te ayudará a integrar tu proyecto Kairos Fitness', 'blue');
	log('con GitHub y Vercel para despliegues automáticos.\n', 'blue');
}

function showGitHubSteps() {
	logStep('1', 'Crear Repositorio en GitHub');
	
	log('Opción A: Usando la interfaz web de GitHub', 'yellow');
	log('1. Ve a https://github.com/new', 'blue');
	log('2. Nombre del repositorio: kairos-fitness', 'blue');
	log('3. Descripción: "Aplicación de fitness con Next.js, Supabase y Stripe"', 'blue');
	log('4. Selecciona "Public" o "Private" según tu preferencia', 'blue');
	log('5. NO inicialices con README, .gitignore o licencia (ya los tienes)', 'blue');
	log('6. Haz clic en "Create repository"', 'blue');
	
	log('\nOpción B: Usando GitHub CLI (si lo instalas)', 'yellow');
	log('1. Instala GitHub CLI: brew install gh', 'blue');
	log('2. Autentícate: gh auth login', 'blue');
	log('3. Crea el repo: gh repo create kairos-fitness --public --source=. --remote=origin --push', 'blue');
}

function showGitCommands() {
	logStep('2', 'Conectar Repositorio Local con GitHub');
	
	log('Ejecuta estos comandos en tu terminal:', 'yellow');
	log('\n# Agregar el repositorio remoto', 'blue');
	log('git remote add origin https://github.com/TU_USUARIO/kairos-fitness.git', 'green');
	log('\n# Cambiar a rama main', 'blue');
	log('git branch -M main', 'green');
	log('\n# Subir el código', 'blue');
	log('git push -u origin main', 'green');
	
	logWarning('Reemplaza "TU_USUARIO" con tu nombre de usuario de GitHub');
}

function showVercelIntegration() {
	logStep('3', 'Integrar con Vercel desde GitHub');
	
	log('1. Ve a https://vercel.com/dashboard', 'blue');
	log('2. Haz clic en "Add New..." > "Project"', 'blue');
	log('3. Selecciona "Import Git Repository"', 'blue');
	log('4. Conecta tu cuenta de GitHub si no lo has hecho', 'blue');
	log('5. Busca y selecciona el repositorio "kairos-fitness"', 'blue');
	log('6. Configura el proyecto:', 'blue');
	log('   - Framework Preset: Next.js', 'green');
	log('   - Root Directory: ./ (raíz)', 'green');
	log('   - Build Command: npm run build', 'green');
	log('   - Output Directory: .next', 'green');
	log('   - Install Command: npm ci', 'green');
	log('7. Haz clic en "Deploy"', 'blue');
}

function showEnvironmentVariables() {
	logStep('4', 'Configurar Variables de Entorno en Vercel');
	
	log('Después del primer despliegue:', 'yellow');
	log('1. Ve a tu proyecto en Vercel Dashboard', 'blue');
	log('2. Haz clic en "Settings" > "Environment Variables"', 'blue');
	log('3. Agrega estas variables (una por una):', 'blue');
	
	const envVars = [
		'NEXT_PUBLIC_SUPABASE_URL',
		'NEXT_PUBLIC_SUPABASE_ANON_KEY',
		'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
		'DATABASE_URL',
		'NEXTAUTH_SECRET',
		'NEXTAUTH_URL',
		'SUPABASE_SERVICE_ROLE_KEY',
		'STRIPE_SECRET_KEY',
		'STRIPE_WEBHOOK_SECRET',
		'CRON_SECRET'
	];
	
	envVars.forEach((envVar, index) => {
		log(`   ${index + 1}. ${envVar}`, 'green');
	});
	
	log('\n4. Para cada variable:', 'blue');
	log('   - Name: nombre de la variable', 'green');
	log('   - Value: valor desde tu .env.local', 'green');
	log('   - Environment: Production, Preview, Development', 'green');
	log('5. Haz clic en "Save"', 'blue');
	
	logWarning('Copia los valores exactos desde tu archivo .env.local');
}

function showAutomaticDeployments() {
	logStep('5', 'Configurar Despliegues Automáticos');
	
	log('Vercel automáticamente configurará:', 'yellow');
	log('✅ Despliegues automáticos en cada push a main', 'green');
	log('✅ Preview deployments para pull requests', 'green');
	log('✅ Integración con GitHub status checks', 'green');
	
	log('\nPara verificar la configuración:', 'blue');
	log('1. Ve a Settings > Git en tu proyecto Vercel', 'blue');
	log('2. Verifica que esté conectado al repositorio correcto', 'blue');
	log('3. Confirma que "Production Branch" sea "main"', 'blue');
}

function showDomainConfiguration() {
	logStep('6', 'Configurar Dominio (Opcional)');
	
	log('Para usar un dominio personalizado:', 'yellow');
	log('1. Ve a Settings > Domains en Vercel', 'blue');
	log('2. Haz clic en "Add"', 'blue');
	log('3. Ingresa tu dominio (ej: kairos-fitness.com)', 'blue');
	log('4. Sigue las instrucciones para configurar DNS', 'blue');
	log('5. Vercel proporcionará los registros DNS necesarios', 'blue');
	
	logInfo('El dominio .vercel.app funciona inmediatamente sin configuración');
}

function showVerificationSteps() {
	logStep('7', 'Verificar la Integración');
	
	log('Después de completar la configuración:', 'yellow');
	log('1. Haz un pequeño cambio en tu código', 'blue');
	log('2. Commit y push:', 'blue');
	log('   git add .', 'green');
	log('   git commit -m "Test automatic deployment"', 'green');
	log('   git push origin main', 'green');
	log('3. Ve a Vercel Dashboard para ver el despliegue automático', 'blue');
	log('4. Verifica que la aplicación funcione en la URL de producción', 'blue');
	
	log('\nPuedes usar nuestro script de verificación:', 'blue');
	log('npm run deploy:verify https://tu-app.vercel.app', 'green');
}

function showTroubleshooting() {
	logStep('8', 'Solución de Problemas Comunes');
	
	log('❌ Build failed:', 'red');
	log('   - Verifica que todas las dependencias estén en package.json', 'blue');
	log('   - Ejecuta "npm run build" localmente para probar', 'blue');
	log('   - Revisa los logs de build en Vercel', 'blue');
	
	log('\n❌ Environment variables not found:', 'red');
	log('   - Verifica que todas las variables estén configuradas', 'blue');
	log('   - Confirma que los nombres sean exactos (case-sensitive)', 'blue');
	log('   - Redeploy después de agregar variables', 'blue');
	
	log('\n❌ Database connection failed:', 'red');
	log('   - Verifica DATABASE_URL en variables de entorno', 'blue');
	log('   - Confirma que Supabase esté activo y accesible', 'blue');
	log('   - Revisa la configuración de RLS en Supabase', 'blue');
}

function showBestPractices() {
	logStep('9', 'Mejores Prácticas');
	
	log('🔒 Seguridad:', 'yellow');
	log('   - Nunca commitees archivos .env al repositorio', 'blue');
	log('   - Usa diferentes claves para desarrollo y producción', 'blue');
	log('   - Regenera secretos regularmente', 'blue');
	
	log('\n🚀 Despliegues:', 'yellow');
	log('   - Usa ramas feature para desarrollo', 'blue');
	log('   - Prueba en preview deployments antes de mergear', 'blue');
	log('   - Mantén main siempre estable', 'blue');
	
	log('\n📊 Monitoreo:', 'yellow');
	log('   - Configura alertas en Vercel', 'blue');
	log('   - Monitorea métricas de performance', 'blue');
	log('   - Revisa logs regularmente', 'blue');
}

function showNextSteps() {
	logStep('10', 'Próximos Pasos');
	
	log('Una vez completada la integración:', 'yellow');
	log('✅ Tu aplicación se desplegará automáticamente', 'green');
	log('✅ Tendrás preview deployments para cada PR', 'green');
	log('✅ Podrás monitorear performance y errores', 'green');
	log('✅ Escalará automáticamente según el tráfico', 'green');
	
	log('\nRecursos útiles:', 'blue');
	log('• Vercel Dashboard: https://vercel.com/dashboard', 'blue');
	log('• Documentación Vercel: https://vercel.com/docs', 'blue');
	log('• GitHub Actions (opcional): .github/workflows/', 'blue');
	log('• Supabase Dashboard: https://supabase.com/dashboard', 'blue');
}

function main() {
	showWelcome();
	showGitHubSteps();
	showGitCommands();
	showVercelIntegration();
	showEnvironmentVariables();
	showAutomaticDeployments();
	showDomainConfiguration();
	showVerificationSteps();
	showTroubleshooting();
	showBestPractices();
	showNextSteps();
	
	log('\n🎉 ¡Listo para la integración!', 'bright');
	log('Sigue estos pasos y tendrás un despliegue automático funcionando.\n', 'green');
}

if (require.main === module) {
	main();
}

module.exports = {
	showWelcome,
	showGitHubSteps,
	showVercelIntegration,
	showEnvironmentVariables
};