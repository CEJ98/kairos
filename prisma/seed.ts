import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...')

  // Crear ejercicios básicos
  const exercises = [
    // STRENGTH - CHEST
    {
      name: 'Push-ups',
      description: 'Flexiones de pecho tradicionales',
      category: 'STRENGTH',
      muscleGroups: JSON.stringify(['CHEST', 'TRICEPS']),
      equipments: JSON.stringify(['BODYWEIGHT']),
      difficulty: 'BEGINNER',
      instructions: '1. Posición de plancha con manos a la anchura de hombros\n2. Bajar el pecho hasta casi tocar el suelo\n3. Empujar hacia arriba hasta posición inicial',
      tips: 'Mantén el core contraído y el cuerpo en línea recta',
    },
    {
      name: 'Bench Press',
      description: 'Press de banca con barra',
      category: 'STRENGTH',
      muscleGroups: JSON.stringify(['CHEST', 'TRICEPS', 'SHOULDERS']),
      equipments: JSON.stringify(['BARBELL', 'BENCH']),
      difficulty: 'INTERMEDIATE',
      instructions: '1. Acostado en el banco, agarra la barra con las manos más anchas que los hombros\n2. Baja la barra controladamente hasta el pecho\n3. Empuja la barra hacia arriba hasta extensión completa',
    },

    // STRENGTH - BACK
    {
      name: 'Pull-ups',
      description: 'Dominadas en barra fija',
      category: 'STRENGTH',
      muscleGroups: JSON.stringify(['BACK', 'BICEPS']),
      equipments: JSON.stringify(['PULL_UP_BAR']),
      difficulty: 'INTERMEDIATE',
      instructions: '1. Cuelga de la barra con agarre más ancho que hombros\n2. Tira hacia arriba hasta que el mentón pase la barra\n3. Baja controladamente hasta posición inicial',
    },
    {
      name: 'Bent-over Row',
      description: 'Remo inclinado con barra',
      category: 'STRENGTH',
      muscleGroups: JSON.stringify(['BACK', 'BICEPS']),
      equipments: JSON.stringify(['BARBELL']),
      difficulty: 'INTERMEDIATE',
      instructions: '1. Inclínate hacia adelante con la barra en las manos\n2. Tira de la barra hacia el abdomen bajo\n3. Baja controladamente',
    },

    // LEGS
    {
      name: 'Squats',
      description: 'Sentadillas básicas',
      category: 'STRENGTH',
      muscleGroups: JSON.stringify(['QUADS', 'GLUTES', 'HAMSTRINGS']),
      equipments: JSON.stringify(['BODYWEIGHT']),
      difficulty: 'BEGINNER',
      instructions: '1. Pies a la anchura de hombros\n2. Baja como si te fueras a sentar\n3. Baja hasta que los muslos estén paralelos al suelo\n4. Sube empujando con los talones',
    },
    {
      name: 'Deadlift',
      description: 'Peso muerto con barra',
      category: 'STRENGTH',
      muscleGroups: JSON.stringify(['HAMSTRINGS', 'GLUTES', 'BACK']),
      equipments: JSON.stringify(['BARBELL']),
      difficulty: 'ADVANCED',
      instructions: '1. Pies debajo de la barra, agarre más ancho que hombros\n2. Mantén la espalda recta y levanta la barra\n3. Extiende caderas y rodillas simultáneamente',
    },

    // CARDIO
    {
      name: 'Running',
      description: 'Carrera continua',
      category: 'CARDIO',
      muscleGroups: JSON.stringify(['FULL_BODY']),
      equipments: JSON.stringify(['BODYWEIGHT']),
      difficulty: 'BEGINNER',
      instructions: '1. Mantén un ritmo constante\n2. Respiración controlada\n3. Aterriza con el mediopié',
    },
    {
      name: 'Burpees',
      description: 'Ejercicio combinado de alta intensidad',
      category: 'CARDIO',
      muscleGroups: JSON.stringify(['FULL_BODY']),
      equipments: JSON.stringify(['BODYWEIGHT']),
      difficulty: 'INTERMEDIATE',
      instructions: '1. Desde parado, baja a posición de squat\n2. Salta hacia atrás a plancha\n3. Haz una flexión\n4. Salta hacia adelante y arriba',
    },

    // ABS
    {
      name: 'Plank',
      description: 'Plancha isométrica',
      category: 'STRENGTH',
      muscleGroups: JSON.stringify(['ABS', 'OBLIQUES']),
      equipments: JSON.stringify(['BODYWEIGHT']),
      difficulty: 'BEGINNER',
      instructions: '1. Posición de plancha sobre antebrazos\n2. Mantén el cuerpo recto\n3. Contrae el core',
    },
    {
      name: 'Crunches',
      description: 'Abdominales tradicionales',
      category: 'STRENGTH',
      muscleGroups: JSON.stringify(['ABS']),
      equipments: JSON.stringify(['BODYWEIGHT']),
      difficulty: 'BEGINNER',
      instructions: '1. Acostado boca arriba, rodillas dobladas\n2. Lleva el pecho hacia las rodillas\n3. Baja controladamente',
    },
  ]

  console.log('📝 Creando ejercicios...')
  
  for (const exercise of exercises) {
    const existing = await prisma.exercise.findFirst({
      where: { name: exercise.name }
    })
    
    if (!existing) {
      await prisma.exercise.create({
        data: exercise
      })
    }
  }

  // Crear usuario admin de ejemplo
  console.log('👤 Creando usuario administrador...')
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@kairosfit.com' },
    update: {},
    create: {
      email: 'admin@kairosfit.com',
      name: 'Admin Kairos',
      role: 'ADMIN',
      isVerified: true,
    },
  })

  // Crear usuario entrenador de ejemplo
  console.log('🏋️ Creando usuario entrenador...')
  
  const trainerUser = await prisma.user.upsert({
    where: { email: 'trainer@kairosfit.com' },
    update: {},
    create: {
      email: 'trainer@kairosfit.com',
      name: 'Carlos Pérez',
      role: 'TRAINER',
      isVerified: true,
      trainerProfile: {
        create: {
          bio: 'Entrenador personal certificado con 10 años de experiencia. Especializado en pérdida de peso y ganancia muscular.',
          experience: 10,
          specialties: JSON.stringify(['Pérdida de peso', 'Ganancia muscular', 'Entrenamiento funcional']),
          hourlyRate: 75.00,
          isActive: true,
          maxClients: 50,
        }
      },
    },
    include: {
      trainerProfile: true,
    }
  })

  // Crear usuario demo para pruebas
  console.log('🎯 Creando usuario demo...')
  
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@kairos.com' },
    update: {},
    create: {
      email: 'demo@kairos.com',
      name: 'Usuario Demo',
      role: 'CLIENT',
      isVerified: true,
      password: 'demo1234', // Para desarrollo, sin hash
      clientProfiles: {
        create: {
          age: 25,
          weight: 70.0,
          height: 175,
          gender: 'MALE',
          fitnessGoal: 'MUSCLE_GAIN',
          activityLevel: 'MODERATE',
        }
      },
    },
    include: {
      clientProfiles: true,
    }
  })

  // Crear usuario cliente de ejemplo
  console.log('💪 Creando usuario cliente...')
  
  const clientUser = await prisma.user.upsert({
    where: { email: 'client@kairosfit.com' },
    update: {},
    create: {
      email: 'client@kairosfit.com',
      name: 'María García',
      role: 'CLIENT',
      isVerified: true,
      clientProfiles: {
        create: {
          age: 28,
          weight: 65.0,
          height: 165,
          gender: 'FEMALE',
          fitnessGoal: 'WEIGHT_LOSS',
          activityLevel: 'LIGHT',
          trainerId: trainerUser.trainerProfile?.id,
        }
      },
    },
    include: {
      clientProfiles: true,
    }
  })

  // Crear rutina de ejemplo
  console.log('📋 Creando rutina de ejemplo...')
  
  const sampleWorkout = await prisma.workout.create({
    data: {
      name: 'Rutina Full Body Principiante',
      description: 'Rutina completa de cuerpo entero ideal para principiantes. Incluye ejercicios básicos para todos los grupos musculares.',
      creatorId: trainerUser.id,
      assignedToId: clientUser.id,
      isTemplate: true,
      category: 'STRENGTH',
      duration: 45,
    }
  })

  // Agregar ejercicios a la rutina
  const workoutExercises = [
    { exerciseName: 'Squats', sets: 3, reps: 15, restTime: 60 },
    { exerciseName: 'Push-ups', sets: 3, reps: 10, restTime: 60 },
    { exerciseName: 'Plank', sets: 3, duration: 30, restTime: 45 },
    { exerciseName: 'Bent-over Row', sets: 3, reps: 12, restTime: 60 },
    { exerciseName: 'Crunches', sets: 2, reps: 20, restTime: 45 },
  ]

  for (let i = 0; i < workoutExercises.length; i++) {
    const workoutEx = workoutExercises[i]
    const exercise = await prisma.exercise.findFirst({
      where: { name: workoutEx.exerciseName }
    })

    if (exercise) {
      await prisma.workoutExercise.create({
        data: {
          workoutId: sampleWorkout.id,
          exerciseId: exercise.id,
          order: i + 1,
          sets: workoutEx.sets,
          reps: workoutEx.reps,
          duration: workoutEx.duration,
          restTime: workoutEx.restTime,
        }
      })
    }
  }

  // Crear suscripción de ejemplo para el entrenador
  console.log('💳 Creando suscripción de ejemplo...')
  
  await prisma.subscription.create({
    data: {
      userId: trainerUser.id,
      planType: 'TRAINER',
      status: 'ACTIVE',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
    }
  })

  // Crear mediciones de demostración para el usuario demo
  console.log('📏 Creando mediciones de demostración...')
  
  const measurementDates = [
    new Date('2024-01-01'),
    new Date('2024-02-01'),
    new Date('2024-03-01'),
  ]

  for (let i = 0; i < measurementDates.length; i++) {
    await prisma.measurement.create({
      data: {
        userId: demoUser.id,
        peso: 70.0 - (i * 1.5), // Simulando pérdida de peso progresiva
        grasa: 18.0 - (i * 0.8), // Reducción de grasa corporal
        cintura: 85.0 - (i * 1.2), // Reducción de cintura
        fecha: measurementDates[i],
        notas: `Medición ${i + 1} - Progreso ${i === 0 ? 'inicial' : i === 1 ? 'intermedio' : 'actual'}`,
      }
    })
  }

  console.log('✅ Seed completado exitosamente!')
  console.log('📊 Datos creados:')
  console.log(`- ${exercises.length} ejercicios`)
  console.log('- 4 usuarios (admin, entrenador, cliente, demo)')
  console.log('- 1 rutina de ejemplo')
  console.log('- 1 suscripción activa')
  console.log('- 3 mediciones de demostración')
  console.log('')
  console.log('🔐 Credenciales de prueba:')
  console.log('Demo: demo@kairos.com / demo1234')
  console.log('Admin: admin@kairosfit.com')
  console.log('Entrenador: trainer@kairosfit.com')
  console.log('Cliente: client@kairosfit.com')
  console.log('')
  console.log('📏 Mediciones demo creadas:')
  console.log('- Enero: 70kg, 18% grasa, 85cm cintura')
  console.log('- Febrero: 68.5kg, 17.2% grasa, 83.8cm cintura')
  console.log('- Marzo: 67kg, 16.4% grasa, 82.6cm cintura')
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })