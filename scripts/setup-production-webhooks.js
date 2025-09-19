#!/usr/bin/env node

/**
 * Script mejorado para configurar webhooks de Stripe en producción
 * Incluye validaciones, configuración automática y verificación completa
 */

const Stripe = require('stripe')
const readline = require('readline')
const https = require('https')
const { URL } = require('url')

// Configuración
const REQUIRED_EVENTS = [
	'customer.subscription.created',
	'customer.subscription.updated',
	'customer.subscription.deleted',
	'invoice.payment_succeeded',
	'invoice.payment_failed',
	'checkout.session.completed',
	'customer.subscription.trial_will_end',
	'customer.created',
	'customer.updated'
]

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
})

function question(prompt) {
	return new Promise((resolve) => {
		rl.question(prompt, resolve)
	})
}

// Función para validar URL
function isValidUrl(string) {
	try {
		const url = new URL(string)
		return url.protocol === 'https:'
	} catch (_) {
		return false
	}
}

// Función para probar conectividad del endpoint
function testWebhookEndpoint(url) {
	return new Promise((resolve) => {
		const testUrl = new URL(url)
		
		const options = {
			hostname: testUrl.hostname,
			port: testUrl.port || 443,
			path: testUrl.pathname,
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'User-Agent': 'Kairos-Webhook-Setup/1.0'
			},
			timeout: 10000
		}

		const req = https.request(options, (res) => {
			// Cualquier respuesta (incluso 400) indica que el endpoint existe
			resolve({ success: true, status: res.statusCode })
		})

		req.on('error', (err) => {
			resolve({ success: false, error: err.message })
		})

		req.on('timeout', () => {
			resolve({ success: false, error: 'Timeout' })
		})

		req.write(JSON.stringify({ test: true }))
		req.end()
	})
}

// Función para mostrar resumen de configuración
function showConfigSummary(webhook, environment) {
	console.log('\n' + '='.repeat(60))
	console.log('🎉 CONFIGURACIÓN COMPLETADA')
	console.log('='.repeat(60))
	console.log(`\n📍 Webhook ID: ${webhook.id}`)
	console.log(`🌐 URL: ${webhook.url}`)
	console.log(`📊 Eventos: ${webhook.enabled_events.length}/${REQUIRED_EVENTS.length}`)
	console.log(`🔒 Estado: ${webhook.status}`)
	console.log(`🏷️  Entorno: ${environment}`)
	
	console.log('\n🔑 SECRETO DEL WEBHOOK:')
	console.log('─'.repeat(40))
	console.log(`STRIPE_WEBHOOK_SECRET=${webhook.secret}`)
	console.log('─'.repeat(40))
	
	console.log('\n📋 PRÓXIMOS PASOS:')
	console.log('1. 📋 Copia el STRIPE_WEBHOOK_SECRET mostrado arriba')
	console.log('2. ⚙️  Agrégalo a las variables de entorno de tu plataforma de deploy')
	console.log('3. 🚀 Redeploya tu aplicación')
	console.log('4. ✅ Prueba con una transacción real')
	
	console.log('\n🔗 ENLACES ÚTILES:')
	console.log(`• Dashboard de Stripe: https://dashboard.stripe.com/webhooks/${webhook.id}`)
	console.log('• Documentación: https://stripe.com/docs/webhooks')
	console.log('• Guía completa: docs/STRIPE_WEBHOOKS_PRODUCTION.md')
}

async function main() {
	console.log('🚀 Configurador de Webhooks de Stripe para Producción v2.0\n')
	
	// Paso 1: Validar variables de entorno
	console.log('📋 Paso 1: Validando configuración...')
	
	let stripeSecretKey = process.env.STRIPE_SECRET_KEY
	let productionUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL
	
	if (!stripeSecretKey) {
		console.log('⚠️  STRIPE_SECRET_KEY no encontrada en variables de entorno')
		stripeSecretKey = await question('Ingresa tu Stripe Secret Key (sk_live_...): ')
		
		if (!stripeSecretKey.startsWith('sk_live_') && !stripeSecretKey.startsWith('sk_test_')) {
			console.log('❌ Clave de Stripe inválida')
			process.exit(1)
		}
	}
	
	if (!productionUrl) {
		productionUrl = await question('Ingresa la URL de producción (https://tu-dominio.com): ')
	}
	
	if (!isValidUrl(productionUrl)) {
		console.log('❌ URL inválida. Debe usar HTTPS para producción')
		process.exit(1)
	}
	
	const environment = stripeSecretKey.startsWith('sk_live_') ? '🔴 PRODUCCIÓN' : '🟡 DESARROLLO'
	console.log(`✅ Configuración válida - Entorno: ${environment}\n`)
	
	// Paso 2: Probar conectividad del endpoint
	console.log('🔍 Paso 2: Probando conectividad del endpoint...')
	const webhookEndpointUrl = `${productionUrl}/api/stripe/webhooks`
	
	const connectivity = await testWebhookEndpoint(webhookEndpointUrl)
	if (connectivity.success) {
		console.log(`✅ Endpoint accesible (Status: ${connectivity.status})`)
	} else {
		console.log(`⚠️  Advertencia: No se pudo conectar al endpoint`)
		console.log(`   Error: ${connectivity.error}`)
		console.log('   Continuando de todas formas...')
	}
	
	// Paso 3: Configurar Stripe
	console.log('\n⚙️  Paso 3: Configurando Stripe...')
	const stripe = new Stripe(stripeSecretKey, {
		apiVersion: '2023-10-16'
	})
	
	try {
		// Verificar que la clave funcione
		await stripe.accounts.retrieve()
		console.log('✅ Conexión con Stripe establecida')
	} catch (error) {
		console.log('❌ Error conectando con Stripe:', error.message)
		process.exit(1)
	}
	
	// Paso 4: Gestionar webhooks
	console.log('\n🔧 Paso 4: Gestionando webhooks...')
	
	try {
		// Listar webhooks existentes
		const existingWebhooks = await stripe.webhookEndpoints.list({ limit: 10 })
		const existingWebhook = existingWebhooks.data.find(wh => wh.url === webhookEndpointUrl)
		
		let finalWebhook
		
		if (existingWebhook) {
			console.log(`🔍 Webhook existente encontrado: ${existingWebhook.id}`)
			console.log(`   Estado: ${existingWebhook.status}`)
			console.log(`   Eventos: ${existingWebhook.enabled_events.length}/${REQUIRED_EVENTS.length}`)
			
			// Verificar eventos faltantes
			const missingEvents = REQUIRED_EVENTS.filter(event => 
				!existingWebhook.enabled_events.includes(event)
			)
			
			if (missingEvents.length > 0) {
				console.log('\n⚠️  Eventos faltantes:')
				missingEvents.forEach(event => console.log(`   - ${event}`))
				
				const shouldUpdate = await question('\n¿Actualizar webhook con eventos faltantes? (y/N): ')
				if (shouldUpdate.toLowerCase() === 'y') {
					finalWebhook = await stripe.webhookEndpoints.update(existingWebhook.id, {
						enabled_events: REQUIRED_EVENTS
					})
					console.log('✅ Webhook actualizado exitosamente')
				} else {
					finalWebhook = existingWebhook
				}
			} else {
				console.log('✅ Todos los eventos requeridos están configurados')
				finalWebhook = existingWebhook
			}
		} else {
			console.log('🆕 Creando nuevo webhook...')
			
			finalWebhook = await stripe.webhookEndpoints.create({
				url: webhookEndpointUrl,
				enabled_events: REQUIRED_EVENTS,
				description: `Kairos Fitness - ${environment} Webhook`
			})
			
			console.log('✅ Webhook creado exitosamente!')
		}
		
		// Mostrar resumen final
		showConfigSummary(finalWebhook, environment)
		
	} catch (error) {
		console.error('❌ Error configurando webhooks:', error.message)
		if (error.code) {
			console.error(`   Código: ${error.code}`)
		}
		if (error.doc_url) {
			console.error(`   Documentación: ${error.doc_url}`)
		}
		process.exit(1)
	} finally {
		rl.close()
	}
}

// Manejo de errores globales
process.on('unhandledRejection', (reason, promise) => {
	console.error('❌ Error no manejado:', reason)
	process.exit(1)
})

process.on('SIGINT', () => {
	console.log('\n\n👋 Configuración cancelada por el usuario')
	rl.close()
	process.exit(0)
})

// Ejecutar script
if (require.main === module) {
	main().catch(console.error)
}

module.exports = { main }