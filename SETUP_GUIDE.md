# 🚀 Kairos Fitness - Setup Completo

## 📋 Checklist de Instalación

### ✅ Fase 1: Inicialización del Proyecto
- [ ] Node.js 18.18+ instalado
- [ ] pnpm instalado (`npm install -g pnpm`)
- [ ] Git inicializado
- [ ] Proyecto Next.js 14 creado

### ✅ Fase 2: Dependencias Core
- [ ] Next.js 14 instalado
- [ ] TypeScript configurado
- [ ] TailwindCSS instalado y configurado
- [ ] shadcn/ui inicializado

### ✅ Fase 3: Base de Datos
- [ ] Prisma instalado
- [ ] Schema definido (User, Workout, etc.)
- [ ] PostgreSQL/Supabase configurado
- [ ] Migraciones ejecutadas
- [ ] Prisma Client generado

### ✅ Fase 4: Autenticación
- [ ] NextAuth instalado
- [ ] Credentials provider configurado
- [ ] Google OAuth configurado
- [ ] Prisma Adapter configurado
- [ ] Bcrypt para passwords

### ✅ Fase 5: Redis & Rate Limiting
- [ ] Upstash Redis cuenta creada
- [ ] @upstash/redis instalado
- [ ] @upstash/ratelimit configurado
- [ ] Variables de entorno configuradas

### ✅ Fase 6: Herramientas de Desarrollo
- [ ] ESLint configurado
- [ ] Prettier configurado
- [ ] Husky (opcional) para pre-commit hooks
- [ ] Scripts de desarrollo definidos

---

## 🎯 Setup Rápido (Proyecto Nuevo)

### 1. Crear proyecto Next.js
```bash
npx create-next-app@14 kairos-fitness --typescript --tailwind --app --src-dir
cd kairos-fitness
```

### 2. Instalar todas las dependencias
```bash
# Ejecutar el script de instalación automática
bash setup-install.sh
```

O manualmente:

```bash
# Dependencias de producción
pnpm add @prisma/client @next-auth/prisma-adapter next-auth bcryptjs \
  @upstash/redis @upstash/ratelimit @supabase/supabase-js \
  @hookform/resolvers react-hook-form zod \
  @radix-ui/react-slot @radix-ui/react-label @radix-ui/react-dialog \
  @radix-ui/react-dropdown-menu @radix-ui/react-avatar \
  class-variance-authority clsx tailwind-merge lucide-react \
  date-fns recharts

# Dependencias de desarrollo
pnpm add -D prisma @types/bcryptjs @types/node typescript \
  @typescript-eslint/eslint-plugin @typescript-eslint/parser \
  eslint eslint-config-next prettier prettier-plugin-tailwindcss \
  autoprefixer postcss tailwindcss
```

### 3. Configurar archivos base
```bash
# Copiar archivos de configuración
cp .env.example .env.local
cp tsconfig.example.json tsconfig.json
```

### 4. Inicializar Prisma
```bash
# Inicializar Prisma
npx prisma init

# Copiar schema.prisma
# (Ver archivo prisma/schema.prisma en este repo)

# Generar cliente y crear base de datos
pnpm db:generate
pnpm db:push
```

### 5. Configurar shadcn/ui
```bash
# Inicializar shadcn/ui
npx shadcn@latest init

# Instalar componentes base
npx shadcn@latest add button input label card dialog dropdown-menu avatar
```

### 6. Iniciar desarrollo
```bash
pnpm dev
```

---

## 📦 Estructura de Archivos Necesaria

```
kairos-fitness/
├── .env.local                    # Variables de entorno (NO commitear)
├── .env.example                  # Template de variables
├── package.json                  # Dependencias
├── tsconfig.json                 # Config TypeScript
├── tailwind.config.ts            # Config Tailwind
├── next.config.js                # Config Next.js
├── prisma/
│   ├── schema.prisma            # Schema de DB
│   └── seed.ts                  # Datos iniciales
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── api/
│   │       └── auth/
│   │           └── [...nextauth]/
│   │               └── route.ts
│   ├── components/
│   │   └── ui/                  # Componentes shadcn
│   ├── lib/
│   │   ├── prisma.ts            # Cliente Prisma
│   │   ├── auth.ts              # Config NextAuth
│   │   ├── redis.ts             # Cliente Redis
│   │   └── utils.ts             # Utilidades
│   └── types/
└── components.json              # Config shadcn/ui
```

---

## 🔧 Configuración de Servicios Externos

### Supabase (PostgreSQL)
1. Crear cuenta en [supabase.com](https://supabase.com)
2. Crear nuevo proyecto
3. Copiar `DATABASE_URL` desde Settings → Database → Connection String
4. Añadir a `.env.local`

### Upstash Redis
1. Crear cuenta en [upstash.com](https://upstash.com)
2. Crear nueva base de datos Redis
3. Copiar `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN`
4. Añadir a `.env.local`

### Google OAuth (Opcional)
1. Ir a [Google Cloud Console](https://console.cloud.google.com)
2. Crear nuevo proyecto
3. Habilitar Google+ API
4. Crear credenciales OAuth 2.0
5. Añadir URIs autorizados:
   - `http://localhost:3000` (desarrollo)
   - `https://tu-dominio.com` (producción)
6. Añadir redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
7. Copiar Client ID y Client Secret a `.env.local`

---

## 🔐 Variables de Entorno Requeridas

Ver archivo `.env.example` para la lista completa.

**Mínimas para desarrollo:**
```env
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="tu-secret-aleatorio"
NEXTAUTH_URL="http://localhost:3000"
```

**Para producción añadir:**
```env
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
```

---

## 🧪 Scripts Útiles

```bash
# Desarrollo
pnpm dev              # Iniciar servidor de desarrollo
pnpm build            # Build para producción
pnpm start            # Iniciar servidor de producción

# Base de datos
pnpm db:generate      # Generar Prisma Client
pnpm db:push          # Push schema sin migración
pnpm db:migrate       # Crear migración
pnpm db:seed          # Poblar DB con datos de prueba
pnpm db:studio        # Abrir Prisma Studio

# Calidad de código
pnpm lint             # Ejecutar ESLint
pnpm format           # Formatear con Prettier
pnpm typecheck        # Verificar tipos TypeScript
```

---

## 🚨 Troubleshooting

### Error: Prisma Client no generado
```bash
pnpm db:generate
```

### Error: No se puede conectar a la base de datos
- Verificar `DATABASE_URL` en `.env.local`
- Asegurarse de que Supabase esté activo
- Verificar firewall/red

### Error: NextAuth session undefined
- Verificar `NEXTAUTH_SECRET` configurado
- Verificar `NEXTAUTH_URL` correcto
- Limpiar cookies del navegador

### Error: Rate limiting no funciona
- Verificar credenciales de Upstash
- Verificar conexión a internet
- Redis puede estar en modo desarrollo (sin Upstash)

---

## 📚 Próximos Pasos

1. ✅ Configurar autenticación
2. ✅ Crear modelos de base de datos
3. ✅ Implementar componentes UI básicos
4. ✅ Configurar rate limiting
5. ✅ Implementar lógica de negocio
6. ✅ Testing
7. ✅ Deploy a Vercel

---

## 🔗 Referencias

- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [NextAuth Docs](https://next-auth.js.org)
- [shadcn/ui Docs](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com)
- [Upstash Redis](https://docs.upstash.com/redis)
