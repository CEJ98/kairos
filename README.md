# Kairos Fitness Platform

Staff-engineered base para un dashboard de entrenamiento tipo FitnessAI: planes periodizados, editor de sesiones con autosave, analíticas accionables y una experiencia UI consistente en Next.js 14.

## Vista general

- **AppShell renovado** con navegación lateral/ inferior, TopNav responsive y tokens de diseño (Poppins/Inter, #FFFFFF/#F5F5F5/#0F0F0F, acentos #3EC7C2/#FF6F61/#81C784).
- **Páginas clave**: `/dashboard`, `/workout/[id]`, `/progress`, `/exercises`, `/insights`, `/calendar`, todas con copy/contexto alineado al motor FitnessAI.
- **Motor de sesiones**: autosave Redis cada 1.5s, temporizador por set, sustitución rápida y commit final a Postgres con limpieza de drafts.
- **Analítica integrada**: gráficos Recharts (peso, 1RM Epley, volumen, adherencia), calendario semanal y export CSV con rate limiting.
- **Prisma schema** extendido con índices compuestos e historial de 8 semanas en seeds (`prisma/seed.ts`).
 - **Protecciones**: Rate limiting Upstash (`ipLimiter`/`authLimiter`) y validaciones Zod en server actions.

## Stack

| Capa            | Tecnología                                      |
| ----------------| ------------------------------------------------ |
| UI              | Next.js 14 App Router, React 18, Tailwind CSS    |
| Componentes     | Diseño propio + utilidades shadcn, Lucide Icons  |
| Estado servis   | Server Actions + Prisma Client                   |
| Datos           | PostgreSQL (Prisma), Redis (Upstash)             |
| Auth            | NextAuth (Credentials + Google OAuth)            |
| Charts          | Recharts                                         |
| Tests           | Jest + Testing Library, Playwright               |
| CI/CD           | GitHub Actions + Vercel                          |

## Estructura

```
src/
├─ app/
│  ├─ (auth)/{login,register,demo}
│  ├─ dashboard/
│  ├─ calendar/
│  ├─ progress/
│  ├─ exercises/
│  ├─ insights/
│  └─ workout/[id]/
├─ components/
│  ├─ layout/ (AppShell, TopNav, SideNav, BottomNav, MobileNav)
│  ├─ dashboard/ (Stat, WeeklyCalendar, WorkoutEditor, etc.)
│  ├─ charts/ (ChartCard)
│  ├─ forms/
│  └─ ui/
├─ lib/
│  ├─ clients/ (prisma, redis, supabase)
│  ├─ cache/ (rate limiting, selective cache)
│  ├─ auth/ (options, password helpers)
│  ├─ config/, logging/, utils/
│  └─ validation/ (Zod schemas)
├─ server/actions/ (plan, progress, auth)
└─ server/services/ (progression rules)
```

## Configuración

1. **Instalar dependencias**
   ```bash
   pnpm install
   ```
2. **Variables de entorno**
   ```bash
   cp .env.example .env.local
   ```
   Completar al menos:
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
   - `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET`
   - `CRON_SECRET` (token Bearer para el endpoint de backup)
   - `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
   - `SENTRY_DSN` (captura de errores cliente/servidor)
   - `NEXT_PUBLIC_ENABLE_COOKIE_BANNER` (mostrar banner de cookies en landing)
   - `IP_HASH_SALT` (sal para hash de IP en eventos server)

### Backups diarios (Supabase Storage)

- Endpoint: `GET /api/cron/daily-backup`
- Runtime: `nodejs` (Prisma no soporta Edge sin Data Proxy)
- Autenticación: `Authorization: Bearer ${CRON_SECRET}`
- Exporta tablas clave a Supabase Storage en `JSON` y `CSV`, con ruta:
  - `daily/YYYY-MM-DD/HHmm/{tabla}.json|csv` dentro del bucket `SUPABASE_STORAGE_BUCKET`.

Ejemplo de configuración de cron en `vercel.json`:
```json
{
  "crons": [
    { "path": "/api/cron/daily-backup", "schedule": "0 3 * * *" }
  ]
}
```

Probar manualmente:
```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
     https://tu-deploy.vercel.app/api/cron/daily-backup
```

#### Restore (documentado)

Hay dos opciones para restaurar desde Storage:

- Usar `JSON` y un script Prisma local:
  1. Descarga los `*.json` desde el bucket (ruta `daily/...`).
  2. Crea un script `scripts/restore.ts` con orden seguro por claves foráneas:

```ts
import { prisma } from '@/lib/clients/prisma';
import fs from 'node:fs/promises';

async function readJson<T>(path: string): Promise<T[]> {
  const raw = await fs.readFile(path, 'utf8');
  return JSON.parse(raw);
}

async function main() {
  const base = 'backups/daily/2024-10-21/0930'; // ajusta

  const exercises = await readJson<any>(`${base}/exercises.json`);
  await prisma.exercise.createMany({ data: exercises });

  const users = await readJson<any>(`${base}/users.json`);
  await prisma.user.createMany({ data: users });

  const profiles = await readJson<any>(`${base}/profiles.json`);
  await prisma.profile.createMany({ data: profiles });

  const plans = await readJson<any>(`${base}/plans.json`);
  await prisma.plan.createMany({ data: plans });

  const workouts = await readJson<any>(`${base}/workouts.json`);
  await prisma.workout.createMany({ data: workouts });

  const wex = await readJson<any>(`${base}/workout_exercises.json`);
  await prisma.workoutExercise.createMany({ data: wex });

  const wsets = await readJson<any>(`${base}/workout_sets.json`);
  await prisma.workoutSet.createMany({ data: wsets });

  const body = await readJson<any>(`${base}/body_metrics.json`);
  await prisma.bodyMetric.createMany({ data: body });

  const streaks = await readJson<any>(`${base}/streaks.json`);
  await prisma.streak.createMany({ data: streaks });

  const subs = await readJson<any>(`${base}/subscriptions.json`);
  await prisma.subscription.createMany({ data: subs });

  const adh = await readJson<any>(`${base}/adherence_metrics.json`);
  await prisma.adherenceMetric.createMany({ data: adh });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

- Usar `CSV` con Postgres: importa con `\copy`/`COPY` desde psql (requiere que las columnas del CSV coincidan con tu esquema y permisos adecuados).

Notas:
- Si hay datos existentes, considera limpiar tablas en el orden inverso a la inserción para evitar violaciones de claves foráneas.
- En producción, valida integridad y añade transacciones por bloque de tabla.

### Analítica (Umami / PostHog)

- La app envía eventos sin PII con un hook de cliente y trazas mínimas en server.
- Si hay Umami en el cliente, se usa preferentemente; en su defecto, PostHog.

Variables de entorno soportadas:
- Umami (cliente y layout):
  - `NEXT_PUBLIC_UMAMI_WEBSITE_ID` o `UMAMI_WEBSITE_ID`
  - `NEXT_PUBLIC_UMAMI_SRC` o `UMAMI_SRC` (por ejemplo `https://umami.is/script.js` o tu instancia self-hosted)
- PostHog:
  - Cliente: `NEXT_PUBLIC_POSTHOG_KEY` (opcional `NEXT_PUBLIC_POSTHOG_HOST`, default `https://us.posthog.com`)
  - Server actions: `POSTHOG_KEY` (opcional `POSTHOG_HOST`, default `https://us.posthog.com`)

Hook de uso (`useTrack`):
```tsx
import { useTrack } from '@/lib/hooks/use-track';

export function CTA() {
  const track = useTrack();
  return (
    <button onClick={() => track('create_plan')}>Crear plan rápido</button>
  );
}
```

Eventos integrados:
- `app_open` (montaje de `AppShell`)
- `view_progress` (cuando la ruta comienza con `/progress`)
- `create_plan` (CTA cliente y server action)
- `start_workout` (CTA cliente y server `nextWorkout`)
- `log_set` (autosave en editor de sesión)
- `commit_session` (commit final cliente y server action)
- `reschedule_workout` (CTA cliente y server action)
- `demo_signup` (flujo demo cliente y API server)

Notas de privacidad:
- El cliente emite solo el nombre del evento (sin properties) evitando PII.
- En server se envían eventos mínimos a PostHog con `distinct_id: 'anonymous-server'` y `properties: { source: 'server' }` para facilitar deduplicación.
- Server actions adjuntan `requestId` e `ipHash` (derivado con `IP_HASH_SALT`), nunca la IP en claro.

3. **Prisma + seeds**
   ```bash
   pnpm db:push
   pnpm db:seed
   ```
4. **Entorno local**
   ```bash
   pnpm dev
   ```

## Seeds

`prisma/seed.ts` genera:
- 30+ ejercicios con `videoUrl`, `muscleGroup`, cues.
- Usuario demo `demo@kairos.fit` con plan de 8 semanas, sesiones completadas (micro/meso ciclos), métricas corporales y adherencia por semana.

## Comandos útiles

```bash
pnpm dev          # entorno local
pnpm build        # build producción (prisma generate + migrate deploy + next build)
pnpm start        # servir build
pnpm lint         # eslint
pnpm typecheck    # tsc --noEmit
pnpm test         # jest (unit)
pnpm test:e2e     # playwright
pnpm db:push      # sync schema
pnpm db:seed      # cargar datos demo
```

## Server Actions clave

- `createPlan`, `nextWorkout`, `applyProgression`, `rescheduleWorkout`, `logWorkout`, `autosaveWorkoutDraft` en `src/server/actions/plan.ts` (todas validadas con Zod y rate limit).
- `exportProgressCsv` con validación y `authLimiter`.
- `createDemoAccount` genera cuenta efímera, plan + métricas.

## Ítems de seguridad

- Rate limiting Upstash: `ipLimiter` (100/10m), `authLimiter` (20/1m), `actionLimiter` (60/10m; claves por acción: `createPlan:<userId>`, `rescheduleWorkout:<userId>`, `logWorkout:<userId>`).
- Autosave Redis invalida draft tras commit.
- Prisma schema indexado (`Workout` por `planId/userId` + `completedAt`).
- Logs Pino (`src/lib/logging/logger.ts`).

## Legales

- Términos: `/terms`
- Privacidad: `/privacy`
- Banner de cookies controlado por `NEXT_PUBLIC_ENABLE_COOKIE_BANNER`.

## Testing & CI

- Jest (`tests/unit`) cubre progresión y validaciones.
- Playwright (`tests/e2e/app.spec.ts`) smoke UI.
- GitHub Action `.github/workflows/ci.yml` ejecuta lint → typecheck → test → e2e → build (requiere servicios externos configurados en runner).

## Roadmap sugerido

1. Expandir `/dashboard` con datos en tiempo real (websocket o polling controlado).
2. Añadir pruebas para server actions (`createPlan`, `logWorkout`, `exportProgressCsv`).
3. Integrar MSW/Supabase mocks para CI determinístico.
4. Conectar Supabase Storage para assets de ejercicios.
5. Ajustar scripts CI para provisionar Postgres/Redis efímeros en pipeline.
### Observabilidad (Sentry)

- Integrado con `@sentry/nextjs` para cliente y servidor.
- Redacción agresiva en `beforeSend` (sin `user`, `headers`, `cookies`, `request.data`).
- ErrorBoundary global en `src/app/global-error.tsx` y captura adicional en `src/app/error.tsx`.

Config:
- `SENTRY_DSN` (usar el DSN de tu proyecto)

---

## 📚 Documentación Completa

La documentación está organizada en la carpeta `docs/`:

### 🚀 Inicio Rápido
- **[docs/INDEX.md](docs/INDEX.md)** - Índice completo de toda la documentación
- **[docs/setup/START_HERE.md](docs/setup/START_HERE.md)** - Empieza aquí si es tu primera vez
- **[docs/setup/QUICK_START.md](docs/setup/QUICK_START.md)** - Configuración rápida en 5 minutos

### 📖 Guías Principales
- **[docs/guides/REDIS_AUTOSAVE_GUIDE.md](docs/guides/REDIS_AUTOSAVE_GUIDE.md)** - Sistema de autosave (CRÍTICO)
- **[docs/guides/CALENDAR_GUIDE.md](docs/guides/CALENDAR_GUIDE.md)** - Calendario con drag & drop
- **[docs/guides/METRICS_GUIDE.md](docs/guides/METRICS_GUIDE.md)** - Sistema de métricas corporales
- **[docs/guides/PROGRESS_DASHBOARD_GUIDE.md](docs/guides/PROGRESS_DASHBOARD_GUIDE.md)** - Dashboard de progreso

### 🔐 Setup y Configuración
- **[docs/setup/AUTH_SETUP.md](docs/setup/AUTH_SETUP.md)** - Configuración de autenticación
- **[docs/setup/INSTALL_COMMANDS.md](docs/setup/INSTALL_COMMANDS.md)** - Comandos de instalación

### 📊 Auditoría y Estado
- **[docs/AUDIT.md](docs/AUDIT.md)** - Auditoría de seguridad completa
- **[docs/IMPLEMENTATION_SUMMARY.md](docs/IMPLEMENTATION_SUMMARY.md)** - Resumen del proyecto

**→ Para ver todo el contenido disponible, visita [docs/INDEX.md](docs/INDEX.md)**
