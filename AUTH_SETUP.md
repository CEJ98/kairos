# Guía de Autenticación - Kairos Fitness

Esta guía detalla la implementación completa de Next.js 14 + Supabase + Prisma + NextAuth.

## 📋 Configuración Completa

### 1. Configurar Supabase

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta
2. Crea un nuevo proyecto:
   - Nombre: `kairos-fitness`
   - Database Password: **Guarda esta contraseña de forma segura**
   - Region: Elige la más cercana

3. Obtén las credenciales:
   - `Project Settings` > `API`
     - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
     - anon public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - service_role key → `SUPABASE_SERVICE_ROLE_KEY`

   - `Project Settings` > `Database`
     - Connection string → `DATABASE_URL`

### 2. Variables de Entorno

Edita `.env.local`:

```bash
# Database (Supabase PostgreSQL)
DATABASE_URL="postgresql://postgres.xxxxx:[PASSWORD]@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.xxxxx:[PASSWORD]@aws-0-region.pooler.supabase.com:5432/postgres"

# NextAuth
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
NEXTAUTH_URL="http://localhost:3000"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://xxxxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGc..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGc..."

# Google OAuth (opcional)
GOOGLE_CLIENT_ID="xxxxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-xxxxx"
```

### 3. Configurar Base de Datos

```bash
# Generar cliente Prisma
pnpm db:generate

# Crear tablas en Supabase
pnpm db:push

# Poblar con datos de ejemplo
pnpm db:seed
```

### 4. Probar Configuración

Iniciar servidor:
```bash
pnpm dev
```

Visita: [http://localhost:3000](http://localhost:3000)

## 🔐 Endpoints Disponibles

### Autenticación

#### Login con Credentials
```typescript
// POST /api/auth/signin
// NextAuth maneja esto automáticamente

// Desde el frontend:
import { signIn } from 'next-auth/react';

const result = await signIn('credentials', {
  email: 'demo@kairos.fit',
  password: 'DemoPass123!',
  redirect: false
});
```

#### Login con Google
```typescript
import { signIn } from 'next-auth/react';

await signIn('google', { callbackUrl: '/dashboard' });
```

#### Registro de Usuario
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nuevo@example.com",
    "password": "SecurePass123!",
    "name": "Nombre Usuario"
  }'
```

Respuesta:
```json
{
  "success": true,
  "message": "Usuario creado exitosamente",
  "user": {
    "id": "clxxx...",
    "email": "nuevo@example.com",
    "name": "Nombre Usuario",
    "createdAt": "2025-10-25T..."
  }
}
```

#### Logout
```typescript
import { signOut } from 'next-auth/react';

await signOut({ callbackUrl: '/login' });
```

### Métricas de Usuario

#### Obtener Métricas
```bash
# GET /api/metrics?limit=30&offset=0
curl http://localhost:3000/api/metrics \
  -H "Cookie: next-auth.session-token=tu-token"
```

Respuesta:
```json
{
  "success": true,
  "data": [
    {
      "id": "clxxx...",
      "date": "2025-10-25T00:00:00.000Z",
      "weightKg": 75.5,
      "bodyFat": 15.2,
      "waistCm": 82.0,
      "createdAt": "2025-10-25T..."
    }
  ],
  "pagination": {
    "total": 50,
    "limit": 30,
    "offset": 0,
    "hasMore": true
  }
}
```

#### Crear Métrica
```bash
curl -X POST http://localhost:3000/api/metrics \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=tu-token" \
  -d '{
    "weightKg": 75.5,
    "bodyFat": 15.2,
    "waistCm": 82.0,
    "hipCm": 95.0,
    "neckCm": 38.0
  }'
```

Respuesta:
```json
{
  "success": true,
  "message": "Métrica creada exitosamente",
  "data": {
    "id": "clxxx...",
    "date": "2025-10-25T...",
    "weightKg": 75.5,
    "bodyFat": 15.2,
    ...
  }
}
```

## 🧪 Usuario Demo

Después del seed, puedes usar:
- **Email:** `demo@kairos.fit`
- **Password:** `DemoPass123!`

Este usuario incluye:
- ✅ 8 semanas de entrenamientos
- ✅ 12 semanas de métricas corporales
- ✅ Plan de entrenamiento activo
- ✅ Historial de adherencia

## 🔒 Uso en Componentes

### Server Component (Recomendado)

```typescript
// app/dashboard/page.tsx
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  return (
    <div>
      <h1>Hola, {session.user?.name}!</h1>
      <p>ID: {session.user?.id}</p>
    </div>
  );
}
```

### Client Component

```typescript
// components/UserProfile.tsx
'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';

export function UserProfile() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div>Cargando...</div>;
  }

  if (status === 'unauthenticated') {
    redirect('/login');
  }

  return (
    <div>
      <h2>{session?.user?.name}</h2>
      <p>{session?.user?.email}</p>
    </div>
  );
}
```

### API Route Protection

```typescript
// app/api/protected/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json(
      { error: 'No autenticado' },
      { status: 401 }
    );
  }

  // Usuario autenticado - procesar request
  return NextResponse.json({
    data: 'Contenido protegido',
    userId: session.user.id
  });
}
```

## 🏗️ Arquitectura

### Flujo de Autenticación

```
1. Usuario envía credenciales
   ↓
2. NextAuth valida con Prisma
   ↓
3. Si válido, crea JWT
   ↓
4. JWT almacenado en cookie segura
   ↓
5. Requests subsecuentes incluyen JWT
   ↓
6. Server verifica JWT en cada request
```

### Estructura de Archivos

```
src/
├── app/
│   └── api/
│       ├── auth/
│       │   ├── [...nextauth]/
│       │   │   └── route.ts          # NextAuth handler
│       │   └── register/
│       │       └── route.ts          # Endpoint de registro
│       └── metrics/
│           └── route.ts              # Endpoints de métricas
├── lib/
│   ├── auth/
│   │   ├── options.ts                # Configuración NextAuth
│   │   ├── password.ts               # Utilidades bcrypt
│   │   ├── session.ts                # Helpers de sesión
│   │   └── index.ts                  # Exports públicos
│   └── clients/
│       ├── prisma.ts                 # Cliente Prisma
│       └── supabase-storage.ts       # Cliente Supabase Storage
└── types/
    └── next-auth.d.ts                # Types de NextAuth
```

## 🔍 Verificar en Supabase

### Ver Tablas Creadas
1. Abre Supabase Dashboard
2. Ve a `Table Editor`
3. Verifica tablas: User, Account, Session, Profile, BodyMetric, etc.

### Query SQL Directo
```sql
-- Ver usuarios
SELECT id, email, name, "createdAt" FROM "User";

-- Ver métricas del demo
SELECT * FROM "BodyMetric"
WHERE "userId" = (SELECT id FROM "User" WHERE email = 'demo@kairos.fit')
ORDER BY date DESC LIMIT 10;

-- Ver sesiones activas
SELECT * FROM "Session"
WHERE expires > NOW();
```

## 🚨 Troubleshooting

### Error: "Invalid credentials"
- Verifica email y password correctos
- Asegúrate de que el usuario existe en la DB
- El password debe tener hash en la DB

### Error: "Database connection failed"
- Verifica `DATABASE_URL` correcta
- Confirma que Supabase esté activo
- Revisa que la contraseña sea correcta

### Error: "NEXTAUTH_SECRET required"
- Genera con: `openssl rand -base64 32`
- Agrega a `.env.local`

### Session es null
- Verifica que `NEXTAUTH_URL` sea correcta
- Limpia cookies del navegador
- Verifica que el usuario esté logueado

### Google OAuth no funciona
- Verifica `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET`
- Confirma redirect URI en Google Console:
  `http://localhost:3000/api/auth/callback/google`
- Asegúrate de que la aplicación esté en modo testing/producción

## 📊 Modelo de Datos

### Usuario
```prisma
model User {
  id           String   @id @default(cuid())
  email        String   @unique
  name         String?
  passwordHash String?  // Solo para Credentials
  image        String?  // Avatar (OAuth o upload)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  // Relaciones
  accounts     Account[]
  sessions     Session[]
  profile      Profile?
  bodyMetrics  BodyMetric[]
}
```

### Perfil
```prisma
model Profile {
  id              String   @id @default(cuid())
  userId          String   @unique
  age             Int?
  heightCm        Float?
  weightKg        Float?
  trainingMax     Float?
  progressionRule String   @default("VOLUME")

  user User @relation(...)
}
```

### Métrica Corporal
```prisma
model BodyMetric {
  id        String   @id @default(cuid())
  userId    String
  date      DateTime @default(now())
  weightKg  Float?
  bodyFat   Float?
  neckCm    Float?
  waistCm   Float?
  hipCm     Float?

  user User @relation(...)
}
```

## 🔗 Referencias

- [NextAuth Docs](https://next-auth.js.org)
- [Prisma Adapter](https://authjs.dev/reference/adapter/prisma)
- [Supabase + Next.js](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Google OAuth Setup](https://next-auth.js.org/providers/google)

---

**¿Problemas?** Revisa los logs con:
```bash
NEXTAUTH_DEBUG=true pnpm dev
```
