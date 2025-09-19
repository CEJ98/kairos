# 🚀 Guía de Despliegue en Vercel - Kairos Fitness

Esta guía te ayudará a configurar y desplegar Kairos Fitness en Vercel con integración continua completa.

## 📋 Requisitos Previos

- [x] Node.js 18+ instalado
- [x] npm o yarn como gestor de paquetes
- [x] Cuenta en [Vercel](https://vercel.com)
- [x] Cuenta en [Supabase](https://supabase.com)
- [x] Repositorio en GitHub
- [x] Variables de entorno configuradas

## 🛠️ Configuración Inicial

### 1. Instalación de Vercel CLI

```bash
npm install -g vercel@latest
```

### 2. Configuración Automática

Ejecuta nuestro script de configuración automática:

```bash
npm run deploy:setup
```

Este script:
- ✅ Verifica prerequisitos
- ✅ Instala Vercel CLI
- ✅ Configura el proyecto en Vercel
- ✅ Configura variables de entorno
- ✅ Proporciona instrucciones para GitHub Secrets

### 3. Configuración Manual (Alternativa)

Si prefieres configurar manualmente:

```bash
# Login en Vercel
vercel login

# Vincular proyecto
vercel link

# Configurar variables de entorno
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add DATABASE_URL production
vercel env add NEXTAUTH_SECRET production
# ... más variables según .env.example
```

## 🔐 Variables de Entorno

### Variables Públicas (Cliente)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Variables Privadas (Servidor)
```bash
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=tu-secret-muy-seguro
NEXTAUTH_URL=https://tu-dominio.vercel.app
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
CRON_SECRET=tu-cron-secret
```

## 🔄 Despliegue

### Despliegue de Vista Previa
```bash
npm run deploy:preview
```

### Despliegue a Producción
```bash
npm run deploy:production
```

### Despliegue Automático con Verificaciones
```bash
npm run deploy:auto
```

## 🤖 Integración Continua (CI/CD)

### GitHub Actions

El proyecto incluye workflows automáticos que se ejecutan en:

- **Pull Requests**: Ejecuta tests y crea despliegue de vista previa
- **Push a main**: Ejecuta tests y despliega a producción

### Secrets Requeridos en GitHub

Configura estos secrets en tu repositorio (`Settings > Secrets and variables > Actions`):

```bash
VERCEL_TOKEN=tu-vercel-token
VERCEL_ORG_ID=tu-org-id
VERCEL_PROJECT_ID=tu-project-id
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
TEST_DATABASE_URL=postgresql://test-db-url
```

### Obtener Tokens y IDs

1. **VERCEL_TOKEN**: Ve a [Vercel Account Settings](https://vercel.com/account/tokens)
2. **VERCEL_ORG_ID y VERCEL_PROJECT_ID**: Ejecuta `vercel link` y revisa `.vercel/project.json`

## 🌐 Configuración de Dominios

### Dominio Personalizado

```bash
# Agregar dominio
vercel domains add tu-dominio.com

# Configurar DNS
# Agrega un registro CNAME apuntando a cname.vercel-dns.com
```

### Configuración Avanzada

El archivo `vercel-domains.json` incluye:
- ✅ Redirects automáticos
- ✅ Rewrites para APIs
- ✅ Headers de seguridad
- ✅ Configuración de caché
- ✅ Cron jobs

## 🔍 Verificación Post-Despliegue

### Verificación Automática
```bash
npm run deploy:verify https://tu-app.vercel.app
```

Este script verifica:
- ✅ Conectividad básica
- ✅ Health check endpoint
- ✅ Headers de seguridad
- ✅ Redirects configurados
- ✅ Endpoints de API
- ✅ Rendimiento
- ✅ Certificado SSL

### Verificación Manual

1. **Health Check**: `https://tu-app.vercel.app/api/health`
2. **Dashboard**: `https://tu-app.vercel.app/dashboard`
3. **Autenticación**: Prueba login/registro
4. **Base de datos**: Verifica conexión a Supabase

## 🐳 Despliegue Local con Docker Compose

Sigue estos pasos para levantar Kairos en local usando Docker Compose y una base de datos PostgreSQL/Redis locales.

### 1) Preparar variables de entorno

1. Copia el archivo de ejemplo:

```bash
cp .env.example .env.local
```

2. Verifica que `DATABASE_URL`, `REDIS_URL`, `NEXTAUTH_URL` y `NEXTAUTH_SECRET` existen y apuntan a los valores por defecto que usa `docker-compose.yml`:

- `DATABASE_URL=postgresql://postgres:postgres_password@localhost:5432/kairos_db`
- `REDIS_URL=redis://localhost:6379`
- `NEXTAUTH_URL=http://localhost:3000`

No cambies puertos ni nombres de variables existentes.

### 2) Levantar la infraestructura

```bash
docker compose up -d postgres redis

# Opcional: levantar toda la pila, incluyendo la app y nginx
docker compose up -d
```

Espera unos segundos a que PostgreSQL esté listo.

### 3) Migraciones y Seed de la base de datos

Con la base de datos en marcha, ejecuta migraciones y seed desde tu entorno local (usa la `DATABASE_URL` anterior):

```bash
# Aplicar migraciones (desarrollo)
npm run db:migrate

# Sembrar datos de ejemplo
npm run db:seed
```

Si prefieres un flujo más "producción":

```bash
npx prisma migrate deploy
npm run db:seed
```

### 4) Comprobaciones de salud

- App (cuando `app` está levantada):

```bash
curl -i http://localhost:3000/api/health
```

Deberías obtener `200 OK` y un JSON con el estado.

- Base de datos (desde el contenedor):

```bash
docker compose exec postgres pg_isready -U postgres
```

El resultado "accepting connections" indica que PostgreSQL está listo.

### 5) Acceso a la aplicación

- Navega a `http://localhost:3000`
- Endpoints clave para verificación rápida:
  - `/`
  - `/signin`
  - `/signup`
  - `/dashboard`
  - `/api/health`

También puedes usar el smoke test incluido:

```bash
BASE_URL=http://localhost:3000 npm run smoke
```

## 📊 Monitoreo y Logs

### Ver Logs
```bash
npm run vercel:logs
```

### Ver Variables de Entorno
```bash
npm run vercel:env
```

### Ver Dominios
```bash
npm run vercel:domains
```

## 🔧 Configuración Avanzada

### Funciones Serverless

Configuración en `vercel.json`:
- **Webhooks Stripe**: 30s timeout
- **Cron Cleanup**: 5min timeout
- **Cron Backup**: 10min timeout
- **Health Check**: 10s timeout

### Cron Jobs

- **Cleanup diario**: `0 2 * * *` (2:00 AM)
- **Backup semanal**: `0 3 * * 0` (3:00 AM domingos)

### Headers de Seguridad

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000`
- `Referrer-Policy: strict-origin-when-cross-origin`

## 🚨 Solución de Problemas

### Error: "Project not found"
```bash
vercel link --confirm
```

### Error: "Environment variable not found"
```bash
vercel env ls
vercel env add VARIABLE_NAME production
```

### Error: "Build failed"
1. Verifica que todas las dependencias estén en `package.json`
2. Ejecuta `npm run build` localmente
3. Revisa los logs en Vercel Dashboard

### Error: "Database connection failed"
1. Verifica `DATABASE_URL` en variables de entorno
2. Confirma que Supabase esté activo
3. Revisa configuración de RLS en Supabase

### Error: "Authentication not working"
1. Verifica `NEXTAUTH_URL` apunte al dominio correcto
2. Confirma `NEXTAUTH_SECRET` esté configurado
3. Revisa configuración OAuth en providers

## 📚 Recursos Adicionales

- [Documentación de Vercel](https://vercel.com/docs)
- [Guía de Next.js en Vercel](https://vercel.com/docs/frameworks/nextjs)
- [Configuración de Dominios](https://vercel.com/docs/concepts/projects/domains)
- [Variables de Entorno](https://vercel.com/docs/concepts/projects/environment-variables)
- [Funciones Serverless](https://vercel.com/docs/concepts/functions/serverless-functions)

## 🆘 Soporte

Si encuentras problemas:

1. Revisa los logs: `npm run vercel:logs`
2. Ejecuta verificación: `npm run deploy:verify`
3. Consulta la documentación oficial
4. Abre un issue en el repositorio

---

**¡Listo!** 🎉 Tu aplicación Kairos Fitness debería estar funcionando perfectamente en Vercel con despliegue continuo configurado.
