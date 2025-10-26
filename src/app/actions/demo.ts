'use server';

import { prisma } from '@/lib/clients/prisma';
import { hashPassword } from '@/lib/auth/password';
import { createPlan, nextWorkout } from '@/app/actions/plan';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function bootstrapDemo() {
  const email = 'demo@kairos.test';
  const plain = 'demopass123';
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    const passwordHash = await hashPassword(plain);
    user = await prisma.user.create({
      data: {
        email,
        name: 'Demo User',
        passwordHash
      }
    });
  }

  const plan = await prisma.plan.findFirst({
    where: { userId: user.id },
    include: { workouts: { include: { exercises: true } } }
  });
  if (!plan || plan.workouts.every((w) => w.exercises.length === 0)) {
    if (plan) {
      await prisma.plan.delete({ where: { id: plan.id } });
    }
    await createPlan({
      userId: user.id,
      goal: 'hipertrofia',
      frequency: 4,
      experience: 'intermedio',
      availableEquipment: ['mancuernas', 'barra', 'máquinas'],
      restrictions: []
    });
  }

  return { email, password: plain };
}

export async function startDemoFlow() {
  // Asegurar usuario y plan demo
  const { email } = await bootstrapDemo();
  const demoUser = await prisma.user.findUnique({ where: { email } });
  if (!demoUser) throw new Error('No se pudo crear usuario demo');

  // Marcar cookie demo para páginas que permiten flujo sin NextAuth
  cookies().set('x-demo', '1', {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60
  });

  // Obtener próxima sesión y redirigir a editor
  const { workoutId } = await nextWorkout(demoUser.id);
  redirect(`/workout/${workoutId}`);
}