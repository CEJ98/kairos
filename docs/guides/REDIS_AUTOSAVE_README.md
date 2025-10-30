# 💾 Autosave con Upstash Redis - Quick Start

Sistema de guardado automático de entrenamientos usando Upstash Redis y Next.js Server Actions.

## ✨ Características

- ✅ **Autosave automático** cada 2 segundos después de cambios
- ✅ **Guardado manual** con botón dedicado
- ✅ **Indicadores visuales** de estado (guardando, guardado, error, offline)
- ✅ **Recuperación automática** al recargar la página
- ✅ **Debouncing inteligente** para optimizar llamadas
- ✅ **TTL de 7 días** para entrenamientos
- ✅ **Sin bloqueo de UI** (Server Actions asíncronas)

## 🚀 Setup Rápido

### 1. Crear cuenta en Upstash

```bash
# 1. Visita https://upstash.com
# 2. Crea cuenta gratuita
# 3. Crea nueva base de datos Redis
# 4. Copia credenciales REST API
```

### 2. Configurar variables de entorno

Actualiza `.env.local`:

```bash
UPSTASH_REDIS_REST_URL="https://your-redis-url.upstash.io"
UPSTASH_REDIS_REST_TOKEN="AXXxxxxx...your-token"
```

### 3. Verificar instalación

```bash
# Las dependencias ya están instaladas
pnpm dev
```

## 📁 Archivos Creados

```
src/
├── lib/
│   └── redis.ts                    # Cliente Redis + tipos
├── app/
│   └── actions/
│       └── workout-actions.ts      # Server Actions
└── components/
    └── workout/
        └── workout-editor.tsx      # Editor con autosave (actualizado)

.env.example                        # Variables de entorno actualizadas
REDIS_AUTOSAVE_GUIDE.md            # Documentación completa
```

## 🎯 Cómo Funciona

### Flujo de Autosave

```typescript
// 1. Usuario edita un set
adjustWeight(exerciseIndex, setId, +2.5);

// 2. Estado local se actualiza → UI refleja cambio instantáneamente

// 3. Debouncer espera 2 segundos sin cambios

// 4. Se ejecuta Server Action
await saveWorkoutToRedis(workoutData);

// 5. Redis guarda con TTL de 7 días
// Key: workout:userId:workoutId

// 6. Indicador visual: "Guardado hace 5s" ✓
```

### Indicadores Visuales

| Estado | Icono | Descripción |
|--------|-------|-------------|
| **Guardando** | 🔄 Spinner | Enviando datos a Redis |
| **Guardado** | ☁️ Verde | Guardado exitoso hace Xs |
| **Error** | ☁️❌ Rojo | Fallo al guardar |
| **Offline** | ☁️⚠️ Amarillo | No autenticado |

## 💻 Uso en el Editor

### Auto-save (automático)

```typescript
// El componente detecta cambios automáticamente
<WorkoutEditor />

// Cualquier edición activa el debouncer:
// - Cambio de peso ±2.5kg
// - Cambio de reps ±1
// - Cambio de RPE ±0.5
// - Marcar serie como completa
```

### Guardado Manual

```typescript
// Botón "Guardar Entrenamiento"
// Cancela el debouncer y guarda inmediatamente
<Button onClick={handleManualSave}>
  <Save /> Guardar Entrenamiento
</Button>
```

### Recuperación Automática

```typescript
// Al cargar la página, intenta cargar desde Redis
useEffect(() => {
  loadWorkoutFromRedis(workoutId).then(result => {
    if (result.success) {
      setWorkout(result.data);
      toast.success('Entrenamiento cargado desde la nube');
    }
  });
}, []);
```

## 🔑 API Principal

### `saveWorkoutToRedis()`

```typescript
const result = await saveWorkoutToRedis({
  id: 'w1',
  title: 'Empuje Superior A',
  description: 'Pecho, hombros y tríceps',
  scheduledAt: new Date().toISOString(),
  exercises: [/* ... */]
});

// Respuesta:
// { success: true, lastModified: "2024-01-15T10:30:00Z" }
```

### `loadWorkoutFromRedis()`

```typescript
const result = await loadWorkoutFromRedis('w1');

if (result.success && result.data) {
  setWorkout(convertFromRedis(result.data));
}
```

### `getUserWorkouts()`

```typescript
const result = await getUserWorkouts();

// Respuesta:
// { success: true, workoutIds: ['w1', 'w2', 'w3'] }
// Ordenados por último modificado (más reciente primero)
```

## 🛡️ Seguridad

- ✅ **Autenticación requerida**: Verifica sesión con NextAuth
- ✅ **Autorización**: Verifica ownership del workout
- ✅ **Server Actions**: Lógica del servidor, no expuesta al cliente
- ✅ **Rate limiting**: Incluido en Upstash (plan free: 10,000 requests/día)

## 🧪 Testing

### Probar Autosave

1. Inicia sesión: `/auth`
2. Ve al editor: `/workout`
3. Edita un set (peso, reps, RPE)
4. Observa indicador: "Guardando..." → "Guardado hace 5s"
5. Recarga la página
6. Verifica que los cambios persisten

### Probar Error Handling

```bash
# Temporalmente configura credenciales inválidas
UPSTASH_REDIS_REST_TOKEN="invalid-token"

# El indicador debe mostrar: "Error al guardar"
```

### Probar Offline Mode

```typescript
// Cierra sesión y edita
// El indicador debe mostrar: "Offline"
```

## 🐛 Troubleshooting

### "No autenticado"

```bash
# Verifica que estés logueado
# Verifica SessionProvider en layout.tsx
```

### "Error de conexión"

```bash
# Verifica credenciales en .env.local
echo $UPSTASH_REDIS_REST_URL
echo $UPSTASH_REDIS_REST_TOKEN

# Prueba conexión directa
curl -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN" \
  "$UPSTASH_REDIS_REST_URL/ping"
# Debe responder: {"result":"PONG"}
```

### Datos no persisten

```bash
# Verifica que el workout se esté guardando
# Logs en consola del servidor:
# "Saving workout: w1"
# "Redis key: workout:userId:w1"
```

## 📊 Redis Keys

```bash
# Entrenamientos individuales
workout:{userId}:{workoutId}
# TTL: 7 días (604,800 segundos)

# Índice de entrenamientos del usuario (sorted set)
workouts:{userId}
# Ordenado por timestamp de última modificación

# Sesiones activas (para workouts en progreso)
session:{userId}:{sessionId}
# TTL: 24 horas (86,400 segundos)
```

## 🎨 Personalización

### Cambiar tiempo de debounce

```typescript
// En WorkoutEditor
setTimeout(() => {
  saveWorkout(workout);
}, 5000); // 5 segundos en lugar de 2
```

### Cambiar TTL

```typescript
// En workout-actions.ts
await redis.set(key, dataToSave, {
  ex: 1209600 // 14 días en lugar de 7
});
```

### Personalizar indicadores

```typescript
// En WorkoutEditor, sección de indicadores
{saveStatus === 'saved' && (
  <>
    <CheckCircle className="h-4 w-4 text-green-500" />
    <span>✓ Guardado</span>
  </>
)}
```

## 📚 Recursos

- [Documentación Completa](./REDIS_AUTOSAVE_GUIDE.md) - Guía detallada con arquitectura
- [Upstash Docs](https://docs.upstash.com/redis) - Documentación oficial
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions)

## 🎯 Próximos Pasos Recomendados

1. **Configurar Upstash** y probar el autosave
2. **Implementar sync con Prisma** para persistencia permanente
3. **Agregar offline support** con Service Workers
4. **Implementar rate limiting** personalizado
5. **Agregar analytics** de uso de autosave

---

**¡El sistema está listo para usar!** 🎉

Empieza editando entrenamientos en `/workout` y verás el autosave en acción.
