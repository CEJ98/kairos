# 🚀 GUÍA COMPLETA DE DESPLIEGUE EN VERCEL - KAIROS FITNESS

## 📋 PASOS OBLIGATORIOS ANTES DEL DESPLIEGUE

### 1. 🔧 PREPARAR BASE DE DATOS EN PRODUCCIÓN

#### Opción A: PostgreSQL en Railway (Recomendado - Gratis)
```bash
# 1. Visita https://railway.app
# 2. Conecta tu GitHub
# 3. Crear nuevo proyecto > PostgreSQL
# 4. Copia la DATABASE_URL que se genera
```

#### Opción B: Supabase (Alternativa)
```bash
# 1. Visita https://supabase.com
# 2. Crear proyecto
# 3. Ve a Settings > Database
# 4. Copia la conexión URI
```

### 2. 🔐 CONFIGURAR STRIPE PARA PRODUCCIÓN

```bash
# 1. Ve a https://dashboard.stripe.com
# 2. Cambiar a "Live mode"
# 3. Crear productos y precios:
#    - Plan Básico: $9.99/mes
#    - Plan Pro: $19.99/mes  
#    - Plan Entrenador: $49.99/mes
# 4. Configurar webhook endpoint:
#    URL: https://tu-app.vercel.app/api/stripe/webhooks
#    Eventos: customer.subscription.*, invoice.payment_*
```

### 3. 🔑 GENERAR SECRETS

```bash
# Generar NEXTAUTH_SECRET
openssl rand -base64 32

# El resultado será algo como:
# Xy8KqF2sN9mP4rT6vU8wA3zD7hJ5kL2n
```

## 🌐 DESPLIEGUE EN VERCEL - PASO A PASO

### PASO 1: Preparar Repositorio
```bash
# 1. Sube tu código a GitHub (si no lo has hecho)
git add .
git commit -m "Ready for production deployment"
git push origin main
```

### PASO 2: Conectar en Vercel
1. Ve a [vercel.com](https://vercel.com)
2. Conecta con tu cuenta de GitHub
3. Click "Import Project"
4. Selecciona tu repositorio `kairos-fitness`
5. **NO hagas deploy todavía** - primero configura las variables

### PASO 3: Configurar Variables de Entorno
En el dashboard de Vercel, antes del deploy, agrega estas variables:

#### Variables Requeridas:
```env
NEXTAUTH_URL=https://tu-app-name.vercel.app
NEXTAUTH_SECRET=tu-secret-generado-con-openssl
DATABASE_URL=postgresql://user:pass@host:port/db
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

#### Variables de Planes Stripe:
```env
STRIPE_PRICE_BASIC_MONTHLY=price_1ABC123...
STRIPE_PRICE_PRO_MONTHLY=price_1DEF456...
STRIPE_PRICE_TRAINER_MONTHLY=price_1GHI789...
```

#### Variables Opcionales:
```env
GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
ALLOWED_ORIGINS=https://tu-app-name.vercel.app
```

### PASO 4: Configurar Build Settings
- **Framework Preset**: Next.js
- **Root Directory**: ./
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### PASO 5: Deploy
1. Click "Deploy"
2. Espera que termine el build (2-5 minutos)
3. Si hay errores, revisa los logs

## 🔧 POST-DEPLOYMENT

### 1. Configurar Base de Datos
```bash
# Una vez desplegado, ejecutar migraciones:
npx prisma db push --schema=./prisma/schema.prisma
```

### 2. Verificar Stripe Webhook
1. Ve a Stripe Dashboard > Webhooks
2. Actualiza la URL del webhook a: `https://tu-app.vercel.app/api/stripe/webhooks`
3. Copia el nuevo webhook secret
4. Actualiza `STRIPE_WEBHOOK_SECRET` en Vercel

### 3. Configurar Dominio Personalizado (Opcional)
1. En Vercel > Settings > Domains
2. Agrega tu dominio personalizado
3. Actualiza `NEXTAUTH_URL` con el nuevo dominio

### 4. Configurar DNS (Si usas dominio personalizado)
```
Type: CNAME
Name: @
Value: cname.vercel-dns.com
```

## ✅ CHECKLIST FINAL

- [ ] Base de datos configurada y migraciones ejecutadas
- [ ] Variables de entorno configuradas en Vercel
- [ ] Stripe webhooks funcionando
- [ ] NextAuth funcionando con login/logout
- [ ] API endpoints respondiendo correctamente
- [ ] PWA instalable en móviles
- [ ] SSL certificado activo

## 🐛 TROUBLESHOOTING

### Error: "Database connection failed"
```bash
# Verifica que DATABASE_URL esté correcta
# Asegúrate que la base de datos acepta conexiones externas
# Ejecuta las migraciones: npx prisma db push
```

### Error: "NextAuth configuration error"
```bash
# Verifica NEXTAUTH_URL y NEXTAUTH_SECRET
# Asegúrate que NEXTAUTH_URL coincide con tu dominio
```

### Error: "Stripe webhook failed"
```bash
# Verifica que STRIPE_WEBHOOK_SECRET esté actualizado
# Revisa que la URL del webhook en Stripe sea correcta
# Verifica que los eventos estén configurados
```

## 📞 SOPORTE

Si tienes problemas:
1. Revisa los logs de Vercel Functions
2. Verifica las variables de entorno
3. Comprueba que la base de datos esté accesible
4. Testa los webhooks de Stripe

## 🎉 ¡LISTO!

Tu aplicación Kairos Fitness estará disponible en:
`https://tu-app-name.vercel.app`

---

**Desarrollado con ❤️ para el mercado fitness de Miami**