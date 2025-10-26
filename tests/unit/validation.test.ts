import { planPreferencesSchema } from '@/lib/validation/plan';
import { loginSchema } from '@/lib/validation/auth';

describe('validation schemas', () => {
  it('valida preferencias de plan', () => {
    const result = planPreferencesSchema.safeParse({
      userId: 'ck1234567890abcdef',
      goal: 'hipertrofia',
      frequency: 4,
      experience: 'intermedio',
      availableEquipment: ['Barra'],
      restrictions: []
    });
    expect(result.success).toBe(true);
  });

  it('rechaza login inválido', () => {
    const result = loginSchema.safeParse({ email: 'no-email', password: 'short' });
    expect(result.success).toBe(false);
  });
});
