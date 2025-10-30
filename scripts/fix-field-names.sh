#!/bin/bash

# Fix field name changes from schema migration
# weightKg -> weight
# neckCm -> removed
# waistCm -> waist
# hipCm -> hips

FILES=(
  "src/app/insights/page.tsx"
  "src/app/progress/page.tsx"
  "src/app/dashboard/page.tsx"
  "src/app/actions/progress-actions.ts"
  "src/app/actions/body-metrics.ts"
  "src/app/api/metrics/route.ts"
  "src/server/actions/progress.ts"
  "src/server/actions/auth.ts"
  "src/components/forms/body-metric-form.tsx"
  "src/lib/validation/body-metrics.ts"
  "scripts/test-setup.ts"
  "src/app/insights/body-metrics/page.tsx"
)

echo "🔧 Fixing field names..."

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "  Fixing $file"
    # Create backup
    cp "$file" "$file.backup"

    # Replace weightKg with weight
    sed -i '' 's/weightKg/weight/g' "$file"

    # Replace waistCm with waist
    sed -i '' 's/waistCm/waist/g' "$file"

    # Replace hipCm with hips
    sed -i '' 's/hipCm/hips/g' "$file"

    echo "    ✓ Fixed"
  else
    echo "    ⚠ File not found: $file"
  fi
done

echo ""
echo "✅ All field names fixed!"
echo ""
echo "⚠️  Note: neckCm field was removed from schema"
echo "   You may need to update code that references it"
