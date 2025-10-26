import { NextResponse } from 'next/server';
import { prisma } from '@/lib/clients/prisma';
import { hashPassword } from '@/lib/auth/password';
import { createPlan } from '@/server/actions/plan';
import { trackServer } from '@/lib/analytics/server';
import * as Sentry from '@sentry/nextjs';

export async function POST() {
  try {
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

    const plan = await prisma.plan.findFirst({ where: { userId: user.id } });
    if (!plan) {
      await createPlan({
        userId: user.id,
        goal: 'hipertrofia',
        frequency: 4,
        experience: 'intermedio',
        availableEquipment: ['mancuernas', 'barra', 'máquinas'],
        restrictions: []
      });
    }

    await trackServer('demo_signup');
    return NextResponse.json({ email, password: plain });
  } catch (err) {
    Sentry.captureException(err);
    return NextResponse.json({ error: 'bootstrap_failed' }, { status: 500 });
  }
}