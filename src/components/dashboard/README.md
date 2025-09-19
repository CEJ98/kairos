# Dashboard Components

Este directorio contiene los componentes modernizados del dashboard fitness, implementados con shadcn/ui y Tailwind CSS.

## Componentes Disponibles

### DashboardCard

**Ubicación:** `dashboard-card.tsx`

**Propósito:** Muestra los últimos entrenamientos completados con métricas clave y acciones rápidas.

**Props:**
- `totalWorkouts: number` - Total de entrenamientos realizados
- `weeklyWorkouts: number` - Entrenamientos completados esta semana
- `isLoading: boolean` - Estado de carga

**Características:**
- Visualización de entrenamientos recientes con iconos específicos por tipo
- Métricas de progreso semanal
- Botones de acción para iniciar nuevo entrenamiento
- Estados de carga y vacío
- Diseño responsivo

**Uso:**
```tsx
<DashboardCard 
	totalWorkouts={stats.totalWorkouts}
	weeklyWorkouts={stats.completedWorkouts}
	isLoading={isLoading}
/>
```

### ProgressChart

**Ubicación:** `progress-chart.tsx`

**Propósito:** Visualiza el progreso corporal (peso, grasa corporal) con gráficos interactivos usando Recharts.

**Props:**
- `data: ProgressData` - Datos de progreso incluyendo historial y métricas actuales

**Características:**
- Gráfico de líneas interactivo con tooltip personalizado
- Métricas de peso y grasa corporal con indicadores de tendencia
- Progreso semanal de entrenamientos
- Badges de cambio (positivo/negativo)
- Animaciones suaves

**Interfaz ProgressData:**
```tsx
interface ProgressData {
	weeklyGoal: number
	currentProgress: number
	lastWeekProgress: number
	streak: number
	currentWeight: number
	weightGoal: number
	weightChange: number
	currentBodyFat: number
	bodyFatGoal: number
	bodyFatChange: number
	progressHistory: ProgressDataPoint[]
}
```

**Uso:**
```tsx
<ProgressChart 
	data={{
		weeklyGoal: 5,
		currentProgress: 3,
		// ... más propiedades
	}}
/>
```

### UpcomingWorkout

**Ubicación:** `upcoming-workout.tsx`

**Propósito:** Muestra los próximos entrenamientos programados integrado con el calendario.

**Props:**
- `isLoading: boolean` - Estado de carga

**Características:**
- Lista de entrenamientos programados con fechas y horarios
- Iconos específicos por tipo de entrenamiento
- Indicadores de dificultad y duración
- Botones de acción (ver detalles, iniciar)
- Estados de carga y sin entrenamientos programados
- Integración con calendario

**Uso:**
```tsx
<UpcomingWorkout isLoading={isLoading} />
```

## Optimizaciones Implementadas

### Lazy Loading

Todos los componentes están configurados con lazy loading para optimizar el rendimiento:

```tsx
const ProgressChart = lazy(() => 
	import('@/components/dashboard/progress-chart').then(module => ({ default: module.default }))
)
```

### Fallbacks de Carga

Cada componente tiene fallbacks específicos que simulan su estructura:

- **DashboardCard:** Skeleton con líneas de texto y botón
- **ProgressChart:** Skeleton con área de gráfico y métricas
- **UpcomingWorkout:** Skeleton con lista de elementos

### Configuración Next.js

Los componentes están optimizados en `next.config.js`:

```javascript
optimizePackageImports: [
	'recharts',
	'lucide-react',
	'@radix-ui/react-*'
]
```

## Tecnologías Utilizadas

- **React 18** con Suspense y lazy loading
- **shadcn/ui** para componentes base
- **Tailwind CSS** para estilos
- **Recharts** para gráficos interactivos
- **Lucide React** para iconos
- **TypeScript** para tipado estático

## Estructura de Archivos

```
src/components/dashboard/
├── dashboard-card.tsx      # Componente de entrenamientos recientes
├── progress-chart.tsx      # Componente de gráficos de progreso
├── upcoming-workout.tsx    # Componente de entrenamientos programados
├── progress-chart.tsx      # Componente legacy (mantener compatibilidad)
└── README.md              # Esta documentación
```

## Notas de Desarrollo

1. **Consistencia Visual:** Todos los componentes siguen el mismo patrón de diseño con shadcn/ui
2. **Responsividad:** Diseñados mobile-first con breakpoints consistentes
3. **Accesibilidad:** Implementan ARIA labels y navegación por teclado
4. **Performance:** Lazy loading y optimizaciones de bundle size
5. **Mantenibilidad:** Código TypeScript con interfaces bien definidas

## Próximas Mejoras

- [ ] Integración con API real para datos dinámicos
- [ ] Animaciones más avanzadas con Framer Motion
- [ ] Modo oscuro/claro
- [ ] Exportación de datos a PDF/Excel
- [ ] Notificaciones push para entrenamientos