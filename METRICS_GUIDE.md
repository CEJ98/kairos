# 📊 Sistema de Métricas Corporales Kairos - Guía Completa

Sistema completo de registro y visualización de métricas corporales con gráficos Recharts, validación de inputs, y comparador de fotos de progreso.

---

## 🎯 Características Implementadas

### ✅ **Registro de Peso**
- Peso corporal (kg) - campo requerido
- Grasa corporal (%) - opcional
- Masa muscular (kg) - opcional
- Selector de fecha
- Validación con Zod (min/max valores)

### ✅ **Gráfico de Peso con Recharts**
- LineChart con 3 líneas: peso, grasa, masa muscular
- Gradientes fill bajo las líneas
- Eje X: fechas formateadas en español
- Eje Y: escala automática con padding
- Tooltip personalizado con valores formateados
- Indicadores de tendencia (↑ ↓ —)
- Cards de resumen: peso inicial, actual, cambio de grasa
- Cálculo de % de cambio

### ✅ **Registro de Medidas Corporales**
- 8 mediciones: pecho, cintura, cadera, hombros, brazos (L/R), muslos (L/R)
- Todas opcionales (permite medir solo las que se deseen)
- Validación de rangos (cm)
- Selector de fecha

### ✅ **Radar Chart de Medidas**
- Gráfico radar (spider chart) con Recharts
- Visualización de medidas actuales vs anteriores
- Gradiente radial purple
- Lista de medidas con valores y cambios
- Card de resumen de cambios desde último registro
- Colores diferenciados: verde (reducción), naranja (aumento)

### ✅ **Sistema de Fotos de Progreso**
- Upload de imágenes con preview
- Validación: máx 5MB, solo imágenes
- Almacenamiento de data URL (demo) - listo para Supabase Storage
- Notas opcionales por foto
- Galería con grid responsive
- Modo comparación: selecciona 2 fotos side-by-side
- Full screen view con dialog
- Eliminación de fotos con confirmación

### ✅ **Dashboard Completo**
- Hero section con gradiente
- 4 summary cards: peso, grasa, mediciones, fotos
- Quick actions buttons
- Layout responsive con animaciones Framer Motion
- Loading skeletons
- Toast notifications (sonner)

### ✅ **Forms Avanzados**
- Tabs: Peso | Medidas | Foto
- react-hook-form + Zod validation
- Error messages inline
- Loading states
- Auto-refresh después de guardar

---

## 📁 Estructura de Archivos

```
src/
├── app/
│   ├── actions/
│   │   └── metrics-actions.ts           # Server Actions (Prisma + Zod)
│   └── metrics/
│       └── page.tsx                      # Dashboard principal
├── components/
│   └── metrics/
│       ├── weight-chart.tsx              # Gráfico LineChart de peso
│       ├── measurements-radar.tsx        # Radar chart de medidas
│       ├── photo-comparison.tsx          # Galería y comparador
│       └── metrics-forms.tsx             # Forms con tabs

Documentación:
└── METRICS_GUIDE.md                      # Este archivo
```

---

## 🚀 Server Actions

### Archivo: `src/app/actions/metrics-actions.ts`

#### Schemas de Validación

```typescript
const bodyWeightSchema = z.object({
  weight: z.number().min(30).max(300),
  bodyFat: z.number().min(3).max(60).optional(),
  muscleMass: z.number().min(10).max(200).optional(),
  date: z.string().optional(),
});

const bodyMeasurementsSchema = z.object({
  chest: z.number().min(50).max(200).optional(),
  waist: z.number().min(40).max(200).optional(),
  hips: z.number().min(50).max(200).optional(),
  leftArm: z.number().min(15).max(80).optional(),
  rightArm: z.number().min(15).max(80).optional(),
  leftThigh: z.number().min(30).max(120).optional(),
  rightThigh: z.number().min(30).max(120).optional(),
  shoulders: z.number().min(70).max(200).optional(),
  date: z.string().optional(),
});
```

---

#### `saveBodyWeight(data: BodyWeightInput)`

Guarda entrada de peso corporal:

```typescript
export async function saveBodyWeight(
  data: BodyWeightInput
): Promise<{ success: boolean; error?: string; data?: BodyWeightData }>
```

**Validaciones**:
- ✅ Usuario autenticado
- ✅ Peso entre 30-300 kg
- ✅ Grasa corporal 3-60% (opcional)
- ✅ Masa muscular 10-200 kg (opcional)
- ✅ Fecha válida o usa fecha actual

**Prisma Query**:
```typescript
await prisma.bodyMetric.create({
  data: {
    userId,
    date: recordDate,
    weight: validated.weight,
    bodyFat: validated.bodyFat ?? null,
    muscleMass: validated.muscleMass ?? null,
  },
});
```

**Revalida**: `/metrics`, `/progress-new`

---

#### `saveBodyMeasurements(data: BodyMeasurementsInput)`

Guarda medidas corporales:

```typescript
export async function saveBodyMeasurements(
  data: BodyMeasurementsInput
): Promise<{ success: boolean; error?: string; data?: BodyMeasurementsData }>
```

**Características**:
- Todas las medidas opcionales
- Crea registro en `bodyMetric` con medidas en cm
- Validación de rangos por parte del cuerpo

---

#### `getBodyWeightHistory(months: number = 6)`

Obtiene historial de peso:

```typescript
export async function getBodyWeightHistory(
  months: number = 6
): Promise<BodyWeightData[]>
```

**Query**:
- Últimos N meses desde hoy
- Solo registros con `weight !== null`
- Ordenados por fecha ASC
- Retorna: id, date, weight, bodyFat, muscleMass

---

#### `getLatestMeasurements()`

Obtiene últimas medidas para radar chart:

```typescript
export async function getLatestMeasurements(): Promise<BodyMeasurementsData | null>
```

**Query**:
- Último registro con cualquier medida no-null
- `OR` query en Prisma para 8 campos
- Ordenado por fecha DESC

---

#### `getProgressPhotos()`

Obtiene fotos de progreso:

```typescript
export async function getProgressPhotos(): Promise<ProgressPhotoData[]>
```

**Retorna**:
- Array de fotos ordenadas por `createdAt DESC`
- Campos: id, url, createdAt, notes

---

#### `saveProgressPhoto(url: string, notes?: string)`

Guarda URL de foto (después de upload):

```typescript
export async function saveProgressPhoto(
  url: string,
  notes?: string
): Promise<{ success: boolean; error?: string; data?: ProgressPhotoData }>
```

**Nota**: En producción, primero subir a Supabase Storage y pasar URL resultante.

---

#### `deleteProgressPhoto(photoId: string)`

Elimina foto de progreso:

```typescript
export async function deleteProgressPhoto(
  photoId: string
): Promise<{ success: boolean; error?: string }>
```

**Validaciones**:
- Verifica ownership (userId)
- Elimina de BD
- En producción: también eliminar de storage

---

#### `getMetricsSummary()`

Obtiene resumen de métricas para cards:

```typescript
export async function getMetricsSummary(): Promise<MetricsSummary | null>
```

**Calcula**:
- Peso actual
- Cambio de peso (últimos 30 días)
- Grasa corporal actual
- Cambio de grasa corporal
- Total de mediciones registradas
- Total de fotos

---

## 📊 Componentes

### 1. WeightChart

**Archivo**: [src/components/metrics/weight-chart.tsx](src/components/metrics/weight-chart.tsx:1)

**Props**:
```typescript
interface WeightChartProps {
  data: BodyWeightData[];
}
```

**Características**:
- LineChart de Recharts (300px height)
- 3 líneas: peso (sólida), grasa (dashed), masa muscular (dashed)
- Colores: azul (#3B82F6), ámbar (#F59E0B), verde (#10B981)
- Gradientes bajo las líneas
- Tooltip personalizado con unidades (kg, %)
- Legend con labels en español
- Header con peso actual + trend icon
- Cálculo de cambio de peso y %
- 3 summary cards: peso inicial, actual, cambio grasa

**Empty State**:
```typescript
if (data.length === 0) {
  return <Card>No hay datos...</Card>;
}
```

**Trend Calculation**:
```typescript
const firstWeight = data[0].weight;
const lastWeight = data[data.length - 1].weight;
const weightChange = lastWeight - firstWeight;

let trend: 'up' | 'down' | 'stable' = 'stable';
if (Math.abs(weightChange) > 0.5) {
  trend = weightChange > 0 ? 'up' : 'down';
}
```

**Uso**:
```tsx
<WeightChart data={weightHistory} />
```

---

### 2. MeasurementsRadar

**Archivo**: [src/components/metrics/measurements-radar.tsx](src/components/metrics/measurements-radar.tsx:1)

**Props**:
```typescript
interface MeasurementsRadarProps {
  data: BodyMeasurementsData | null;
  previousData?: BodyMeasurementsData | null;
}
```

**Características**:
- RadarChart de Recharts (400px height)
- 8 mediciones posibles (filtra nulls)
- Compara actual vs anterior (si se pasa previousData)
- Gradiente radial purple (#8B5CF6)
- PolarAngleAxis con labels de medidas
- Línea anterior en gris dashed
- Línea actual en purple sólido
- Lista de medidas con valores y cambios
- Card de resumen de cambios por medida

**Empty State**:
```typescript
if (!data) {
  return (
    <Card>
      <Ruler icon />
      <p>Registra tus medidas...</p>
    </Card>
  );
}
```

**Data Preparation**:
```typescript
const measurements = [
  { name: 'Pecho', key: 'chest', current: data.chest, previous: previousData?.chest },
  { name: 'Cintura', key: 'waist', current: data.waist, previous: previousData?.waist },
  // ... 8 medidas
].filter((m) => m.current !== null);

const radarData = measurements.map((m) => ({
  measurement: m.name,
  actual: m.current,
  anterior: m.previous,
}));
```

**Uso**:
```tsx
<MeasurementsRadar data={latestMeasurements} />
```

---

### 3. PhotoComparison

**Archivo**: [src/components/metrics/photo-comparison.tsx](src/components/metrics/photo-comparison.tsx:1)

**Props**:
```typescript
interface PhotoComparisonProps {
  photos: ProgressPhotoData[];
  onUploadClick: () => void;
}
```

**Características**:
- 2 modos: Gallery y Compare
- Gallery: grid 2x4 con fotos en aspect-ratio 3:4
- Compare: 2 slots (antes/después) + selector grid
- Animaciones Framer Motion en cards
- Full screen dialog al click en foto
- Botón delete con confirmación
- Toast feedback para acciones
- Border colors: purple (slot 1), green (slot 2)

**Estados**:
```typescript
const [selectedPhoto, setSelectedPhoto] = useState<ProgressPhotoData | null>(null);
const [compareMode, setCompareMode] = useState(false);
const [comparePhotos, setComparePhotos] = useState<[ProgressPhotoData | null, ProgressPhotoData | null]>([
  null,
  null,
]);
```

**Compare Mode Flow**:
1. Click "Comparar" → activa compareMode
2. Muestra 2 slots vacíos + grid selector
3. Click en foto del grid → asigna a slot 1 o 2
4. Muestra border colored según slot
5. Click X en slot → limpia selección

**Delete Flow**:
```typescript
const handleDeletePhoto = async (photoId: string) => {
  if (!confirm('¿Estás seguro?')) return;

  setIsDeleting(true);
  const result = await deleteProgressPhoto(photoId);

  if (result.success) {
    toast.success('Foto eliminada');
    router.refresh();
  }
  setIsDeleting(false);
};
```

**Uso**:
```tsx
<PhotoComparison
  photos={photos}
  onUploadClick={() => openForms('photo')}
/>
```

---

### 4. MetricsForms

**Archivo**: [src/components/metrics/metrics-forms.tsx](src/components/metrics/metrics-forms.tsx:1)

**Props**:
```typescript
interface MetricsFormsProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'weight' | 'measurements' | 'photo';
}
```

**Características**:
- Dialog de shadcn/ui
- Tabs: Peso | Medidas | Foto
- react-hook-form para Peso y Medidas
- zodResolver para validación
- File input para fotos con preview
- Error messages inline
- Loading states por tab
- Auto-refresh al guardar

**Weight Form**:
```typescript
const {
  register: registerWeight,
  handleSubmit: handleSubmitWeight,
  formState: { errors: weightErrors },
  reset: resetWeight,
} = useForm<BodyWeightInput>({
  resolver: zodResolver(weightSchema),
});
```

**Fields**:
- Weight: number input, step 0.1, required
- Body Fat: number input, step 0.1, optional
- Muscle Mass: number input, step 0.1, optional
- Date: date input, defaults to today

**Measurements Form**:
- 8 number inputs (chest, waist, hips, shoulders, arms, thighs)
- Todos opcionales
- Step 0.1
- Labels en español

**Photo Upload**:
```typescript
const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];

  // Validate size
  if (file.size > 5 * 1024 * 1024) {
    toast.error('Máximo 5MB');
    return;
  }

  // Validate type
  if (!file.type.startsWith('image/')) {
    toast.error('Solo imágenes');
    return;
  }

  setSelectedFile(file);

  // Create preview
  const reader = new FileReader();
  reader.onloadend = () => {
    setPhotoPreview(reader.result as string);
  };
  reader.readAsDataURL(file);
};
```

**Submit**:
```typescript
const handlePhotoUpload = async () => {
  const reader = new FileReader();
  reader.onloadend = async () => {
    const dataUrl = reader.result as string;
    const result = await saveProgressPhoto(dataUrl, photoNotes);

    if (result.success) {
      toast.success('Foto guardada');
      router.refresh();
      onClose();
    }
  };
  reader.readAsDataURL(selectedFile);
};
```

**Uso**:
```tsx
<MetricsForms
  isOpen={isFormsOpen}
  onClose={() => setIsFormsOpen(false)}
  initialTab="weight"
/>
```

---

## 🎨 Página Principal

### Archivo: [src/app/metrics/page.tsx](src/app/metrics/page.tsx:1)

**Layout**:
```
┌─────────────────────────────────────────────────────────┐
│ Hero Section (Gradiente blue-purple-pink)               │
│ 📊 Métricas Corporales + Botón Registrar               │
├─────────────────────────────────────────────────────────┤
│ Summary Cards: Peso | Grasa | Mediciones | Fotos       │
├─────────────────────────────────────────────────────────┤
│ Quick Actions: 3 botones (peso, medidas, foto)         │
├─────────────────────────────────────────────────────────┤
│ WeightChart (full width)                               │
├─────────────────────────────────────────────────────────┤
│ Grid 2 cols: MeasurementsRadar | PhotoComparison       │
├─────────────────────────────────────────────────────────┤
│ Tips Section (gradiente purple-pink)                   │
└─────────────────────────────────────────────────────────┘
```

**Estados**:
```typescript
const [isFormsOpen, setIsFormsOpen] = useState(false);
const [formsTab, setFormsTab] = useState<'weight' | 'measurements' | 'photo'>('weight');
const [weightHistory, setWeightHistory] = useState<BodyWeightData[]>([]);
const [latestMeasurements, setLatestMeasurements] = useState<BodyMeasurementsData | null>(null);
const [photos, setPhotos] = useState<ProgressPhotoData[]>([]);
const [summary, setSummary] = useState<MetricsSummary | null>(null);
```

**Data Loading**:
```typescript
const loadData = async () => {
  const [weights, measurements, photosList, summaryData] = await Promise.all([
    getBodyWeightHistory(6),
    getLatestMeasurements(),
    getProgressPhotos(),
    getMetricsSummary(),
  ]);

  setWeightHistory(weights);
  setLatestMeasurements(measurements);
  setPhotos(photosList);
  setSummary(summaryData);
};

useEffect(() => {
  loadData();
}, []);
```

**Summary Cards**:
- 4 cards con gradientes: blue, amber, purple, pink
- Iconos: Scale, Activity, Ruler, Camera
- Trend icons (TrendingUp/Down) si hay cambios
- Valores: peso, grasa%, total mediciones, total fotos
- Texto de cambio: "+X kg este mes"

**Animaciones**:
- Hero: y: -20→0, duration 0.5s
- Summary: delay 0.1s
- Quick Actions: delay 0.2s
- Weight Chart: delay 0.3s
- Measurements: delay 0.4s
- Photos: delay 0.5s
- Tips: delay 0.6s

**Loading Skeleton**:
```typescript
function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-40" />
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <Skeleton className="h-96" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-96" />
        <Skeleton className="h-96" />
      </div>
    </div>
  );
}
```

---

## 🎨 Estilo Minimalista Kairos

### Paleta de Colores

```typescript
// Gradientes principales
from-blue-50 via-purple-50 to-pink-50   // Hero section
from-blue-500 to-purple-600             // Botón principal
from-purple-500 to-pink-600             // Tips section

// Summary Cards
from-blue-500 to-blue-600               // Peso
from-amber-500 to-orange-600            // Grasa
from-purple-500 to-purple-600           // Mediciones
from-pink-500 to-rose-600               // Fotos

// Charts
#3B82F6  // Blue - Peso
#F59E0B  // Amber - Grasa corporal
#10B981  // Green - Masa muscular
#8B5CF6  // Purple - Radar chart
```

### Componentes Styled

**Summary Card**:
```css
.card {
  overflow: hidden;
}

.gradient-header {
  background: linear-gradient(to bottom right, from, to);
  padding: 1rem;
  color: white;
}

.stat-value {
  font-size: 1.875rem; /* 3xl */
  font-weight: 700;
  margin-top: 0.25rem;
}
```

**Photo Card (Compare Mode)**:
```css
.compare-slot-1 {
  border: 2px solid #A855F7; /* purple-400 */
  ring: 2px solid #D8B4FE;   /* purple-300 */
}

.compare-slot-2 {
  border: 2px solid #4ADE80; /* green-400 */
  ring: 2px solid #86EFAC;   /* green-300 */
}
```

---

## 🧪 Testing

### 1. Registro de Peso

**Pasos**:
1. Click "Registrar" o "Registrar Peso"
2. Tab "Peso" activo
3. Ingresar peso (ej: 75.5)
4. Opcional: grasa (ej: 15.2), masa muscular (ej: 60)
5. Click "Guardar Peso"
6. Ver toast de éxito
7. Gráfico actualiza con nuevo punto

**Validaciones a testear**:
- Peso < 30 → error "Peso mínimo: 30kg"
- Peso > 300 → error "Peso máximo: 300kg"
- Grasa < 3 o > 60 → error
- Submit sin peso → error required

---

### 2. Registro de Medidas

**Pasos**:
1. Click "Registrar Medidas"
2. Tab "Medidas" activo
3. Ingresar medidas deseadas (no todas required)
4. Click "Guardar Medidas"
5. Ver toast de éxito
6. Radar chart actualiza

**Casos a testear**:
- Solo 1 medida → válido
- Todas las medidas → válido
- Ninguna medida → error (al menos 1)
- Valores fuera de rango → error

---

### 3. Upload de Foto

**Pasos**:
1. Click "Subir Foto"
2. Tab "Foto" activo
3. Click input file
4. Seleccionar imagen
5. Ver preview
6. Añadir notas opcionales
7. Click "Subir Foto"
8. Ver toast de éxito
9. Foto aparece en galería

**Validaciones a testear**:
- Archivo > 5MB → error "Máximo 5MB"
- No imagen (PDF, TXT) → error "Solo imágenes"
- Submit sin archivo → error "Selecciona imagen"

---

### 4. Comparador de Fotos

**Pasos**:
1. Tener al menos 2 fotos
2. Click "Comparar"
3. Modo compare activa
4. Click foto 1 del grid → slot 1 (purple border)
5. Click foto 2 del grid → slot 2 (green border)
6. Ver fotos side-by-side
7. Click X en slot → limpia selección
8. Click "Cancelar" → vuelve a galería

---

### 5. Eliminar Foto

**Pasos**:
1. Click en foto de galería
2. Dialog full screen abre
3. Ver fecha y notas
4. Click "Eliminar"
5. Confirmar en alert
6. Ver toast de éxito
7. Foto desaparece de galería

---

### 6. Responsive

**Mobile** (< 768px):
- Summary cards: 1-2 columnas
- Chart: full width, scroll horizontal si needed
- Measurements + Photos: 1 columna (stack)
- Photo grid: 2 columnas
- Forms: full width

**Tablet** (768px - 1024px):
- Summary cards: 4 columnas
- Measurements + Photos: 2 columnas
- Photo grid: 4 columnas

**Desktop** (> 1024px):
- Todo en grid
- Máxima información visible
- Photo grid: 4 columnas

---

## 🚨 Troubleshooting

### Gráfico no muestra datos

**Causa**: Array vacío o datos mal formateados

**Solución**:
```typescript
// Verificar formato de data
const chartData = data.map((entry) => ({
  date: format(entry.date, 'dd MMM', { locale: es }),
  weight: entry.weight, // debe ser number
  bodyFat: entry.bodyFat,
  muscleMass: entry.muscleMass,
}));
```

### Radar chart vacío

**Causa**: Todas las medidas son null

**Solución**:
```typescript
const measurements = [
  { name: 'Pecho', current: data.chest },
  // ...
].filter((m) => m.current !== null); // Filtra nulls

if (measurements.length === 0) {
  return <EmptyState />;
}
```

### Foto no sube

**Causa**: Falta conversión a data URL

**Solución**:
```typescript
const reader = new FileReader();
reader.onloadend = async () => {
  const dataUrl = reader.result as string;
  await saveProgressPhoto(dataUrl, notes);
};
reader.readAsDataURL(selectedFile);
```

### Form no valida

**Causa**: Schema de Zod no coincide con tipos

**Solución**:
```typescript
// En schema: optional().or(z.literal(undefined))
bodyFat: z.number().min(3).max(60).optional().or(z.literal(undefined)),

// En register: valueAsNumber
{...registerWeight('bodyFat', { valueAsNumber: true })}
```

### Toast no se muestra

**Causa**: Falta `<Toaster />`

**Solución**:
```tsx
import { Toaster } from 'sonner';

<Toaster position="top-right" richColors />
```

---

## 🎯 Próximas Mejoras

1. **Supabase Storage**: Upload real de fotos a bucket
2. **Comparación Histórica**: Overlay de fotos (slider antes/después)
3. **Export**: Descargar datos en CSV o PDF
4. **Goals**: Establecer metas de peso/grasa
5. **Recordatorios**: Notificaciones para medir semanalmente
6. **Body Fat Calculator**: Calcular grasa con fórmulas (Navy, etc)
7. **BMI y otras métricas**: Calcular IMC, BMR, TDEE
8. **Charts avanzados**: Correlaciones peso-grasa, proyecciones
9. **Photo Filters**: Filtros de fecha, tags
10. **Multi-Photo Compare**: Comparar 3-4 fotos en grid

---

## 📚 Recursos

- [Recharts Docs](https://recharts.org/)
- [react-hook-form Docs](https://react-hook-form.com/)
- [Zod Validation](https://zod.dev/)
- [sonner (Toast)](https://sonner.emilkowal.ski/)
- [Framer Motion](https://www.framer.com/motion/)
- [shadcn/ui Components](https://ui.shadcn.com/)

---

**¡Sistema de Métricas Completado!** 🎉

Visita `http://localhost:3000/metrics` para registrar tu peso, medidas y fotos de progreso.

## 🔑 Tecnologías Principales

- **Next.js 14** - App Router, Server Actions
- **Recharts** - LineChart, RadarChart
- **react-hook-form** - Form management
- **Zod** - Schema validation
- **Prisma** - ORM para Supabase
- **sonner** - Toast notifications
- **Framer Motion** - Animations
- **shadcn/ui** - Dialog, Tabs, Input, etc
- **Tailwind CSS** - Utility-first styling

---

## 📖 Flujo Completo - Registro de Peso

```
Usuario abre forms
        ↓
Tab "Peso" activo
        ↓
Ingresa datos (react-hook-form)
        ↓
Submit → validación Zod
        ↓
Si válido → saveBodyWeight() Server Action
        ↓
Prisma create en bodyMetric
        ↓
Revalidar rutas (/metrics, /progress-new)
        ↓
Toast de éxito
        ↓
Router refresh
        ↓
loadData() recarga todo
        ↓
Gráfico actualiza con nuevo punto
```

## 📖 Flujo Completo - Upload Foto

```
Usuario selecciona archivo
        ↓
Validar tamaño y tipo
        ↓
FileReader crea preview (data URL)
        ↓
Mostrar preview en dialog
        ↓
Usuario añade notas opcionales
        ↓
Click "Subir Foto"
        ↓
FileReader convierte a data URL
        ↓
saveProgressPhoto() Server Action
        ↓
Prisma create en progressPhoto
        ↓
Revalidar /metrics
        ↓
Toast de éxito
        ↓
Router refresh
        ↓
Foto aparece en galería
```
