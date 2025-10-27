# 📅 Calendario Semanal Kairos - Guía Completa

Calendario semanal estilo FitnessAI con drag & drop, marcadores visuales, confirmación de cambios y animaciones Framer Motion.

---

## 🎯 Características Implementadas

### ✅ **Vista Semanal de 7 Días**
- Grid responsive con columnas por día (Lunes a Domingo)
- Navegación entre semanas con flechas
- Indicador visual del día actual (turquesa)
- Fechas formateadas en español

### ✅ **Cards de Entrenamientos**
- Título del entrenamiento
- Grupos musculares con badges
- Duración estimada (10 min por ejercicio)
- Cantidad de ejercicios
- Botón "Completar" para workouts pendientes
- Drag handle visual (icono de agarre)

### ✅ **Drag & Drop con dnd-kit**
- Arrastrar entrenamientos entre días
- Overlay visual durante el arrastre
- No permite mover entrenamientos completados
- Validación de día objetivo

### ✅ **Marcadores Visuales de Estado**
- **Verde** (`completed`) - Entrenamiento completado
- **Turquesa** (`today`) - Programado para hoy
- **Gris** (`pending`) - Próximos entrenamientos
- **Rojo** (`overdue`) - Entrenamientos vencidos

### ✅ **Modal de Confirmación**
- Animación de entrada con Framer Motion
- Muestra título del workout
- Fecha actual vs nueva fecha
- Advertencia sobre cambios permanentes
- Loading state durante guardado

### ✅ **Animaciones Framer Motion**
- Entrada gradual de componentes
- Hover effects en cards
- Transiciones suaves en drag & drop
- Fade in/out de workouts

### ✅ **Persistencia en Supabase/Prisma**
- Server Actions para todas las operaciones
- Actualización de `scheduledAt` en BD
- Revalidación automática de rutas
- Toast notifications para feedback

---

## 📁 Estructura de Archivos

```
src/
├── app/
│   ├── actions/
│   │   └── calendar-actions.ts           # Server Actions (Prisma)
│   └── calendar-new/
│       └── page.tsx                       # Página principal del calendario
├── components/
│   └── calendar/
│       ├── workout-card.tsx               # Card de entrenamiento draggable
│       ├── reschedule-modal.tsx           # Modal de confirmación
│       └── weekly-calendar-grid.tsx       # Grid de 7 días con dnd-kit

Documentación:
└── CALENDAR_GUIDE.md                      # Este archivo
```

---

## 🚀 Server Actions

### Archivo: `src/app/actions/calendar-actions.ts`

#### `getWeekCalendarData(weekOffset: number)`

**Función principal** que obtiene los entrenamientos de la semana:

```typescript
export async function getWeekCalendarData(weekOffset: number = 0): Promise<WeekCalendarData | null>
```

**Parámetros**:
- `weekOffset`: Offset de semanas desde la actual (0 = semana actual, -1 = anterior, +1 = siguiente)

**Retorna**:
```typescript
{
  days: DayData[];           // 7 días (Lun-Dom)
  weekStart: Date;           // Inicio de semana
  weekEnd: Date;             // Fin de semana
}
```

**Cada `DayData` contiene**:
```typescript
{
  date: Date;
  dayName: string;           // "lunes", "martes", etc.
  dayNumber: number;         // 1-31
  isToday: boolean;
  workouts: WorkoutCardData[];
}
```

**Cada `WorkoutCardData` contiene**:
```typescript
{
  id: string;
  title: string;
  scheduledAt: Date;
  completedAt: Date | null;
  duration: number;          // minutos estimados
  muscleGroups: string[];    // ["Pecho", "Tríceps"]
  exerciseCount: number;
  status: 'completed' | 'today' | 'pending' | 'overdue';
}
```

**Queries a Prisma**:
1. `plan.findFirst()` - Plan activo del usuario
2. `workouts` con `sets` y `exercise` - Entrenamientos de la semana
3. Cálculo de duración y grupos musculares

---

#### `rescheduleWorkout(workoutId: string, newDate: string)`

Reprograma un entrenamiento a una nueva fecha:

```typescript
export async function rescheduleWorkout(
  workoutId: string,
  newDate: string
): Promise<{ success: boolean; error?: string }>
```

**Validaciones**:
- ✅ Usuario autenticado
- ✅ Workout pertenece al usuario
- ✅ Workout no está completado
- ✅ Fecha válida (ISO 8601)

**Actualiza**:
```typescript
await prisma.workout.update({
  where: { id: workoutId },
  data: { scheduledAt: parsedDate }
});
```

**Revalida**: `/calendar`

---

#### `markWorkoutComplete(workoutId: string)`

Marca un entrenamiento como completado:

```typescript
export async function markWorkoutComplete(
  workoutId: string
): Promise<{ success: boolean; error?: string }>
```

**Actualiza**:
```typescript
await prisma.workout.update({
  where: { id: workoutId },
  data: { completedAt: new Date() }
});
```

---

## 📊 Componentes

### 1. WorkoutCard

**Archivo**: `src/components/calendar/workout-card.tsx`

**Props**:
```typescript
interface WorkoutCardProps {
  workout: WorkoutCardData;
  onComplete?: (workoutId: string) => void;
  isDragging?: boolean;
}
```

**Características**:
- ✅ Integración con `useSortable` de dnd-kit
- ✅ Colores según estado (verde/turquesa/gris/rojo)
- ✅ Drag handle (icono `GripVertical`)
- ✅ Badges de grupos musculares (máx 3 + contador)
- ✅ Footer con duración y cantidad de ejercicios
- ✅ Botón "Completar" (solo para no completados)
- ✅ Animaciones Framer Motion (hover, entrada/salida)
- ✅ Disabled drag para completados

**Estados Visuales**:
```typescript
const statusConfig = {
  completed: {
    borderColor: 'border-green-500',
    bgColor: 'bg-green-50',
    icon: CheckCircle2,
  },
  today: {
    borderColor: 'border-cyan-500',
    bgColor: 'bg-cyan-50',
    icon: AlertCircle,
  },
  pending: {
    borderColor: 'border-gray-300',
    bgColor: 'bg-white',
    icon: Clock,
  },
  overdue: {
    borderColor: 'border-red-400',
    bgColor: 'bg-red-50',
    icon: AlertCircle,
  },
};
```

**Uso**:
```tsx
<WorkoutCard
  workout={workout}
  onComplete={handleCompleteWorkout}
/>
```

---

### 2. RescheduleModal

**Archivo**: `src/components/calendar/reschedule-modal.tsx`

**Props**:
```typescript
interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  workoutTitle: string;
  fromDate: Date;
  toDate: Date;
}
```

**Características**:
- ✅ Dialog de shadcn/ui
- ✅ Animaciones Framer Motion en contenido
- ✅ Muestra workout title en card con gradiente
- ✅ Comparación fecha actual vs nueva
- ✅ Icono de flecha animado
- ✅ Warning con border y background amber
- ✅ Loading state con spinner
- ✅ Botones: Cancelar (outline) y Confirmar (gradient)

**Layout**:
```
┌──────────────────────────────────────┐
│ 📅 Reprogramar Entrenamiento         │
├──────────────────────────────────────┤
│ [Workout Title en card gradiente]    │
│                                      │
│ Fecha actual: Lunes, 25 de octubre   │
│          ↓ (icono animado)           │
│ Nueva fecha: Miércoles, 27 de oct.   │
│                                      │
│ ⚠️  Advertencia sobre cambios        │
├──────────────────────────────────────┤
│ [Cancelar]  [Confirmar]              │
└──────────────────────────────────────┘
```

**Uso**:
```tsx
<RescheduleModal
  isOpen={!!pendingReschedule}
  onClose={() => setPendingReschedule(null)}
  onConfirm={handleConfirmReschedule}
  workoutTitle="Upper Body A"
  fromDate={new Date()}
  toDate={new Date()}
/>
```

---

### 3. WeeklyCalendarGrid

**Archivo**: `src/components/calendar/weekly-calendar-grid.tsx`

**Props**:
```typescript
interface WeeklyCalendarGridProps {
  days: DayData[];
  weekStart: Date;
  weekEnd: Date;
  onWeekChange: (offset: number) => void;
  currentWeekOffset: number;
}
```

**Características**:
- ✅ Grid responsive: 1 columna (mobile) → 7 columnas (desktop)
- ✅ Navegación con botones < >
- ✅ Título de semana con fechas formateadas
- ✅ DndContext de dnd-kit
- ✅ SortableContext por cada día
- ✅ DragOverlay con efecto rotate y scale
- ✅ Validación de drag (mismo día = cancel)
- ✅ Modal de confirmación automático
- ✅ Toast notifications (sonner)
- ✅ Refresh automático con `router.refresh()`
- ✅ AnimatePresence para entrada/salida de cards

**Estados Internos**:
```typescript
const [activeWorkout, setActiveWorkout] = useState<WorkoutCardData | null>(null);
const [pendingReschedule, setPendingReschedule] = useState<PendingReschedule | null>(null);
```

**Sensors dnd-kit**:
```typescript
const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8,  // 8px antes de iniciar drag
    },
  })
);
```

**Uso**:
```tsx
<WeeklyCalendarGrid
  days={calendarData.days}
  weekStart={calendarData.weekStart}
  weekEnd={calendarData.weekEnd}
  onWeekChange={handleWeekChange}
  currentWeekOffset={weekOffset}
/>
```

---

## 🎨 Página Principal

### Archivo: `src/app/calendar-new/page.tsx`

**Layout**:
```
┌─────────────────────────────────────────────────────────┐
│ Hero Section (Gradiente azul-indigo-purple)             │
│ 📅 Calendario Semanal + descripción                     │
├─────────────────────────────────────────────────────────┤
│ Info Cards: Completado | Hoy | Pendiente (3 cols)      │
├─────────────────────────────────────────────────────────┤
│ WeeklyCalendarGrid (7 días con drag & drop)            │
├─────────────────────────────────────────────────────────┤
│ Tips Section (Gradiente azul con bullets)              │
└─────────────────────────────────────────────────────────┘
```

**Estados**:
```typescript
const [weekOffset, setWeekOffset] = useState(0);
const [calendarData, setCalendarData] = useState<WeekCalendarData | null>(null);
const [isLoading, setIsLoading] = useState(true);
```

**useEffect**:
```typescript
useEffect(() => {
  loadCalendarData(weekOffset);
}, [weekOffset]);
```

**Loading State**:
- Skeleton con animate-pulse
- Hero + info cards + grid skeletons
- Spinner centrado

**Empty State**:
- Icono de calendario grande
- Mensaje "No hay plan activo"
- CTA "Crear Plan"

**Animaciones Framer Motion**:
1. Hero: opacity 0→1, y: -20→0 (duration 0.5s)
2. Info Cards: delay 0.1s
3. Calendar Grid: delay 0.2s
4. Tips Section: delay 0.3s

---

## 🎨 Estilo Minimalista Kairos

### Paleta de Colores

```typescript
// Gradientes principales
from-blue-50 via-indigo-50 to-purple-50   // Hero section
from-blue-500 to-indigo-600               // Botones y CTAs

// Estados de entrenamientos
#10B981  // Green - Completado
#06B6D4  // Cyan - Hoy
#6B7280  // Gray - Pendiente
#EF4444  // Red - Vencido

// Badges
bg-green-100 text-green-800  // Completado
bg-cyan-100 text-cyan-800    // Hoy
bg-gray-100 text-gray-700    // Pendiente
```

### Componentes Styled

**Day Container (Hoy)**:
```css
border-cyan-400 bg-gradient-to-br from-cyan-50 to-blue-50
```

**Day Container (Normal)**:
```css
border-gray-200 bg-white hover:border-gray-300
```

**Workout Card**:
```css
rounded-lg border-2 p-3 shadow-sm transition-all
cursor-grab active:cursor-grabbing
hover:scale-102
```

**Modal Background**:
```css
bg-gradient-to-r from-blue-50 to-indigo-50 p-3
```

---

## 🔧 Implementación Drag & Drop

### Setup dnd-kit

```tsx
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
```

### Eventos

**onDragStart**:
1. Obtener `active.id` del workout
2. Buscar workout en days array
3. Guardar en `activeWorkout` state
4. Mostrar en DragOverlay

**onDragEnd**:
1. Obtener `active.id` (workout) y `over.id` (día destino)
2. Validar que no sea el mismo día
3. Validar que workout no esté completado
4. Crear `PendingReschedule` object
5. Abrir modal de confirmación

**onConfirm**:
1. Llamar `rescheduleWorkout()` Server Action
2. Mostrar toast de éxito/error
3. Refresh de router (`router.refresh()`)
4. Cerrar modal

---

## 🧪 Testing

### 1. Con Datos del Seed

```bash
# Seed la base de datos
pnpm db:seed

# Iniciar servidor
pnpm dev

# Visitar
http://localhost:3000/calendar-new
```

**Debe mostrar**:
- ✅ 7 días de la semana actual
- ✅ Día actual marcado en turquesa
- ✅ Entrenamientos del seed distribuidos
- ✅ Poder arrastrar workouts entre días
- ✅ Modal de confirmación al soltar
- ✅ Toast notification al confirmar

### 2. Drag & Drop Flow

**Pasos**:
1. Click en drag handle de un workout
2. Arrastrar a otro día
3. Ver DragOverlay durante el drag
4. Soltar en día objetivo
5. Ver modal de confirmación
6. Click "Confirmar"
7. Ver toast de éxito
8. Verificar workout movido

### 3. Completar Workout

**Pasos**:
1. Click en botón "Completar"
2. Ver toast de éxito
3. Card cambia a estado verde
4. Drag handle desaparece
5. Botón "Completar" desaparece

### 4. Navegación entre Semanas

**Pasos**:
1. Click en flecha derecha (semana siguiente)
2. Fechas actualizan
3. Workouts de esa semana cargan
4. Click en flecha izquierda (semana anterior)
5. Regresar a semana actual

### 5. Responsive

**Mobile** (< 768px):
- ✅ 1 columna por día
- ✅ Scroll vertical
- ✅ Info cards: 1 columna

**Tablet** (768px - 1024px):
- ✅ Grid 7 días en horizontal
- ✅ Info cards: 3 columnas

**Desktop** (> 1024px):
- ✅ Grid 7 días espaciados
- ✅ Info cards: 3 columnas
- ✅ Mejor visibilidad de drag & drop

---

## 🚨 Troubleshooting

### No se pueden arrastrar entrenamientos

**Causa**: Workout está completado

**Solución**:
- Solo workouts pendientes son draggables
- Verificar `status !== 'completed'`
- Drag handle solo se muestra si no está completado

### Modal no se abre

**Causa**: Validación de mismo día

**Solución**:
```typescript
// En handleDragEnd
if (format(sourceDayDate, 'yyyy-MM-dd') === format(targetDay.date, 'yyyy-MM-dd')) {
  return; // No abre modal si es mismo día
}
```

### Toast no se muestra

**Causa**: Falta `<Toaster />` en página

**Solución**:
```tsx
import { Toaster } from 'sonner';

<Toaster position="top-right" richColors />
```

### Drag se activa muy fácil

**Causa**: No hay activation constraint

**Solución**:
```typescript
useSensor(PointerSensor, {
  activationConstraint: {
    distance: 8,  // Requiere 8px de movimiento
  },
})
```

### Cambios no persisten

**Causa**: No hay revalidación de ruta

**Solución**:
```typescript
// En calendar-actions.ts
revalidatePath('/calendar');

// En componente
router.refresh();
```

---

## 🎯 Próximas Mejoras

1. **Filtros de Vista**: Selector de semana/mes
2. **Workout Templates**: Crear entrenamientos desde el calendario
3. **Undo/Redo**: Deshacer cambios de reprogramación
4. **Notificaciones**: Recordatorios de entrenamientos
5. **Color Coding**: Colores personalizados por tipo de entrenamiento
6. **Multi-Drag**: Mover múltiples entrenamientos a la vez
7. **Dark Mode**: Ajustar colores para tema oscuro
8. **Export**: Exportar calendario a iCal/Google Calendar

---

## 📚 Recursos

- [dnd-kit Docs](https://docs.dndkit.com/)
- [Framer Motion Docs](https://www.framer.com/motion/)
- [sonner (Toast) Docs](https://sonner.emilkowal.ski/)
- [shadcn/ui Dialog](https://ui.shadcn.com/docs/components/dialog)
- [date-fns Docs](https://date-fns.org/)

---

**¡Calendario Semanal Completado!** 🎉

Visita `http://localhost:3000/calendar-new` para organizar tus entrenamientos con drag & drop.

## 🔑 Tecnologías Principales

- **Next.js 14** - App Router, Server Components, Client Components
- **dnd-kit** - Drag & drop library (modern, accessible)
- **Framer Motion** - Animation library
- **Prisma** - ORM para Supabase PostgreSQL
- **date-fns** - Date manipulation
- **sonner** - Toast notifications
- **shadcn/ui** - Component library (Dialog, Button, Card)
- **Tailwind CSS** - Utility-first styling

---

## 📖 Flujo Completo

```
Usuario arrastra workout
        ↓
DragStartEvent → guardar activeWorkout
        ↓
DragOverlay muestra card con rotate
        ↓
Usuario suelta en día objetivo
        ↓
DragEndEvent → validar día diferente
        ↓
Crear PendingReschedule
        ↓
Abrir RescheduleModal
        ↓
Usuario confirma
        ↓
rescheduleWorkout() Server Action
        ↓
Actualizar BD (Prisma)
        ↓
Revalidar ruta
        ↓
Refresh router
        ↓
Toast de éxito
        ↓
Workout aparece en nuevo día
```
