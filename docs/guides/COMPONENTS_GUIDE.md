# Guía de Componentes - Kairos Fitness

Esta guía documenta los componentes principales construidos con TSX, Tailwind CSS y shadcn/ui.

## 📦 Componentes Implementados

### 1. WorkoutEditor

**Ubicación:** `src/components/workout/workout-editor.tsx`

**Descripción:** Editor completo de entrenamientos que permite registrar sets en tiempo real con edición en vivo.

**Características:**
- ✅ Edición de peso (+/- 2.5 kg)
- ✅ Edición de repeticiones (+/- 1 rep)
- ✅ Edición de RPE (+/- 0.5)
- ✅ Marcado de sets como completados
- ✅ Temporizador de descanso configurable
- ✅ Navegación entre ejercicios con tabs
- ✅ Visualización de progreso (sets completados/totales)
- ✅ Botones de guardar y reiniciar

**Uso:**
```tsx
import { WorkoutEditor } from '@/components/workout/workout-editor';

export default function WorkoutPage() {
  return <WorkoutEditor />;
}
```

**Props:** Ninguna (usa datos dummy internos)

**Estado Local:**
- `workout`: Datos del entrenamiento actual
- `activeExerciseIndex`: Índice del ejercicio activo
- `restTimer`: Temporizador de descanso en segundos

**Funciones Principales:**
- `updateSet(exerciseIndex, setId, updates)`: Actualiza un set
- `toggleSetComplete(exerciseIndex, setId)`: Marca/desmarca set completado
- `adjustWeight(exerciseIndex, setId, delta)`: Ajusta el peso
- `adjustReps(exerciseIndex, setId, delta)`: Ajusta las repeticiones
- `adjustRPE(exerciseIndex, setId, delta)`: Ajusta el RPE
- `startRestTimer(seconds)`: Inicia contador de descanso

### 2. ProgressGraph

**Ubicación:** `src/components/progress/progress-graph.tsx`

**Descripción:** Visualizador de gráficas de progreso con múltiples métricas usando Recharts.

**Características:**
- ✅ 5 métricas disponibles (peso, grasa, squat, bench, volumen)
- ✅ Gráfico de área con gradientes
- ✅ Cálculo automático de tendencias
- ✅ Stats cards (inicial, actual, cambio total)
- ✅ Análisis contextual por métrica
- ✅ Colores personalizados por métrica
- ✅ Responsive design

**Métricas Disponibles:**
1. **Peso Corporal** (kg) - Azul
2. **Grasa Corporal** (%) - Verde
3. **Sentadilla 1RM** (kg) - Naranja
4. **Press Banca 1RM** (kg) - Rojo
5. **Volumen Semanal** (kg) - Púrpura

**Uso:**
```tsx
import { ProgressGraph } from '@/components/progress/progress-graph';

export default function ProgressPage() {
  return <ProgressGraph />;
}
```

**Props:** Ninguna (usa datos dummy internos)

**Estado Local:**
- `activeMetric`: Métrica seleccionada actualmente

**Cálculos:**
- Cambio absoluto (valor final - valor inicial)
- Cambio porcentual ((cambio / inicial) * 100)
- Trending (positivo/negativo con contexto)

### 3. WorkoutCalendar

**Ubicación:** `src/components/calendar/workout-calendar.tsx`

**Descripción:** Calendario semanal reprogramable con drag & drop simulado.

**Características:**
- ✅ Vista de semana completa (Lun-Dom)
- ✅ Navegación por semanas (anterior/siguiente/hoy)
- ✅ Marcar entrenamientos como completados
- ✅ Reprogramar eventos (selección de nuevo día)
- ✅ Agregar nuevos eventos
- ✅ Eliminar eventos
- ✅ Resumen semanal (total, completados, adherencia)
- ✅ Highlight del día actual
- ✅ Estados visuales (completado/pendiente)

**Uso:**
```tsx
import { WorkoutCalendar } from '@/components/calendar/workout-calendar';

export default function CalendarPage() {
  return <WorkoutCalendar />;
}
```

**Props:** Ninguna (usa datos dummy internos)

**Estado Local:**
- `events`: Array de eventos del calendario
- `currentDate`: Fecha actual para navegación
- `selectedDate`: Fecha seleccionada
- `editingEvent`: ID del evento en modo edición

**Funciones Principales:**
- `getEventsForDate(date)`: Obtiene eventos de una fecha
- `rescheduleEvent(eventId, newDate)`: Mueve evento a nuevo día
- `toggleEventComplete(eventId)`: Marca/desmarca completado
- `deleteEvent(eventId)`: Elimina un evento
- `addNewEvent(date)`: Crea nuevo evento

### 4. DemoScreen

**Ubicación:** `src/components/demo/demo-screen.tsx`

**Descripción:** Pantalla de demostración con cards resumen (creado por linter).

**Características:**
- ✅ 3 cards de resumen (Próximo entrenamiento, Progreso, Semana)
- ✅ Datos de ejemplo estáticos
- ✅ Enlaces a navegación

**Uso:**
```tsx
import { DemoScreen } from '@/components/demo/demo-screen';

export default function DemoPage() {
  return <DemoScreen />;
}
```

## 🎨 Tipos TypeScript

**Ubicación:** `src/types/workout.ts`

```typescript
interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  equipment: string;
}

interface WorkoutSet {
  id: string;
  exerciseId: string;
  setNumber: number;
  weight: number;
  reps: number;
  rpe?: number;
  rir?: number;
  completed: boolean;
  notes?: string;
}

interface WorkoutExercise {
  id: string;
  exercise: Exercise;
  targetSets: number;
  targetReps: number;
  restSeconds: number;
  sets: WorkoutSet[];
}

interface Workout {
  id: string;
  title: string;
  description?: string;
  scheduledAt: Date;
  completedAt?: Date;
  exercises: WorkoutExercise[];
}

interface ProgressDataPoint {
  date: string;
  value: number;
  label?: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  completed: boolean;
  workoutId: string;
}
```

## 📊 Datos Dummy

**Ubicación:** `src/lib/dummy-data.ts`

**Exports:**
- `DUMMY_EXERCISES`: 8 ejercicios de ejemplo
- `DUMMY_CURRENT_WORKOUT`: Workout activo con 3 ejercicios y 10 sets
- `DUMMY_PROGRESS_DATA`: Object con 5 arrays de datos de progreso
- `DUMMY_CALENDAR_EVENTS`: 6 eventos del calendario

**Ejemplo de uso:**
```typescript
import { DUMMY_CURRENT_WORKOUT } from '@/lib/dummy-data';

const [workout, setWorkout] = useState(DUMMY_CURRENT_WORKOUT);
```

## 🎯 Patrones de Uso

### Edición de Sets

```typescript
// Incrementar peso
adjustWeight(exerciseIndex, setId, 2.5);

// Decrementar peso
adjustWeight(exerciseIndex, setId, -2.5);

// Marcar completado
toggleSetComplete(exerciseIndex, setId);

// Actualización directa
updateSet(exerciseIndex, setId, {
  weight: 80,
  reps: 8,
  rpe: 7.5,
  completed: true
});
```

### Temporizador de Descanso

```typescript
// Iniciar timer de 120 segundos
startRestTimer(120);

// El timer se auto-decrementa cada segundo
// Se muestra en formato MM:SS
```

### Navegación del Calendario

```typescript
// Ir a semana anterior
goToPreviousWeek();

// Ir a semana siguiente
goToNextWeek();

// Volver a hoy
goToToday();

// Reprogramar evento
rescheduleEvent('event-id', new Date('2025-10-28'));
```

## 🎨 Estilos y Temas

### Colores por Métrica

```typescript
const METRICS = [
  { color: '#3b82f6', areaColor: '#3b82f620' }, // Peso - Azul
  { color: '#10b981', areaColor: '#10b98120' }, // Grasa - Verde
  { color: '#f59e0b', areaColor: '#f59e0b20' }, // Squat - Naranja
  { color: '#ef4444', areaColor: '#ef444420' }, // Bench - Rojo
  { color: '#8b5cf6', areaColor: '#8b5cf620' }  // Volumen - Púrpura
];
```

### Estados Visuales

```typescript
// Set completado
className="bg-primary/5 border-primary/20"

// Día actual
className="ring-2 ring-primary"

// Evento completado
className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
```

## 📱 Responsive Design

### WorkoutEditor
- Mobile: Columna única para controles
- Desktop: Grid 3 columnas (Weight, Reps, RPE)

### ProgressGraph
- Mobile: Stats cards apiladas
- Desktop: Grid 3 columnas

### Calendar
- Mobile: 1 columna (scroll vertical)
- Tablet: 3-4 columnas
- Desktop: 7 columnas (toda la semana)

## 🔧 Customización

### Cambiar Ejercicios

Edita `DUMMY_EXERCISES` en `src/lib/dummy-data.ts`:

```typescript
export const DUMMY_EXERCISES = [
  {
    id: '9',
    name: 'Nuevo Ejercicio',
    muscleGroup: 'Piernas',
    equipment: 'Mancuernas'
  },
  // ...más ejercicios
];
```

### Agregar Nueva Métrica

1. Agregar datos en `DUMMY_PROGRESS_DATA`:
```typescript
deadlift: [
  { date: 'Sem 1', value: 140 },
  { date: 'Sem 2', value: 145 },
  // ...
]
```

2. Agregar config en `METRICS`:
```typescript
{
  key: 'deadlift',
  title: 'Peso Muerto (1RM)',
  description: 'Progreso en peso muerto',
  unit: 'kg',
  icon: <Zap className="h-4 w-4" />,
  color: '#06b6d4',
  areaColor: '#06b6d420'
}
```

### Cambiar Intervalos de Ajuste

En `WorkoutEditor`:

```typescript
// Cambiar incremento de peso (default: 2.5 kg)
adjustWeight(exerciseIndex, setId, 5); // 5 kg

// Cambiar incremento de RPE (default: 0.5)
adjustRPE(exerciseIndex, setId, 1); // 1.0
```

## 🧪 Testing Manual

### WorkoutEditor
1. Click en ejercicio para cambiar
2. Ajustar peso con +/- botones
3. Ajustar reps con +/- botones
4. Marcar set como completado
5. Iniciar temporizador de descanso
6. Verificar que el contador decrementa

### ProgressGraph
1. Click en cada métrica
2. Verificar que la gráfica cambia
3. Verificar cálculos de cambio
4. Leer análisis contextual

### WorkoutCalendar
1. Navegar entre semanas
2. Click "Hoy" para volver
3. Agregar nuevo evento
4. Marcar como completado
5. Click en "Editar" para reprogramar
6. Eliminar evento

## 🚀 Integración con DB Real

Para conectar con base de datos real:

### WorkoutEditor

```typescript
// Reemplazar useState inicial
const [workout, setWorkout] = useState<Workout | null>(null);

// Agregar useEffect para fetch
useEffect(() => {
  async function loadWorkout() {
    const response = await fetch('/api/workouts/current');
    const data = await response.json();
    setWorkout(data);
  }
  loadWorkout();
}, []);

// Agregar función de guardado
async function saveWorkout() {
  await fetch('/api/workouts/' + workout.id, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(workout)
  });
}
```

### ProgressGraph

```typescript
// Reemplazar datos dummy con fetch
const [data, setData] = useState<ProgressDataPoint[]>([]);

useEffect(() => {
  async function loadProgress() {
    const response = await fetch(`/api/progress/${activeMetric}`);
    const data = await response.json();
    setData(data);
  }
  loadProgress();
}, [activeMetric]);
```

### WorkoutCalendar

```typescript
// Fetch eventos
const [events, setEvents] = useState<CalendarEvent[]>([]);

useEffect(() => {
  async function loadEvents() {
    const response = await fetch('/api/calendar/events');
    const data = await response.json();
    setEvents(data);
  }
  loadEvents();
}, [currentDate]);

// Guardar cambios
async function rescheduleEvent(eventId: string, newDate: Date) {
  await fetch(`/api/calendar/events/${eventId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date: newDate })
  });
  setEvents(/* actualizar local */);
}
```

## 📚 Dependencias

### Instaladas y Usadas

- `recharts`: ^2.12.7 - Gráficas
- `date-fns`: ^3.6.0 - Manejo de fechas
- `lucide-react`: ^0.441.0 - Iconos
- `@radix-ui/react-tabs`: ^1.0.4 - Tabs (nuevo)

### Componentes shadcn/ui

- Card (con subcomponentes)
- Button
- Badge
- Tabs (nuevo)
- Avatar
- Toast (disponible)

## 💡 Tips y Mejores Prácticas

1. **Siempre validar datos**: Usar `Math.max(0, value)` para evitar negativos
2. **Feedback visual inmediato**: Cambiar estado local antes de guardar a DB
3. **Optimistic UI**: Actualizar UI primero, luego sincronizar con servidor
4. **Loading states**: Agregar skeletons mientras carga data real
5. **Error handling**: Mostrar toasts en caso de errores de red

## 🎯 Estado Actual

- ✅ Todos los componentes funcionan con datos dummy
- ✅ Edición en vivo funciona perfectamente
- ✅ Navegación fluida entre componentes
- ✅ Responsive design implementado
- ✅ TypeScript types completos
- ⏳ Pendiente: Conexión a DB real
- ⏳ Pendiente: Persistencia de cambios
- ⏳ Pendiente: Loading/Error states

---

**Desarrollado con ❤️ usando React, TypeScript, Tailwind CSS y shadcn/ui**
