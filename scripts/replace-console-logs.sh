#!/bin/bash
set -euo pipefail

# Generar lista de archivos con console.* o usar console-files.txt si existe
if [[ -f console-files.txt ]]; then
  FILES=$(cat console-files.txt)
else
  # Excluir los propios loggers
  FILES=$(grep -rl "console\." src --exclude-dir=node_modules | grep -vE 'src/lib/logging/index.ts|src/lib/logging/client.ts|\.bak$|\.backup$')
fi

updated=0
for file in $FILES; do
  if [[ ! -f "$file" ]]; then
    echo "Skipping missing: $file"
    continue
  fi

  echo "Procesando: $file"

  # Backup
  cp "$file" "$file.bak"

  first_line=$(head -n 1 "$file" || echo "")
  if grep -qE "import\s+\{\s*logger\s*\}\s+from\s+['\"]@/lib/logging/client['\"]" "$file"; then has_client_import=yes; else has_client_import=no; fi
  if grep -qE "import\s+\{\s*logger\s*\}\s+from\s+['\"]@/lib/logging['\"]" "$file"; then has_server_import=yes; else has_server_import=no; fi

  # Añadir import según el contexto
  if [[ "$first_line" == "'use client';" || "$first_line" == '"use client";' ]]; then
    if [[ "$has_client_import" == "no" ]]; then
      awk 'NR==1{print; print "import { logger } from \"@/lib/logging/client\";"; next} {print}' "$file" > "$file.tmp" && mv "$file.tmp" "$file"
    fi
  elif [[ "$first_line" == "'use server';" || "$first_line" == '"use server";' ]]; then
    if [[ "$has_server_import" == "no" ]]; then
      awk 'NR==1{print; print "import { logger } from \"@/lib/logging\";"; next} {print}' "$file" > "$file.tmp" && mv "$file.tmp" "$file"
    fi
  else
    # Por defecto, usar logger de servidor
    if [[ "$has_server_import" == "no" ]]; then
      sed -i '' '1s/^/import { logger } from "@\/lib\/logging";\
/' "$file"
    fi
  fi

  # Reemplazos de métodos console -> logger
  sed -i '' -E \
    -e 's/console\.log\(/logger.info(/g' \
    -e 's/console\.error\(/logger.error(/g' \
    -e 's/console\.warn\(/logger.warn(/g' \
    -e 's/console\.debug\(/logger.debug(/g' \
    "$file"

  updated=$((updated+1))
  echo "Updated: $file"
done

echo "✅ Reemplazo completado. Archivos actualizados: $updated"