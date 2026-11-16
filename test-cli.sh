#!/bin/bash
set -e

echo "=== CLI Encryption Script Test ==="
echo ""

# Test password (for fixtures only, not real data)
TEST_PASSWORD="TestFixtureP@ss2024!"

# Change to test directory
cd "$(dirname "$0")"
export DATA_DIR="./test-output/data"

echo "1. Testing diary entry encryption..."
echo "$TEST_PASSWORD" | npx tsx scripts/encrypt-entry.ts \
  --type diary \
  --date 2026-11-16 \
  --input test-fixtures/diary-entry.json

if [ $? -eq 0 ]; then
  echo "✓ Diary encryption successful"
else
  echo "✗ Diary encryption failed"
  exit 1
fi

echo ""
echo "2. Testing course record encryption..."
echo "$TEST_PASSWORD" | npx tsx scripts/encrypt-entry.ts \
  --type course \
  --date 2026-11-16 \
  --input test-fixtures/course-record.json

if [ $? -eq 0 ]; then
  echo "✓ Course encryption successful"
else
  echo "✗ Course encryption failed"
  exit 1
fi

echo ""
echo "3. Verifying encrypted files exist..."
if [ -f "test-output/data/encrypted/diary/2026-11-16.enc" ]; then
  echo "✓ Diary encrypted file exists"
else
  echo "✗ Diary encrypted file missing"
  exit 1
fi

if [ -f "test-output/data/encrypted/courses/2026-11-16.enc" ]; then
  echo "✓ Course encrypted file exists"
else
  echo "✗ Course encrypted file missing"
  exit 1
fi

echo ""
echo "4. Checking manifest.json..."
if grep -q "diary-2026-11-16" test-output/data/manifest.json; then
  echo "✓ Diary entry in manifest"
else
  echo "✗ Diary entry missing from manifest"
  exit 1
fi

if grep -q "course-2026-11-16" test-output/data/manifest.json; then
  echo "✓ Course entry in manifest"
else
  echo "✗ Course entry missing from manifest"
  exit 1
fi

echo ""
echo "5. Verifying encrypted files contain no plaintext..."
if grep -q "测试日记" test-output/data/encrypted/diary/2026-11-16.enc; then
  echo "✗ WARNING: Plaintext found in encrypted file!"
  exit 1
else
  echo "✓ No plaintext in diary file"
fi

if grep -q "title" test-output/data/manifest.json; then
  # Check if it's actually a plaintext title, not just the word "title"
  if grep -q '"title".*"测试日记"' test-output/data/manifest.json; then
    echo "✗ WARNING: Plaintext title in manifest!"
    exit 1
  fi
fi
echo "✓ Manifest contains no plaintext private data"

echo ""
echo "6. Checking encrypted envelope structure..."
DIARY_ENC=$(cat test-output/data/encrypted/diary/2026-11-16.enc)
if echo "$DIARY_ENC" | jq -e '.version == "v1"' > /dev/null 2>&1; then
  echo "✓ Envelope version correct"
else
  echo "✗ Invalid envelope structure"
  exit 1
fi

if echo "$DIARY_ENC" | jq -e '.algorithm == "AES-256-GCM"' > /dev/null 2>&1; then
  echo "✓ Algorithm correct"
else
  echo "✗ Wrong algorithm"
  exit 1
fi

if echo "$DIARY_ENC" | jq -e '.iterations >= 600000' > /dev/null 2>&1; then
  echo "✓ Iterations >= 600,000"
else
  echo "✗ Insufficient iterations"
  exit 1
fi

echo ""
echo "7. Testing idempotent update..."
echo "$TEST_PASSWORD" | npx tsx scripts/encrypt-entry.ts \
  --type diary \
  --date 2026-11-16 \
  --input test-fixtures/diary-entry.json > /dev/null 2>&1

# Count entries in manifest
ENTRY_COUNT=$(jq '.entries | length' test-output/data/manifest.json)
if [ "$ENTRY_COUNT" -eq 2 ]; then
  echo "✓ Idempotent update preserved entry count"
else
  echo "✗ Entry count changed: $ENTRY_COUNT (expected 2)"
  exit 1
fi

echo ""
echo "=== All CLI tests passed! ==="
