# Demo Components - README

## 🎉 Componentes Completados

He construido **4 componentes principales** completamente funcionales con datos dummy:

### 1. ✅ WorkoutEditor
**Editor completo de entrenamientos con edición en vivo**

**Ubicación:** `src/components/workout/workout-editor.tsx`

**Funcionalidades:**
- ✏️ Editar peso, reps y RPE con botones +/-
- ✅ Marcar sets como completados
- ⏱️ Temporizador de descanso con countdown
- 🔄 Navegación entre ejercicios
- 📊 Progreso visual (sets completados/totales)
- 💾 Botones de guardar y reiniciar

**Ver en acción:** `/workout` (incluido en la página)

### 2. 📈 ProgressGraph
**Visualizador de gráficas con 5 métricas**

**Ubicación:** `src/components/progress/progress-graph.tsx`

**Funcionalidades:**
- 📉 Gráfico de área interactivo (Recharts)
- 🎨 5 métricas con colores únicos
- 📊 Cálculo de tendencias automático
- 💡 Análisis contextual por métrica
- 📱 Completamente responsive

**Métricas disponibles:**
1. Peso Corporal
2. Grasa Corporal
3. Sentadilla 1RM
4. Press Banca 1RM
5. Volumen Semanal

**Ver en acción:** `/progress` (incluido en la página)

### 3. 📅 WorkoutCalendar
**Calendario semanal reprogramable**

**Ubicación:** `src/components/calendar/workout-calendar.tsx`

**Funcionalidades:**
- 📆 Vista de semana completa
- ◀️ ▶️ Navegación (anterior/siguiente/hoy)
- ✅ Marcar como completado
- 🔄 Reprogramar eventos (cambiar día)
- ➕ Agregar nuevos eventos
- 🗑️ Eliminar eventos
- 📊 Resumen semanal con adherencia

**Ver en acción:** `/calendar` (incluido en la página)

### 4. 🏠 DemoScreen
**Dashboard de demostración**

**Ubicación:** `src/components/demo/demo-screen.tsx`

**Funcionalidades:**
- 📊 Cards de resumen
- 🔗 Enlaces a otras secciones
- 🎨 Diseño minimalista

**Ver en acción:** `/demo`

## 🚀 Cómo Probar

### 1. Instalar dependencia de tabs (si no está)
```bash
pnpm add @radix-ui/react-tabs
```

### 2. Iniciar servidor
```bash
pnpm dev
```

### 3. Navegar a las páginas

#### WorkoutEditor
```
http://localhost:3000/workout
```
**Prueba:**
- Click en botones +/- para ajustar peso/reps
- Click en el círculo para marcar set completado
- Click en "Iniciar descanso" para ver temporizador
- Cambia entre ejercicios con los tabs superiores

#### ProgressGraph
```
http://localhost:3000/progress
```
**Prueba:**
- Click en cada métrica para cambiar gráfico
- Observa cómo cambian los colores y análisis
- Revisa las stats cards debajo del gráfico

#### WorkoutCalendar
```
http://localhost:3000/calendar
```
**Prueba:**
- Click en "◀ ▶" para navegar semanas
- Click en "Hoy" para volver a la semana actual
- Click en "+" para agregar evento
- Click en el ícono ✓ para marcar completado
- Click en "✏" para reprogramar
- Click en "🗑" para eliminar

#### DemoScreen
```
http://localhost:3000/demo
```
**Prueba:**
- Revisa el resumen general
- Click en los enlaces

## 📊 Datos Dummy

Todos los componentes usan datos de ejemplo de:
```typescript
import {
  DUMMY_CURRENT_WORKOUT,
  DUMMY_PROGRESS_DATA,
  DUMMY_CALENDAR_EVENTS
} from '@/lib/dummy-data';
```

**Datos incluidos:**
- 8 ejercicios de ejemplo
- 1 workout con 3 ejercicios y 10 sets
- 5 métricas con 8-12 puntos de datos cada una
- 6 eventos del calendario

## 🎨 Tecnologías Usadas

```typescript
// UI Components
import { Card, Button, Badge } from '@/components/ui/*';

// Charts
import { AreaChart, Line, XAxis, YAxis } from 'recharts';

// Icons
import { Dumbbell, Calendar, TrendingUp } from 'lucide-react';

// Dates
import { format, addDays, startOfWeek } from 'date-fns';

// Styling
className="..." // Tailwind CSS
```

## 🔧 Características Técnicas

### Estado Reactivo
```typescript
// Todos los componentes usan React state
const [workout, setWorkout] = useState(DUMMY_CURRENT_WORKOUT);
const [activeMetric, setActiveMetric] = useState('weight');
const [events, setEvents] = useState(DUMMY_CALENDAR_EVENTS);
```

### Actualización Optimista
```typescript
// Los cambios se reflejan inmediatamente en la UI
const adjustWeight = (exerciseIndex, setId, delta) => {
  setWorkout(prev => ({
    ...prev,
    exercises: prev.exercises.map((ex, idx) =>
      idx === exerciseIndex ? { ...ex, /* cambios */ } : ex
    )
  }));
};
```

### TypeScript Completo
```typescript
// Todos los tipos definidos en src/types/workout.ts
interface Workout { id: string; title: string; /* ... */ }
interface WorkoutSet { weight: number; reps: number; /* ... */ }
```

## 📱 Responsive Design

### Mobile First
- Todos los componentes son responsive
- Grid adapta columnas según tamaño
- Botones apilados en mobile
- Tabs con scroll horizontal

### Breakpoints
```typescript
// Tailwind breakpoints usados:
sm: 640px   // Tablets pequeñas
md: 768px   // Tablets
lg: 1024px  // Desktop
```

## 🎯 Funcionalidad Completa

### WorkoutEditor
```typescript
✅ Edición de peso (+/- 2.5 kg)
✅ Edición de reps (+/- 1)
✅ Edición de RPE (+/- 0.5)
✅ Toggle completed
✅ Temporizador con countdown
✅ Navegación entre ejercicios
```

### ProgressGraph
```typescript
✅ 5 métricas diferentes
✅ Gráfico interactivo
✅ Cálculo de tendencias
✅ Stats cards
✅ Análisis contextual
✅ Colores personalizados
```

### WorkoutCalendar
```typescript
✅ Vista semanal
✅ Navegación temporal
✅ CRUD completo (crear, leer, editar, eliminar)
✅ Toggle completed
✅ Reprogramación
✅ Resumen con adherencia
```

## 🔄 Sin Conexión a DB

**IMPORTANTE:** Todos los componentes funcionan **sin conexión a base de datos**.

- ✅ Los cambios se guardan en el estado local
- ✅ La UI se actualiza inmediatamente
- ⚠️ Los cambios se pierden al recargar la página
- ⚠️ Los datos son de ejemplo (dummy data)

Para conectar a DB real, ver sección "Integración con DB" en `COMPONENTS_GUIDE.md`.

## 📚 Documentación Completa

Para más detalles técnicos:
- **COMPONENTS_GUIDE.md** - Guía completa de componentes
- **NAVIGATION_GUIDE.md** - Guía de rutas
- **IMPLEMENTATION_SUMMARY.md** - Resumen técnico

## 🐛 Troubleshooting

### Error: "Cannot find module recharts"
```bash
pnpm add recharts
```

### Error: "Cannot find module @radix-ui/react-tabs"
```bash
pnpm add @radix-ui/react-tabs
```

### Error: "Module not found date-fns"
```bash
pnpm add date-fns
```

### Los componentes no aparecen
Verifica que estén importados en las páginas:
```typescript
// src/app/workout/page.tsx
import { WorkoutEditor } from '@/components/workout/workout-editor';

// src/app/progress/page.tsx
import { ProgressGraph } from '@/components/progress/progress-graph';

// src/app/calendar/page.tsx
import { WorkoutCalendar } from '@/components/calendar/workout-calendar';
```

## ✨ Próximos Pasos

### Para Producción:
1. Conectar a API real (`/api/workouts`, `/api/progress`, `/api/calendar`)
2. Agregar loading states (Skeletons)
3. Agregar error handling (Toasts)
4. Persistir cambios en base de datos
5. Agregar optimistic updates con rollback
6. Implementar real-time sync

### Mejoras Sugeridas:
- Drag & drop real en calendario
- Más métricas en progreso
- Exportar datos a CSV
- Modo offline con sync
- Notificaciones push
- Compartir entrenamientos

## 🎉 Resumen

**¡TODO LISTO PARA PROBAR!**

- ✅ 4 componentes completamente funcionales
- ✅ Edición en vivo sin DB
- ✅ Gráficas interactivas
- ✅ Calendario reprogramable
- ✅ TypeScript completo
- ✅ Responsive design
- ✅ Datos dummy incluidos
- ✅ Documentación completa

**Inicia con:**
```bash
pnpm dev
```

**Y visita:**
- http://localhost:3000/workout
- http://localhost:3000/progress
- http://localhost:3000/calendar
- http://localhost:3000/demo

---

**¡Disfruta probando los componentes!** 🚀
