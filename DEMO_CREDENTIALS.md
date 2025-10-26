# 🎯 Credenciales de Cuenta Demo

## Acceso Rápido

**Email**: `demo@kairos.fit`
**Contraseña**: `DemoPass123!`

## Datos Incluidos

La cuenta demo viene pre-cargada con:

### 👤 Usuario
- **Nombre**: Demo Kairos
- **Email**: demo@kairos.fit
- **Training Max**: 140kg
- **Regla de progresión**: VOLUME

### 📊 Plan de Entrenamiento
- **Objetivo**: Hipertrofia
- **Duración**: 8 semanas (completadas)
- **Mesociclo**: 8 semanas
- **Microciclo**: 4 semanas

### 💪 Workouts (32 sesiones totales)
- **8 semanas** x **4 sesiones/semana** = 32 workouts
- Distribución:
  - Fuerza Inferior (8 sesiones)
  - Empuje Superior (8 sesiones)
  - Tracción Superior (8 sesiones)
  - Metabólico y Core (8 sesiones)

### 🏋️ Ejercicios por Sesión

**Fuerza Inferior**:
- Back Squat con Barra
- Peso Muerto Rumano
- Hip Thrust

**Empuje Superior**:
- Press Banca
- Press Inclinado con Mancuernas
- Press Militar

**Tracción Superior**:
- Dominadas
- Remo con Barra
- Face Pull

**Metabólico y Core**:
- Bike Assault
- Plancha con Arrastre
- Press Pallof

### 📈 Progreso Histórico

**Body Metrics (8 semanas)**:
- Peso corporal
- Grasa corporal
- Músculo
- IMC

**Strength Metrics**:
- Squat 1RM: Progresión de 100kg → 140kg
- Bench 1RM: Progresión de 80kg → 100kg
- Deadlift 1RM: Progresión de 120kg → 160kg

**Volume Metrics**:
- Volumen total semanal
- Volumen por grupo muscular
- Adherencia: 88-96%

### 📅 Calendario
- **Adherencia promedio**: 91%
- **Sesiones completadas**: ~29/32
- **Workouts programados**: Distribuidos en los últimos 56 días

## Auto-Login desde UI

Los siguientes botones inician sesión automáticamente con estas credenciales:

1. **Landing Page** (`/`): Botón "Probar Demo"
2. **Auth Page** (`/auth`): Botón "Cuenta Demo"

## Flujo Demo

Después del auto-login, el usuario es redirigido a:

```
/demo → /dashboard → /workout → /progress → /calendar
```

## Seed del Demo

Para recrear los datos:

```bash
pnpm db:seed
```

O manualmente en Prisma Studio:

```bash
pnpm prisma studio
```

## Estructura de Datos Generados

```typescript
{
  user: {
    email: "demo@kairos.fit",
    name: "Demo Kairos",
    passwordHash: "bcrypt.hash('DemoPass123!', 12)",
    profile: {
      trainingMax: 140,
      progressionRule: "VOLUME"
    }
  },
  plan: {
    goal: "hipertrofia",
    microcycleLength: 4,
    mesocycleWeeks: 8,
    progressionRule: "VOLUME",
    trainingMax: 140,
    workouts: [32 sesiones]
  },
  bodyMetrics: [
    // 8 semanas de datos
    { weight, bodyFat, muscleMass, bmi }
  ],
  strengthMetrics: [
    // 8 semanas de PRs
    { squat1RM, bench1RM, deadlift1RM, totalVolume }
  ],
  adherenceMetrics: [
    // 32 valores entre 0.87-0.96
  ],
  workoutSets: [
    // Sets completados para cada workout
  ]
}
```

## Testing

Para probar el demo:

1. **Iniciar servidor**:
   ```bash
   pnpm dev
   ```

2. **Seed la base de datos**:
   ```bash
   pnpm db:seed
   ```

3. **Visitar**:
   - http://localhost:3000/ → Click "Probar Demo"
   - http://localhost:3000/auth → Click "Cuenta Demo"

4. **Verificar**:
   - ✓ Login automático exitoso
   - ✓ Redirección a /demo
   - ✓ Dashboard con datos
   - ✓ Workouts navegables
   - ✓ Progreso visible
   - ✓ Calendario poblado

## Notas

- **Expiración**: La cuenta demo expira en 1 semana (renovable con re-seed)
- **Seed Version**: v1
- **Password Hash**: bcrypt con 12 rounds
- **Datos históricos**: Últimas 8 semanas desde hoy

---

**¡Listo para mostrar a usuarios!** 🚀

Usa estas credenciales para demostrar todas las funcionalidades de Kairos Fitness.
