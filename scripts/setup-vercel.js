#!/usr/bin/env node

/**
 * Script de configuración automática para Vercel
 * Configura el proyecto para despliegue en Vercel con todas las variables de entorno necesarias
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

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

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

function execCommand(command, options = {}) {
  try {
    const result = execSync(command, { 
      encoding: 'utf8', 
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options 
    });
    return result;
  } catch (error) {
    if (!options.ignoreError) {
      log(`Error ejecutando: ${command}`, 'red');
      log(error.message, 'red');
      process.exit(1);
    }
    return null;
  }
}

function checkPrerequisites() {
  log('\n🔍 Verificando prerequisitos...', 'cyan');
  
  // Verificar Node.js
  try {
    const nodeVersion = execCommand('node --version', { silent: true });
    log(`✅ Node.js: ${nodeVersion.trim()}`, 'green');
  } catch {
    log('❌ Node.js no está instalado', 'red');
    process.exit(1);
  }
  
  // Verificar npm
  try {
    const npmVersion = execCommand('npm --version', { silent: true });
    log(`✅ npm: ${npmVersion.trim()}`, 'green');
  } catch {
    log('❌ npm no está instalado', 'red');
    process.exit(1);
  }
  
  // Verificar Git
  try {
    execCommand('git --version', { silent: true });
    log('✅ Git está disponible', 'green');
  } catch {
    log('❌ Git no está instalado', 'red');
    process.exit(1);
  }
  
  // Verificar archivos del proyecto
  const requiredFiles = ['package.json', 'vercel.json', '.env.example'];
  for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
      log(`❌ Archivo requerido no encontrado: ${file}`, 'red');
      process.exit(1);
    }
  }
  log('✅ Archivos del proyecto verificados', 'green');
}

function installVercelCLI() {
  log('\n📦 Instalando Vercel CLI...', 'cyan');
  
  try {
    execCommand('vercel --version', { silent: true });
    log('✅ Vercel CLI ya está instalado', 'green');
  } catch {
    log('Instalando Vercel CLI globalmente...', 'yellow');
    execCommand('npm install -g vercel@latest');
    log('✅ Vercel CLI instalado correctamente', 'green');
  }
}

async function setupVercelProject() {
  log('\n🚀 Configurando proyecto en Vercel...', 'cyan');
  
  const shouldLogin = await question('¿Necesitas hacer login en Vercel? (y/N): ');
  if (shouldLogin.toLowerCase() === 'y') {
    log('Iniciando sesión en Vercel...', 'yellow');
    execCommand('vercel login');
  }
  
  log('Configurando proyecto...', 'yellow');
  execCommand('vercel link');
  
  log('✅ Proyecto configurado en Vercel', 'green');
}

async function setupEnvironmentVariables() {
  log('\n🔧 Configurando variables de entorno...', 'cyan');
  
  const envExample = fs.readFileSync('.env.example', 'utf8');
  const envVars = envExample
    .split('\n')
    .filter(line => line.includes('=') && !line.startsWith('#'))
    .map(line => line.split('=')[0]);
  
  log('Variables de entorno detectadas:', 'yellow');
  envVars.forEach(varName => log(`  - ${varName}`, 'blue'));
  
  const setupEnv = await question('\n¿Quieres configurar las variables de entorno automáticamente? (y/N): ');
  
  if (setupEnv.toLowerCase() === 'y') {
    // Variables públicas (se pueden mostrar en el cliente)
    const publicVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'
    ];
    
    // Variables privadas (solo en el servidor)
    const privateVars = envVars.filter(v => !publicVars.includes(v));
    
    log('\n📝 Configurando variables públicas...', 'cyan');
    for (const varName of publicVars) {
      if (envVars.includes(varName)) {
        const value = await question(`Ingresa el valor para ${varName}: `);
        if (value.trim()) {
          execCommand(`vercel env add ${varName} production`, { 
            input: value,
            ignoreError: true 
          });
          execCommand(`vercel env add ${varName} preview`, { 
            input: value,
            ignoreError: true 
          });
        }
      }
    }
    
    log('\n🔒 Configurando variables privadas...', 'cyan');
    for (const varName of privateVars.slice(0, 5)) { // Limitar para no abrumar
      const value = await question(`Ingresa el valor para ${varName} (opcional): `);
      if (value.trim()) {
        execCommand(`vercel env add ${varName} production`, { 
          input: value,
          ignoreError: true 
        });
        execCommand(`vercel env add ${varName} preview`, { 
          input: value,
          ignoreError: true 
        });
      }
    }
    
    log('✅ Variables de entorno configuradas', 'green');
  } else {
    log('⚠️  Recuerda configurar las variables de entorno manualmente en el dashboard de Vercel', 'yellow');
  }
}

function setupGitHubSecrets() {
  log('\n🔐 Configuración de GitHub Secrets...', 'cyan');
  
  const secrets = [
    'VERCEL_TOKEN',
    'VERCEL_ORG_ID', 
    'VERCEL_PROJECT_ID',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'TEST_DATABASE_URL'
  ];
  
  log('Secrets requeridos para GitHub Actions:', 'yellow');
  secrets.forEach(secret => log(`  - ${secret}`, 'blue'));
  
  log('\nPara configurar estos secrets:', 'yellow');
  log('1. Ve a tu repositorio en GitHub', 'blue');
  log('2. Settings > Secrets and variables > Actions', 'blue');
  log('3. Agrega cada secret con su valor correspondiente', 'blue');
  log('\nPuedes obtener VERCEL_TOKEN desde: https://vercel.com/account/tokens', 'blue');
  log('VERCEL_ORG_ID y VERCEL_PROJECT_ID están en .vercel/project.json después de hacer vercel link', 'blue');
}

function createDeploymentScript() {
  log('\n📜 Creando script de despliegue...', 'cyan');
  
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  if (!packageJson.scripts) {
    packageJson.scripts = {};
  }
  
  // Agregar scripts de despliegue
  packageJson.scripts['deploy:preview'] = 'vercel';
  packageJson.scripts['deploy:production'] = 'vercel --prod';
  packageJson.scripts['deploy:setup'] = 'node scripts/setup-vercel.js';
  
  fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
  
  log('✅ Scripts de despliegue agregados a package.json', 'green');
}

function showFinalInstructions() {
  log('\n🎉 ¡Configuración completada!', 'green');
  log('\n📋 Próximos pasos:', 'cyan');
  log('\n1. Verificar configuración:', 'yellow');
  log('   vercel env ls', 'blue');
  log('\n2. Hacer un despliegue de prueba:', 'yellow');
  log('   npm run deploy:preview', 'blue');
  log('\n3. Desplegar a producción:', 'yellow');
  log('   npm run deploy:production', 'blue');
  log('\n4. Configurar dominio personalizado (opcional):', 'yellow');
  log('   vercel domains add tu-dominio.com', 'blue');
  log('\n5. Monitorear despliegues:', 'yellow');
  log('   https://vercel.com/dashboard', 'blue');
  
  log('\n🔗 Enlaces útiles:', 'cyan');
  log('• Dashboard de Vercel: https://vercel.com/dashboard', 'blue');
  log('• Documentación: https://vercel.com/docs', 'blue');
  log('• GitHub Actions: https://github.com/features/actions', 'blue');
}

async function main() {
  log('🚀 Configurador de Vercel para Kairos Fitness', 'bright');
  log('================================================', 'bright');
  
  try {
    checkPrerequisites();
    installVercelCLI();
    await setupVercelProject();
    await setupEnvironmentVariables();
    setupGitHubSecrets();
    createDeploymentScript();
    showFinalInstructions();
    
    log('\n✅ ¡Configuración completada exitosamente!', 'green');
  } catch (error) {
    log(`\n❌ Error durante la configuración: ${error.message}`, 'red');
    process.exit(1);
  } finally {
    rl.close();
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  checkPrerequisites,
  installVercelCLI,
  setupVercelProject,
  setupEnvironmentVariables
};