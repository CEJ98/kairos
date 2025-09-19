require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')
const { hash } = require('bcryptjs')

const prisma = new PrismaClient()

async function fixDemoPassword() {
  try {
    console.log('🔧 Actualizando contraseña del usuario demo...')
    
    // Hash de la contraseña demo1234
    const hashedPassword = await hash('demo1234', 12)
    
    // Actualizar contraseña del usuario demo
    const updatedUser = await prisma.user.update({
      where: { email: 'demo@kairos.com' },
      data: { password: hashedPassword }
    })
    
    console.log('✅ Contraseña actualizada para:', updatedUser.email)
    
    // Verificar que la contraseña funciona
    const { compare } = require('bcryptjs')
    const isValid = await compare('demo1234', updatedUser.password)
    console.log('🔐 Verificación de contraseña:', isValid ? '✅ Válida' : '❌ Inválida')
    
  } catch (error) {
    console.error('❌ Error actualizando contraseña:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

fixDemoPassword()
  .then(() => {
    console.log('🎉 Contraseña actualizada exitosamente')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Error:', error)
    process.exit(1)
  })