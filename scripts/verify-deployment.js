#!/usr/bin/env node

/**
 * Script de verificación post-despliegue
 * Valida que el despliegue en Vercel funcione correctamente
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

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

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: options.timeout || 10000
    };
    
    const req = client.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data,
          responseTime: Date.now() - startTime
        });
      });
    });
    
    const startTime = Date.now();
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (options.data) {
      req.write(options.data);
    }
    
    req.end();
  });
}

async function checkEndpoint(name, url, expectedStatus = 200, options = {}) {
  try {
    log(`🔍 Verificando ${name}...`, 'cyan');
    const response = await makeRequest(url, options);
    
    if (response.statusCode === expectedStatus) {
      log(`✅ ${name}: OK (${response.responseTime}ms)`, 'green');
      return { success: true, responseTime: response.responseTime, data: response.data };
    } else {
      log(`❌ ${name}: Error ${response.statusCode} (esperado ${expectedStatus})`, 'red');
      return { success: false, statusCode: response.statusCode };
    }
  } catch (error) {
    log(`❌ ${name}: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function checkHealthEndpoint(baseUrl) {
  const result = await checkEndpoint('Health Check', `${baseUrl}/api/health`);
  
  if (result.success && result.data) {
    try {
      const healthData = JSON.parse(result.data);
      if (healthData.status === 'healthy') {
        log('  📊 Estado: Saludable', 'green');
        if (healthData.database) {
          log(`  🗄️  Base de datos: ${healthData.database.status}`, 'green');
        }
        if (healthData.responseTime) {
          log(`  ⏱️  Tiempo de respuesta: ${healthData.responseTime}ms`, 'blue');
        }
      } else {
        log('  ⚠️  Estado: No saludable', 'yellow');
      }
    } catch (e) {
      log('  ⚠️  Respuesta de salud no válida', 'yellow');
    }
  }
  
  return result;
}

async function checkSecurityHeaders(baseUrl) {
  log('🔒 Verificando headers de seguridad...', 'cyan');
  
  try {
    const response = await makeRequest(baseUrl);
    const headers = response.headers;
    
    const securityHeaders = {
      'x-content-type-options': 'nosniff',
      'x-frame-options': 'DENY',
      'x-xss-protection': '1; mode=block',
      'strict-transport-security': true, // Solo verificar que existe
      'referrer-policy': 'strict-origin-when-cross-origin'
    };
    
    let allPresent = true;
    
    for (const [header, expectedValue] of Object.entries(securityHeaders)) {
      const actualValue = headers[header];
      
      if (!actualValue) {
        log(`  ❌ Falta header: ${header}`, 'red');
        allPresent = false;
      } else if (expectedValue !== true && actualValue !== expectedValue) {
        log(`  ⚠️  Header incorrecto: ${header} = ${actualValue} (esperado: ${expectedValue})`, 'yellow');
      } else {
        log(`  ✅ ${header}: OK`, 'green');
      }
    }
    
    return allPresent;
  } catch (error) {
    log(`❌ Error verificando headers: ${error.message}`, 'red');
    return false;
  }
}

async function checkRedirects(baseUrl) {
  log('🔄 Verificando redirects...', 'cyan');
  
  const redirects = [
    { from: '/home', to: '/', status: 301 },
    { from: '/app', to: '/dashboard', status: 302 },
    { from: '/login', to: '/auth/signin', status: 302 }
  ];
  
  let allWorking = true;
  
  for (const redirect of redirects) {
    try {
      const response = await makeRequest(`${baseUrl}${redirect.from}`, {
        method: 'GET',
        timeout: 5000
      });
      
      if (response.statusCode === redirect.status) {
        const location = response.headers.location;
        if (location && (location === redirect.to || location.endsWith(redirect.to))) {
          log(`  ✅ ${redirect.from} → ${redirect.to}`, 'green');
        } else {
          log(`  ⚠️  ${redirect.from}: redirige a ${location} (esperado: ${redirect.to})`, 'yellow');
        }
      } else {
        log(`  ❌ ${redirect.from}: status ${response.statusCode} (esperado: ${redirect.status})`, 'red');
        allWorking = false;
      }
    } catch (error) {
      log(`  ❌ ${redirect.from}: ${error.message}`, 'red');
      allWorking = false;
    }
  }
  
  return allWorking;
}

async function checkAPIEndpoints(baseUrl) {
  log('🔌 Verificando endpoints de API...', 'cyan');
  
  const endpoints = [
    { path: '/api/health', status: 200 },
    { path: '/api/auth/session', status: 200 }, // Puede devolver null pero debe responder
    { path: '/healthz', status: 200 }, // Rewrite a /api/health
  ];
  
  let allWorking = true;
  
  for (const endpoint of endpoints) {
    const result = await checkEndpoint(
      `API ${endpoint.path}`,
      `${baseUrl}${endpoint.path}`,
      endpoint.status
    );
    
    if (!result.success) {
      allWorking = false;
    }
  }
  
  return allWorking;
}

async function checkPerformance(baseUrl) {
  log('⚡ Verificando rendimiento...', 'cyan');
  
  const startTime = Date.now();
  const result = await checkEndpoint('Página principal', baseUrl);
  const loadTime = Date.now() - startTime;
  
  if (result.success) {
    if (loadTime < 1000) {
      log(`  ✅ Tiempo de carga: ${loadTime}ms (Excelente)`, 'green');
    } else if (loadTime < 3000) {
      log(`  ⚠️  Tiempo de carga: ${loadTime}ms (Aceptable)`, 'yellow');
    } else {
      log(`  ❌ Tiempo de carga: ${loadTime}ms (Lento)`, 'red');
    }
  }
  
  return result.success && loadTime < 5000;
}

async function checkSSL(baseUrl) {
  if (!baseUrl.startsWith('https://')) {
    log('⚠️  No se está usando HTTPS', 'yellow');
    return false;
  }
  
  log('🔐 Verificando certificado SSL...', 'cyan');
  
  try {
    const response = await makeRequest(baseUrl);
    log('  ✅ Certificado SSL válido', 'green');
    return true;
  } catch (error) {
    if (error.message.includes('certificate')) {
      log(`  ❌ Error de certificado SSL: ${error.message}`, 'red');
      return false;
    }
    // Otros errores no relacionados con SSL
    return true;
  }
}

function generateReport(results) {
  log('\n📊 REPORTE DE VERIFICACIÓN', 'bright');
  log('============================', 'bright');
  
  const totalChecks = Object.keys(results).length;
  const passedChecks = Object.values(results).filter(r => r).length;
  const score = Math.round((passedChecks / totalChecks) * 100);
  
  log(`\n📈 Puntuación general: ${score}% (${passedChecks}/${totalChecks})`, 
      score >= 90 ? 'green' : score >= 70 ? 'yellow' : 'red');
  
  log('\n📋 Resultados detallados:', 'cyan');
  for (const [check, passed] of Object.entries(results)) {
    const icon = passed ? '✅' : '❌';
    const color = passed ? 'green' : 'red';
    log(`  ${icon} ${check}`, color);
  }
  
  if (score >= 90) {
    log('\n🎉 ¡Excelente! El despliegue está funcionando perfectamente.', 'green');
  } else if (score >= 70) {
    log('\n⚠️  El despliegue funciona pero hay algunas mejoras pendientes.', 'yellow');
  } else {
    log('\n❌ Hay problemas críticos que necesitan atención inmediata.', 'red');
  }
  
  return score;
}

async function main() {
  const baseUrl = process.argv[2];
  
  if (!baseUrl) {
    log('❌ Uso: node verify-deployment.js <URL>', 'red');
    log('Ejemplo: node verify-deployment.js https://kairos-fitness.vercel.app', 'blue');
    process.exit(1);
  }
  
  log('🚀 Verificador de Despliegue - Kairos Fitness', 'bright');
  log('==============================================', 'bright');
  log(`🌐 URL: ${baseUrl}\n`, 'blue');
  
  const results = {};
  
  try {
    // Verificaciones principales
    results['Conectividad básica'] = (await checkEndpoint('Conectividad', baseUrl)).success;
    results['Health Check'] = (await checkHealthEndpoint(baseUrl)).success;
    results['Headers de seguridad'] = await checkSecurityHeaders(baseUrl);
    results['Redirects'] = await checkRedirects(baseUrl);
    results['Endpoints de API'] = await checkAPIEndpoints(baseUrl);
    results['Rendimiento'] = await checkPerformance(baseUrl);
    results['SSL/HTTPS'] = await checkSSL(baseUrl);
    
    // Generar reporte final
    const score = generateReport(results);
    
    // Exit code basado en el score
    process.exit(score >= 70 ? 0 : 1);
    
  } catch (error) {
    log(`\n❌ Error durante la verificación: ${error.message}`, 'red');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  checkEndpoint,
  checkHealthEndpoint,
  checkSecurityHeaders,
  checkRedirects,
  checkAPIEndpoints,
  checkPerformance,
  checkSSL
};