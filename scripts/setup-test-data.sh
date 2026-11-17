#!/bin/bash
# Setup test data for E2E tests
# Backs up production data and installs test fixtures

set -e

echo "🔧 Setting up test data..."

# Backup production data
if [ -d "public/data" ]; then
  echo "📦 Backing up production data..."
  if [ -d "public/data.prod.backup" ]; then
    rm -rf public/data.prod.backup
  fi
  cp -r public/data public/data.prod.backup
fi

# Generate test fixtures if they don't exist
if [ ! -d "test-output/data" ] || [ ! -f "test-output/data/manifest.json" ]; then
  echo "🧪 Generating test fixtures..."
  npx tsx scripts/generate-test-fixtures.ts
fi

# Copy test data to public/data
echo "📋 Installing test data..."
rm -rf public/data
mkdir -p public/data
cp -r test-output/data/* public/data/

echo "✅ Test data ready!"
