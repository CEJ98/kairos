/**
 * Production Database Seeding Script
 * Creates essential data for production deployment
 */
import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Starting production database seeding...')

  // Create essential exercises
  const essentialExercises = [
    // Basic Bodyweight Exercises
    {
      name: 'Push-ups',
      description: 'Classic bodyweight chest exercise',
      category: 'STRENGTH',
      muscleGroups: JSON.stringify(['CHEST', 'TRICEPS', 'SHOULDERS']),
      equipments: JSON.stringify(['BODYWEIGHT']),
      difficulty: 'BEGINNER',
      instructions: '1. Start in plank position with hands shoulder-width apart\n2. Lower chest until almost touching ground\n3. Push back up to starting position',
      tips: 'Keep core engaged and body in straight line throughout movement',
      isActive: true,
    },
    {
      name: 'Bodyweight Squats',
      description: 'Fundamental lower body exercise',
      category: 'STRENGTH',
      muscleGroups: JSON.stringify(['QUADS', 'GLUTES', 'HAMSTRINGS']),
      equipments: JSON.stringify(['BODYWEIGHT']),
      difficulty: 'BEGINNER',
      instructions: '1. Stand with feet shoulder-width apart\n2. Lower as if sitting back into chair\n3. Descend until thighs parallel to ground\n4. Drive through heels to return to standing',
      tips: 'Keep chest up and knees tracking over toes',
      isActive: true,
    },
    {
      name: 'Plank',
      description: 'Isometric core strengthening exercise',
      category: 'STRENGTH',
      muscleGroups: JSON.stringify(['ABS', 'OBLIQUES', 'SHOULDERS']),
      equipments: JSON.stringify(['BODYWEIGHT']),
      difficulty: 'BEGINNER',
      instructions: '1. Position forearms on ground with elbows under shoulders\n2. Extend legs back, balancing on toes\n3. Keep body in straight line from head to heels\n4. Hold position',
      tips: 'Breathe normally and avoid letting hips sag or pike up',
      isActive: true,
    },
    {
      name: 'Jumping Jacks',
      description: 'Full-body cardio exercise',
      category: 'CARDIO',
      muscleGroups: JSON.stringify(['FULL_BODY']),
      equipments: JSON.stringify(['BODYWEIGHT']),
      difficulty: 'BEGINNER',
      instructions: '1. Start standing with arms at sides\n2. Jump while spreading legs and raising arms overhead\n3. Jump back to starting position\n4. Repeat continuously',
      tips: 'Land softly on balls of feet and maintain steady rhythm',
      isActive: true,
    },
    {
      name: 'Mountain Climbers',
      description: 'Dynamic cardio and core exercise',
      category: 'CARDIO',
      muscleGroups: JSON.stringify(['ABS', 'SHOULDERS', 'LEGS']),
      equipments: JSON.stringify(['BODYWEIGHT']),
      difficulty: 'INTERMEDIATE',
      instructions: '1. Start in plank position\n2. Drive one knee toward chest\n3. Quickly switch legs in running motion\n4. Keep core engaged throughout',
      tips: 'Maintain plank position and avoid letting hips rise',
      isActive: true,
    },
  ]

  console.log('📝 Creating essential exercises...')
  
  for (const exercise of essentialExercises) {
    const existingExercise = await prisma.exercise.findFirst({
      where: { name: exercise.name }
    })
    
    if (!existingExercise) {
      await prisma.exercise.create({
        data: exercise
      })
    }
  }

  // Create system admin user (only if not exists)
  console.log('🔐 Creating system admin...')
  
  const adminPassword = process.env.ADMIN_PASSWORD || 'TempAdmin123!'
  const hashedAdminPassword = await hash(adminPassword, 12)

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@kairosfit.com' },
    update: {},
    create: {
      email: 'admin@kairosfit.com',
      name: 'System Administrator',
      password: hashedAdminPassword,
      role: 'ADMIN',
      isVerified: true,
    },
  })

  // Create default workout templates
  console.log('📋 Creating default workout templates...')
  
  const existingBeginnerWorkout = await prisma.workout.findFirst({
    where: { 
      name: 'Beginner Full Body',
      creatorId: adminUser.id
    }
  })
  
  const beginnerWorkout = existingBeginnerWorkout || await prisma.workout.create({
    data: {
      name: 'Beginner Full Body',
      description: 'Perfect starting routine for fitness beginners. Focuses on basic movements and proper form.',
      creatorId: adminUser.id,
      isTemplate: true,
      category: 'STRENGTH',
      duration: 30,
    }
  })

  // Add exercises to beginner workout
  const beginnerExercises = [
    { name: 'Bodyweight Squats', sets: 2, reps: 12, restTime: 60 },
    { name: 'Push-ups', sets: 2, reps: 8, restTime: 60 },
    { name: 'Plank', sets: 2, duration: 20, restTime: 45 },
    { name: 'Jumping Jacks', sets: 2, duration: 30, restTime: 60 },
  ]

  for (let i = 0; i < beginnerExercises.length; i++) {
    const workoutEx = beginnerExercises[i]
    const exercise = await prisma.exercise.findFirst({
      where: { name: workoutEx.name }
    })

    if (exercise) {
      await prisma.workoutExercise.upsert({
        where: {
          workoutId_order: {
            workoutId: beginnerWorkout.id,
            order: i + 1
          }
        },
        update: {},
        create: {
          workoutId: beginnerWorkout.id,
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

  // Create intermediate workout template
  const existingIntermediateWorkout = await prisma.workout.findFirst({
    where: { 
      name: 'Intermediate HIIT',
      creatorId: adminUser.id
    }
  })
  
  const intermediateWorkout = existingIntermediateWorkout || await prisma.workout.create({
    data: {
      name: 'Intermediate HIIT',
      description: 'High-intensity interval training for intermediate fitness levels.',
      creatorId: adminUser.id,
      isTemplate: true,
      category: 'CARDIO',
      duration: 25,
    }
  })

  // Add exercises to intermediate workout
  const hiitExercises = [
    { name: 'Jumping Jacks', sets: 3, duration: 45, restTime: 15 },
    { name: 'Push-ups', sets: 3, reps: 12, restTime: 15 },
    { name: 'Mountain Climbers', sets: 3, duration: 30, restTime: 15 },
    { name: 'Bodyweight Squats', sets: 3, reps: 15, restTime: 15 },
    { name: 'Plank', sets: 2, duration: 45, restTime: 60 },
  ]

  for (let i = 0; i < hiitExercises.length; i++) {
    const workoutEx = hiitExercises[i]
    const exercise = await prisma.exercise.findFirst({
      where: { name: workoutEx.name }
    })

    if (exercise) {
      await prisma.workoutExercise.upsert({
        where: {
          workoutId_order: {
            workoutId: intermediateWorkout.id,
            order: i + 1
          }
        },
        update: {},
        create: {
          workoutId: intermediateWorkout.id,
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

  // Create system settings (if using a settings table)
  console.log('⚙️ Setting up system configuration...')
  
  // Log completion
  const exerciseCount = await prisma.exercise.count()
  const workoutCount = await prisma.workout.count({ where: { isTemplate: true } })

  console.log('✅ Production seeding completed successfully!')
  console.log('📊 Data created:')
  console.log(`- ${exerciseCount} exercises`)
  console.log(`- ${workoutCount} workout templates`)
  console.log('- 1 system administrator')
  console.log('')
  console.log('🔐 System Admin Credentials:')
  console.log('Email: admin@kairosfit.com')
  console.log('Password:', adminPassword)
  console.log('')
  console.log('⚠️  IMPORTANT: Change the admin password after first login!')
}

main()
  .catch((e) => {
    console.error('❌ Production seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })