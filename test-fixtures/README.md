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
# Encrypt a diary entry
tsx scripts/encrypt-entry.ts --type diary --date 2026-11-16 \
  --input test-fixtures/diary-fixture.json \
  --password "TestPassword123!@#Strong" \
  --output public/data

# Verify manifest created
cat public/data/manifest.json
```

These files are NOT committed to the deployed site.
