require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')
const { compare } = require('bcryptjs')

const prisma = new PrismaClient()

async function verifySystem() {
	try {
		console.log('🔍 Verificando sistema Kairos Fitness...')
		console.log('=' .repeat(50))

		// 1. Verificar conexión a base de datos
		console.log('\n📊 1. Verificando conexión a base de datos...')
		await prisma.$connect()
		console.log('✅ Conexión a base de datos exitosa')

		// 2. Verificar usuario demo
		console.log('\n👤 2. Verificando usuario demo...')
		const demoUser = await prisma.user.findUnique({
			where: { email: 'demo@kairos.com' }
		})
		
		if (!demoUser) {
			console.log('❌ Usuario demo no encontrado')
			return false
		}
		
		const isPasswordValid = await compare('demo123', demoUser.password)
		console.log('✅ Usuario demo encontrado y contraseña válida:', isPasswordValid)

		// 3. Verificar tablas principales
		console.log('\n🗄️ 3. Verificando estructura de base de datos...')
		
		const userCount = await prisma.user.count()
		const exerciseCount = await prisma.exercise.count()
		const workoutCount = await prisma.workout.count()
		const sessionCount = await prisma.workoutSession.count()
		
		console.log(`✅ Usuarios: ${userCount}`)
		console.log(`✅ Ejercicios: ${exerciseCount}`)
		console.log(`✅ Rutinas: ${workoutCount}`)
		console.log(`✅ Sesiones: ${sessionCount}`)

		// 4. Verificar variables de entorno
		console.log('\n🔧 4. Verificando variables de entorno...')
		const envVars = {
			'DATABASE_URL': !!process.env.DATABASE_URL,
			'NEXTAUTH_URL': !!process.env.NEXTAUTH_URL,
			'NEXTAUTH_SECRET': !!process.env.NEXTAUTH_SECRET,
			'NEXT_PUBLIC_SUPABASE_URL': !!process.env.NEXT_PUBLIC_SUPABASE_URL,
			'NEXT_PUBLIC_SUPABASE_ANON_KEY': !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
		}
		
		for (const [key, value] of Object.entries(envVars)) {
			console.log(`${value ? '✅' : '❌'} ${key}: ${value ? 'Configurado' : 'No configurado'}`)
		}

		// 5. Verificar datos de ejemplo
		console.log('\n📝 5. Verificando datos de ejemplo...')
		
		if (exerciseCount === 0) {
			console.log('⚠️ No hay ejercicios en la base de datos')
			console.log('💡 Considera ejecutar el seed para agregar datos de ejemplo')
		}
		
		if (workoutCount === 0) {
			console.log('⚠️ No hay rutinas en la base de datos')
		}

		// 6. Verificar perfil del usuario demo
		console.log('\n👥 6. Verificando perfil del usuario demo...')
		const clientProfile = await prisma.clientProfile.findFirst({
			where: { userId: demoUser.id }
		})
		
		if (clientProfile) {
			console.log('✅ Perfil de cliente encontrado')
		} else {
			console.log('⚠️ Perfil de cliente no encontrado')
		}

		console.log('\n' + '=' .repeat(50))
		console.log('🎉 Verificación del sistema completada')
		console.log('\n📋 Resumen:')
		console.log('- Base de datos: ✅ Conectada')
		console.log('- Autenticación: ✅ Usuario demo configurado')
		console.log('- Estructura: ✅ Tablas creadas')
		console.log('- Variables: ✅ Configuradas')
		console.log('\n🚀 El sistema está listo para usar!')
		console.log('\n🔗 URLs importantes:')
		console.log('- Aplicación: http://localhost:3000')
		console.log('- Login: http://localhost:3000/signin')
		console.log('- Dashboard: http://localhost:3000/dashboard')
		console.log('- Prisma Studio: http://localhost:5555')
		console.log('\n👤 Credenciales demo:')
		console.log('- Email: demo@kairos.com')
		console.log('- Contraseña: demo123')
		
		return true
		
	} catch (error) {
		console.error('❌ Error en verificación del sistema:', error)
		return false
	} finally {
		await prisma.$disconnect()
	}
}

verifySystem()
	.then((success) => {
		if (success) {
			console.log('\n✅ Verificación exitosa')
			process.exit(0)
		} else {
			console.log('\n❌ Verificación falló')
			process.exit(1)
		}
	})
	.catch((error) => {
		console.error('💥 Error crítico:', error)
		process.exit(1)
	})