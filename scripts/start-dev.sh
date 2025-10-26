#!/usr/bin/env bash
set -euo pipefail

printf "\n🚀 Kairos Fitness - Arranque de Desarrollo\n\n"

# 1) Verificar Node
REQUIRED_NODE_MAJOR=18
NODE_MAJOR=$(node -v | sed 's/v\([0-9]*\).*/\1/')
if [ "$NODE_MAJOR" -lt "$REQUIRED_NODE_MAJOR" ]; then
  echo "❌ Node >= 18 requerido. Versión actual: $(node -v)"
  exit 1
fi
echo "✅ Node OK: $(node -v)"

# 2) Preparar .env si no existe
if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    cp .env.example .env
    echo "✅ Copiado .env desde .env.example"
  else
    echo "⚠️ No se encontró .env.example. Creando .env mínimo."
    cat > .env <<'EOF'
# Mínimo para desarrollo local
NEXT_PUBLIC_ENABLE_COOKIE_BANNER=false
EOF
  fi
fi

# 3) Instalar dependencias
if [ ! -d node_modules ]; then
  echo "📦 Instalando dependencias con npm..."
  npm install
else
  echo "📦 Dependencias ya instaladas"
fi

# 4) Preparar base de datos (Prisma SQLite dev por defecto)
echo "🗃️ Generando Prisma Client..."
npm run db:generate

echo "🗃️ Aplicando schema a la DB..."
npm run db:push

# Intentar seed (si existe)
if [ -f prisma/seed.ts ]; then
  echo "🌱 Ejecutando seed..."
  npm run db:seed || echo "⚠️ Seed opcional falló, continuando"
fi

# 5) Info de Redis/Upstash opcional
if [ -z "${UPSTASH_REDIS_REST_URL:-}" ] || [ -z "${UPSTASH_REDIS_REST_TOKEN:-}" ]; then
  echo "ℹ️ Upstash Redis no configurado. Autosave y timers usarán fallback o se limitarán."
fi

# 6) Lanzar servidor de desarrollo
echo "\n▶️ Iniciando servidor: npm run dev\n"
npm run dev