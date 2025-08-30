#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Script de Conexión con GitHub - Kairos Fitness');
console.log('================================================\n');

// Verificar que estamos en un repositorio Git
try {
	execSync('git status', { stdio: 'ignore' });
	console.log('✅ Repositorio Git local detectado');
} catch (error) {
	console.error('❌ Error: No estás en un repositorio Git');
	process.exit(1);
}

// Verificar si ya hay un remote configurado
try {
	const remotes = execSync('git remote -v', { encoding: 'utf8' });
	if (remotes.trim()) {
		console.log('⚠️  Ya tienes repositorios remotos configurados:');
		console.log(remotes);
		console.log('\n¿Quieres continuar? (Ctrl+C para cancelar)');
	}
} catch (error) {
	// No hay remotes, continuamos
}

console.log('\n📋 Pasos para conectar con GitHub:');
console.log('==================================');

console.log('\n1. 🌐 Crear Repositorio en GitHub:');
console.log('   • Ve a: https://github.com/new');
console.log('   • Nombre del repositorio: kairos-fitness');
console.log('   • Descripción: Aplicación de fitness con Supabase y Next.js');
console.log('   • Visibilidad: Público (recomendado para Vercel gratuito)');
console.log('   • NO marques "Add a README file"');
console.log('   • NO marques "Add .gitignore"');
console.log('   • NO marques "Choose a license"');
console.log('   • Clic en "Create repository"');

console.log('\n2. 📝 Copia la URL del repositorio que aparecerá en GitHub');
console.log('   Ejemplo: https://github.com/CEJ98/kairos-fitness.git');

console.log('\n3. 🔗 Ejecuta estos comandos (reemplaza con tu URL):');
console.log('   git remote add origin https://github.com/CEJ98/kairos-fitness.git');
console.log('   git branch -M main');
console.log('   git push -u origin main');

console.log('\n4. 🎯 Comandos automáticos disponibles:');
console.log('   Una vez que tengas la URL del repositorio, ejecuta:');
console.log('   npm run github:connect <URL_DEL_REPOSITORIO>');

console.log('\n5. 🚀 Después de conectar:');
console.log('   • Ve a https://vercel.com/dashboard');
console.log('   • Clic en "Import Project"');
console.log('   • Selecciona tu repositorio kairos-fitness');
console.log('   • Configura las variables de entorno');
console.log('   • Deploy automático');

console.log('\n📋 Variables de entorno necesarias en Vercel:');
console.log('============================================');

// Leer variables del .env.example si existe
const envExamplePath = path.join(process.cwd(), '.env.example');
if (fs.existsSync(envExamplePath)) {
	const envExample = fs.readFileSync(envExamplePath, 'utf8');
	const envVars = envExample
		.split('\n')
		.filter(line => line.trim() && !line.startsWith('#'))
		.map(line => line.split('=')[0])
		.filter(Boolean);
	
	envVars.forEach(varName => {
		console.log(`   • ${varName}`);
	});
} else {
	console.log('   • DATABASE_URL');
	console.log('   • SUPABASE_URL');
	console.log('   • SUPABASE_ANON_KEY');
	console.log('   • NEXTAUTH_SECRET');
	console.log('   • NEXTAUTH_URL');
	console.log('   • STRIPE_SECRET_KEY');
	console.log('   • STRIPE_PUBLISHABLE_KEY');
}

console.log('\n🎉 Una vez completado tendrás:');
console.log('==============================');
console.log('✅ Repositorio en GitHub');
console.log('✅ Despliegues automáticos en Vercel');
console.log('✅ Preview deployments para cada branch');
console.log('✅ URL de producción funcionando');
console.log('✅ CI/CD completo');

console.log('\n🔧 Comandos útiles después de conectar:');
console.log('=======================================');
console.log('npm run deploy:preview  # Deploy de preview');
console.log('npm run deploy:prod     # Deploy de producción');
console.log('npm run github:status   # Ver estado del repositorio');

console.log('\n📞 ¿Necesitas ayuda?');
console.log('===================');
console.log('Si tienes problemas, ejecuta: npm run github:help');

console.log('\n🚀 ¡Listo para conectar!');
console.log('========================');
console.log('Sigue los pasos de arriba y tendrás todo funcionando.\n');