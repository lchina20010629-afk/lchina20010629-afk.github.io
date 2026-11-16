# Test Fixtures

These JSON files are used for testing the CLI encryption and manifest generation.

They contain NO real user data - only synthetic test content.

## Files

- `diary-fixture.json` - Test diary entry with Unicode content
- `course-fixture.json` - Test course/learning record  
- `weekly-fixture.json` - Test weekly review
- `test-image.jpg` - Synthetic test image (to be generated)

## Usage

```bash
# Encrypt a diary entry (secure password via env var)
VAULT_PASSWORD="TestPassword123" npx tsx scripts/encrypt-entry.ts \
  --type diary --date 2026-11-16 \
  --input test-fixtures/diary-fixture.json \
  --output /tmp/test-data

# Or via stdin (pipe)
echo "TestPassword123" | npx tsx scripts/encrypt-entry.ts \
  --type diary --date 2026-11-16 \
  --input test-fixtures/diary-fixture.json \
  --stdin-password \
  --output /tmp/test-data

# Verify manifest created
cat /tmp/test-data/manifest.json
```

**Note**: Image publishing is currently disabled. EXIF/metadata stripping must be implemented before images can be safely published.

These files are NOT committed to the deployed site.
