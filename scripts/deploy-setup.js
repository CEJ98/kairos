#!/usr/bin/env node

/**
 * Vercel Deployment Setup Script
 * Configura automáticamente el proyecto para despliegue en Vercel
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

console.log('🚀 Configurando Kairos Fitness para despliegue en Vercel...\n')

// 1. Verificar archivos necesarios
const requiredFiles = [
  'package.json',
  'next.config.js',
  'vercel.json',
  'prisma/schema.prisma',
  '.env.example'
]

console.log('📁 Verificando archivos necesarios...')
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`   ✅ ${file}`)
  } else {
    console.log(`   ❌ ${file} - FALTANTE`)
    process.exit(1)
  }
})

// 2. Verificar dependencias
console.log('\n📦 Verificando dependencias...')
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
  const requiredDeps = ['next', '@prisma/client', 'next-auth', 'stripe']
  
  requiredDeps.forEach(dep => {
    if (packageJson.dependencies[dep]) {
      console.log(`   ✅ ${dep}`)
    } else {
      console.log(`   ❌ ${dep} - FALTANTE`)
      process.exit(1)
    }
  })
} catch (error) {
  console.log('   ❌ Error leyendo package.json')
  process.exit(1)
}

// 3. Verificar build
console.log('\n🔨 Verificando que el build funciona...')
try {
  execSync('npm run build', { stdio: 'pipe' })
  console.log('   ✅ Build exitoso')
} catch (error) {
  console.log('   ❌ Build falló')
  console.log('   Por favor, corrige los errores antes del deploy')
  process.exit(1)
}

// 4. Crear .env.example actualizado
console.log('\n🔧 Actualizando .env.example...')
const envExample = `# Kairos Fitness - Environment Variables Template

# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
NODE_ENV=development

# Authentication - Generate with: openssl rand -base64 32
NEXTAUTH_SECRET=your-super-secret-key-here

# Database - Use Railway, Supabase, or your PostgreSQL instance
DATABASE_URL="postgresql://user:password@host:port/database"

# Stripe Configuration (Get from Stripe Dashboard)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Plan IDs (Create products in Stripe Dashboard)
STRIPE_PRICE_BASIC_MONTHLY=price_...
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_TRAINER_MONTHLY=price_...

# Analytics (Optional)
GOOGLE_ANALYTICS_ID=G-...

# Security (Optional)
ALLOWED_ORIGINS=http://localhost:3000
`

fs.writeFileSync('.env.example', envExample)
console.log('   ✅ .env.example actualizado')

// 5. Crear script de verificación post-deploy
const postDeployScript = `#!/usr/bin/env node

/**
 * Post-Deploy Verification Script
 * Verifica que el deployment funcione correctamente
 */

const https = require('https')

const VERCEL_URL = process.env.VERCEL_URL || process.argv[2]

if (!VERCEL_URL) {
  console.log('❌ VERCEL_URL no proporcionada')
  console.log('Uso: node scripts/verify-deploy.js <vercel-url>')
  process.exit(1)
}

console.log('🔍 Verificando deployment en:', VERCEL_URL)

const checks = [
  { path: '/', name: 'Landing Page' },
  { path: '/api/health', name: 'Health Check' },
  { path: '/signin', name: 'Auth Page' },
  { path: '/pricing', name: 'Pricing Page' }
]

async function checkEndpoint(url, name) {
  return new Promise((resolve) => {
    const req = https.get(url, (res) => {
      if (res.statusCode >= 200 && res.statusCode < 400) {
        console.log('   ✅', name, '- Status:', res.statusCode)
        resolve(true)
      } else {
        console.log('   ❌', name, '- Status:', res.statusCode)
        resolve(false)
      }
    })
    
    req.on('error', (error) => {
      console.log('   ❌', name, '- Error:', error.message)
      resolve(false)
    })
    
    req.setTimeout(10000, () => {
      console.log('   ⏱️', name, '- Timeout')
      resolve(false)
    })
  })
}

async function runChecks() {
  let passed = 0
  
  for (const check of checks) {
    const url = \`https://\${VERCEL_URL}\${check.path}\`
    const success = await checkEndpoint(url, check.name)
    if (success) passed++
  }
  
  console.log(\`\\n📊 Resultado: \${passed}/\${checks.length} checks pasaron\`)
  
  if (passed === checks.length) {
    console.log('🎉 ¡Deployment exitoso!')
  } else {
    console.log('⚠️  Algunos checks fallaron - revisa los logs')
  }
}

runChecks()
`

fs.writeFileSync('scripts/verify-deploy.js', postDeployScript)
fs.chmodSync('scripts/verify-deploy.js', '755')
console.log('   ✅ Script de verificación creado')

// 6. Mostrar resumen
console.log(`
🎉 ¡Configuración completa!

📋 PRÓXIMOS PASOS PARA DESPLEGAR EN VERCEL:

1. 📤 Subir a GitHub:
   git add .
   git commit -m "Ready for Vercel deployment"
   git push origin main

2. 🌐 Ir a vercel.com:
   - Conectar GitHub
   - Importar proyecto
   - Configurar variables de entorno (ver .env.example)

3. 🔑 Variables de entorno REQUERIDAS en Vercel:
   - NEXTAUTH_URL (https://tu-app.vercel.app)
   - NEXTAUTH_SECRET (genera con: openssl rand -base64 32)
   - DATABASE_URL (PostgreSQL en Railway/Supabase)
   - STRIPE_* (desde Stripe Dashboard)

4. 🚀 Deploy y verificar:
   node scripts/verify-deploy.js tu-app.vercel.app

📚 Documentación completa: README-DEPLOYMENT.md

¡Tu app estará lista para el mercado fitness de Miami! 🏋️‍♂️
`)

console.log('✨ Setup completado exitosamente!\n')