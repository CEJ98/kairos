require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')
const { hash } = require('bcryptjs')

const prisma = new PrismaClient()

async function setupDemoUser() {
  try {
    console.log('🔍 Verificando usuario demo...')
    
    // Verificar si el usuario demo ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email: 'demo@kairos.com' }
    })
    
    if (existingUser) {
      console.log('✅ Usuario demo ya existe:', existingUser.email)
      return existingUser
    }
    
    console.log('🔨 Creando usuario demo...')
    
    // Hash de la contraseña demo123
    const hashedPassword = await hash('demo123', 12)
    
    // Crear usuario demo
    const demoUser = await prisma.user.create({
      data: {
        email: 'demo@kairos.com',
        name: 'Usuario Demo',
        password: hashedPassword,
        role: 'CLIENT',
        isVerified: true
      }
    })
    
    console.log('✅ Usuario demo creado exitosamente:', demoUser.email)
    
    // Crear perfil de cliente para el usuario demo
    const clientProfile = await prisma.clientProfile.create({
      data: {
        userId: demoUser.id,
        age: 30,
        weight: 70.0,
        height: 175.0,
        gender: 'MALE',
        fitnessGoal: 'MUSCLE_GAIN',
        activityLevel: 'MODERATE'
      }
    })
    
    console.log('✅ Perfil de cliente creado para el usuario demo')
    
    return demoUser
    
  } catch (error) {
    console.error('❌ Error configurando usuario demo:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

setupDemoUser()
  .then(() => {
    console.log('🎉 Configuración completada')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Error en la configuración:', error)
    process.exit(1)
  })