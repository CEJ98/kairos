# Configuración de Webhooks de Stripe en Producción

Esta guía te ayudará a configurar correctamente los webhooks de Stripe para el entorno de producción de Kairos.

## 📋 Prerrequisitos

1. **Cuenta de Stripe en modo Live**
   - Tener una cuenta de Stripe verificada
   - Acceso al dashboard de Stripe en modo producción
   - Claves de API de producción (pk_live_ y sk_live_)

2. **Aplicación desplegada**
   - URL de producción accesible (HTTPS requerido)
   - Variables de entorno configuradas en la plataforma de deploy

## 🔧 Paso 1: Configurar Variables de Entorno

### En tu plataforma de deploy (Vercel, Railway, etc.):

```bash
# Stripe - Claves de producción
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_tu_clave_publica
STRIPE_SECRET_KEY=sk_live_tu_clave_secreta
STRIPE_WEBHOOK_SECRET=whsec_se_generara_automaticamente

# URLs de producción
NEXT_PUBLIC_SITE_URL=https://tu-dominio.com
NEXTAUTH_URL=https://tu-dominio.com

# Otros requeridos
NEXTAUTH_SECRET=tu_secreto_nextauth
DATABASE_URL=tu_url_base_datos_produccion
```

## 🎯 Paso 2: Crear Webhook en Stripe

### Opción A: Usando el Script Automatizado

```bash
# Configurar variables de entorno localmente
export STRIPE_SECRET_KEY="sk_live_tu_clave_secreta"
export NEXTAUTH_URL="https://tu-dominio.com"

# Ejecutar script de configuración
node scripts/setup-stripe-webhooks.js
```

### Opción B: Configuración Manual

1. **Ir al Dashboard de Stripe**
   - Visita: https://dashboard.stripe.com/webhooks
   - Asegúrate de estar en modo "Live"

2. **Crear Nuevo Webhook**
   - Click en "Add endpoint"
   - URL: `https://tu-dominio.com/api/stripe/webhooks`
   - Descripción: "Kairos Fitness - Production Webhook"

3. **Configurar Eventos**
   Selecciona estos eventos requeridos:
   ```
   customer.subscription.created
   customer.subscription.updated
   customer.subscription.deleted
   invoice.payment_succeeded
   invoice.payment_failed
   checkout.session.completed
   customer.subscription.trial_will_end
   customer.created
   customer.updated
   ```

4. **Obtener Webhook Secret**
   - Después de crear el webhook, copia el "Signing secret"
   - Formato: `whsec_...`

## 🔐 Paso 3: Configurar Webhook Secret

### En tu plataforma de deploy:

```bash
# Agregar el secreto del webhook
STRIPE_WEBHOOK_SECRET=whsec_el_secreto_copiado_de_stripe
```

### Redeploy la aplicación
Después de agregar la variable, redeploya tu aplicación para que tome efecto.

## ✅ Paso 4: Verificar Configuración

### Usando el Script de Verificación

```bash
# Configurar variables de entorno
export STRIPE_SECRET_KEY="sk_live_tu_clave_secreta"
export STRIPE_WEBHOOK_SECRET="whsec_tu_secreto"
export NEXTAUTH_URL="https://tu-dominio.com"

# Verificar configuración
node scripts/verify-stripe-webhooks.js
```

### Verificación Manual

1. **Acceder al Panel de Admin**
   - Ve a: `https://tu-dominio.com/admin`
   - Sección "Webhook Manager"

2. **Verificar Estado**
   - ✅ Webhook configurado
   - ✅ Eventos requeridos
   - ✅ Variables de entorno

## 🧪 Paso 5: Probar Webhooks

### Prueba con Stripe CLI (Desarrollo)

```bash
# Instalar Stripe CLI
brew install stripe/stripe-cli/stripe

# Login a tu cuenta
stripe login

# Escuchar webhooks localmente
stripe listen --forward-to localhost:3000/api/stripe/webhooks

# En otra terminal, disparar eventos de prueba
stripe trigger customer.subscription.created
```

### Prueba en Producción

1. **Realizar una compra de prueba**
   - Usar tarjeta de prueba en modo live (si está habilitado)
   - O usar una tarjeta real con un monto pequeño

2. **Verificar logs**
   - Revisar logs de la aplicación
   - Verificar dashboard de Stripe > Webhooks > Logs

## 🚨 Troubleshooting

### Webhook no recibe eventos

1. **Verificar URL**
   ```bash
   curl -X POST https://tu-dominio.com/api/stripe/webhooks \
     -H "Content-Type: application/json" \
     -d '{"test": true}'
   ```

2. **Verificar variables de entorno**
   - STRIPE_WEBHOOK_SECRET debe estar configurado
   - URL debe ser HTTPS
   - Endpoint debe responder 200

### Error de verificación de firma

```
Stripe webhook signature verification failed
```

**Solución:**
- Verificar que STRIPE_WEBHOOK_SECRET sea correcto
- Asegurarse de que el secreto corresponda al webhook correcto
- Verificar que no haya espacios extra en la variable

### Eventos no procesados

1. **Verificar logs de aplicación**
2. **Revisar base de datos** - ¿se están guardando las suscripciones?
3. **Verificar manejo de errores** en `/api/stripe/webhooks/route.ts`

## 📊 Monitoreo

### Dashboard de Stripe
- Webhooks > [Tu webhook] > Logs
- Ver intentos exitosos/fallidos
- Revisar tiempos de respuesta

### Logs de Aplicación
```bash
# Ejemplo de logs exitosos
[INFO] Stripe webhook received: customer.subscription.created
[INFO] Subscription created for user: user_123
[INFO] Webhook processed successfully
```

## 🔄 Mantenimiento

### Rotación de Secretos
1. Generar nuevo webhook secret en Stripe
2. Actualizar STRIPE_WEBHOOK_SECRET en deploy
3. Redeploy aplicación
4. Verificar funcionamiento

### Actualización de Eventos
Si necesitas agregar nuevos eventos:
1. Actualizar `REQUIRED_EVENTS` en scripts
2. Ejecutar script de actualización
3. Actualizar handlers en `/api/stripe/webhooks/route.ts`

## 📚 Referencias

- [Documentación de Webhooks de Stripe](https://stripe.com/docs/webhooks)
- [Stripe CLI](https://stripe.com/docs/stripe-cli)
- [Mejores Prácticas de Webhooks](https://stripe.com/docs/webhooks/best-practices)

---

**⚠️ Importante:** Nunca compartas tus claves de producción o secretos de webhook. Manténlos seguros en variables de entorno.