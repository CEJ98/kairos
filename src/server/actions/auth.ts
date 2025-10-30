"use server";

import { randomUUID } from "crypto";
import { addDays } from "date-fns";

import { prisma } from "@/lib/clients/prisma";
import { hashPassword } from "@/lib/auth/password";
import { registerSchema } from "@/lib/validation/auth";
import { METRICS } from "@/lib/config/constants";
import { ipLimiter } from "@/lib/cache/rate-limit";

type ExerciseLite = { id: string; muscleGroup: string };

export async function registerUser(raw: unknown) {
  const input = registerSchema.parse(raw);

  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new Error('Ya existe un usuario con ese correo');
  }

  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: {
      email: input.email,
      name: input.name,
      passwordHash,
      profile: {
        create: {
          progressionRule: 'VOLUME',
          trainingMax: 100
        }
      }
    }
  });

  return { id: user.id, email: user.email };
}

export async function createDemoAccount() {
  await ipLimiter.limit("demo-account");

  const email = `demo-${randomUUID()}@kairos.fit`;
  const password = `Demo-${Math.random().toString(36).slice(-8)}`;
  const passwordHash = await hashPassword(password);

  const exercises: ExerciseLite[] = await prisma.exercise.findMany({ take: 9 });
  if (!exercises.length) {
    throw new Error('Se requieren ejercicios seed para crear el demo. Ejecuta prisma seed.');
  }

  const [lower, push, pull] = [
    exercises.filter((ex: ExerciseLite) => ex.muscleGroup === 'Piernas').slice(0, 3),
    exercises
      .filter((ex: ExerciseLite) => ex.muscleGroup === 'Pectoral' || ex.muscleGroup === 'Hombros')
      .slice(0, 3),
    exercises.filter((ex: ExerciseLite) => ex.muscleGroup === 'Espalda' || ex.muscleGroup === 'Bíceps').slice(0, 3)
  ];

  const user = await prisma.user.create({
    data: {
      email,
      name: 'Cuenta Demo',
      passwordHash,
      profile: {
        create: {
          trainingMax: 120,
          progressionRule: 'INTENSITY'
        }
      },
      plans: {
        create: {
          goal: 'hipertrofia',
          microcycleLength: 4,
          mesocycleWeeks: 8,
          progressionRule: 'VOLUME',
          trainingMax: 120,
          workouts: {
            create: [
              {
                title: 'Lower Power',
                scheduledAt: addDays(new Date(), 1),
                microcycle: 1,
                mesocycle: 1,
                rpeTarget: 8,
                restSeconds: 150,
                exercises: {
                  create: lower.map((exercise: ExerciseLite, order: number) => ({
                    exerciseId: exercise.id,
                    order,
                    targetSets: 4,
                    targetReps: 6,
                    restSeconds: 150,
                    rpeTarget: 8
                  }))
                }
              },
              {
                title: 'Upper Push',
                scheduledAt: addDays(new Date(), 3),
                microcycle: 1,
                mesocycle: 1,
                rpeTarget: 7.5,
                restSeconds: 120,
                exercises: {
                  create: push.map((exercise: ExerciseLite, order: number) => ({
                    exerciseId: exercise.id,
                    order,
                    targetSets: 3,
                    targetReps: 10,
                    restSeconds: 120,
                    rpeTarget: 7.5
                  }))
                }
              },
              {
                title: 'Upper Pull',
                scheduledAt: addDays(new Date(), 5),
                microcycle: 1,
                mesocycle: 1,
                rpeTarget: 7,
                restSeconds: 110,
                exercises: {
                  create: pull.map((exercise: ExerciseLite, order: number) => ({
                    exerciseId: exercise.id,
                    order,
                    targetSets: 3,
                    targetReps: 8,
                    restSeconds: 110,
                    rpeTarget: 7
                  }))
                }
              }
            ]
          }
        }
      },
      demoAccount: {
        create: {
          expiresAt: addDays(new Date(), METRICS.demoExpirationDays),
          seedVersion: 'v1'
        }
      }
    }
  });

  await prisma.bodyMetric.create({
    data: {
      userId: user.id,
      weight: 80,
      bodyFat: 18
    }
  });

  return { email, password };
}
