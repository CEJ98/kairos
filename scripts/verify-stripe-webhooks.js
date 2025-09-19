#!/usr/bin/env node

/**
 * Script para verificar el estado de webhooks de Stripe
 * Comprueba configuración y conectividad
 */

const Stripe = require('stripe')
const https = require('https')
const http = require('http')

// Eventos requeridos
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

function makeRequest(url) {
	return new Promise((resolve, reject) => {
		const client = url.startsWith('https:') ? https : http
		
		const req = client.get(url, (res) => {
			let data = ''
			res.on('data', chunk => data += chunk)
			res.on('end', () => {
				resolve({
					statusCode: res.statusCode,
					headers: res.headers,
					body: data
				})
			})
		})
		
		req.on('error', reject)
		req.setTimeout(10000, () => {
			req.destroy()
			reject(new Error('Request timeout'))
		})
	})
}

async function verifyWebhookEndpoint(url) {
	console.log(`🔍 Verificando endpoint: ${url}`)
	
	try {
		// Hacer una petición GET al endpoint (debería devolver 405 Method Not Allowed)
		const response = await makeRequest(url)
		
		if (response.statusCode === 405) {
			console.log('✅ Endpoint accesible (405 Method Not Allowed es esperado)')
			return true
		} else if (response.statusCode === 200) {
			console.log('⚠️  Endpoint responde 200 (puede estar mal configurado)')
			return true
		} else {
			console.log(`❌ Endpoint no accesible (${response.statusCode})`)
			return false
		}
	} catch (error) {
		console.log(`❌ Error accediendo al endpoint: ${error.message}`)
		return false
	}
}

async function main() {
	console.log('🔍 Verificador de Webhooks de Stripe\n')

	// Verificar variables de entorno
	const stripeSecretKey = process.env.STRIPE_SECRET_KEY
	const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
	const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL

	if (!stripeSecretKey) {
		console.log('❌ STRIPE_SECRET_KEY no encontrada')
		process.exit(1)
	}

	if (!webhookSecret) {
		console.log('⚠️  STRIPE_WEBHOOK_SECRET no encontrada')
	}

	if (!baseUrl) {
		console.log('⚠️  NEXTAUTH_URL o VERCEL_URL no encontrada')
	}

	const stripe = new Stripe(stripeSecretKey, {
		apiVersion: '2023-10-16'
	})

	try {
		console.log('📊 Estado de configuración:')
		console.log(`   Stripe Key: ${stripeSecretKey.startsWith('sk_live_') ? '🔴 PRODUCCIÓN' : '🟡 DESARROLLO'}`)
		console.log(`   Webhook Secret: ${webhookSecret ? '✅ Configurado' : '❌ Faltante'}`)
		console.log(`   Base URL: ${baseUrl || '❌ No configurada'}\n`)

		// Listar webhooks
		console.log('🔍 Verificando webhooks en Stripe...')
		const webhooks = await stripe.webhookEndpoints.list({ limit: 10 })

		if (webhooks.data.length === 0) {
			console.log('❌ No hay webhooks configurados en Stripe')
			console.log('   Ejecuta: node scripts/setup-stripe-webhooks.js')
			return
		}

		console.log(`✅ Encontrados ${webhooks.data.length} webhooks:\n`)

		for (const webhook of webhooks.data) {
			console.log(`📍 Webhook: ${webhook.id}`)
			console.log(`   URL: ${webhook.url}`)
			console.log(`   Estado: ${webhook.status === 'enabled' ? '✅ Habilitado' : '❌ Deshabilitado'}`)
			console.log(`   Eventos: ${webhook.enabled_events.length}/${REQUIRED_EVENTS.length}`)

			// Verificar eventos requeridos
			const missingEvents = REQUIRED_EVENTS.filter(event => 
				!webhook.enabled_events.includes(event)
			)

			if (missingEvents.length > 0) {
				console.log('   ⚠️  Eventos faltantes:')
				missingEvents.forEach(event => console.log(`      - ${event}`))
			} else {
				console.log('   ✅ Todos los eventos requeridos configurados')
			}

			// Verificar accesibilidad del endpoint
			if (webhook.url.includes('localhost') || webhook.url.includes('127.0.0.1')) {
				console.log('   ⚠️  URL local detectada (solo para desarrollo)')
			} else {
				const isAccessible = await verifyWebhookEndpoint(webhook.url)
				if (!isAccessible) {
					console.log('   ❌ Endpoint no accesible desde internet')
				}
			}

			console.log('') // Línea en blanco
		}

		// Verificar configuración de producción
		if (baseUrl) {
			const expectedUrl = `${baseUrl}/api/stripe/webhooks`
			const matchingWebhook = webhooks.data.find(wh => wh.url === expectedUrl)

			if (matchingWebhook) {
				console.log('✅ Webhook configurado para la URL actual')
				if (matchingWebhook.status === 'enabled') {
					console.log('✅ Webhook habilitado')
				} else {
					console.log('❌ Webhook deshabilitado')
				}
			} else {
				console.log(`⚠️  No hay webhook configurado para: ${expectedUrl}`)
				console.log('   Considera ejecutar: node scripts/setup-stripe-webhooks.js')
			}
		}

		// Resumen final
		console.log('\n📋 Resumen:')
		const activeWebhooks = webhooks.data.filter(wh => wh.status === 'enabled').length
		console.log(`   Webhooks activos: ${activeWebhooks}/${webhooks.data.length}`)
		
		const properlyConfigured = webhooks.data.filter(wh => {
			const hasAllEvents = REQUIRED_EVENTS.every(event => 
				wh.enabled_events.includes(event)
			)
			return wh.status === 'enabled' && hasAllEvents
		}).length

		console.log(`   Correctamente configurados: ${properlyConfigured}/${webhooks.data.length}`)

		if (properlyConfigured > 0) {
			console.log('\n🎉 ¡Webhooks configurados correctamente!')
		} else {
			console.log('\n⚠️  Algunos webhooks necesitan configuración adicional')
		}

	} catch (error) {
		console.error('❌ Error verificando webhooks:', error.message)
		if (error.code) {
			console.error(`   Código: ${error.code}`)
		}
		process.exit(1)
	}
}

// Ejecutar script
if (require.main === module) {
	main().catch(console.error)
}

module.exports = { main, verifyWebhookEndpoint }