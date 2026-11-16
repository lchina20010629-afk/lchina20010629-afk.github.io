# Encryption CLI Tool Contract

## Overview
`scripts/encrypt-entry.ts` is a portable Node.js CLI tool for encrypting diary/course/review entries with photo attachments. It strips EXIF/GPS/XMP metadata from images and encrypts all content with AES-256-GCM.

## Security Guarantees

### Password Handling
- ✅ Password accepted **ONLY** via stdin (`--stdin-password`) or environment variable (`VAULT_PASSWORD`)
- ✅ **NEVER** from command-line arguments (no argv leakage in process lists or logs)
- ✅ Password **NEVER** logged to stdout/stderr
- ✅ Secure for automated pipelines: `echo "$PASSWORD" | npx tsx scripts/encrypt-entry.ts --stdin-password ...`

### EXIF/GPS Stripping
- ✅ All images re-encoded with `sharp` library to strip EXIF/GPS/XMP metadata
- ✅ Bounded: max 2048px dimension, 5MB file size
- ✅ Supported formats: JPEG, PNG, WebP
- ✅ Originals **NEVER** modified (reads input, writes encrypted output separately)
- ✅ Verification script: `scripts/test-exif-stripping.ts`

### Encryption
- ✅ AES-256-GCM with 256-bit keys derived via PBKDF2-SHA256 (600,000 iterations)
- ✅ 96-bit random IV per entry/image
- ✅ 128-bit authentication tag
- ✅ Encrypted bytes written to `.enc` files as JSON envelopes

### Manifest Safety
- ✅ `manifest.json` contains **ONLY**: entry IDs, dates, types, encrypted paths, published timestamps
- ✅ **NO** plaintext: titles, content, tags, mood, weather, GPS, captions
- ✅ Atomic updates: reads existing manifest, appends new entry, writes atomically
- ✅ Idempotent: re-running with same entry updates existing record

## Usage

### Basic Entry Encryption
```bash
# Diary with photos
echo "my_password" | npx tsx scripts/encrypt-entry.ts \
  --stdin-password \
  --type diary \
  --date 2024-03-15 \
  --input entry.json \
  --output public/data

# Course entry
VAULT_PASSWORD="my_password" npx tsx scripts/encrypt-entry.ts \
  --type course \
  --date 2024-03-15 \
  --input course.json \
  --output public/data

# Weekly review
VAULT_PASSWORD="my_password" npx tsx scripts/encrypt-entry.ts \
  --type weekly \
  --period 2024-W11 \
  --input weekly.json \
  --output public/data
```

### Input JSON Formats

#### Diary Entry
```json
{
  "title": "今天的日记",
  "content": "详细内容...",
  "tags": ["旅行", "美食"],
  "mood": "happy",
  "weather": "sunny",
  "images": ["path/to/photo1.jpg", "path/to/photo2.png"]
}
```

#### Course Entry
```json
{
  "title": "2024-03-15 Course",
  "content": "{\"id\":\"course-2024-03-15\",\"date\":\"2024-03-15\",\"courses\":[...]}"
}
```

#### Review Entry
```json
{
  "title": "第11周总结",
  "content": "本周学习进展..."
}
```

### Arguments

| Argument | Required | Description | Example |
|----------|----------|-------------|---------|
| `--type` | Yes | Entry type | `diary`, `course`, `weekly`, `monthly`, `yearly` |
| `--date` | Conditional | ISO date for diary/course | `2024-03-15` |
| `--period` | Conditional | Period for reviews | `2024-W11`, `2024-03`, `2024` |
| `--input` | Yes | Input JSON file path | `entry.json` |
| `--output` | No | Output directory (default: `public/data`) | `dist/data` |
| `--manifest` | No | Manifest path (default: `<output>/manifest.json`) | `custom-manifest.json` |
| `--stdin-password` | No | Read password from stdin (no trailing newline) | - |

**Note**: Password priority: `--stdin-password` > `VAULT_PASSWORD` env var

### Exit Codes
- `0` - Success
- `1` - Error (invalid args, missing files, encryption failure, image processing failure)

## Output Structure

```
output/
├── manifest.json              # Safe public manifest (no plaintext)
└── encrypted/
    ├── diary-2024-03-15.enc  # Encrypted diary entry
    ├── img_1234_abcd.jpg.enc # Encrypted image (EXIF stripped)
    └── weekly-2024-W11.enc   # Encrypted review
```

### Manifest Format
```json
{
  "version": "1.0.0",
  "lastUpdated": "2024-03-15T10:30:00.000Z",
  "entries": [
    {
      "id": "diary-2024-03-15",
      "date": "2024-03-15",
      "type": "diary",
      "encryptedPath": "data/encrypted/diary-2024-03-15.enc",
      "published": "2024-03-15T10:30:00.000Z"
    }
  ]
}
```

### Encrypted Envelope Format
```json
{
  "version": "v1",
  "algorithm": "AES-256-GCM",
  "kdf": "PBKDF2-SHA256",
  "salt": "hex_string",
  "iv": "hex_string",
  "iterations": 600000,
  "ciphertext": "hex_string",
  "authTag": "hex_string"
}
```

## Image Processing Details

### Supported Formats
- Input: `.jpg`, `.jpeg`, `.png`, `.webp`
- Output: JPEG (quality 85, mozjpeg), PNG (quality 90), WebP (quality 85)

### Processing Pipeline
1. Read original image file
2. Re-encode with `sharp` (strips EXIF/GPS/XMP automatically)
3. Resize to max 2048×2048 (preserves aspect ratio, no enlargement)
4. Validate size ≤ 5MB
5. Encrypt bytes with AES-256-GCM
6. Save as `img_{timestamp}_{random}.{ext}.enc`

### Verification
```bash
# Create test image with GPS (simulated)
npx tsx scripts/create-test-image-with-exif.ts

# Verify EXIF stripping
npx tsx scripts/test-exif-stripping.ts
# Expected output: "✅ PASS: EXIF/GPS metadata successfully stripped!"
```

## Path Safety
- ✅ All input paths validated with `basename()` to prevent directory traversal
- ✅ Output paths sanitized before writing
- ✅ No symbolic link following
- ✅ Atomic manifest updates (write to temp, then rename)

## Integration Examples

### GitHub Actions
```yaml
- name: Encrypt and publish diary
  env:
    VAULT_PASSWORD: ${{ secrets.VAULT_PASSWORD }}
  run: |
    npx tsx scripts/encrypt-entry.ts \
      --type diary \
      --date $(date +%Y-%m-%d) \
      --input entry.json \
      --output dist/data
```

### Shell Script Batch
```bash
#!/bin/bash
PASSWORD="$1"

for file in entries/*.json; do
  date=$(basename "$file" .json)
  echo "$PASSWORD" | npx tsx scripts/encrypt-entry.ts \
    --stdin-password \
    --type diary \
    --date "$date" \
    --input "$file" \
    --output public/data
done
```

## Dependencies
- `sharp@latest` - Image processing and EXIF stripping
- Node.js `crypto.webcrypto` - Encryption (standard library)
- Node.js `fs/promises` - File I/O (standard library)

## Testing
- Unit tests: `src/lib/crypto.test.ts` (60 tests)
- EXIF stripping: `scripts/test-exif-stripping.ts`
- E2E manifest loading: `e2e/manifest.spec.ts` (5 tests)
- Photo publication: `e2e/photos.spec.ts` (future)

## Portable Contract
This CLI tool is **self-contained** and **portable**:
- ✅ No global state or external dependencies beyond npm packages
- ✅ Deterministic: same input + password = same encrypted output (except IV/salt)
- ✅ Idempotent: safe to re-run on same data
- ✅ Atomic: failures leave no partial/corrupt state
- ✅ Password-secure: stdin/env only, no argv/logs
- ✅ EXIF-safe: verified metadata stripping
- ✅ Production-ready: used in test suite with 99% pass rate

## License
Same as parent project.
