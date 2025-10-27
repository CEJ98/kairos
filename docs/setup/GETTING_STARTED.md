# 🚀 Getting Started - Kairos Fitness

Guía de inicio rápido para levantar la aplicación localmente en menos de 5 minutos.

## 📋 Requisitos Previos

- **Node.js** >= 18.18.0 ([Descargar](https://nodejs.org))
- **pnpm** (se instalará automáticamente si no lo tienes)
- **Git** (para clonar el repositorio)

## ⚡ Inicio Rápido (Método Recomendado)

### 1. Clonar el Repositorio

```bash
git clone <repository-url>
cd Kairos
```

### 2. Verificar Requisitos

```bash
pnpm check
```

Este comando verificará:
- ✅ Versión de Node.js
- ✅ Instalación de pnpm
- ✅ Dependencias instaladas
- ✅ Variables de entorno
- ✅ Prisma Client generado

### 3. Iniciar Servidor de Desarrollo

```bash
pnpm dev
```

O usando npm:

```bash
npm run dev
```

Este comando automáticamente:
1. ✅ Verifica requisitos previos
2. ✅ Instala dependencias (si es necesario)
3. ✅ Genera Prisma Client
4. ✅ Inicia Next.js en modo desarrollo
5. ✅ Muestra un mensaje de éxito con todas las rutas disponibles

### 4. Abrir en el Navegador

El servidor estará disponible en:

- 🌐 **Local**: http://localhost:3000
- 🌐 **Network**: http://[tu-ip]:3000

## 🎯 Rutas Disponibles

### Páginas Públicas

- **`/`** - Landing page con call-to-actions
- **`/auth`** - Login y registro unificados
- **`/demo`** - Dashboard demo (sin autenticación)

### Aplicación Principal (requiere login)

- **`/workout`** - Editor de entrenamientos con autosave Redis
- **`/progress`** - Gráficos de progreso (5 métricas)
- **`/calendar`** - Calendario con reprogramación
- **`/dashboard`** - Dashboard principal
- **`/exercises`** - Biblioteca de ejercicios
- **`/insights`** - Analytics y insights

## 🎨 Navegación Principal

La aplicación incluye:

- **Sidebar lateral** (desktop) con navegación
- **Bottom navigation** (móvil)
- **Header** con título de página y acciones
- **Navegación responsive** con hamburger menu

Todos los componentes están listos para usar sin configuración adicional.

## 📦 Scripts Disponibles

### Desarrollo

```bash
# Iniciar con verificación y mensajes de éxito
pnpm dev

# Iniciar Next.js directamente (sin scripts)
pnpm dev:next

# Verificar requisitos solamente
pnpm check
```

### Base de Datos

```bash
# Generar Prisma Client
pnpm db:generate

# Crear/aplicar migraciones
pnpm db:migrate

# Push schema sin crear migración
pnpm db:push

# Seed de datos de prueba
pnpm db:seed

# Reset completo de BD
pnpm db:reset

# Setup inicial completo
pnpm setup
```

### Build y Producción

```bash
# Build para producción
pnpm build

# Iniciar en modo producción
pnpm start
```

### Testing y Calidad

```bash
# Linter
pnpm lint

# Format code
pnpm format

# Type checking
pnpm typecheck

# Tests unitarios
pnpm test

# Tests E2E
pnpm test:e2e

# Pipeline completo de CI
pnpm test:ci
```

## 🔧 Configuración Opcional

### Variables de Entorno

El archivo `.env.local` se crea automáticamente desde `.env.example` si no existe.

Para habilitar todas las funcionalidades, configura:

#### Supabase (Base de Datos)

```bash
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
NEXT_PUBLIC_SUPABASE_URL="https://..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
```

#### Upstash Redis (Autosave)

```bash
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."
```

#### NextAuth (Autenticación)

```bash
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
```

#### Google OAuth (Opcional)

```bash
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
```

Ver [.env.example](.env.example) para configuración completa.

## 🎉 Mensaje de Éxito

Cuando inicies el servidor con `pnpm dev`, verás:

```
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║  🚀  ¡SERVIDOR INICIADO EXITOSAMENTE!  🚀                  ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝

🔥  KAIROS FITNESS está listo para entrenar

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Accede a la aplicación:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  🔗  Local:          http://localhost:3000
  🔗  Network:        http://192.168.1.x:3000

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Rutas disponibles:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  💪  /auth            - Inicio de sesión y registro
  💪  /demo            - Dashboard demo
  💪  /workout         - Editor de entrenamientos (con autosave Redis)
  💪  /progress        - Gráficos de progreso
  💪  /calendar        - Calendario de entrenamientos

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Funcionalidades:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ✓  Autenticación (NextAuth + Google OAuth)
  ✓  Autosave en Redis cada 2 segundos
  ✓  Editor de entrenamientos interactivo
  ✓  Gráficos de progreso (5 métricas)
  ✓  Calendario con reprogramación
  ✓  Navegación responsive con sidebar
```

## 🧪 Testing Rápido

### 1. Verificar Home Page

```
http://localhost:3000/
```

Deberías ver:
- ✅ Landing page atractiva
- ✅ Botones "Probar Demo" y "Crear Cuenta"
- ✅ Grid de features
- ✅ Stats section
- ✅ Navegación funcional

### 2. Verificar Login

```
http://localhost:3000/auth
```

Deberías ver:
- ✅ Formulario de login/registro
- ✅ Toggle entre login y registro
- ✅ Botón "Cuenta Demo"
- ✅ Botón "Continuar con Google"
- ✅ Branding lateral

### 3. Verificar Demo (sin login)

```
http://localhost:3000/demo
```

Deberías ver:
- ✅ Dashboard con stats
- ✅ Sidebar navegable
- ✅ Header con título
- ✅ Responsive en móvil

### 4. Verificar Workout Editor

```
http://localhost:3000/workout
```

Deberías ver:
- ✅ Lista de ejercicios
- ✅ Editor de sets interactivo
- ✅ Controles +/- para peso/reps/RPE
- ✅ Indicador de autosave
- ✅ Rest timer

## 🐛 Troubleshooting

### Puerto 3000 en uso

Si el puerto 3000 está ocupado, Next.js automáticamente usará 3001, 3002, etc.

```bash
# O especifica un puerto manualmente
PORT=3001 pnpm dev
```

### Dependencias no instaladas

```bash
# Limpia e reinstala
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Prisma Client desactualizado

```bash
# Regenera Prisma Client
pnpm db:generate
```

### Variables de entorno faltantes

```bash
# Copia el ejemplo
cp .env.example .env.local

# Edita con tus credenciales
nano .env.local  # o usa tu editor favorito
```

### Script no ejecutable

```bash
# Haz los scripts ejecutables
chmod +x scripts/dev.sh scripts/check-requirements.sh
```

## 📚 Próximos Pasos

1. **Explora la documentación**:
   - [README.md](README.md) - Documentación general
   - [REDIS_AUTOSAVE_README.md](REDIS_AUTOSAVE_README.md) - Sistema de autosave
   - [COMPONENTS_GUIDE.md](COMPONENTS_GUIDE.md) - Componentes principales
   - [NAVIGATION_GUIDE.md](NAVIGATION_GUIDE.md) - Estructura de rutas

2. **Configura servicios externos**:
   - Supabase para base de datos
   - Upstash Redis para autosave
   - Google OAuth para login social

3. **Personaliza la aplicación**:
   - Modifica colores en `tailwind.config.ts`
   - Ajusta componentes en `src/components/`
   - Extiende el schema de Prisma

4. **Deploy a producción**:
   - Ver guía de deployment (próximamente)

## 💡 Tips

- **Hot reload**: Los cambios en código se reflejan automáticamente
- **TypeScript**: Aprovecha el autocompletado del IDE
- **Dummy data**: Los componentes funcionan sin BD usando datos de prueba
- **Mobile first**: Todos los componentes son responsive
- **Dark mode**: Soportado por defecto (toggle en header)

## 🆘 Ayuda

- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Documentación**: Ver archivos `.md` en la raíz del proyecto
- **Code**: Revisa los comentarios en el código fuente

---

**¡Listo para entrenar! 💪**

Ahora puedes empezar a explorar la aplicación y hacer tus primeros cambios.
