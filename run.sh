#!/usr/bin/env bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "🔨 Compiling individual TypeScript files..."

# Compiler options matching modern Node.js/ES Modules requirements
TSC_FLAGS="--esModuleInterop --moduleResolution node --module es2022 --target es2022"

# Backend server files
BACKEND_FILES=(
  "src/app.ts"
  "src/db.ts"
  "src/repositories/documentRepository.ts"
)

# Frontend client files (outputting directly to public/)
FRONTEND_FILES=(
  "src/client/document.ts"
  "src/client/index.ts"
  "src/client/new.ts"
  "src/client/archive.ts"
  "src/client/edit.ts"
)

echo "Compiling backend files..."
for FILE in "${BACKEND_FILES[@]}"; do
  echo "  -> $FILE"
  npx tsc $TSC_FLAGS "$FILE"
done

echo "Compiling frontend files to public/..."
for FILE in "${FRONTEND_FILES[@]}"; do
  echo "  -> $FILE"
  npx tsc $TSC_FLAGS --outDir public/javascripts "$FILE"
done

echo "✅ All files compiled successfully!"
echo "🚀 Starting development server..."

# Run dev server
npm run dev