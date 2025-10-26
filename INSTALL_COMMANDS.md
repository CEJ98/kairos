# 📦 Comandos de Instalación - Kairos Fitness

## 🎯 Instalación Automática (RECOMENDADO)

```bash
chmod +x setup-install.sh
./setup-install.sh
```

---

## 📝 Instalación Manual Paso a Paso

### 1. Instalar pnpm (si no lo tienes)
```bash
npm install -g pnpm
```

### 2. Instalar Dependencias de Producción
```bash
pnpm add @prisma/client \
  @next-auth/prisma-adapter \
  next-auth \
  bcryptjs \
  @upstash/redis \
  @upstash/ratelimit \
  @hookform/resolvers \
  react-hook-form \
  zod \
  @radix-ui/react-slot \
  @radix-ui/react-label \
  @radix-ui/react-dialog \
  @radix-ui/react-dropdown-menu \
  @radix-ui/react-avatar \
  @radix-ui/react-select \
  @radix-ui/react-tabs \
  @radix-ui/react-toast \
  class-variance-authority \
  clsx \
  tailwind-merge \
  lucide-react \
  date-fns \
  recharts \
  next-themes
```

### 3. Instalar Dependencias de Desarrollo
```bash
pnpm add -D prisma \
  @types/bcryptjs \
  @types/node \
  @types/react \
  @types/react-dom \
  typescript \
  @typescript-eslint/eslint-plugin \
  @typescript-eslint/parser \
  eslint \
  eslint-config-next \
  eslint-config-prettier \
  prettier \
  prettier-plugin-tailwindcss \
  autoprefixer \
  postcss \
  tailwindcss \
  tsx
```

### 4. Configurar Archivos Base
```bash
# Copiar variables de entorno
cp .env.example.NEW .env.local

# Inicializar Prisma (si no existe)
npx prisma init

# Copiar schema de Prisma
cp prisma/schema.prisma.NEW prisma/schema.prisma

# Copiar archivos de configuración
cp lib/prisma.ts.example lib/prisma.ts
cp lib/auth.ts.example lib/auth.ts
cp lib/redis.ts.example lib/redis.ts
cp lib/utils.ts.example lib/utils.ts
cp components.json.example components.json
```

### 5. Configurar Variables de Entorno
```bash
# Editar .env.local con tus credenciales
nano .env.local

# Mínimo requerido:
# DATABASE_URL="postgresql://..."
# NEXTAUTH_SECRET="$(openssl rand -base64 32)"
# NEXTAUTH_URL="http://localhost:3000"
```

### 6. Configurar Base de Datos
```bash
# Generar Prisma Client
pnpm db:generate

# Push schema a la base de datos
pnpm db:push

# (Opcional) Poblar con datos de prueba
pnpm db:seed
```

### 7. Configurar shadcn/ui
```bash
# Inicializar shadcn/ui
npx shadcn@latest init

# Opciones recomendadas:
# - Style: Default
# - Color: Slate
# - CSS variables: Yes

# Instalar componentes básicos
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add label
npx shadcn@latest add card
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
npx shadcn@latest add avatar
npx shadcn@latest add form
```

### 8. Iniciar Desarrollo
```bash
pnpm dev
```

---

## 🔧 Comandos Útiles Post-Instalación

### Base de Datos
```bash
# Generar Prisma Client
pnpm db:generate

# Push cambios sin migración
pnpm db:push

# Crear migración
pnpm db:migrate

# Ver base de datos (GUI)
pnpm db:studio

# Poblar con datos de prueba
pnpm db:seed
```

### Desarrollo
```bash
# Iniciar servidor de desarrollo
pnpm dev

# Build para producción
pnpm build

# Iniciar producción
pnpm start

# Verificar tipos TypeScript
pnpm typecheck

# Lint
pnpm lint

# Formatear código
pnpm format
```

### Agregar Componentes shadcn/ui
```bash
# Ver todos los componentes disponibles
npx shadcn@latest add

# Ejemplos:
npx shadcn@latest add table
npx shadcn@latest add select
npx shadcn@latest add toast
npx shadcn@latest add calendar
npx shadcn@latest add checkbox
npx shadcn@latest add radio-group
npx shadcn@latest add switch
npx shadcn@latest add slider
npx shadcn@latest add progress
npx shadcn@latest add badge
npx shadcn@latest add separator
```

---

## 🌐 Crear Servicios Externos

### Supabase (PostgreSQL)
1. Ir a [supabase.com](https://supabase.com)
2. Crear cuenta gratuita
3. Crear nuevo proyecto
4. Esperar ~2 minutos a que esté listo
5. Ir a **Settings → Database**
6. Copiar **Connection String** (URI)
7. Pegar en `.env.local` como `DATABASE_URL`

### Upstash Redis (Rate Limiting)
1. Ir a [upstash.com](https://upstash.com)
2. Crear cuenta gratuita
3. Crear nueva base de datos Redis
4. Seleccionar región más cercana
5. Copiar **REST URL** y **REST TOKEN**
6. Pegar en `.env.local`:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

### Google OAuth (Opcional)
1. Ir a [console.cloud.google.com](https://console.cloud.google.com)
2. Crear nuevo proyecto
3. Ir a **APIs & Services → Credentials**
4. Crear **OAuth 2.0 Client ID**
5. Configurar pantalla de consentimiento
6. Añadir URIs autorizados:
   - `http://localhost:3000` (desarrollo)
   - `https://tu-dominio.com` (producción)
7. Añadir URIs de redirección:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://tu-dominio.com/api/auth/callback/google`
8. Copiar **Client ID** y **Client Secret**
9. Pegar en `.env.local`:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`

---

## 🎨 Personalizar TailwindCSS

Edita [tailwind.config.ts](tailwind.config.ts):

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Tus colores personalizados
        primary: {
          50: '#...',
          // ...
        },
      },
    },
  },
  plugins: [],
}
```

---

## 🔐 Generar Secrets

```bash
# NEXTAUTH_SECRET
openssl rand -base64 32

# IP_HASH_SALT
openssl rand -base64 32

# Otro secret aleatorio
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## 🚀 Deploy a Vercel

```bash
# Instalar Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Deploy a producción
vercel --prod
```

O conectar directamente desde [vercel.com](https://vercel.com):
1. Importar repositorio de GitHub
2. Configurar variables de entorno
3. Deploy automático

---

## ✅ Checklist Final

- [ ] Node.js 18.18+ instalado
- [ ] pnpm instalado
- [ ] Todas las dependencias instaladas
- [ ] `.env.local` configurado
- [ ] Supabase proyecto creado
- [ ] `DATABASE_URL` configurado
- [ ] Prisma Client generado
- [ ] Base de datos creada
- [ ] shadcn/ui inicializado
- [ ] `pnpm dev` funciona correctamente
- [ ] Puedes acceder a http://localhost:3000

**¡Listo para desarrollar! 🎉**
