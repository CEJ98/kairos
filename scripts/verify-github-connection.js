#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function execCommand(command, description) {
	try {
		const result = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
		return { success: true, output: result.trim() };
	} catch (error) {
		return { success: false, error: error.message };
	}
}

function checkStatus(condition, message) {
	const status = condition ? '✅' : '❌';
	console.log(`${status} ${message}`);
	return condition;
}

console.log('🔍 Verificación de Conexión GitHub - Kairos Fitness');
console.log('=================================================\n');

let allChecksPass = true;

// 1. Verificar que estamos en un repositorio Git
console.log('1. 📁 Verificando repositorio Git local:');
const gitStatus = execCommand('git status --porcelain', 'Git status');
allChecksPass &= checkStatus(gitStatus.success, 'Repositorio Git inicializado');

// 2. Verificar que hay commits
console.log('\n2. 📝 Verificando commits:');
const gitLog = execCommand('git log --oneline -1', 'Git log');
allChecksPass &= checkStatus(gitLog.success, 'Commits encontrados en el repositorio');
if (gitLog.success) {
	console.log(`   Último commit: ${gitLog.output}`);
}

// 3. Verificar remote origin
console.log('\n3. 🔗 Verificando conexión remota:');
const remotes = execCommand('git remote -v', 'Git remotes');
allChecksPass &= checkStatus(remotes.success && remotes.output.includes('origin'), 'Remote origin configurado');
if (remotes.success && remotes.output) {
	console.log('   Remotes configurados:');
	remotes.output.split('\n').forEach(line => {
		if (line.trim()) console.log(`   ${line}`);
	});
}

// 4. Verificar que el remote es de GitHub
console.log('\n4. 🐙 Verificando GitHub:');
const isGitHub = remotes.success && remotes.output.includes('github.com');
allChecksPass &= checkStatus(isGitHub, 'Repositorio conectado a GitHub');

// 5. Verificar sincronización con remote
console.log('\n5. 🔄 Verificando sincronización:');
const fetchResult = execCommand('git fetch origin', 'Git fetch');
const statusResult = execCommand('git status -uno', 'Git status');
const isSynced = statusResult.success && (
	statusResult.output.includes('up to date') || 
	statusResult.output.includes('up-to-date') ||
	statusResult.output.includes('nothing to commit')
);
allChecksPass &= checkStatus(isSynced, 'Repositorio sincronizado con GitHub');

// 6. Verificar archivos importantes
console.log('\n6. 📋 Verificando archivos del proyecto:');
const importantFiles = [
	'package.json',
	'next.config.js',
	'vercel.json',
	'.env.example',
	'src/app/layout.tsx',
	'src/app/page.tsx'
];

importantFiles.forEach(file => {
	const exists = fs.existsSync(path.join(process.cwd(), file));
	allChecksPass &= checkStatus(exists, `${file} existe`);
});

// 7. Verificar configuración de Vercel
console.log('\n7. ⚡ Verificando configuración de Vercel:');
const vercelConfig = fs.existsSync(path.join(process.cwd(), 'vercel.json'));
allChecksPass &= checkStatus(vercelConfig, 'vercel.json configurado');

if (vercelConfig) {
	try {
		const config = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'vercel.json'), 'utf8'));
		checkStatus(config.buildCommand, 'Build command configurado');
		checkStatus(config.outputDirectory, 'Output directory configurado');
		checkStatus(config.functions, 'Funciones serverless configuradas');
	} catch (error) {
		checkStatus(false, 'Error leyendo vercel.json');
	}
}

// 8. Verificar variables de entorno de ejemplo
console.log('\n8. 🔐 Verificando variables de entorno:');
const envExample = fs.existsSync(path.join(process.cwd(), '.env.example'));
allChecksPass &= checkStatus(envExample, '.env.example existe');

if (envExample) {
	try {
		const envContent = fs.readFileSync(path.join(process.cwd(), '.env.example'), 'utf8');
		const requiredVars = [
			'DATABASE_URL',
			'NEXTAUTH_SECRET',
			'NEXTAUTH_URL'
		];
		
		requiredVars.forEach(varName => {
			const hasVar = envContent.includes(varName);
			checkStatus(hasVar, `${varName} definido en .env.example`);
		});
	} catch (error) {
		checkStatus(false, 'Error leyendo .env.example');
	}
}

// Resumen final
console.log('\n' + '='.repeat(50));
if (allChecksPass) {
	console.log('🎉 ¡TODAS LAS VERIFICACIONES PASARON!');
	console.log('✅ Tu repositorio está listo para Vercel');
	
	console.log('\n🚀 Próximos pasos:');
	console.log('1. Ve a https://vercel.com/dashboard');
	console.log('2. Clic en "Import Project"');
	console.log('3. Busca y selecciona tu repositorio "kairos"');
	console.log('4. Vercel detectará automáticamente Next.js');
	console.log('5. Configura las variables de entorno');
	console.log('6. Haz clic en "Deploy"');
	
	console.log('\n📋 Variables críticas para Vercel:');
	console.log('• DATABASE_URL (tu URL de Supabase)');
	console.log('• NEXTAUTH_SECRET (genera uno nuevo)');
	console.log('• NEXTAUTH_URL (será tu dominio de Vercel)');
	console.log('• SUPABASE_URL');
	console.log('• SUPABASE_ANON_KEY');
	
} else {
	console.log('❌ ALGUNAS VERIFICACIONES FALLARON');
	console.log('🔧 Revisa los errores de arriba y corrígelos antes de continuar');
	
	console.log('\n🆘 Comandos útiles para solucionar problemas:');
	console.log('• git status - Ver estado del repositorio');
	console.log('• git remote -v - Ver remotes configurados');
	console.log('• git push origin main - Subir cambios a GitHub');
	console.log('• npm run github:connect - Reconectar con GitHub');
}

console.log('\n📞 ¿Necesitas ayuda adicional?');
console.log('Ejecuta: npm run github:setup');
console.log('O visita: https://vercel.com/docs/deployments/git');

process.exit(allChecksPass ? 0 : 1);