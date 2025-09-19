require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')
const { compare } = require('bcryptjs')

const prisma = new PrismaClient()

async function testAuth() {
  try {
    console.log('🔍 Probando autenticación...')
    
    // Buscar usuario demo
    const user = await prisma.user.findUnique({
      where: { email: 'demo@kairos.com' }
    })
    
    if (!user) {
      console.log('❌ Usuario demo no encontrado')
      return
    }
    
    console.log('✅ Usuario encontrado:', {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isVerified: user.isVerified,
      hasPassword: !!user.password
    })
    
    // Probar contraseña
    if (user.password) {
      const isPasswordValid = await compare('demo1234', user.password)
      console.log('🔐 Contraseña válida:', isPasswordValid)
    } else {
      console.log('❌ Usuario no tiene contraseña configurada')
    }
    
    // Verificar variables de entorno de NextAuth
    console.log('\n🔧 Variables de entorno:')
    console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL)
    console.log('NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? '✅ Configurado' : '❌ No configurado')
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ Configurado' : '❌ No configurado')
    
  } catch (error) {
    console.error('❌ Error en prueba de autenticación:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testAuth()
  .then(() => {
    console.log('\n🎉 Prueba completada')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Error:', error)
    process.exit(1)
  })