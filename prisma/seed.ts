import { PrismaClient } from '@prisma/client';
import { addDays, addHours, addWeeks, subWeeks } from 'date-fns';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const exercises = [
  {
    name: 'Back Squat con Barra',
    description: 'Sentadilla trasera enfocada en fuerza y desarrollo de piernas.',
    videoUrl: 'https://videos.kairos.fit/back-squat.mp4',
    muscleGroup: 'Piernas',
    equipment: 'Barra',
    cues: 'Mantén el torso neutro, desciende controlado, empuja con los talones.'
  },
  {
    name: 'Peso Muerto Rumano',
    description: 'Movimiento para isquios y glúteos con énfasis en la cadena posterior.',
    videoUrl: 'https://videos.kairos.fit/rdl.mp4',
    muscleGroup: 'Isquiotibiales',
    equipment: 'Barra',
    cues: 'Caderas atrás, columna neutra, siente el estiramiento en los isquios.'
  },
  {
    name: 'Prensa de Piernas',
    description: 'Ejercicio guiado para cuádriceps y glúteos.',
    videoUrl: 'https://videos.kairos.fit/leg-press.mp4',
    muscleGroup: 'Piernas',
    equipment: 'Máquina',
    cues: 'Controla la bajada, evita bloquear rodillas, empuja uniforme.'
  },
  {
    name: 'Estocadas Caminando',
    description: 'Trabajo unilateral para estabilidad y fuerza.',
    videoUrl: 'https://videos.kairos.fit/walking-lunge.mp4',
    muscleGroup: 'Piernas',
    equipment: 'Mancuernas',
    cues: 'Paso largo, rodilla alineada, torso erguido.'
  },
  {
    name: 'Hip Thrust',
    description: 'Potencia glúteos y cadena posterior.',
    videoUrl: 'https://videos.kairos.fit/hip-thrust.mp4',
    muscleGroup: 'Glúteos',
    equipment: 'Barra',
    cues: 'Barra sobre caderas, empuja hasta neutro, aprieta al final.'
  },
  {
    name: 'Press Banca',
    description: 'Fuerza de tren superior para pectoral y tríceps.',
    videoUrl: 'https://videos.kairos.fit/bench-press.mp4',
    muscleGroup: 'Pectoral',
    equipment: 'Barra',
    cues: 'Escápulas retraídas, barra a la parte baja del pecho, empuja explosivo.'
  },
  {
    name: 'Press Inclinado con Mancuernas',
    description: 'Enfoque en pectoral superior y estabilidad.',
    videoUrl: 'https://videos.kairos.fit/incline-dumbbell.mp4',
    muscleGroup: 'Pectoral',
    equipment: 'Mancuernas',
    cues: 'Ángulo de 30°, controla recorrido, junta ligeramente al final.'
  },
  {
    name: 'Dominadas',
    description: 'Trabajo dorsal y bíceps con peso corporal.',
    videoUrl: 'https://videos.kairos.fit/pull-up.mp4',
    muscleGroup: 'Espalda',
    equipment: 'Peso corporal',
    cues: 'Escápulas activas, barbilla sobre la barra, controla bajada.'
  },
  {
    name: 'Remo con Barra',
    description: 'Grosor de espalda y estabilidad lumbar.',
    videoUrl: 'https://videos.kairos.fit/barbell-row.mp4',
    muscleGroup: 'Espalda',
    equipment: 'Barra',
    cues: 'Torso paralelo, tira hacia el abdomen, aprieta omóplatos.'
  },
  {
    name: 'Face Pull',
    description: 'Salud de hombros y deltoide posterior.',
    videoUrl: 'https://videos.kairos.fit/face-pull.mp4',
    muscleGroup: 'Hombros',
    equipment: 'Polea',
    cues: 'Codos altos, lleva cuerdas a la cara, controla retorno.'
  },
  {
    name: 'Press Militar',
    description: 'Desarrollo de hombros en posición vertical.',
    videoUrl: 'https://videos.kairos.fit/overhead-press.mp4',
    muscleGroup: 'Hombros',
    equipment: 'Barra',
    cues: 'Glúteos firmes, barra recta, cabeza al pasar la barra.'
  },
  {
    name: 'Elevaciones Laterales',
    description: 'Aislamiento del deltoide medio.',
    videoUrl: 'https://videos.kairos.fit/lateral-raise.mp4',
    muscleGroup: 'Hombros',
    equipment: 'Mancuernas',
    cues: 'Codos ligeramente flexionados, eleva a 90°, controla bajada.'
  },
  {
    name: 'Curl con Barra',
    description: 'Trabajo principal de bíceps.',
    videoUrl: 'https://videos.kairos.fit/barbell-curl.mp4',
    muscleGroup: 'Bíceps',
    equipment: 'Barra',
    cues: 'Codos pegados, evita balanceo, squeeze arriba.'
  },
  {
    name: 'Curl Martillo',
    description: 'Enfoque en braquial y antebrazo.',
    videoUrl: 'https://videos.kairos.fit/hammer-curl.mp4',
    muscleGroup: 'Brazos',
    equipment: 'Mancuernas',
    cues: 'Pulgares arriba, movimiento controlado, sin balanceo.'
  },
  {
    name: 'Press Francés',
    description: 'Aislamiento de tríceps.',
    videoUrl: 'https://videos.kairos.fit/skullcrusher.mp4',
    muscleGroup: 'Tríceps',
    equipment: 'Barra Z',
    cues: 'Codos fijos, baja a la frente, extiende completo.'
  },
  {
    name: 'Fondos en Paralelas',
    description: 'Trabajo compuesto de tríceps y pecho.',
    videoUrl: 'https://videos.kairos.fit/dips.mp4',
    muscleGroup: 'Tríceps',
    equipment: 'Peso corporal',
    cues: 'Cuerpo ligeramente inclinado, baja controlado, empuja fuerte.'
  },
  {
    name: 'Remo en Máquina',
    description: 'Estímulo horizontal controlado.',
    videoUrl: 'https://videos.kairos.fit/row-machine.mp4',
    muscleGroup: 'Espalda',
    equipment: 'Máquina',
    cues: 'Pecho apoyado, tira al abdomen, pausa atrás.'
  },
  {
    name: 'Jalón al Pecho',
    description: 'Alternativa de tracción vertical guiada.',
    videoUrl: 'https://videos.kairos.fit/lat-pulldown.mp4',
    muscleGroup: 'Espalda',
    equipment: 'Polea',
    cues: 'Saca pecho, tira con dorsales, controla subida.'
  },
  {
    name: 'Step Up',
    description: 'Trabajo unilateral de pierna y estabilidad.',
    videoUrl: 'https://videos.kairos.fit/step-up.mp4',
    muscleGroup: 'Piernas',
    equipment: 'Mancuernas',
    cues: 'Sube con la pierna líder, controla descenso.'
  },
  {
    name: 'Peso Muerto Sumo',
    description: 'Variación para aductores y glúteos.',
    videoUrl: 'https://videos.kairos.fit/sumo-deadlift.mp4',
    muscleGroup: 'Cadera',
    equipment: 'Barra',
    cues: 'Caderas bajas, rodillas afuera, empuja el piso.'
  },
  {
    name: 'Farmer Walk',
    description: 'Agarre y core en locomoción.',
    videoUrl: 'https://videos.kairos.fit/farmer-walk.mp4',
    muscleGroup: 'Full Body',
    equipment: 'Mancuernas',
    cues: 'Postura alta, pasos cortos, core firme.'
  },
  {
    name: 'Press de Piernas Unilateral',
    description: 'Equilibrio y fuerza unilateral en prensa.',
    videoUrl: 'https://videos.kairos.fit/single-leg-press.mp4',
    muscleGroup: 'Piernas',
    equipment: 'Máquina',
    cues: 'Controla alineación de rodilla, empuja con el talón.'
  },
  {
    name: 'Hack Squat',
    description: 'Sentadilla guiada para énfasis en cuádriceps.',
    videoUrl: 'https://videos.kairos.fit/hack-squat.mp4',
    muscleGroup: 'Piernas',
    equipment: 'Máquina',
    cues: 'Apoya espalda, baja profundo, empuja con talones.'
  },
  {
    name: 'Extensión de Pierna',
    description: 'Aislamiento de cuádriceps.',
    videoUrl: 'https://videos.kairos.fit/leg-extension.mp4',
    muscleGroup: 'Piernas',
    equipment: 'Máquina',
    cues: 'Pausa arriba, controla bajada.'
  },
  {
    name: 'Curl Femoral sentado',
    description: 'Aislamiento de isquios.',
    videoUrl: 'https://videos.kairos.fit/seated-leg-curl.mp4',
    muscleGroup: 'Isquiotibiales',
    equipment: 'Máquina',
    cues: 'Talones atrás, aprieta al final.'
  },
  {
    name: 'Elevación de Gemelos de pie',
    description: 'Trabajo de pantorrilla.',
    videoUrl: 'https://videos.kairos.fit/standing-calf.mp4',
    muscleGroup: 'Piernas',
    equipment: 'Máquina',
    cues: 'Pausa arriba, recorrido completo.'
  },
  {
    name: 'Press Inclinado con Barra',
    description: 'Compuesto para pectoral superior.',
    videoUrl: 'https://videos.kairos.fit/incline-barbell.mp4',
    muscleGroup: 'Pectoral',
    equipment: 'Barra',
    cues: 'Ángulo moderado, barra al pecho alto.'
  },
  {
    name: 'Aperturas con Mancuernas',
    description: 'Aislamiento de pectoral.',
    videoUrl: 'https://videos.kairos.fit/dumbbell-fly.mp4',
    muscleGroup: 'Pectoral',
    equipment: 'Mancuernas',
    cues: 'Codos flexionados, arco controlado.'
  },
  {
    name: 'Aperturas en Polea',
    description: 'Aislamiento guiado de pectoral.',
    videoUrl: 'https://videos.kairos.fit/cable-fly.mp4',
    muscleGroup: 'Pectoral',
    equipment: 'Polea',
    cues: 'Tensión constante, junta manos al centro.'
  },
  {
    name: 'Remo T-Bar',
    description: 'Compuesto para grosor de espalda.',
    videoUrl: 'https://videos.kairos.fit/tbar-row.mp4',
    muscleGroup: 'Espalda',
    equipment: 'Máquina',
    cues: 'Torso estable, tira al abdomen.'
  },
  {
    name: 'Pullover en Polea',
    description: 'Trabajo de dorsales con aislamiento.',
    videoUrl: 'https://videos.kairos.fit/cable-pullover.mp4',
    muscleGroup: 'Espalda',
    equipment: 'Polea',
    cues: 'Codos semiflexionados, arco con dorsales.'
  },
  {
    name: 'Rear Delt Machine',
    description: 'Aislamiento del deltoide posterior.',
    videoUrl: 'https://videos.kairos.fit/rear-delt.mp4',
    muscleGroup: 'Hombros',
    equipment: 'Máquina',
    cues: 'Codos altos, abre con control.'
  },
  {
    name: 'Elevación Frontal',
    description: 'Aislamiento del deltoide anterior.',
    videoUrl: 'https://videos.kairos.fit/front-raise.mp4',
    muscleGroup: 'Hombros',
    equipment: 'Mancuernas',
    cues: 'Sube a 90°, controla bajada.'
  },
  {
    name: 'Curl Predicador',
    description: 'Bíceps con mayor control.',
    videoUrl: 'https://videos.kairos.fit/preacher-curl.mp4',
    muscleGroup: 'Bíceps',
    equipment: 'Máquina',
    cues: 'Codos fijos, contracción máxima.'
  },
  {
    name: 'Tríceps en Polea',
    description: 'Extensión de tríceps con cuerda.',
    videoUrl: 'https://videos.kairos.fit/triceps-rope.mp4',
    muscleGroup: 'Tríceps',
    equipment: 'Polea',
    cues: 'Separa cuerdas al final, codos fijos.'
  },
  {
    name: 'Kettlebell Swing',
    description: 'Potencia de cadera y acondicionamiento.',
    videoUrl: 'https://videos.kairos.fit/kb-swing.mp4',
    muscleGroup: 'Full Body',
    equipment: 'Kettlebell',
    cues: 'Caderas atrás, impulso explosivo.'
  },
  {
    name: 'RDL Unilateral',
    description: 'Estabilidad y cadena posterior unilateral.',
    videoUrl: 'https://videos.kairos.fit/single-leg-rdl.mp4',
    muscleGroup: 'Isquiotibiales',
    equipment: 'Mancuernas',
    cues: 'Cadera atrás, control del equilibrio.'
  },
  {
    name: 'Plancha',
    description: 'Estabilidad de core isométrica.',
    videoUrl: 'https://videos.kairos.fit/plank.mp4',
    muscleGroup: 'Core',
    equipment: 'Peso corporal',
    cues: 'Caderas neutras, respiración controlada.'
  },
  {
    name: 'Elevación de Piernas Colgado',
    description: 'Trabajo de abdomen inferior.',
    videoUrl: 'https://videos.kairos.fit/hanging-leg-raise.mp4',
    muscleGroup: 'Core',
    equipment: 'Barra',
    cues: 'Evita balanceo, controla subida/bajada.'
  },
  {
    name: 'Rower',
    description: 'Cardio de bajo impacto, cuerpo completo.',
    videoUrl: 'https://videos.kairos.fit/rower.mp4',
    muscleGroup: 'Cardio',
    equipment: 'Máquina',
    cues: 'Cadencia constante, técnica de remada.'
  },
  {
    name: 'Cinta de Correr',
    description: 'Cardio sostenido.',
    videoUrl: 'https://videos.kairos.fit/treadmill.mp4',
    muscleGroup: 'Cardio',
    equipment: 'Máquina',
    cues: 'Postura neutra, paso relajado.'
  }
];

async function seedExercises() {
  await Promise.all(
    exercises.map((exercise: any) =>
      prisma.exercise.upsert({
        where: { name: exercise.name },
        update: exercise,
        create: exercise
      })
    )
  );
}

async function seedDemoUser() {
  const demoEmail = 'demo@kairos.fit';
  const passwordHash = await bcrypt.hash('DemoPass123!', 12);

  const user: any = await prisma.user.upsert({
    where: { email: demoEmail },
    update: { passwordHash },
    create: {
      email: demoEmail,
      name: 'Demo Kairos',
      passwordHash,
      profile: {
        create: {
          trainingMax: 140,
          progressionRule: 'VOLUME'
        }
      }
    }
  });

  let plan = await prisma.plan.findFirst({ where: { userId: user.id } });
  if (!plan) {
    const allExercises = await prisma.exercise.findMany();
    const exerciseMap: Map<string, any> = new Map(
      allExercises.map((exercise: any) => [exercise.name, exercise])
    );

    const templates = [
      {
        title: 'Fuerza Inferior',
        description: 'Enfoque en patrones dominantes de cadera y rodilla.',
        exercises: ['Back Squat con Barra', 'Peso Muerto Rumano', 'Hip Thrust']
      },
      {
        title: 'Empuje Superior',
        description: 'Pecho, hombros y tríceps.',
        exercises: ['Press Banca', 'Press Inclinado con Mancuernas', 'Press Militar']
      },
      {
        title: 'Tracción Superior',
        description: 'Espalda y bíceps.',
        exercises: ['Dominadas', 'Remo con Barra', 'Face Pull']
      },
      {
        title: 'Metabólico y Core',
        description: 'Acondicionamiento y estabilidad.',
        exercises: ['Bike Assault', 'Plancha con Arrastre', 'Press Pallof']
      }
    ];

    const baseDate = subWeeks(new Date(), 8);
    const workoutsData = [] as {
      title: string;
      description: string;
      scheduledAt: Date;
      completedAt: Date | null;
      microcycle: number;
      mesocycle: number;
      rpeTarget: number;
      restSeconds: number;
      exercises: {
        create: Array<{
          exerciseId: string;
          order: number;
          targetSets: number;
          targetReps: number;
          restSeconds: number;
          rpeTarget: number;
        }>;
      };
    }[];

    for (let week = 0; week < 8; week += 1) {
      for (let session = 0; session < templates.length; session += 1) {
        const template = templates[session];
        const scheduledAt = addDays(baseDate, week * 7 + session * 2);
        const completedAt = scheduledAt < new Date() ? addHours(scheduledAt, 1) : null;

        workoutsData.push({
          title: `${template.title} Semana ${week + 1}`,
          description: template.description,
          scheduledAt,
          completedAt,
          microcycle: (week % 4) + 1,
          mesocycle: Math.floor(week / 4) + 1,
          rpeTarget: session === 3 ? 6.5 : 8,
          restSeconds: session === 3 ? 60 : 120,
          exercises: {
            create: template.exercises.map((name: string, index: number) => {
              const exercise = exerciseMap.get(name) as any;
              if (!exercise) throw new Error(`Ejercicio faltante en seed: ${name}`);
              return {
                exerciseId: exercise.id,
                order: index,
                targetSets: 4,
                targetReps: session === 3 ? 12 : 8,
                restSeconds: session === 3 ? 60 : 120,
                rpeTarget: session === 3 ? 6.5 : 8
              };
            })
          }
        });
      }
    }

    plan = await prisma.plan.create({
      data: {
        userId: user.id,
        goal: 'hipertrofia',
        microcycleLength: 4,
        mesocycleWeeks: 8,
        progressionRule: 'VOLUME',
        trainingMax: 140,
        workouts: { create: workoutsData }
      }
    });
  }

  const planWorkouts: any[] = await prisma.workout.findMany({
    where: { planId: plan.id },
    include: { exercises: true }
  });

  await prisma.demoAccount.upsert({
    where: { userId: user.id },
    update: {
      expiresAt: addWeeks(new Date(), 1),
      seedVersion: 'v1'
    },
    create: {
      userId: user.id,
      expiresAt: addWeeks(new Date(), 1),
      seedVersion: 'v1'
    }
  });

  await prisma.adherenceMetric.deleteMany({ where: { planId: plan.id } });
  await prisma.workoutSet.deleteMany({ where: { workoutId: { in: planWorkouts.map((w) => w.id) } } });

  const adherenceValues = [0.92, 0.87, 0.95, 0.9, 0.88, 0.93, 0.96, 0.91];

  for (const [index, workout] of planWorkouts.entries()) {
    const adherence = adherenceValues[index % adherenceValues.length];
    await prisma.adherenceMetric.create({
      data: {
        planId: plan.id,
        workoutId: workout.id,
        adherence
      }
    });

    for (const workoutExercise of workout.exercises) {
      const baseWeight = 60 + index * 0.5 + workoutExercise.order * 2;
      await prisma.workoutSet.create({
        data: {
          workoutId: workout.id,
          exerciseId: workoutExercise.exerciseId,
          weight: Number((baseWeight * adherence).toFixed(1)),
          reps: workoutExercise.targetReps + (adherence > 0.9 ? 1 : 0),
          rpe: adherence > 0.9 ? 8.5 : 7.5,
          rir: adherence > 0.9 ? 1 : 2,
          restSeconds: workoutExercise.restSeconds,
          notes: adherence > 0.9 ? 'Sesión sólida, avanzar carga.' : 'Mantener carga estable.'
        }
      });
    }
  }

  await prisma.bodyMetric.deleteMany({ where: { userId: user.id } });

  const metrics: { date: Date; weightKg: number; bodyFat: number }[] = [];
  const metricStart = subWeeks(new Date(), 11);
  for (let week = 0; week < 12; week += 1) {
    const fluctuation = Math.sin(week / 2) * 0.2; // variación suave
    metrics.push({
      date: addWeeks(metricStart, week),
      weightKg: Number((82 - week * 0.35 + fluctuation).toFixed(1)),
      bodyFat: Number((18 - week * 0.25 + fluctuation / 2).toFixed(1))
    });
  }

  await prisma.bodyMetric.createMany({
    data: metrics.map((metric: any) => ({
      userId: user.id,
      date: metric.date,
      weightKg: metric.weightKg,
      bodyFat: metric.bodyFat
    }))
  });
}

async function main() {
  console.log('Seeding exercises...');
  await seedExercises();
  console.log('Seeding demo user and history...');
  await seedDemoUser();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
