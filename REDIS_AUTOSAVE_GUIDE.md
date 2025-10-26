# 🚀 Guía de Autosave con Upstash Redis

Esta guía explica cómo funciona el sistema de autosave de entrenamientos usando Upstash Redis y Next.js Server Actions.

## 📋 Tabla de Contenidos

- [Descripción General](#descripción-general)
- [Arquitectura](#arquitectura)
- [Configuración](#configuración)
- [Funcionalidades](#funcionalidades)
- [Uso del Sistema](#uso-del-sistema)
- [API Reference](#api-reference)
- [Resolución de Problemas](#resolución-de-problemas)

## Descripción General

El sistema de autosave permite:

- **Guardado automático** de entrenamientos cada 2 segundos después de cambios
- **Guardado manual** mediante botón
- **Indicadores visuales** del estado de guardado (guardando, guardado, error, offline)
- **Recuperación automática** de entrenamientos al recargar la página
- **TTL de 7 días** para entrenamientos guardados
- **TTL de 24 horas** para sesiones activas

### Tecnologías Utilizadas

- **Upstash Redis**: Base de datos Redis serverless
- **Next.js Server Actions**: Lógica del servidor sin API routes
- **React Hooks**: `useEffect`, `useCallback`, `useRef` para autosave
- **Debouncing**: Optimización de llamadas a Redis

## Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                    WorkoutEditor (Client)                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 1. Usuario edita sets (peso, reps, RPE)             │   │
│  │ 2. Estado local se actualiza inmediatamente         │   │
│  │ 3. Debouncer espera 2 segundos                      │   │
│  │ 4. Llama a Server Action                            │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              Server Actions (workout-actions.ts)             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 1. Verifica autenticación con NextAuth              │   │
│  │ 2. Transforma datos a formato Redis                 │   │
│  │ 3. Guarda en Redis con TTL                          │   │
│  │ 4. Actualiza índice de entrenamientos del usuario   │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Upstash Redis (Cloud)                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Key: workout:{userId}:{workoutId}                   │   │
│  │ Value: JSON del entrenamiento completo              │   │
│  │ TTL: 7 días (604800 segundos)                       │   │
│  │                                                      │   │
│  │ Key: workouts:{userId} (sorted set)                 │   │
│  │ Members: workoutIds ordenados por timestamp         │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Configuración

### 1. Crear cuenta en Upstash

1. Visita [https://upstash.com](https://upstash.com)
2. Crea una cuenta gratuita
3. Crea una nueva base de datos Redis
4. Selecciona la región más cercana a tus usuarios

### 2. Obtener credenciales

En el dashboard de Upstash:

1. Selecciona tu base de datos
2. Ve a la pestaña "REST API"
3. Copia las credenciales:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

### 3. Configurar variables de entorno

Crea o actualiza tu archivo `.env.local`:

```bash
# Upstash Redis (para autosave de entrenamientos)
UPSTASH_REDIS_REST_URL="https://your-redis-url.upstash.io"
UPSTASH_REDIS_REST_TOKEN="AXXxxxxx...your-token"
```

### 4. Verificar instalación

El paquete `@upstash/redis` ya está instalado. Si necesitas reinstalarlo:

```bash
pnpm add @upstash/redis
```

## Funcionalidades

### ✅ Auto-save con Debouncing

El sistema guarda automáticamente después de cambios:

```typescript
// Se activa 2 segundos después del último cambio
useEffect(() => {
  const timeout = setTimeout(() => {
    saveWorkout(workout);
  }, 2000);

  return () => clearTimeout(timeout);
}, [workout]);
```

**Ventajas:**
- Reduce llamadas innecesarias a Redis
- Mejora rendimiento
- Evita race conditions
- Experiencia de usuario fluida

### 💾 Guardado Manual

El botón "Guardar Entrenamiento" permite forzar guardado inmediato:

```typescript
const handleManualSave = async () => {
  clearTimeout(saveTimeoutRef.current);
  await saveWorkout(workout);
  toast.success('Entrenamiento guardado');
};
```

### 📊 Indicadores Visuales

El sistema muestra el estado en tiempo real:

| Estado | Icono | Descripción |
|--------|-------|-------------|
| `saving` | 🔄 Spinner animado | Guardando en Redis |
| `saved` | ☁️ Cloud verde | Guardado exitoso |
| `error` | ☁️❌ Cloud rojo | Error al guardar |
| `offline` | ☁️⚠️ Cloud amarillo | Usuario no autenticado |

### 🔄 Recuperación Automática

Al cargar la página, el sistema intenta recuperar datos de Redis:

```typescript
useEffect(() => {
  if (authenticated) {
    loadWorkoutFromRedis(workoutId).then(result => {
      if (result.success && result.data) {
        setWorkout(convertFromRedis(result.data));
        toast.success('Entrenamiento cargado desde la nube');
      }
    });
  }
}, [authenticated]);
```

## Uso del Sistema

### Flujo de Usuario

1. **Iniciar sesión**: El autosave requiere autenticación
2. **Abrir workout editor**: `/workout`
3. **Editar sets**: Cualquier cambio activa el autosave
4. **Ver indicador**: Observa el estado en el header
5. **Guardar manual** (opcional): Click en "Guardar Entrenamiento"

### Ejemplo de Edición

```typescript
// 1. Usuario ajusta peso
adjustWeight(exerciseIndex, setId, +2.5);

// 2. Estado local se actualiza inmediatamente
setWorkout(prev => ({...prev, /* cambios */}));

// 3. UI refleja cambios (optimistic UI)
// ✓ Usuario ve el nuevo peso al instante

// 4. Debouncer espera 2 segundos
// [Usuario puede seguir editando...]

// 5. Auto-save se ejecuta
saveWorkout(workout);
// ↓ Server Action: saveWorkoutToRedis()
// ↓ Redis: SET workout:userId:workoutId {...}
// ↓ Respuesta: { success: true, lastModified: "..." }

// 6. Indicador visual actualizado
// "Guardado hace 5s" con icono verde
```

## API Reference

### Server Actions

#### `saveWorkoutToRedis()`

Guarda un entrenamiento en Redis.

```typescript
async function saveWorkoutToRedis(
  workoutData: Omit<RedisWorkoutData, 'userId' | 'lastModified'>
): Promise<SaveWorkoutResult>
```

**Parámetros:**
```typescript
{
  id: string;
  title: string;
  description?: string;
  scheduledAt: string; // ISO date string
  exercises: {
    id: string;
    name: string;
    muscleGroup: string;
    equipment: string;
    sets: WorkoutSet[];
  }[];
}
```

**Respuesta:**
```typescript
{
  success: boolean;
  error?: string;
  lastModified?: string; // ISO date string
}
```

**Ejemplo:**
```typescript
const result = await saveWorkoutToRedis({
  id: 'w1',
  title: 'Empuje Superior A',
  description: 'Pecho, hombros y tríceps',
  scheduledAt: new Date().toISOString(),
  exercises: [/* ... */]
});

if (result.success) {
  console.log('Guardado:', result.lastModified);
}
```

#### `loadWorkoutFromRedis()`

Carga un entrenamiento desde Redis.

```typescript
async function loadWorkoutFromRedis(
  workoutId: string
): Promise<{ success: boolean; data?: RedisWorkoutData; error?: string }>
```

**Ejemplo:**
```typescript
const result = await loadWorkoutFromRedis('w1');

if (result.success && result.data) {
  const workout = convertFromRedis(result.data);
  setWorkout(workout);
}
```

#### `getUserWorkouts()`

Obtiene lista de IDs de entrenamientos del usuario.

```typescript
async function getUserWorkouts(): Promise<{
  success: boolean;
  workoutIds?: string[];
  error?: string;
}>
```

**Ejemplo:**
```typescript
const result = await getUserWorkouts();

if (result.success) {
  console.log('Workouts:', result.workoutIds);
  // ['w1', 'w2', 'w3'] ordenados por último modificado
}
```

#### `deleteWorkoutFromRedis()`

Elimina un entrenamiento de Redis.

```typescript
async function deleteWorkoutFromRedis(
  workoutId: string
): Promise<SaveWorkoutResult>
```

#### `saveWorkoutSession()` / `loadWorkoutSession()`

Guarda/carga sesiones activas con TTL de 24 horas.

```typescript
// Para entrenamientos en progreso
await saveWorkoutSession('session-123', workoutData);
const session = await loadWorkoutSession('session-123');
```

### Redis Keys

El sistema usa los siguientes patrones de keys:

```typescript
// Entrenamiento individual
workout:{userId}:{workoutId}
// Ejemplo: workout:user_abc123:w1

// Índice de entrenamientos del usuario (sorted set)
workouts:{userId}
// Ejemplo: workouts:user_abc123

// Sesión activa
session:{userId}:{sessionId}
// Ejemplo: session:user_abc123:sess_xyz789
```

### TTL (Time To Live)

| Tipo | TTL | Segundos |
|------|-----|----------|
| Workout completo | 7 días | 604,800 |
| Sesión activa | 24 horas | 86,400 |
| Índice de usuario | 7 días | 604,800 |

## Resolución de Problemas

### ❌ Error: "No autenticado"

**Causa**: Usuario no ha iniciado sesión

**Solución**:
```typescript
// Verifica el estado de sesión
const { data: session, status } = useSession();

if (status === 'loading') {
  return <div>Cargando...</div>;
}

if (status === 'unauthenticated') {
  redirect('/auth');
}
```

### ❌ Error: "Error de conexión al guardar"

**Causas posibles**:
1. Credenciales de Upstash incorrectas
2. Redis está fuera de servicio
3. Límite de plan gratuito excedido

**Solución**:
```bash
# 1. Verifica las variables de entorno
echo $UPSTASH_REDIS_REST_URL
echo $UPSTASH_REDIS_REST_TOKEN

# 2. Prueba la conexión directamente
curl -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN" \
  "$UPSTASH_REDIS_REST_URL/ping"
# Debería responder: {"result":"PONG"}

# 3. Verifica uso en dashboard de Upstash
```

### ❌ "Entrenamiento no encontrado en caché"

**Causa**: El workout expiró (TTL) o nunca se guardó

**Solución**:
```typescript
const result = await loadWorkoutFromRedis(workoutId);

if (!result.success) {
  // Cargar desde base de datos principal (Prisma)
  const workout = await prisma.workout.findUnique({
    where: { id: workoutId }
  });

  // O usar datos por defecto
  setWorkout(DUMMY_CURRENT_WORKOUT);
}
```

### ⚠️ Indicador siempre en "offline"

**Causa**: SessionProvider no configurado o sesión no válida

**Solución**:
```typescript
// Verifica que el layout tenga SessionProvider
<SessionProvider>
  <ThemeProvider>
    {children}
  </ThemeProvider>
</SessionProvider>

// Verifica NextAuth configuration
// src/lib/auth.ts debe exportar authOptions válidas
```

### 🔄 Auto-save muy frecuente

**Causa**: Debounce time muy corto

**Solución**:
```typescript
// Ajusta el delay en useEffect
setTimeout(() => {
  saveWorkout(workout);
}, 5000); // 5 segundos en lugar de 2
```

### 💾 Datos no persisten después de reload

**Causa**: Formato de conversión incorrecto

**Solución**:
```typescript
// Asegúrate de convertir fechas correctamente
const loadedWorkout: Workout = {
  ...result.data,
  scheduledAt: new Date(result.data.scheduledAt), // String → Date
  exercises: result.data.exercises.map(ex => ({
    ...ex,
    exercise: ex, // Mapeo correcto de estructura
    targetSets: ex.sets.length,
    targetReps: ex.sets[0]?.reps || 10,
    restSeconds: 90,
  }))
};
```

## 🔐 Seguridad

### Autenticación

Todas las Server Actions verifican autenticación:

```typescript
const session = await getServerSession(authOptions);

if (!session?.user?.id) {
  return { success: false, error: 'No autenticado' };
}
```

### Autorización

El sistema verifica ownership:

```typescript
// Al cargar
if (data.userId !== userId) {
  return { success: false, error: 'No autorizado' };
}

// Al guardar
const dataToSave = {
  ...workoutData,
  userId, // Forzar userId del usuario autenticado
  lastModified: now,
};
```

### Rate Limiting

Upstash Redis incluye rate limiting nativo. Para producción:

```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { redis } from '@/lib/redis';

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '10 s'), // 10 requests por 10 segundos
});

// En Server Action
const { success } = await ratelimit.limit(userId);
if (!success) {
  return { success: false, error: 'Rate limit exceeded' };
}
```

## 📊 Monitoreo

### Logs en Desarrollo

```typescript
// En workout-actions.ts
console.log('Saving workout:', workoutId);
console.log('Redis key:', REDIS_KEYS.workout(userId, workoutId));
console.log('Data size:', JSON.stringify(dataToSave).length);
```

### Analytics en Producción

```typescript
// Integración con PostHog/Sentry
posthog.capture('workout_saved', {
  workoutId,
  exerciseCount: exercises.length,
  totalSets: exercises.reduce((sum, ex) => sum + ex.sets.length, 0),
});
```

### Dashboard de Upstash

Monitorea:
- Requests por segundo
- Uso de memoria
- Comandos ejecutados
- Latencia promedio

## 🚀 Optimizaciones

### 1. Compresión de Datos

Para entrenamientos grandes:

```typescript
import { compress, decompress } from 'lz-string';

// Al guardar
const compressed = compress(JSON.stringify(workoutData));
await redis.set(key, compressed, { ex: 604800 });

// Al cargar
const compressed = await redis.get(key);
const data = JSON.parse(decompress(compressed));
```

### 2. Partial Updates

Guardar solo cambios en lugar de todo el entrenamiento:

```typescript
// Guardar solo un set modificado
const setKey = `${REDIS_KEYS.workout(userId, workoutId)}:set:${setId}`;
await redis.hset(setKey, updates);
```

### 3. Background Sync

Para dispositivos offline:

```typescript
// Service Worker API
if ('serviceWorker' in navigator && 'sync' in registration) {
  await registration.sync.register('sync-workouts');
}
```

## 📚 Recursos Adicionales

- [Documentación de Upstash](https://docs.upstash.com/redis)
- [Upstash SDK Reference](https://github.com/upstash/upstash-redis)
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions)
- [React Hooks Reference](https://react.dev/reference/react)

## 🎯 Próximos Pasos

1. **Implementar offline support** con Service Workers
2. **Agregar compresión** para entrenamientos grandes
3. **Implementar sync** con base de datos principal (Prisma)
4. **Agregar rate limiting** en producción
5. **Implementar analytics** de uso de autosave

---

**¡El sistema de autosave está listo para usar!** 🎉

Ahora puedes editar entrenamientos con la tranquilidad de que tus cambios se guardan automáticamente cada 2 segundos.
