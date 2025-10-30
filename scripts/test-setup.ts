/**
 * Script de prueba para verificar la configuración completa
 * Ejecutar con: tsx scripts/test-setup.ts
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

interface TestResult {
  name: string;
  success: boolean;
  message: string;
  duration?: number;
}

const results: TestResult[] = [];

function log(emoji: string, message: string) {
  console.log(`${emoji} ${message}`);
}

async function testDatabaseConnection() {
  const start = Date.now();
  try {
    await prisma.$connect();
    await prisma.user.count();
    const duration = Date.now() - start;

    results.push({
      name: 'Database Connection',
      success: true,
      message: 'Conectado exitosamente a la base de datos',
      duration
    });
    log('✅', `Conexión a DB exitosa (${duration}ms)`);
  } catch (error) {
    results.push({
      name: 'Database Connection',
      success: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
    log('❌', 'Error conectando a la base de datos');
    throw error;
  }
}

async function testUserModel() {
  const start = Date.now();
  try {
    // Verificar que el modelo User existe y tiene los campos correctos
    const userCount = await prisma.user.count();
    const duration = Date.now() - start;

    results.push({
      name: 'User Model',
      success: true,
      message: `Modelo User verificado. Usuarios en DB: ${userCount}`,
      duration
    });
    log('✅', `Modelo User OK - ${userCount} usuarios encontrados (${duration}ms)`);

    return userCount;
  } catch (error) {
    results.push({
      name: 'User Model',
      success: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
    log('❌', 'Error verificando modelo User');
    throw error;
  }
}

async function testDemoUser() {
  const start = Date.now();
  try {
    const demoUser = await prisma.user.findUnique({
      where: { email: 'demo@kairos.fit' },
      include: {
        profile: true,
        bodyMetrics: { take: 1, orderBy: { date: 'desc' } },
        plans: { take: 1, include: { workouts: { take: 1 } } }
      }
    });

    const duration = Date.now() - start;

    if (!demoUser) {
      results.push({
        name: 'Demo User',
        success: false,
        message: 'Usuario demo no encontrado. ¿Ejecutaste el seed?'
      });
      log('⚠️', 'Usuario demo no encontrado');
      return null;
    }

    // Verificar password
    const passwordValid = demoUser.passwordHash
      ? await bcrypt.compare('DemoPass123!', demoUser.passwordHash)
      : false;

    results.push({
      name: 'Demo User',
      success: true,
      message: `Usuario demo encontrado con ${demoUser.bodyMetrics.length} métricas`,
      duration
    });

    log('✅', `Usuario demo OK (${duration}ms)`);
    log('   ', `- Email: ${demoUser.email}`);
    log('   ', `- Password válido: ${passwordValid ? 'Sí' : 'No'}`);
    log('   ', `- Perfil: ${demoUser.profile ? 'Creado' : 'Faltante'}`);
    log('   ', `- Planes: ${demoUser.plans.length}`);

    return demoUser;
  } catch (error) {
    results.push({
      name: 'Demo User',
      success: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
    log('❌', 'Error verificando usuario demo');
    throw error;
  }
}

async function testBodyMetrics() {
  const start = Date.now();
  try {
    const metricsCount = await prisma.bodyMetric.count();
    const latestMetrics = await prisma.bodyMetric.findMany({
      take: 5,
      orderBy: { date: 'desc' },
      include: { user: { select: { email: true } } }
    });

    const duration = Date.now() - start;

    results.push({
      name: 'Body Metrics',
      success: true,
      message: `${metricsCount} métricas encontradas`,
      duration
    });

    log('✅', `Métricas corporales OK (${duration}ms)`);
    log('   ', `- Total: ${metricsCount}`);
    if (latestMetrics.length > 0) {
      log('   ', `- Última: ${latestMetrics[0].weight}kg para ${latestMetrics[0].user.email}`);
    }

    return metricsCount;
  } catch (error) {
    results.push({
      name: 'Body Metrics',
      success: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
    log('❌', 'Error verificando métricas');
    throw error;
  }
}

async function testExercises() {
  const start = Date.now();
  try {
    const exercisesCount = await prisma.exercise.count();
    const duration = Date.now() - start;

    if (exercisesCount === 0) {
      results.push({
        name: 'Exercises',
        success: false,
        message: 'No hay ejercicios. Ejecuta el seed.'
      });
      log('⚠️', 'No hay ejercicios en la DB');
      return 0;
    }

    results.push({
      name: 'Exercises',
      success: true,
      message: `${exercisesCount} ejercicios encontrados`,
      duration
    });

    log('✅', `Ejercicios OK - ${exercisesCount} encontrados (${duration}ms)`);
    return exercisesCount;
  } catch (error) {
    results.push({
      name: 'Exercises',
      success: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
    log('❌', 'Error verificando ejercicios');
    throw error;
  }
}

async function testWorkouts() {
  const start = Date.now();
  try {
    const workoutsCount = await prisma.workout.count();
    const completedCount = await prisma.workout.count({
      where: { completedAt: { not: null } }
    });
    const duration = Date.now() - start;

    results.push({
      name: 'Workouts',
      success: true,
      message: `${workoutsCount} entrenamientos (${completedCount} completados)`,
      duration
    });

    log('✅', `Entrenamientos OK (${duration}ms)`);
    log('   ', `- Total: ${workoutsCount}`);
    log('   ', `- Completados: ${completedCount}`);

    return workoutsCount;
  } catch (error) {
    results.push({
      name: 'Workouts',
      success: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
    log('❌', 'Error verificando entrenamientos');
    throw error;
  }
}

async function testCreateAndDeleteUser() {
  const start = Date.now();
  const testEmail = `test-${Date.now()}@kairos.fit`;

  try {
    // Crear usuario de prueba
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        name: 'Test User',
        passwordHash: await bcrypt.hash('TestPass123!', 12),
        profile: {
          create: {
            progressionRule: 'VOLUME'
          }
        }
      },
      include: { profile: true }
    });

    // Verificar que se creó
    const found = await prisma.user.findUnique({
      where: { email: testEmail }
    });

    if (!found) {
      throw new Error('Usuario creado pero no encontrado');
    }

    // Eliminar usuario de prueba
    await prisma.user.delete({
      where: { id: user.id }
    });

    const duration = Date.now() - start;

    results.push({
      name: 'Create & Delete User',
      success: true,
      message: 'Operaciones CRUD funcionando correctamente',
      duration
    });

    log('✅', `CRUD de usuarios OK (${duration}ms)`);
  } catch (error) {
    results.push({
      name: 'Create & Delete User',
      success: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
    log('❌', 'Error en operaciones CRUD');
    throw error;
  }
}

async function testRelationships() {
  const start = Date.now();
  try {
    // Buscar un usuario con todas sus relaciones
    const user = await prisma.user.findFirst({
      include: {
        profile: true,
        bodyMetrics: true,
        plans: {
          include: {
            workouts: true
          }
        },
        accounts: true,
        sessions: true
      }
    });

    const duration = Date.now() - start;

    if (!user) {
      results.push({
        name: 'Relationships',
        success: false,
        message: 'No se encontraron usuarios para verificar relaciones'
      });
      log('⚠️', 'No hay usuarios para verificar relaciones');
      return;
    }

    results.push({
      name: 'Relationships',
      success: true,
      message: 'Relaciones de Prisma funcionando correctamente',
      duration
    });

    log('✅', `Relaciones OK (${duration}ms)`);
    log('   ', `- Perfil: ${user.profile ? 'Sí' : 'No'}`);
    log('   ', `- Métricas: ${user.bodyMetrics.length}`);
    log('   ', `- Planes: ${user.plans.length}`);
  } catch (error) {
    results.push({
      name: 'Relationships',
      success: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
    log('❌', 'Error verificando relaciones');
    throw error;
  }
}

function printSummary() {
  console.log('\n' + '═'.repeat(60));
  console.log('📊 RESUMEN DE PRUEBAS');
  console.log('═'.repeat(60) + '\n');

  const total = results.length;
  const passed = results.filter(r => r.success).length;
  const failed = total - passed;

  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    const duration = result.duration ? ` (${result.duration}ms)` : '';
    console.log(`${status} ${result.name}${duration}`);
    console.log(`   ${result.message}`);
  });

  console.log('\n' + '─'.repeat(60));
  console.log(`Total: ${total} | Exitosas: ${passed} | Fallidas: ${failed}`);
  console.log('─'.repeat(60) + '\n');

  if (failed === 0) {
    console.log('🎉 ¡Todas las pruebas pasaron exitosamente!');
    console.log('✨ La configuración está lista para usar.\n');
    console.log('📝 Próximos pasos:');
    console.log('   1. Inicia el servidor: pnpm dev');
    console.log('   2. Ve a http://localhost:3000');
    console.log('   3. Inicia sesión con demo@kairos.fit / DemoPass123!');
    console.log('');
  } else {
    console.log('⚠️  Algunas pruebas fallaron.');
    console.log('🔧 Revisa los errores arriba y:');
    console.log('   1. Verifica que DATABASE_URL esté configurada');
    console.log('   2. Ejecuta: pnpm db:generate');
    console.log('   3. Ejecuta: pnpm db:push');
    console.log('   4. Ejecuta: pnpm db:seed');
    console.log('');
  }
}

async function main() {
  console.log('\n🚀 VERIFICACIÓN DE CONFIGURACIÓN - KAIROS FITNESS\n');

  try {
    await testDatabaseConnection();
    await testUserModel();
    await testDemoUser();
    await testBodyMetrics();
    await testExercises();
    await testWorkouts();
    await testCreateAndDeleteUser();
    await testRelationships();
  } catch (error) {
    console.error('\n❌ Error fatal:', error);
  } finally {
    printSummary();
    await prisma.$disconnect();
  }
}

main();
