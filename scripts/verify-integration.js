#!/usr/bin/env node
/**
 * Script de verificación de integración completa
 * Verifica que Supabase, Vercel y la aplicación estén correctamente integrados
 */

require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')
const { createClient } = require('@supabase/supabase-js')
const https = require('https')
const http = require('http')

const prisma = new PrismaClient()

// Colores para la consola
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green')
}

function logError(message) {
  log(`❌ ${message}`, 'red')
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow')
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue')
}

// Verificar variables de entorno
async function checkEnvironmentVariables() {
  logInfo('Verificando variables de entorno...')
  
  const requiredVars = [
    'DATABASE_URL',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET'
  ]
  
  const missingVars = []
  
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missingVars.push(varName)
    }
  }
  
  if (missingVars.length > 0) {
    logError(`Variables de entorno faltantes: ${missingVars.join(', ')}`)
    return false
  }
  
  logSuccess('Todas las variables de entorno están configuradas')
  return true
}

// Verificar conexión a Supabase
async function checkSupabaseConnection() {
  logInfo('Verificando conexión a Supabase...')
  
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      logError('Configuración de Supabase faltante')
      return false
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Test básico de conexión
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1)
    
    if (error && !error.message.includes('JSON object requested')) {
      logError(`Error de conexión a Supabase: ${error.message}`)
      return false
    }
    
    logSuccess('Conexión a Supabase exitosa')
    return true
  } catch (error) {
    logError(`Error verificando Supabase: ${error.message}`)
    return false
  }
}

// Verificar conexión a base de datos con Prisma
async function checkPrismaConnection() {
  logInfo('Verificando conexión a base de datos con Prisma...')
  
  try {
    await prisma.$connect()
    
    // Verificar que las tablas existen
    const userCount = await prisma.user.count()
    const exerciseCount = await prisma.exercise.count()
    
    logSuccess(`Base de datos conectada - ${userCount} usuarios, ${exerciseCount} ejercicios`)
    return true
  } catch (error) {
    logError(`Error de conexión a base de datos: ${error.message}`)
    return false
  }
}

// Verificar servidor local
async function checkLocalServer() {
  logInfo('Verificando servidor local...')
  
  return new Promise((resolve) => {
    const req = http.get('http://localhost:3000', (res) => {
      if (res.statusCode === 200) {
        logSuccess('Servidor local funcionando correctamente')
        resolve(true)
      } else {
        logError(`Servidor local respondió con código: ${res.statusCode}`)
        resolve(false)
      }
    })
    
    req.on('error', (error) => {
      logError(`Error conectando al servidor local: ${error.message}`)
      resolve(false)
    })
    
    req.setTimeout(5000, () => {
      logError('Timeout conectando al servidor local')
      resolve(false)
    })
  })
}

// Verificar endpoint de salud
async function checkHealthEndpoint() {
  logInfo('Verificando endpoint de salud...')
  
  return new Promise((resolve) => {
    const req = http.get('http://localhost:3000/api/health', (res) => {
      let data = ''
      
      res.on('data', (chunk) => {
        data += chunk
      })
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data)
          if (response.status === 'healthy') {
            logSuccess('Endpoint de salud funcionando correctamente')
            resolve(true)
          } else {
            logError(`Endpoint de salud reporta: ${response.status}`)
            resolve(false)
          }
        } catch (error) {
          logError(`Error parseando respuesta de salud: ${error.message}`)
          resolve(false)
        }
      })
    })
    
    req.on('error', (error) => {
      logError(`Error verificando endpoint de salud: ${error.message}`)
      resolve(false)
    })
    
    req.setTimeout(5000, () => {
      logError('Timeout verificando endpoint de salud')
      resolve(false)
    })
  })
}

// Verificar autenticación
async function checkAuthentication() {
  logInfo('Verificando configuración de autenticación...')
  
  try {
    // Verificar que existe al menos un usuario demo
    const demoUser = await prisma.user.findUnique({
      where: { email: 'demo@kairos.com' }
    })
    
    if (!demoUser) {
      logWarning('Usuario demo no encontrado')
      return false
    }
    
    logSuccess('Configuración de autenticación verificada')
    return true
  } catch (error) {
    logError(`Error verificando autenticación: ${error.message}`)
    return false
  }
}

// Función principal
async function main() {
  log('\n🔍 VERIFICACIÓN DE INTEGRACIÓN COMPLETA', 'bold')
  log('==========================================\n', 'blue')
  
  const checks = [
    { name: 'Variables de entorno', fn: checkEnvironmentVariables },
    { name: 'Conexión Supabase', fn: checkSupabaseConnection },
    { name: 'Conexión Prisma', fn: checkPrismaConnection },
    { name: 'Servidor local', fn: checkLocalServer },
    { name: 'Endpoint de salud', fn: checkHealthEndpoint },
    { name: 'Autenticación', fn: checkAuthentication }
  ]
  
  const results = []
  
  for (const check of checks) {
    try {
      const result = await check.fn()
      results.push({ name: check.name, success: result })
    } catch (error) {
      logError(`Error en ${check.name}: ${error.message}`)
      results.push({ name: check.name, success: false })
    }
  }
  
  // Resumen final
  log('\n📊 RESUMEN DE VERIFICACIÓN', 'bold')
  log('==========================\n', 'blue')
  
  const successful = results.filter(r => r.success).length
  const total = results.length
  
  results.forEach(result => {
    if (result.success) {
      logSuccess(result.name)
    } else {
      logError(result.name)
    }
  })
  
  log(`\n✨ Resultado: ${successful}/${total} verificaciones exitosas`, 'bold')
  
  if (successful === total) {
    log('\n🎉 ¡INTEGRACIÓN COMPLETA EXITOSA!', 'green')
    log('La aplicación está lista para usar con:', 'green')
    log('• Supabase conectado y funcionando', 'green')
    log('• Base de datos sincronizada', 'green')
    log('• Servidor de desarrollo activo', 'green')
    log('• Endpoints de API funcionando', 'green')
    log('• Autenticación configurada', 'green')
    log('\n🔗 Accede a: http://localhost:3000', 'blue')
    log('👤 Usuario demo: demo@kairos.com / demo123', 'blue')
  } else {
    log('\n⚠️  INTEGRACIÓN INCOMPLETA', 'yellow')
    log('Revisa los errores anteriores y corrige los problemas.', 'yellow')
    process.exit(1)
  }
}

// Ejecutar verificación
main()
  .catch((error) => {
    logError(`Error general: ${error.message}`)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })