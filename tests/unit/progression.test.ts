import { computeProgressionAdjustments } from '@/server/services/progression';

function epley(weight: number, reps: number) {
  return Number((weight * (1 + reps / 30)).toFixed(1));
}

describe('computeProgressionAdjustments', () => {
  it('incrementa intensidad con alta adherencia', () => {
    const history = [
      {
        date: new Date().toISOString(),
        exerciseId: 'exercise-1',
        weight: 100,
        reps: 5,
        rpe: 8,
        adherence: 0.95
      }
    ];

    const [adjustment] = computeProgressionAdjustments(history, 'INTENSITY');
    expect(adjustment.targetWeight).toBeGreaterThan(100);
    expect(adjustment.targetReps).toBe(5);
  });

  it('incrementa repeticiones cuando la regla es volumen', () => {
    const history = [
      {
        date: new Date().toISOString(),
        exerciseId: 'exercise-1',
        weight: 60,
        reps: 10,
        rpe: 7,
        adherence: 0.8
      }
    ];

    const [adjustment] = computeProgressionAdjustments(history, 'VOLUME');
    expect(adjustment.targetReps).toBeGreaterThan(10);
  });

  it('1RM (Epley) se calcula correctamente para muestra simple', () => {
    expect(epley(100, 5)).toBeCloseTo(116.7, 1);
    expect(epley(80, 10)).toBeCloseTo(106.7, 1);
  });

  it('alta adherencia mantiene o aumenta intensidad; baja la reduce', () => {
    const good = [
      { date: new Date().toISOString(), exerciseId: 'ex-1', weight: 100, reps: 5, rpe: 8, adherence: 0.95 }
    ];
    const poor = [
      { date: new Date().toISOString(), exerciseId: 'ex-1', weight: 100, reps: 5, rpe: 8, adherence: 0.5 }
    ];

    const [up] = computeProgressionAdjustments(good, 'INTENSITY');
    const [down] = computeProgressionAdjustments(poor, 'INTENSITY');

    expect(up.targetWeight).toBeGreaterThanOrEqual(100);
    expect(down.targetWeight).toBeLessThanOrEqual(up.targetWeight);
  });

  it('volumen semanal agregado aumenta con más sets', () => {
    const sets = [
      { date: new Date().toISOString(), exerciseId: 'ex-1', weight: 50, reps: 10, rpe: 7, adherence: 0.9 },
      { date: new Date().toISOString(), exerciseId: 'ex-1', weight: 50, reps: 10, rpe: 7, adherence: 0.9 }
    ];
    const [adjA] = computeProgressionAdjustments([sets[0]], 'VOLUME');
    const [adjB] = computeProgressionAdjustments(sets, 'VOLUME');
    // Con más historial, la progresión tenderá a proponer igual o mayor carga/repeticiones
    expect(adjB.targetReps * adjB.targetWeight).toBeGreaterThanOrEqual(adjA.targetReps * adjA.targetWeight);
  });
});
