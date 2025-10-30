'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { prisma } from '@/lib/clients/prisma';
import { bodyMetricSchema, progressPhotosSchema } from '@/lib/validation/body-metrics';
import { uploadObject } from '@/lib/clients/supabase-storage';

export async function addBodyMetric(form: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error('Not authenticated');

  const raw = {
    date: form.get('date') ? new Date(String(form.get('date'))) : undefined,
    weight: form.get('weight') ? Number(form.get('weight')) : undefined,
    bodyFat: form.get('bodyFat') ? Number(form.get('bodyFat')) : undefined,
    neckCm: form.get('neckCm') ? Number(form.get('neckCm')) : undefined,
    waist: form.get('waist') ? Number(form.get('waist')) : undefined,
    hips: form.get('hips') ? Number(form.get('hips')) : undefined,
  };

  const parsed = bodyMetricSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map(i => i.message).join(', '));
  }

  const { date, ...data } = parsed.data;
  const created = await prisma.bodyMetric.create({
    data: {
      userId: session.user.id,
      date: date ?? new Date(),
      ...data,
    },
  });

  return created;
}

export async function listBodyMetrics(weeks: number = 12) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];

  const from = new Date();
  from.setDate(from.getDate() - weeks * 7);

  return prisma.bodyMetric.findMany({
    where: { userId: session.user.id, date: { gte: from } },
    orderBy: { date: 'asc' },
  });
}

export async function uploadProgressPhotos(form: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error('Not authenticated');

  const note = form.get('note')?.toString();
  const dateStr = form.get('date')?.toString();
  const date = dateStr ? new Date(dateStr) : new Date();

  const parsed = progressPhotosSchema.safeParse({ date, note });
  if (!parsed.success) throw new Error(parsed.error.issues.map(i => i.message).join(', '));

  const front = form.get('front') as File | null;
  const side = form.get('side') as File | null;
  const back = form.get('back') as File | null;

  let frontUrl: string | undefined;
  let sideUrl: string | undefined;
  let backUrl: string | undefined;

  const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'progress-photos';
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (front && front.size > 0) {
    const path = `photos/${session.user.id}/${date.toISOString()}-front-${front.name}`;
    const mime = front.type || 'image/jpeg';
    const buf = new Uint8Array(await front.arrayBuffer());
    await uploadObject({ bucket, path, mime, body: buf });
    frontUrl = `${baseUrl}/storage/v1/object/public/${bucket}/${path}`;
  }
  if (side && side.size > 0) {
    const path = `photos/${session.user.id}/${date.toISOString()}-side-${side.name}`;
    const mime = side.type || 'image/jpeg';
    const buf = new Uint8Array(await side.arrayBuffer());
    await uploadObject({ bucket, path, mime, body: buf });
    sideUrl = `${baseUrl}/storage/v1/object/public/${bucket}/${path}`;
  }
  if (back && back.size > 0) {
    const path = `photos/${session.user.id}/${date.toISOString()}-back-${back.name}`;
    const mime = back.type || 'image/jpeg';
    const buf = new Uint8Array(await back.arrayBuffer());
    await uploadObject({ bucket, path, mime, body: buf });
    backUrl = `${baseUrl}/storage/v1/object/public/${bucket}/${path}`;
  }

  const created = await (prisma as any).progressPhoto.create({
    data: {
      userId: session.user.id,
      date,
      frontUrl,
      sideUrl,
      backUrl,
      note,
    },
  });

  return created;
}

export async function listProgressPhotos(limit = 12) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];

  return (prisma as any).progressPhoto.findMany({
    where: { userId: session.user.id },
    orderBy: { date: 'desc' },
    take: limit,
  });
}