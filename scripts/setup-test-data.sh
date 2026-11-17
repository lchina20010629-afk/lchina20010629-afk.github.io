#!/bin/bash
# Setup test data for E2E tests
# Backs up production data and installs test fixtures

set -e

echo "🔧 Setting up test data..."

# Backup production data (force fresh backup)
if [ -d "public/data" ]; then
  echo "📦 Backing up production data..."
  rm -rf public/data.test.backup
  cp -r public/data public/data.test.backup
else
  echo "⚠️  public/data not found, will restore from git"
fi

# Generate test fixtures if they don't exist or are empty
if [ ! -f "test-output/data/manifest.json" ] || [ ! -s "test-output/data/manifest.json" ] || [ "$(cat test-output/data/manifest.json | grep -c '"entries"')" -eq 0 ]; then
  echo "🧪 Generating test fixtures..."
  npx tsx scripts/generate-test-fixtures.ts
fi

# Verify test fixtures were generated correctly
if [ ! -f "test-output/data/manifest.json" ]; then
  echo "❌ Failed to generate test fixtures"
  exit 1
fi

ENTRY_COUNT=$(cat test-output/data/manifest.json | grep -o '"id"' | wc -l)
if [ "$ENTRY_COUNT" -lt 3 ]; then
  echo "❌ Test fixtures incomplete (found $ENTRY_COUNT entries, expected 3+)"
  exit 1
fi

# Copy test data to public/data
echo "📋 Installing test data ($ENTRY_COUNT entries)..."
rm -rf public/data
mkdir -p public/data
cp -r test-output/data/* public/data/

echo "✅ Test data ready!"
