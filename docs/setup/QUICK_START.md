# Quick Start - Kairos Fitness

Guía rápida para poner en marcha el proyecto en 5 minutos.

## ⚡ Setup Rápido

### 1. Instalar Dependencias
```bash
pnpm install
```

### 2. Configurar Variables de Entorno
```bash
cp .env.example .env.local
```

**Editar `.env.local` con:**
```env
# Mínimo requerido para desarrollo local:
DATABASE_URL="postgresql://..."  # URL de Supabase
NEXTAUTH_SECRET="tu-secret-aqui" # Genera con: openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"

# Opcional (para Google OAuth):
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
```

### 3. Configurar Base de Datos
```bash
pnpm db:generate  # Generar Prisma Client
pnpm db:push      # Crear tablas en Supabase
pnpm db:seed      # Poblar con datos demo
```

### 4. Iniciar Servidor
```bash
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000)

## 🎯 Probar Inmediatamente

### Opción 1: Cuenta Demo (Recomendado)
1. Ve a [http://localhost:3000/auth](http://localhost:3000/auth)
2. Click en **"Probar cuenta demo"**
3. ¡Listo! Ya estás dentro con datos precargados

**Credenciales:**
- Email: `demo@kairos.fit`
- Password: `DemoPass123!`

### Opción 2: Crear Cuenta Nueva
1. Ve a [http://localhost:3000/auth](http://localhost:3000/auth)
2. Click en **"Regístrate aquí"**
3. Completa el formulario
4. Auto-login automático

## 🗺️ Navegación Rápida

Una vez autenticado, explora:

| Ruta | Descripción |
|------|-------------|
| `/demo` | Dashboard con estadísticas |
| `/workout` | Gestión de entrenamientos |
| `/progress` | Métricas y evolución |
| `/calendar` | Calendario semanal |

## 🛠️ Scripts Útiles

```bash
# Desarrollo
pnpm dev              # Servidor de desarrollo
pnpm build            # Build producción
pnpm start            # Servidor producción

# Base de datos
pnpm db:generate      # Generar Prisma Client
pnpm db:push          # Sincronizar schema
pnpm db:seed          # Poblar datos demo
pnpm db:reset         # ⚠️ Resetear DB (cuidado!)

# Calidad
pnpm lint             # ESLint
pnpm typecheck        # TypeScript
pnpm format           # Prettier
pnpm test             # Tests unitarios
pnpm test:e2e         # Tests E2E
```

## 📋 Checklist de Verificación

- [ ] Dependencias instaladas (`pnpm install`)
- [ ] `.env.local` creado y configurado
- [ ] `DATABASE_URL` apunta a Supabase
- [ ] `NEXTAUTH_SECRET` generado
- [ ] `pnpm db:generate` ejecutado
- [ ] `pnpm db:push` ejecutado
- [ ] `pnpm db:seed` ejecutado
- [ ] `pnpm dev` corriendo
- [ ] Login con cuenta demo funciona
- [ ] Navegación entre páginas funciona

## 🔍 Verificar Instalación

### 1. Verificar Prisma Client
```bash
pnpm db:generate
# Debe crear: node_modules/@prisma/client
```

### 2. Verificar Base de Datos
```bash
# En Supabase Dashboard > Table Editor
# Deberías ver las tablas: User, Account, Session, etc.
```

### 3. Verificar Usuario Demo
```bash
# En Supabase > Table Editor > User
# Buscar: demo@kairos.fit
```

### 4. Verificar Autenticación
```bash
# Ir a: http://localhost:3000/auth
# Login con demo@kairos.fit
# Debe redirigir a: /demo
```

## ❌ Problemas Comunes

### Error: "Can't reach database server"
```bash
# Verificar DATABASE_URL en .env.local
# Asegurar que Supabase esté activo
# Verificar conexión a internet
```

### Error: "Module not found @prisma/client"
```bash
pnpm db:generate
```

### Error: "Invalid session"
```bash
# Verificar NEXTAUTH_SECRET en .env.local
# Generar nuevo: openssl rand -base64 32
# Limpiar cookies del navegador
```

### Error: "Google OAuth failed"
```bash
# Opcional: comentar GoogleProvider en src/lib/auth/options.ts
# O configurar GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET
```

## 📚 Documentación Completa

Para más detalles, ver:
- [SETUP_GUIDE.md](./SETUP_GUIDE.md) - Configuración paso a paso
- [NAVIGATION_GUIDE.md](./NAVIGATION_GUIDE.md) - Guía de rutas
- [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - Resumen técnico

## 🚀 ¡Ya Está!

Si seguiste todos los pasos, deberías tener:
- ✅ Servidor corriendo en `localhost:3000`
- ✅ Base de datos configurada en Supabase
- ✅ Usuario demo funcional
- ✅ Todas las rutas accesibles
- ✅ Navegación responsive

## 💡 Tips

1. **Usa la cuenta demo** para explorar rápidamente
2. **Abre DevTools** (F12) para ver los logs
3. **Prueba responsive** con DevTools (Ctrl/Cmd + Shift + M)
4. **Cambia el tema** con el botón en el header
5. **Explora el código** en `src/app/` y `src/components/`

## 🎨 Personalización Rápida

### Cambiar colores
Edita `tailwind.config.ts`:
```typescript
theme: {
  extend: {
    colors: {
      primary: '#TU_COLOR'
    }
  }
}
```

### Cambiar logo
Edita `src/components/layout/sidebar.tsx`:
```typescript
<Dumbbell className="h-6 w-6 text-primary" />
// Cambia por tu ícono
```

### Cambiar fuentes
Edita `src/app/layout.tsx`:
```typescript
const inter = Inter({ ... });
const poppins = Poppins({ ... });
```

---

**¿Necesitas ayuda?**
- Revisa los archivos de documentación
- Chequea los errores en la consola
- Verifica las variables de entorno

**¡Happy coding!** 🎉
