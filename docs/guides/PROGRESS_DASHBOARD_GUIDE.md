# 📊 Dashboard de Progreso Kairos - Guía Completa

Dashboard completo de progreso con gráficos Recharts, métricas en tiempo real y estilo minimalista Kairos.

---

## 🎯 Características Implementadas

### ✅ **Gráficos con Recharts**
1. **Peso Corporal** - LineChart con múltiples métricas
2. **1RM Estimado** - LineChart multi-ejercicio con gradientes
3. **Volumen Semanal** - BarChart con gradientes
4. **Adherencia** - AreaChart con análisis de tendencias

### ✅ **Cards de Métricas**
- Peso Actual
- Grasa Corporal
- Adherencia
- Volumen Semanal

### ✅ **Personal Records**
- Squat 1RM
- Bench 1RM
- Deadlift 1RM
- Volumen Máximo
- Racha Más Larga

### ✅ **Datos Reales de Supabase/Prisma**
- Body Metrics
- Strength Metrics
- Workout Sets
- Adherence Metrics
- Calculated PRs

---

## 📁 Estructura de Archivos

```
src/
├── app/
│   ├── actions/
│   │   └── progress-actions.ts           # Server Actions (Prisma + Supabase)
│   └── progress-new/
│       └── page.tsx                       # Dashboard principal
├── components/
│   └── progress/
│       ├── body-weight-chart.tsx          # Gráfico de peso corporal
│       ├── strength-chart.tsx             # Gráfico de 1RM
│       ├── volume-chart.tsx               # Gráfico de volumen
│       ├── adherence-chart.tsx            # Gráfico de adherencia
│       ├── stats-cards.tsx                # Cards de métricas actuales
│       └── personal-records-card.tsx      # Card de PRs

Documentación:
└── PROGRESS_DASHBOARD_GUIDE.md            # Este archivo
```

---

## 🚀 Server Actions

### `getProgressData()`

**Archivo**: `src/app/actions/progress-actions.ts`

**Función principal** que obtiene todos los datos de progreso del usuario:

```typescript
export async function getProgressData(): Promise<ProgressMetrics | null>
```

**Retorna**:
```typescript
{
  bodyWeight: BodyWeightData[];      // Peso, grasa, músculo
  strength: StrengthData[];          // 1RM por ejercicio y fecha
  volume: VolumeData[];              // Volumen semanal
  adherence: AdherenceData[];        // Adherencia por semana
  personalRecords: PersonalRecords;  // PRs calculados
  currentStats: {                    // Stats actuales
    weight: number;
    bodyFat: number;
    adherenceRate: number;
    weeklyVolume: number;
  };
}
```

**Queries a Prisma**:
1. `bodyMetric.findMany()` - Métricas corporales (12 semanas)
2. `strengthMetric.findMany()` - Métricas de fuerza
3. `plan.findFirst()` con `workouts` - Plan activo con workouts
4. Cálculos de volumen por semana
5. Cálculos de adherencia por semana
6. Cálculos de PRs

---

## 📊 Componentes de Gráficos

### 1. BodyWeightChart

**Archivo**: `src/components/progress/body-weight-chart.tsx`

**Props**:
```typescript
interface BodyWeightChartProps {
  data: BodyWeightData[];
}
```

**Características**:
- ✅ LineChart con 3 líneas (peso, grasa%, músculo)
- ✅ Gradientes suaves para fill
- ✅ Colores: Blue (peso), Amber (grasa), Green (músculo)
- ✅ Tooltip customizado
- ✅ Legend con iconos circulares
- ✅ Responsive 100% width, 300px height

**Uso**:
```tsx
<BodyWeightChart data={progressData.bodyWeight} />
```

### 2. StrengthChart

**Archivo**: `src/components/progress/strength-chart.tsx`

**Props**:
```typescript
interface StrengthChartProps {
  data: StrengthData[];
}
```

**Características**:
- ✅ LineChart multi-ejercicio (hasta 5 ejercicios)
- ✅ Agrupa datos por ejercicio automáticamente
- ✅ Colores específicos por ejercicio
- ✅ Cards debajo del gráfico con 1RM actual
- ✅ Muestra % de mejora
- ✅ connectNulls para datos faltantes

**Ejercicios Tracked**:
- Back Squat con Barra (#3B82F6)
- Press Banca (#10B981)
- Peso Muerto Rumano (#F59E0B)
- Press Militar (#8B5CF6)
- Dominadas (#EC4899)

**Uso**:
```tsx
<StrengthChart data={progressData.strength} />
```

### 3. VolumeChart

**Archivo**: `src/components/progress/volume-chart.tsx`

**Props**:
```typescript
interface VolumeChartProps {
  data: VolumeData[];
}
```

**Características**:
- ✅ BarChart con gradiente vertical
- ✅ Colores alternados en barras
- ✅ Stats debajo: Total Series, Total Reps, Promedio Semanal
- ✅ Tooltips con formato de miles (15k kg)
- ✅ Bordes redondeados en barras

**Uso**:
```tsx
<VolumeChart data={progressData.volume} />
```

### 4. AdherenceChart

**Archivo**: `src/components/progress/adherence-chart.tsx`

**Props**:
```typescript
interface AdherenceChartProps {
  data: AdherenceData[];
}
```

**Características**:
- ✅ AreaChart con gradiente green
- ✅ Cálculo de adherencia promedio
- ✅ Análisis de tendencia (up/down/stable)
- ✅ Icono de tendencia (TrendingUp/Down/Minus)
- ✅ Cards de completadas vs programadas
- ✅ Domain fijo 0-100%

**Uso**:
```tsx
<AdherenceChart data={progressData.adherence} />
```

---

## 🎨 Cards de Métricas

### StatsCards

**Archivo**: `src/components/progress/stats-cards.tsx`

**4 Cards con gradientes**:

| Métrica | Icono | Color |
|---------|-------|-------|
| Peso Actual | Weight | Blue |
| Grasa Corporal | TrendingUp | Amber |
| Adherencia | Target | Green |
| Volumen Semanal | Flame | Purple |

**Diseño**:
- ✅ Grid responsive: 1 col (mobile) → 4 col (desktop)
- ✅ Iconos en círculo con gradiente de fondo
- ✅ Hover con shadow-md
- ✅ Valores grandes y legibles

**Uso**:
```tsx
<StatsCards currentStats={progressData.currentStats} />
```

### PersonalRecordsCard

**Archivo**: `src/components/progress/personal-records-card.tsx`

**5 PRs**:
- Squat 1RM (Blue)
- Bench 1RM (Green)
- Deadlift 1RM (Amber)
- Volumen Máximo (Purple)
- Racha Más Larga (Pink)

**Diseño**:
- ✅ Card grande con grid de 5 columnas
- ✅ Iconos grandes centrados
- ✅ Gradiente suave de fondo
- ✅ Hover con border

**Uso**:
```tsx
<PersonalRecordsCard records={progressData.personalRecords} />
```

---

## 🎨 Estilo Minimalista Kairos

### Paleta de Colores

```typescript
// Gradientes principales
from-blue-50 via-indigo-50 to-purple-50  // Hero section
from-blue-500 to-indigo-600              // CTA footer

// Colores por métrica
#3B82F6  // Blue - Peso, Squat
#10B981  // Green - Adherencia, Bench, Músculo
#F59E0B  // Amber - Grasa, Deadlift
#8B5CF6  // Purple - Volumen
#EC4899  // Pink - Racha
```

### Gradientes en Gráficos

Todos los gráficos usan gradientes con `linearGradient`:

```tsx
<defs>
  <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
  </linearGradient>
</defs>
```

### Componentes Recharts Styled

- **CartesianGrid**: Dashed, gray, opacity 0.5
- **XAxis/YAxis**: No tickLine, no axisLine, gray stroke
- **Tooltip**: White background, gray border, rounded, shadow
- **Legend**: Circle icons, padding top 20px

---

## 📖 Dashboard Principal

### Archivo: `src/app/progress-new/page.tsx`

**Layout**:
```
┌─────────────────────────────────────────────────────┐
│ Hero Section (Gradiente)                            │
├─────────────────────────────────────────────────────┤
│ Stats Cards (4 columnas)                            │
├─────────────────────────────────────────────────────┤
│ Personal Records (1 fila)                           │
├─────────────────────────────────────────────────────┤
│ BodyWeight Chart  │  Strength Chart                 │
├─────────────────────────────────────────────────────┤
│ Volume Chart      │  Adherence Chart                │
├─────────────────────────────────────────────────────┤
│ CTA Footer (Gradiente azul)                         │
└─────────────────────────────────────────────────────┘
```

**Secciones**:

1. **Hero** - Gradiente suave con grid pattern
2. **Stats Cards** - 4 métricas actuales
3. **PRs** - 5 personal records
4. **Gráficos Principales** - 2 columnas (peso + fuerza)
5. **Gráficos Secundarios** - 2 columnas (volumen + adherencia)
6. **CTA** - Call to action para entrenar

**Loading State**:
- Skeleton con animate-pulse
- Loader spinner centrado
- Gradientes grises

**Empty State**:
- Icono de gráficos
- Mensaje claro
- CTA a login

---

## 🧪 Testing

### 1. Con Datos del Seed

```bash
# Seed la base de datos
pnpm db:seed

# Iniciar servidor
pnpm dev

# Visitar
http://localhost:3000/progress-new
```

**Debe mostrar**:
- ✅ Hero con fecha actual
- ✅ 4 stats cards con datos reales
- ✅ PRs calculados (Squat: 140kg, etc.)
- ✅ Gráfico de peso con 8 semanas
- ✅ Gráfico de 1RM con progresión
- ✅ Volumen por semana
- ✅ Adherencia ~91%

### 2. Sin Sesión

```bash
# Visitar sin login
http://localhost:3000/progress-new
```

**Debe mostrar**:
- ✅ Empty state
- ✅ Mensaje "Sin Datos Disponibles"
- ✅ Botón "Iniciar Sesión"

### 3. Responsive

**Mobile** (< 768px):
- ✅ Stats cards: 1 columna
- ✅ Gráficos: 1 columna
- ✅ PRs: 2 columnas

**Tablet** (768px - 1024px):
- ✅ Stats cards: 2 columnas
- ✅ Gráficos: 1 columna
- ✅ PRs: 3 columnas

**Desktop** (> 1024px):
- ✅ Stats cards: 4 columnas
- ✅ Gráficos: 2 columnas
- ✅ PRs: 5 columnas

---

## 🔧 Customización

### Cambiar Colores

**En cada componente**:
```typescript
// body-weight-chart.tsx
<Line stroke="#3B82F6" ... />  // Cambiar color de línea

// En gradientes
<stop offset="5%" stopColor="#3B82F6" ... />
```

### Ajustar Período de Datos

**En progress-actions.ts**:
```typescript
const twelveWeeksAgo = subWeeks(new Date(), 12);  // Cambiar a 8, 16, etc.
```

### Agregar Nuevas Métricas

1. **Actualizar tipos** en `progress-actions.ts`
2. **Query adicional** en `getProgressData()`
3. **Crear componente** de gráfico
4. **Agregar al dashboard** en `progress-new/page.tsx`

---

## 📊 Datos Calculados

### 1RM Estimation (Epley Formula)

```typescript
oneRepMax = weight * (1 + reps / 30)
```

### Adherencia

```typescript
adherence = (completed / planned) * 100
```

### Volumen

```typescript
volume = weight * reps  // Por set
weeklyVolume = sum(volume por semana)
```

### Tendencia

```typescript
// Primera mitad vs segunda mitad
firstAvg = avg(firstHalf)
secondAvg = avg(secondHalf)
trend = secondAvg > firstAvg ? 'up' : 'down'
```

---

## 🚨 Troubleshooting

### No se muestran gráficos

**Causa**: Datos vacíos o null

**Solución**:
```bash
# Re-seed la base de datos
pnpm db:seed

# Verificar en Prisma Studio
pnpm prisma studio
```

### Gráficos deformados

**Causa**: ResponsiveContainer no renderiza correctamente

**Solución**:
```tsx
// Asegurar height fijo
<ResponsiveContainer width="100%" height={300}>
```

### Colores no se ven

**Causa**: Gradientes no definidos o IDs duplicados

**Solución**:
```tsx
// IDs únicos en cada defs
<linearGradient id="uniqueId" ...>
```

### Server Action falla

**Causa**: Usuario no autenticado

**Solución**:
```typescript
// Verificar session
const session = await getServerSession(authOptions);
if (!session?.user?.id) return null;
```

---

## 🎯 Próximas Mejoras

1. **Filtros de Fecha**: Selector de rango (4w, 8w, 12w, 6m, 1y)
2. **Export CSV**: Botón para exportar datos
3. **Comparación**: Ver 2 períodos lado a lado
4. **Metas**: Agregar líneas de meta en gráficos
5. **Predicciones**: ML para predecir progreso futuro
6. **Animaciones**: Framer Motion en transitions
7. **Dark Mode**: Ajustar colores para tema oscuro

---

## 📚 Recursos

- [Recharts Docs](https://recharts.org/en-US/)
- [Prisma Docs](https://www.prisma.io/docs)
- [Tailwind Gradients](https://tailwindcss.com/docs/gradient-color-stops)
- [Lucide Icons](https://lucide.dev)

---

**¡Dashboard de Progreso Completado!** 🎉

Visita `http://localhost:3000/progress-new` para ver tu progreso en acción.
