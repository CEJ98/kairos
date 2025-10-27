#!/bin/bash

# Archivos principales con console.log
FILES=(
  "src/components/dashboard/workout-editor.tsx"
  "src/app/actions/calendar-actions.ts"
  "src/app/actions/metrics-actions.ts"
  "src/app/api/auth/register/route.ts"
  "src/app/api/cron/daily-backup/route.ts"
)

for file in "${FILES[@]}"; do
  echo "Procesando: $file"

  # Backup
  cp "$file" "$file.backup"

  # Reemplazar console.log con logger
  sed -i '' 's/console\.log/logger.info/g' "$file"
  sed -i '' 's/console\.error/logger.error/g' "$file"
  sed -i '' 's/console\.warn/logger.warn/g' "$file"

  # Agregar import del logger si no existe
  if ! grep -q "from '@/lib/logging'" "$file"; then
    sed -i '' '1i\
import { logger } from "@/lib/logging";\
' "$file"
  fi
done

echo "✅ Reemplazo completado. Verifica los archivos."
