#!/usr/bin/env node

const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

function execCommand(command, description) {
	try {
		console.log(`\n🔄 ${description}...`);
		const result = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
		console.log(`✅ ${description} completado`);
		return result;
	} catch (error) {
		console.error(`❌ Error en ${description}:`);
		console.error(error.message);
		process.exit(1);
	}
}

function askQuestion(question) {
	return new Promise((resolve) => {
		rl.question(question, (answer) => {
			resolve(answer.trim());
		});
	});
}

async function main() {
	console.log('🚀 Conectar Repositorio con GitHub');
	console.log('==================================\n');

	// Verificar que estamos en un repositorio Git
	try {
		execSync('git status', { stdio: 'ignore' });
		console.log('✅ Repositorio Git local detectado');
	} catch (error) {
		console.error('❌ Error: No estás en un repositorio Git');
		process.exit(1);
	}

	// Verificar si ya hay commits
	try {
		execSync('git log --oneline -1', { stdio: 'ignore' });
		console.log('✅ Commits encontrados en el repositorio');
	} catch (error) {
		console.error('❌ Error: No hay commits en el repositorio');
		console.log('Ejecuta primero: git add . && git commit -m "Initial commit"');
		process.exit(1);
	}

	// Verificar si ya hay un remote
	try {
		const remotes = execSync('git remote -v', { encoding: 'utf8' });
		if (remotes.trim()) {
			console.log('⚠️  Ya tienes repositorios remotos configurados:');
			console.log(remotes);
			
			const continuar = await askQuestion('¿Quieres continuar y reemplazar el remote origin? (y/N): ');
			if (continuar.toLowerCase() !== 'y' && continuar.toLowerCase() !== 'yes') {
				console.log('❌ Operación cancelada');
				process.exit(0);
			}
			
			// Remover remote existente
			execCommand('git remote remove origin', 'Removiendo remote existente');
		}
	} catch (error) {
		// No hay remotes, continuamos
		console.log('✅ No hay remotes configurados, perfecto para conectar');
	}

	// Pedir URL del repositorio
	console.log('\n📝 Necesito la URL de tu repositorio de GitHub');
	console.log('Ejemplo: https://github.com/CEJ98/kairos-fitness.git');
	console.log('(La puedes copiar desde GitHub después de crear el repositorio)\n');

	const repoUrl = await askQuestion('🔗 Pega la URL del repositorio: ');

	if (!repoUrl) {
		console.error('❌ Error: URL del repositorio requerida');
		process.exit(1);
	}

	// Validar formato de URL
	if (!repoUrl.includes('github.com') || !repoUrl.endsWith('.git')) {
		console.error('❌ Error: URL inválida. Debe ser una URL de GitHub que termine en .git');
		process.exit(1);
	}

	console.log(`\n🔗 Conectando con: ${repoUrl}`);

	// Agregar remote origin
	execCommand(`git remote add origin ${repoUrl}`, 'Agregando remote origin');

	// Configurar branch principal
	execCommand('git branch -M main', 'Configurando branch principal como main');

	// Push inicial
	console.log('\n🚀 Subiendo código a GitHub...');
	try {
		execCommand('git push -u origin main', 'Subiendo código inicial');
		console.log('\n🎉 ¡Repositorio conectado exitosamente!');
	} catch (error) {
		console.error('\n❌ Error al subir el código.');
		console.log('Esto puede suceder si:');
		console.log('1. El repositorio ya tiene contenido');
		console.log('2. No tienes permisos de escritura');
		console.log('3. Problemas de autenticación');
		
		console.log('\n🔧 Intenta con:');
		console.log('git push -u origin main --force');
		console.log('(Solo si estás seguro de que quieres sobrescribir)');
		process.exit(1);
	}

	// Verificar conexión
	console.log('\n🔍 Verificando conexión...');
	const remoteInfo = execCommand('git remote -v', 'Verificando remotes');
	console.log(remoteInfo);

	console.log('\n✅ ¡Conexión completada!');
	console.log('========================');
	console.log('Tu repositorio local ahora está conectado con GitHub.');
	console.log('\n🚀 Próximos pasos:');
	console.log('1. Ve a https://vercel.com/dashboard');
	console.log('2. Clic en "Import Project"');
	console.log('3. Selecciona tu repositorio');
	console.log('4. Configura las variables de entorno');
	console.log('5. ¡Deploy automático!');

	console.log('\n📋 Variables de entorno para Vercel:');
	console.log('• DATABASE_URL');
	console.log('• SUPABASE_URL');
	console.log('• SUPABASE_ANON_KEY');
	console.log('• NEXTAUTH_SECRET');
	console.log('• NEXTAUTH_URL');
	console.log('• STRIPE_SECRET_KEY');
	console.log('• STRIPE_PUBLISHABLE_KEY');

	rl.close();
}

main().catch(console.error);