#!/bin/bash

# 🚀 Kairos Fitness - Script de Instalación Automática
# Este script instala todas las dependencias necesarias para Kairos

set -e  # Salir si hay errores

echo "🚀 Iniciando instalación de Kairos Fitness..."
echo ""

# Verificar que pnpm está instalado
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm no está instalado. Instalando..."
    npm install -g pnpm
fi

echo "✅ pnpm detectado"
echo ""

# Instalar dependencias de producción
echo "📦 Instalando dependencias de producción..."
pnpm add \
  @prisma/client \
  @next-auth/prisma-adapter \
  next-auth \
  bcryptjs \
  @upstash/redis \
  @upstash/ratelimit \
  @supabase/supabase-js \
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

echo "✅ Dependencias de producción instaladas"
echo ""

# Instalar dependencias de desarrollo
echo "🛠️  Instalando dependencias de desarrollo..."
pnpm add -D \
  prisma \
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

echo "✅ Dependencias de desarrollo instaladas"
echo ""

# Verificar si .env.local existe
if [ ! -f .env.local ]; then
    echo "📝 Creando .env.local desde .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env.local
        echo "⚠️  IMPORTANTE: Edita .env.local con tus credenciales reales"
    else
        echo "⚠️  .env.example no encontrado. Créalo manualmente."
    fi
else
    echo "✅ .env.local ya existe"
fi
echo ""

# Inicializar Prisma si no existe
if [ ! -d prisma ]; then
    echo "🗄️  Inicializando Prisma..."
    npx prisma init
    echo "✅ Prisma inicializado"
else
    echo "✅ Directorio prisma ya existe"
fi
echo ""

# Generar Prisma Client si existe schema
if [ -f prisma/schema.prisma ]; then
    echo "⚙️  Generando Prisma Client..."
    npx prisma generate
    echo "✅ Prisma Client generado"
else
    echo "⚠️  prisma/schema.prisma no encontrado. Créalo antes de continuar."
fi
echo ""

# Verificar si components.json existe (shadcn)
if [ ! -f components.json ]; then
    echo "🎨 Inicializando shadcn/ui..."
    echo "   Selecciona las siguientes opciones:"
    echo "   - Style: Default"
    echo "   - Color: Slate"
    echo "   - CSS variables: Yes"
    echo ""
    npx shadcn@latest init
    echo "✅ shadcn/ui inicializado"
else
    echo "✅ shadcn/ui ya configurado"
fi
echo ""

echo "🎉 ¡Instalación completada!"
echo ""
echo "📋 Próximos pasos:"
echo "1. Edita .env.local con tus credenciales"
echo "2. Configura tu base de datos en Supabase"
echo "3. Ejecuta: pnpm db:push"
echo "4. Ejecuta: pnpm dev"
echo ""
echo "🚀 Para iniciar desarrollo:"
echo "   pnpm dev"
echo ""
