#!/usr/bin/env node

/**
 * Script para configurar webhooks de Stripe en producción
 * Automatiza la creación y configuración de webhooks
 */

const Stripe = require('stripe')
const readline = require('readline')

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

async function main() {
	console.log('🔧 Configurador de Webhooks de Stripe para Producción\n')

	// Verificar variables de entorno
	const stripeSecretKey = process.env.STRIPE_SECRET_KEY
	const webhookUrl = process.env.NEXTAUTH_URL || await question('URL de producción (ej: https://tu-app.vercel.app): ')

	if (!stripeSecretKey) {
		console.log('❌ STRIPE_SECRET_KEY no encontrada en variables de entorno')
		console.log('   Configura esta variable antes de continuar')
		process.exit(1)
	}

	if (!webhookUrl.startsWith('https://')) {
		console.log('❌ La URL debe usar HTTPS para producción')
		process.exit(1)
	}

	const stripe = new Stripe(stripeSecretKey, {
		apiVersion: '2023-10-16'
	})

	try {
		console.log('🔍 Verificando webhooks existentes...')
		
		// Listar webhooks existentes
		const existingWebhooks = await stripe.webhookEndpoints.list({
			limit: 10
		})

		const webhookEndpointUrl = `${webhookUrl}/api/stripe/webhooks`
		const existingWebhook = existingWebhooks.data.find(wh => wh.url === webhookEndpointUrl)

		if (existingWebhook) {
			console.log(`✅ Webhook existente encontrado: ${existingWebhook.id}`)
			console.log(`   URL: ${existingWebhook.url}`)
			console.log(`   Estado: ${existingWebhook.status}`)
			console.log(`   Eventos configurados: ${existingWebhook.enabled_events.length}`)

			// Verificar eventos
			const missingEvents = REQUIRED_EVENTS.filter(event => 
				!existingWebhook.enabled_events.includes(event)
			)

			if (missingEvents.length > 0) {
				console.log('\n⚠️  Eventos faltantes:')
				missingEvents.forEach(event => console.log(`   - ${event}`))
				
				const updateWebhook = await question('\n¿Actualizar webhook con eventos faltantes? (y/n): ')
				if (updateWebhook.toLowerCase() === 'y') {
					await stripe.webhookEndpoints.update(existingWebhook.id, {
						enabled_events: REQUIRED_EVENTS
					})
					console.log('✅ Webhook actualizado con todos los eventos requeridos')
				}
			} else {
				console.log('✅ Todos los eventos requeridos están configurados')
			}

			console.log(`\n🔑 Webhook Secret: ${existingWebhook.secret}`)
			console.log('\n📋 Configura esta variable de entorno en tu plataforma de deploy:')
			console.log(`STRIPE_WEBHOOK_SECRET=${existingWebhook.secret}`)
		} else {
			console.log('🆕 Creando nuevo webhook...')
			
			const newWebhook = await stripe.webhookEndpoints.create({
				url: webhookEndpointUrl,
				enabled_events: REQUIRED_EVENTS,
				description: 'Kairos Fitness - Production Webhook'
			})

			console.log('✅ Webhook creado exitosamente!')
			console.log(`   ID: ${newWebhook.id}`)
			console.log(`   URL: ${newWebhook.url}`)
			console.log(`   Eventos: ${newWebhook.enabled_events.length}`)

			console.log(`\n🔑 Webhook Secret: ${newWebhook.secret}`)
			console.log('\n📋 Configura esta variable de entorno en tu plataforma de deploy:')
			console.log(`STRIPE_WEBHOOK_SECRET=${newWebhook.secret}`)
		}

		// Mostrar resumen
		console.log('\n📊 Resumen de configuración:')
		console.log(`   Webhook URL: ${webhookEndpointUrl}`)
		console.log(`   Eventos configurados: ${REQUIRED_EVENTS.length}`)
		console.log(`   Entorno: ${stripeSecretKey.startsWith('sk_live_') ? 'PRODUCCIÓN' : 'DESARROLLO'}`)

		console.log('\n🎯 Próximos pasos:')
		console.log('   1. Copia el STRIPE_WEBHOOK_SECRET mostrado arriba')
		console.log('   2. Configúralo en tu plataforma de deploy (Vercel, Railway, etc.)')
		console.log('   3. Redeploya tu aplicación')
		console.log('   4. Prueba un pago para verificar que funciona')

		console.log('\n✅ Configuración de webhooks completada!')

	} catch (error) {
		console.error('❌ Error configurando webhooks:', error.message)
		if (error.code) {
			console.error(`   Código de error: ${error.code}`)
		}
		process.exit(1)
	} finally {
		rl.close()
	}
}

// Ejecutar script
if (require.main === module) {
	main().catch(console.error)
}

module.exports = { main }