require('dotenv').config({ path: '.env.local' })
const { exec } = require('child_process')

console.log('🔧 Ejecutando migración de Prisma...')
console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ Configurado' : '❌ No configurado')

exec('npx prisma migrate dev', (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Error en migración:', error)
    process.exit(1)
  }
  
  if (stderr) {
    console.error('⚠️ Advertencias:', stderr)
  }
  
  console.log('✅ Salida de migración:')
  console.log(stdout)
  
  console.log('🎉 Migración completada')
})