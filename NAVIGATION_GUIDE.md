# Guía de Navegación - Kairos Fitness

Esta guía describe la estructura completa de rutas implementadas con Next.js 14 App Router.

## 🗺️ Estructura de Rutas

### Rutas Públicas

#### `/` - Landing Page
- **Descripción**: Página de inicio con información del producto
- **Características**:
  - Hero section con descripción de Kairos
  - Grid de características principales
  - CTAs para "Probar Demo" y "Crear Cuenta"
  - Estadísticas del producto
- **Links**: `/auth`, `/demo`

#### `/auth` - Autenticación
- **Descripción**: Página unificada de login y registro
- **Características**:
  - Formulario de login con email/contraseña
  - Formulario de registro
  - Integración con Google OAuth
  - Botón para usar cuenta demo
  - Toggle entre login y registro
- **Credenciales Demo**:
  - Email: `demo@kairos.fit`
  - Password: `DemoPass123!`

### Rutas Protegidas (requieren autenticación)

Todas estas rutas usan el layout `AppLayout` que incluye:
- Sidebar minimalista con navegación
- Header con título, descripción y controles
- Navegación responsive (mobile y desktop)
- Avatar y menú de usuario

#### `/demo` - Dashboard Principal
- **Descripción**: Vista general del estado del usuario
- **Características**:
  - 4 tarjetas de estadísticas (Entrenamientos, Adherencia, Racha, Progreso)
  - 3 cards de acciones rápidas:
    - Próximo entrenamiento
    - Progreso reciente
    - Plan semanal
  - Actividad reciente
  - Consejo del día

#### `/workout` - Entrenamientos
- **Descripción**: Gestión de entrenamientos
- **Características**:
  - Card "Próxima Sesión" con CTA para comenzar
  - Card "Historial" con link al calendario
  - Card "Progreso" con link a métricas
  - Card "Acceso Rápido" con herramientas adicionales

#### `/progress` - Progreso
- **Descripción**: Análisis de métricas y evolución
- **Características**:
  - 4 cards de métricas clave:
    - Peso corporal (con tendencia)
    - Grasa corporal (con tendencia)
    - Volumen total
    - 1RM estimado
  - Gráficas de evolución (placeholders)
  - Tabla de progreso por ejercicio
- **Nota**: Esta página ya existía con lógica completa de servidor

#### `/calendar` - Calendario
- **Descripción**: Planificación de entrenamientos
- **Características**:
  - Vista de calendario semanal
  - Lista de entrenamientos de la semana con estados
  - Badges de estado (Completado, Programado, Descanso)
  - 3 cards de estadísticas semanales
- **Nota**: Esta página ya existía con lógica completa de servidor

## 🧩 Componentes Principales

### Layout Components

#### `<Sidebar />` - [src/components/layout/sidebar.tsx](src/components/layout/sidebar.tsx)
Sidebar responsive con:
- Logo de Kairos
- Navegación principal (Demo, Entrenamientos, Progreso, Calendario)
- Sección de usuario con avatar y email
- Botón de cerrar sesión
- Versión mobile con hamburger menu y overlay

#### `<Header />` - [src/components/layout/header.tsx](src/components/layout/header.tsx)
Header sticky con:
- Título de la página
- Descripción opcional
- Botón de notificaciones
- Toggle de tema (dark/light)

#### `<AppLayout />` - [src/components/layout/app-layout.tsx](src/components/layout/app-layout.tsx)
Layout wrapper que combina Sidebar y Header:
```tsx
<AppLayout title="Título" description="Descripción opcional">
  {children}
</AppLayout>
```

### Auth Components

#### `<LoginForm />` - [src/components/auth/login-form.tsx](src/components/auth/login-form.tsx)
- Validación con Zod
- Login con credentials (email/password)
- Login con Google OAuth
- Botón para cuenta demo
- Manejo de errores

#### `<RegisterForm />` - [src/components/auth/register-form.tsx](src/components/auth/register-form.tsx)
- Validación con Zod
- Registro de nuevos usuarios
- Auto-login después de registro exitoso
- Creación automática de perfil

## 🎨 Sistema de Diseño

### Colores (Tailwind)
- **Primary**: Color principal de la marca
- **Secondary**: Color secundario
- **Muted**: Textos secundarios
- **Accent**: Acentos y highlights
- **Border**: Bordes de componentes
- **Background**: Fondo principal
- **Card**: Fondo de tarjetas

### Componentes UI (shadcn/ui)
Todos los componentes están en `src/components/ui/`:

- **Button**: Botón con variantes (default, outline, ghost, link)
- **Card**: Tarjeta con subcomponentes (Header, Title, Description, Content, Footer)
- **Badge**: Etiqueta con variantes (default, secondary, outline)
- **Avatar**: Avatar de usuario con fallback
- **Input**: Campos de texto
- **Toaster**: Sistema de notificaciones

### Tipografía
- **Headings**: Font Poppins (600, 700) - `font-poppins`
- **Body**: Font Inter (400, 500, 600) - `font-sans`

## 🔐 Autenticación

### NextAuth Configuration
Archivo: [src/lib/auth/options.ts](src/lib/auth/options.ts)

#### Providers Configurados:
1. **Credentials Provider**: Login con email/password
2. **Google Provider**: OAuth con Google

#### Session Strategy:
- JWT-based para mejor rendimiento
- Session incluye `user.id`

#### Callbacks:
```typescript
session({ session, token }) {
  if (token.sub) {
    session.user.id = token.sub;
  }
  return session;
}
```

### Protección de Rutas
Para proteger una página:
```typescript
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { redirect } from 'next/navigation';

export default async function ProtectedPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth');
  }

  // Contenido protegido
}
```

Para componentes cliente:
```typescript
'use client';
import { useSession } from 'next-auth/react';

export function ClientComponent() {
  const { data: session, status } = useSession();

  if (status === 'loading') return <div>Loading...</div>;
  if (!session) return <div>No autenticado</div>;

  // Contenido
}
```

## 📱 Responsive Design

### Breakpoints (Tailwind)
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

### Mobile Navigation
- Hamburger menu en `<lg`
- Sidebar fixed en `>=lg`
- Overlay oscuro en mobile cuando está abierto
- Click fuera del sidebar para cerrar

## 🚀 Prueba la Navegación

### 1. Iniciar el servidor
```bash
pnpm dev
```

### 2. Navegar por las rutas

#### Flujo de Usuario Nuevo:
1. Visita `http://localhost:3000`
2. Click en "Registrarse" → `/auth`
3. Completa el formulario de registro
4. Automáticamente redirige a `/demo`
5. Explora las páginas usando el sidebar

#### Flujo con Cuenta Demo:
1. Visita `http://localhost:3000/auth`
2. Click en "Probar cuenta demo"
3. Inicia sesión automáticamente
4. Redirige a `/demo` con datos precargados

#### Flujo con Google OAuth:
1. Visita `http://localhost:3000/auth`
2. Click en botón "Google"
3. Completa autenticación de Google
4. Redirige a `/demo`

### 3. Probar navegación
- Click en cada item del sidebar
- Verifica que las páginas cargan correctamente
- Prueba el responsive (mobile/tablet/desktop)
- Verifica el toggle de tema claro/oscuro
- Prueba cerrar sesión

## 📊 Estado de las Páginas

| Ruta | Estado | Descripción |
|------|--------|-------------|
| `/` | ✅ Completo | Landing page funcional |
| `/auth` | ✅ Completo | Login/Registro con OAuth |
| `/demo` | ✅ Completo | Dashboard con datos estáticos |
| `/workout` | ✅ Completo | Vista de entrenamientos |
| `/progress` | ✅ Completo | Métricas y progreso (con lógica de servidor) |
| `/calendar` | ✅ Completo | Calendario semanal (con lógica de servidor) |

## 🔧 Próximos Pasos

### Mejoras Sugeridas:
1. **Conectar datos reales**: Las páginas `/demo` y `/workout` usan datos estáticos
2. **Agregar loading states**: Skeletons mientras cargan los datos
3. **Implementar error boundaries**: Manejo de errores en rutas
4. **Agregar middleware**: Protección automática de rutas
5. **Optimizar imágenes**: Usar Next.js Image component
6. **PWA**: Configurar service workers para offline
7. **Analytics**: Integrar tracking de eventos

### Nuevas Funcionalidades:
- `/exercises` - Biblioteca de ejercicios
- `/profile` - Perfil de usuario
- `/settings` - Configuración
- `/workout/[id]` - Detalle de entrenamiento individual
- `/plans` - Gestión de planes de entrenamiento

## 🐛 Troubleshooting

### Error: "useSession" is not defined
Asegúrate de que el `SessionProvider` esté en el layout raíz:
```typescript
// src/app/layout.tsx
<SessionProvider>
  {children}
</SessionProvider>
```

### Error: Rutas no protegidas
Usa `getServerSession` en server components o `useSession` en client components.

### Error: Sidebar no aparece en mobile
Verifica que la clase `lg:translate-x-0` esté aplicada al sidebar.

### Componentes no se ven bien
Verifica que hayas importado `@/app/globals.css` en el layout raíz.

## 📝 Convenciones de Código

### Nombres de Archivos:
- Páginas: `page.tsx`
- Layouts: `layout.tsx`
- Componentes: `kebab-case.tsx`

### Estructura de Componentes:
```typescript
// Imports
import { ... } from '...';

// Types (si es necesario)
interface Props { ... }

// Component
export default function ComponentName({ ...props }: Props) {
  // Logic

  return (
    // JSX
  );
}
```

### Estilos:
- Usar Tailwind CSS exclusivamente
- Evitar CSS modules
- Componentes de shadcn/ui para consistencia

---

**¡Todo listo para probar!** 🎉

La navegación está completamente funcional y lista para desarrollo adicional.
