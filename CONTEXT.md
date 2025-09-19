# CONTEXT.md - Kairos Fitness Platform

## 1. Objetivo del Producto

**Kairos Fitness** es una plataforma integral de fitness que conecta entrenadores personales con clientes, proporcionando herramientas avanzadas para la gestión de entrenamientos, seguimiento de progreso y administración de suscripciones.

### Propósito Principal
- **Para Clientes**: Acceso a rutinas personalizadas, seguimiento de progreso, mediciones corporales y comunicación directa con entrenadores certificados
- **Para Entrenadores**: Dashboard profesional para gestionar clientes, crear rutinas con IA, analizar métricas de rendimiento y generar ingresos recurrentes
- **Para Administradores**: Panel de control completo para supervisar la plataforma, gestionar usuarios y monitorear métricas de negocio

### Público Objetivo
- **Clientes**: Personas que buscan mejorar su condición física con orientación profesional
- **Entrenadores Personales**: Profesionales del fitness que desean digitalizar y escalar su negocio
- **Gimnasios y Centros de Fitness**: Instituciones que requieren una solución integral de gestión

## 2. Entidades Principales

### User
**Campos clave:**
- `id`: Identificador único
- `email`: Email único para autenticación
- `role`: ADMIN | TRAINER | CLIENT
- `name`: Nombre completo
- `avatar`: URL de imagen de perfil
- `isVerified`: Estado de verificación de cuenta

**Relaciones:**
- `clientProfiles`: Perfil de cliente (1:N)
- `trainerProfile`: Perfil de entrenador (1:1)
- `workouts`: Rutinas creadas (1:N)
- `workoutSessions`: Sesiones de entrenamiento (1:N)
- `subscriptions`: Suscripciones activas (1:N)
- `notifications`: Notificaciones (1:N)

### Workout
**Estructura:**
- `id`: Identificador único
- `name`: Nombre de la rutina
- `description`: Descripción detallada
- `category`: Categoría (STRENGTH, CARDIO, FLEXIBILITY, etc.)
- `difficulty`: Nivel de dificultad (BEGINNER, INTERMEDIATE, ADVANCED)
- `estimatedDuration`: Duración estimada en minutos
- `isTemplate`: Indica si es una plantilla reutilizable
- `isPublic`: Visibilidad pública

**Relación con ejercicios:**
- `exercises`: Array de WorkoutExercise con orden, series, repeticiones y descanso

### Exercise
**Detalles y atributos:**
- `id`: Identificador único
- `name`: Nombre del ejercicio
- `description`: Instrucciones detalladas
- `category`: Categoría muscular
- `equipment`: Equipamiento necesario
- `difficulty`: Nivel de dificultad
- `instructions`: Pasos de ejecución
- `tips`: Consejos de forma y técnica
- `videoUrl`: URL de video demostrativo
- `imageUrl`: Imagen ilustrativa

### BodyMeasurement
**Tipos de métricas registradas:**
- `weight`: Peso corporal
- `bodyFat`: Porcentaje de grasa corporal
- `muscleMass`: Masa muscular
- `height`: Altura
- `chest`: Perímetro pectoral
- `waist`: Perímetro de cintura
- `hips`: Perímetro de cadera
- `arms`: Perímetro de brazos
- `thighs`: Perímetro de muslos
- `date`: Fecha de medición
- `notes`: Observaciones adicionales

## 3. Rutas Críticas del Dashboard

### Endpoints de Autenticación
- `POST /api/auth/signin` - Inicio de sesión
- `POST /api/auth/signup` - Registro de usuarios
- `GET /api/auth/session` - Verificación de sesión
- `POST /api/auth/signout` - Cierre de sesión

### API de Rutinas
- `GET /api/workouts` - Listar rutinas (filtros: categoría, dificultad, público)
- `POST /api/workouts` - Crear nueva rutina
- `GET /api/workouts/[id]` - Obtener rutina específica
- `PUT /api/workouts/[id]` - Actualizar rutina
- `DELETE /api/workouts/[id]` - Eliminar rutina
- `POST /api/workouts/[id]/sessions` - Crear sesión de entrenamiento

### API de Usuarios y Perfiles
- `GET /api/users/[id]` - Obtener perfil de usuario
- `PUT /api/users/[id]` - Actualizar perfil
- `GET /api/trainers/assignments` - Gestión de asignaciones trainer-cliente
- `POST /api/trainers/assignments` - Asignar cliente a entrenador

### API de Progreso y Analytics
- `GET /api/progress` - Obtener datos de progreso (filtros: timeframe, tipo)
- `POST /api/measurements` - Registrar mediciones corporales
- `GET /api/analytics/trainer/clients` - Métricas de clientes para entrenadores

### API de Notificaciones
- `GET /api/notifications` - Listar notificaciones
- `POST /api/notifications/subscribe` - Suscribirse a push notifications
- `POST /api/notifications/workout-reminder` - Programar recordatorios
- `POST /api/notifications/trainer-message` - Mensajes de entrenador

### Rutas del Dashboard por Rol

**Cliente:**
- `/dashboard` - Dashboard principal
- `/workouts` - Biblioteca de rutinas
- `/dashboard/exercises` - Catálogo de ejercicios
- `/dashboard/progress` - Seguimiento de progreso
- `/dashboard/profile` - Perfil personal
- `/dashboard/billing` - Gestión de suscripción

**Entrenador:**
- `/dashboard/trainer` - Dashboard del entrenador
- `/dashboard/trainer/clients` - Gestión de clientes
- `/dashboard/trainer/workouts` - Rutinas del entrenador
- `/dashboard/trainer/ai-workouts` - Generación con IA
- `/dashboard/trainer/calendar` - Calendario de sesiones
- `/dashboard/trainer/analytics` - Métricas detalladas
- `/dashboard/trainer/billing` - Facturación

**Administrador:**
- `/admin` - Panel de administración
- `/admin/backup` - Gestión de respaldos
- `/admin/stripe-webhooks` - Configuración de webhooks
- `/admin/performance` - Monitoreo de rendimiento

### Flujos de Autenticación y Autorización
1. **Autenticación**: NextAuth.js con JWT tokens
2. **Middleware de autorización**: Verificación de roles en `/src/middleware.ts`
3. **Protección de rutas**: Redirección automática según rol de usuario
4. **Sesiones**: Gestión de estado con `next-auth/react`

## 4. Variables de Entorno Mínimas

### Configuraciones Obligatorias para Desarrollo
```env
# Base de datos
DATABASE_URL="file:./dev.db"

# Autenticación
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-jwt-key"

# Entorno
NODE_ENV="development"
```

### Configuraciones Obligatorias para Producción
```env
# Base de datos (PostgreSQL)
DATABASE_URL="postgresql://user:password@host:port/database"

# Autenticación
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="production-secret-key-min-32-chars"

# Stripe (Pagos)
STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Email
RESEND_API_KEY="re_..."
SMTP_FROM="noreply@yourdomain.com"

# Push Notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY="..."
VAPID_PRIVATE_KEY="..."
VAPID_EMAIL="mailto:support@yourdomain.com"

# Seguridad
INTERNAL_API_SECRET="internal-api-secret-key"

# Entorno
NODE_ENV="production"
```

### Valores Sensibles y Manejo Seguro
- **Secretos JWT**: Mínimo 32 caracteres, generados aleatoriamente
- **Claves de Stripe**: Separar test/live, rotar periódicamente
- **VAPID Keys**: Generar con `npx web-push generate-vapid-keys`
- **Database URL**: Usar conexiones SSL en producción
- **API Secrets**: Generar con herramientas criptográficas seguras

## 5. Métricas de Éxito del Sprint

### 1. Tasa de Adopción de Usuarios (KPI Principal)
**Objetivo**: Alcanzar 85% de usuarios activos semanalmente
**Medición**: 
- Usuarios que inician sesión al menos 3 veces por semana
- Usuarios que completan al menos 1 rutina por semana
- Tiempo promedio de sesión > 15 minutos

**Criterios de aceptación**:
- Dashboard de analytics funcional mostrando métricas en tiempo real
- Sistema de notificaciones push implementado y operativo
- Onboarding completo con menos de 3 pasos

### 2. Eficiencia de Entrenadores (KPI Operacional)
**Objetivo**: Reducir tiempo de gestión de clientes en 40%
**Medición**:
- Tiempo promedio para crear una rutina < 5 minutos
- Asignación de rutinas a clientes < 30 segundos
- Generación de reportes de progreso automatizada

**Criterios de aceptación**:
- Generador de rutinas con IA funcional
- Sistema de plantillas de rutinas implementado
- Dashboard de clientes con métricas consolidadas

### 3. Estabilidad y Performance de la Plataforma (KPI Técnico)
**Objetivo**: Mantener 99.5% de uptime y tiempo de respuesta < 2s
**Medición**:
- Tiempo de respuesta promedio de API < 500ms
- Zero errores críticos en producción
- Tiempo de carga de páginas < 2 segundos

**Criterios de aceptación**:
- Monitoreo de performance implementado en `/api/admin/performance`
- Sistema de logs estructurados operativo
- Backup automático de base de datos configurado
- Tests de integración con cobertura > 80%

---

**Generado automáticamente el**: $(date)
**Stack Tecnológico**: Next.js 15 + App Router, NextAuth.js, Prisma, SQLite/PostgreSQL, Stripe, Tailwind CSS
**Configuraciones de Seguridad**: Mantenidas según `next.config.js`