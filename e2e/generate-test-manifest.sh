#!/bin/bash
# Generate test manifest data in temporary directory (not production paths)
set -e

TEST_DATA_DIR="/tmp/test-manifest-data"
PASSWORD="TestFixturePassword123"

echo "Generating test manifest in $TEST_DATA_DIR"
rm -rf "$TEST_DATA_DIR"
mkdir -p "$TEST_DATA_DIR"

# Generate entries
VAULT_PASSWORD="$PASSWORD" npx tsx scripts/encrypt-entry.ts \
  --type diary --date 2026-11-16 \
  --input test-fixtures/diary-fixture.json \
  --output "$TEST_DATA_DIR"

VAULT_PASSWORD="$PASSWORD" npx tsx scripts/encrypt-entry.ts \
  --type course --date 2026-11-16 \
  --input test-fixtures/course-fixture.json \
  --output "$TEST_DATA_DIR"

VAULT_PASSWORD="$PASSWORD" npx tsx scripts/encrypt-entry.ts \
  --type weekly --period 2026-W46 \
  --input test-fixtures/weekly-fixture.json \
  --output "$TEST_DATA_DIR"

echo "Test manifest generated: $TEST_DATA_DIR/manifest.json"
ls -lh "$TEST_DATA_DIR/"
