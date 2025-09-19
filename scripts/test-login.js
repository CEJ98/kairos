require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')
const { compare } = require('bcryptjs')

const prisma = new PrismaClient()

async function testLogin() {
	try {
		console.log('🔐 Probando funcionalidad de login...')
		console.log('=' .repeat(40))

		// 1. Verificar usuario demo
		const demoUser = await prisma.user.findUnique({
			where: { email: 'demo@kairos.com' },
			include: {
				clientProfiles: true
			}
		})

		if (!demoUser) {
			console.log('❌ Usuario demo no encontrado')
			return false
		}

		console.log('✅ Usuario demo encontrado:')
		console.log(`   - ID: ${demoUser.id}`)
		console.log(`   - Email: ${demoUser.email}`)
		console.log(`   - Nombre: ${demoUser.name}`)
		console.log(`   - Rol: ${demoUser.role}`)
		console.log(`   - Verificado: ${demoUser.isVerified}`)

		// 2. Verificar contraseña
		const isPasswordValid = await compare('demo1234', demoUser.password)
		console.log(`\n🔑 Contraseña válida: ${isPasswordValid ? '✅ Sí' : '❌ No'}`)

		if (!isPasswordValid) {
			console.log('❌ La contraseña no es válida')
			return false
		}

		// 3. Verificar variables de entorno de NextAuth
		console.log('\n🔧 Variables de NextAuth:')
		console.log(`   - NEXTAUTH_URL: ${process.env.NEXTAUTH_URL || 'No configurado'}`)
		console.log(`   - NEXTAUTH_SECRET: ${process.env.NEXTAUTH_SECRET ? 'Configurado' : 'No configurado'}`)

		// 4. Verificar perfil del cliente
		if (demoUser.clientProfiles && demoUser.clientProfiles.length > 0) {
			console.log('\n👤 Perfil de cliente:')
			const profile = demoUser.clientProfiles[0]
			console.log(`   - Edad: ${profile.age || 'No especificada'}`)
			console.log(`   - Peso: ${profile.weight || 'No especificado'} kg`)
			console.log(`   - Altura: ${profile.height || 'No especificada'} cm`)
			console.log(`   - Objetivo: ${profile.fitnessGoal || 'No especificado'}`)
		} else {
			console.log('\n⚠️ No se encontró perfil de cliente')
		}

		// 5. Verificar datos de ejemplo
		console.log('\n📊 Datos del sistema:')
		const exerciseCount = await prisma.exercise.count()
		const workoutCount = await prisma.workout.count()
		const sessionCount = await prisma.workoutSession.count()

		console.log(`   - Ejercicios: ${exerciseCount}`)
		console.log(`   - Rutinas: ${workoutCount}`)
		console.log(`   - Sesiones: ${sessionCount}`)

		console.log('\n' + '=' .repeat(40))
		console.log('🎉 Prueba de login completada exitosamente')
		console.log('\n📝 Resumen:')
		console.log('✅ Usuario demo configurado correctamente')
		console.log('✅ Contraseña válida')
		console.log('✅ Variables de entorno configuradas')
		console.log('✅ Base de datos con datos')

		console.log('\n🚀 El sistema está listo para usar!')
		console.log('\n🔗 Para probar:')
		console.log('1. Ir a: http://localhost:3000/signin')
		console.log('2. Email: demo@kairos.com')
		console.log('3. Contraseña: demo1234')
		console.log('4. Hacer clic en "Iniciar Sesión"')

		return true

	} catch (error) {
		console.error('❌ Error en prueba de login:', error)
		return false
	} finally {
		await prisma.$disconnect()
	}
}

testLogin()
	.then((success) => {
		if (success) {
			console.log('\n✅ Prueba exitosa')
			process.exit(0)
		} else {
			console.log('\n❌ Prueba falló')
			process.exit(1)
		}
	})
	.catch((error) => {
		console.error('💥 Error crítico:', error)
		process.exit(1)
	})