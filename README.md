# 🏋️‍♂️ Kairos Fitness App

Aplicación completa de gestión de rutinas de ejercicio con potencial de monetización B2C/B2B optimizada para el mercado de Miami.

## 🚀 Stack Tecnológico

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes + Prisma ORM
- **Base de datos**: PostgreSQL (Supabase)
- **Autenticación**: NextAuth.js
- **Pagos**: Stripe + webhooks
- **UI Components**: Shadcn/ui + Radix
- **Deployment**: Vercel + Railway

## 🎯 Características Principales

### Para Usuarios Individuales
- ✅ Sistema de registro/autenticación seguro
- ✅ Constructor de rutinas con drag & drop
- ✅ Base de datos completa de ejercicios
- ✅ Temporizador inteligente por ejercicio
- ✅ Tracking de progreso y estadísticas
- ✅ Historial completo de entrenamientos

### Para Entrenadores Personales
- ✅ Dashboard de gestión de clientes
- ✅ Constructor avanzado de rutinas
- ✅ Sistema de comunicación con clientes
- ✅ Panel de progreso de clientes
- ✅ Facturación automática con Stripe
- ✅ Reportes de rendimiento detallados

## 📋 Prerequisitos

- Node.js 18+ 
- PostgreSQL database
- Cuenta de Stripe
- Cuenta de Supabase (opcional)

## 🛠️ Instalación y Setup

### 1. Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/kairos-fitness.git
cd kairos-fitness
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
```bash
cp .env.example .env.local
```

Completar las variables en `.env.local`:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/kairos_fitness"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-key"

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Planes de Stripe
STRIPE_PRICE_BASIC_MONTHLY="price_..."
STRIPE_PRICE_PRO_MONTHLY="price_..."
STRIPE_PRICE_TRAINER_MONTHLY="price_..."
```

### 4. Setup de la base de datos
```bash
# Generar cliente Prisma
npm run db:generate

# Ejecutar migraciones
npm run db:migrate

# Seed inicial (opcional)
npm run db:seed
```

### 5. Configurar Stripe Webhooks

#### Desarrollo local:
```bash
# Instalar Stripe CLI
stripe listen --forward-to localhost:3000/api/stripe/webhooks

# Copiar el webhook secret a .env.local
```

#### Producción:
1. Ir a Dashboard de Stripe > Webhooks
2. Crear endpoint: `https://tu-dominio.com/api/stripe/webhooks`
3. Eventos a escuchar:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

### 6. Ejecutar en desarrollo
```bash
npm run dev
```

## 📦 Estructura del Proyecto

```
kairos-fitness/
├── prisma/
│   ├── schema.prisma          # Modelos de datos
│   └── seed.ts               # Data inicial
├── src/
│   ├── app/                  # App Router (Next.js 14)
│   │   ├── (auth)/          # Autenticación
│   │   ├── (dashboard)/     # Dashboard protegido
│   │   ├── api/             # API Routes
│   │   └── globals.css      # Estilos globales
│   ├── components/          # Componentes React
│   │   ├── ui/             # Componentes base
│   │   ├── auth/           # Autenticación
│   │   ├── dashboard/      # Dashboard
│   │   └── workouts/       # Rutinas
│   ├── lib/                # Utilidades
│   │   ├── auth.ts         # NextAuth config
│   │   ├── db.ts           # Prisma client
│   │   ├── stripe.ts       # Stripe config
│   │   └── utils.ts        # Helpers
│   ├── hooks/              # Custom hooks
│   ├── stores/             # Zustand stores
│   └── types/              # TypeScript types
└── README.md
```

## 🏗️ Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Servidor de desarrollo
npm run build           # Build para producción
npm run start           # Servidor de producción

# Base de datos
npm run db:generate     # Generar cliente Prisma
npm run db:push         # Push schema sin migración
npm run db:migrate      # Crear y aplicar migración
npm run db:seed         # Ejecutar seed
npm run db:studio       # Abrir Prisma Studio

# Calidad de código
npm run lint            # ESLint
npm run type-check      # TypeScript check

# Stripe
npm run stripe:listen   # Escuchar webhooks localmente
```

## 💰 Planes de Precios

| Plan | Precio/mes | Características |
|------|------------|-----------------|
| **Gratis** | $0 | 3 rutinas, ejercicios básicos |
| **Básico** | $9.99 | Rutinas ilimitadas, análisis avanzado |
| **Pro** | $19.99 | Integración wearables, nutrición |
| **Entrenador** | $49.99 | Dashboard profesional, 50 clientes |
| **Enterprise** | $99.99 | Clientes ilimitados, white label |

## 🚀 Deployment

### Vercel (Recomendado)
1. Conectar repositorio en Vercel
2. Configurar variables de entorno
3. Deploy automático en cada push

### Variables de entorno en producción:
- `DATABASE_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- Todas las `STRIPE_PRICE_*`

## 📊 Métricas de Éxito Objetivo

- **Tiempo de desarrollo**: ≤ 2 semanas
- **Performance**: Loading < 3 segundos
- **Conversión freemium**: > 5%
- **Retención mensual**: > 60%
- **Revenue por entrenador**: > $200/mes
- **Objetivo total**: $10k+ USD/mes

## 🔧 Personalización

### Agregar nuevos ejercicios
1. Usar Prisma Studio o API
2. Incluir GIFs/videos en Cloudinary
3. Categorizar correctamente

### Crear nuevos planes
1. Crear productos en Stripe Dashboard
2. Actualizar `PRICING_PLANS` en `src/lib/stripe.ts`
3. Configurar variables de entorno

### Modificar permisos
Editar roles y permisos en `prisma/schema.prisma`

## 🆘 Troubleshooting

### Error de conexión a base de datos
```bash
# Verificar URL de conexión
npm run db:studio
```

### Webhooks de Stripe no funcionan
```bash
# Verificar secret key
stripe listen --print-secret
```

### Problemas de autenticación
```bash
# Regenerar secret
openssl rand -base64 32
```

## 🤝 Contribución

1. Fork el proyecto
2. Crear feature branch (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push al branch (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver `LICENSE` para más detalles.

## 🌟 Roadmap Futuro

### Q1 2024
- [ ] App móvil React Native
- [ ] Integración Apple Health/Google Fit
- [ ] Sistema de notificaciones push

### Q2 2024
- [ ] AI Workout Assistant
- [ ] Video llamadas integradas
- [ ] Marketplace de rutinas

### Q3 2024
- [ ] White label completo
- [ ] API pública
- [ ] Integración con gimnasios

---

**Desarrollado con ❤️ para revolucionar el fitness**

**Target**: Miami, FL - Mercado premium fitness
**Contacto**: info@kairosfit.com
**Demo**: https://demo.kairosfit.com