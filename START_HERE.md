# ⚡ START HERE - Kairos Fitness

## 🚀 Inicio Rápido en 2 Comandos

```bash
# 1. Instalar dependencias (solo primera vez)
pnpm install

# 2. Iniciar servidor de desarrollo
pnpm dev
```

## ✅ Qué Verás

Cuando ejecutes `pnpm dev`, verás un mensaje de éxito como este:

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
  🔗  Network:        http://192.168.x.x:3000

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Rutas disponibles:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  💪  /auth            - Inicio de sesión y registro
  💪  /demo            - Dashboard demo
  💪  /workout         - Editor de entrenamientos (con autosave)
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

## 🌐 Rutas para Probar

### 1. Home Page
**http://localhost:3000/**

- Landing page atractiva
- Botones de call-to-action
- Grid de features
- Navegación funcional

### 2. Login / Registro
**http://localhost:3000/auth**

- Formulario de login y registro
- Toggle entre ambos modos
- Botón "Cuenta Demo"
- OAuth con Google

### 3. Demo Dashboard
**http://localhost:3000/demo**

- Dashboard sin necesidad de login
- Sidebar navegable
- Stats y métricas
- Responsive

### 4. Editor de Entrenamientos
**http://localhost:3000/workout**

- Editor interactivo de sets
- Autosave cada 2 segundos
- Indicador visual de guardado
- Rest timer

### 5. Progreso
**http://localhost:3000/progress**

- Gráficos con 5 métricas
- Análisis de tendencias
- Visualización con Recharts

### 6. Calendario
**http://localhost:3000/calendar**

- Vista semanal
- Reprogramación drag & drop
- Adherencia calculada

## 🔧 Comandos Útiles

```bash
# Verificar requisitos del sistema
pnpm check

# Iniciar en modo desarrollo (con mensajes bonitos)
pnpm dev

# Iniciar Next.js directamente (modo simple)
pnpm dev:next

# Verificar tipos TypeScript
pnpm typecheck

# Ejecutar linter
pnpm lint

# Formatear código
pnpm format
```

## ✨ Características Implementadas

### ✅ Autenticación
- NextAuth con Credentials
- Google OAuth
- Cuenta demo para testing

### ✅ Autosave con Redis
- Guardado automático cada 2 segundos
- Indicadores visuales de estado
- Recuperación automática al recargar
- Ver: [REDIS_AUTOSAVE_README.md](REDIS_AUTOSAVE_README.md)

### ✅ Componentes Interactivos
- WorkoutEditor con edición de sets
- ProgressGraph con 5 métricas
- WorkoutCalendar con reprogramación
- Ver: [COMPONENTS_GUIDE.md](COMPONENTS_GUIDE.md)

### ✅ Navegación Completa
- Sidebar responsive
- Bottom navigation (móvil)
- Header con breadcrumbs
- Ver: [NAVIGATION_GUIDE.md](NAVIGATION_GUIDE.md)

## 📚 Documentación Completa

- **[GETTING_STARTED.md](GETTING_STARTED.md)** - Guía completa de inicio
- **[README.md](README.md)** - Documentación general del proyecto
- **[REDIS_AUTOSAVE_README.md](REDIS_AUTOSAVE_README.md)** - Sistema de autosave
- **[REDIS_AUTOSAVE_GUIDE.md](REDIS_AUTOSAVE_GUIDE.md)** - Guía técnica de Redis
- **[COMPONENTS_GUIDE.md](COMPONENTS_GUIDE.md)** - Componentes principales
- **[NAVIGATION_GUIDE.md](NAVIGATION_GUIDE.md)** - Estructura de rutas

## 🐛 Problemas Comunes

### Puerto 3000 ocupado
Next.js usará automáticamente 3001, 3002, etc.

### Dependencias faltantes
```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Variables de entorno
El archivo `.env.local` se crea automáticamente.
Para funcionalidad completa, configura:
- Supabase (base de datos)
- Upstash Redis (autosave)
- NextAuth (autenticación)

Ver `.env.example` para detalles.

## 🎯 Próximos Pasos

1. **Explora la app**: Visita todas las rutas listadas arriba
2. **Revisa el código**: Componentes en `src/components/`
3. **Lee la documentación**: Archivos `.md` en la raíz
4. **Configura servicios**: Supabase, Upstash, Google OAuth
5. **Personaliza**: Colores, componentes, esquema de BD

## 💡 Tips

- **Hot reload automático** - Los cambios se reflejan al instante
- **Dummy data incluida** - Todo funciona sin configurar BD
- **TypeScript full** - Autocompletado en tu IDE
- **Mobile responsive** - Prueba en diferentes tamaños
- **Dark mode** - Toggle en el header

---

**¡Listo para empezar! 🎉**

Ejecuta `pnpm dev` y visita http://localhost:3000
