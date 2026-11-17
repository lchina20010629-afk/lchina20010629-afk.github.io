# Life Growth Dashboard Encryption CLI

**Version 2.0.0** - Portable encryption CLI for managing published encrypted content.

## Overview

This CLI tool provides commands to:
- Bootstrap/initialize the vault with password verifier
- Encrypt diary entries, courses, and reviews
- Manage the published manifest
- Process and encrypt images with EXIF stripping

## Installation

```bash
cd cli
npm ci  # Install locked dependencies
npm run build  # Compile TypeScript
```

## Usage

### Bootstrap Vault

Initialize an empty manifest with password verifier:

```bash
echo "YourSecurePassword" | node dist/cli.js bootstrap --stdin-password --output ../public/data
```

Or using environment variable:

```bash
VAULT_PASSWORD="YourSecurePassword" node dist/cli.js bootstrap --output ../public/data
```

This creates a manifest with proper salt/verifier but no entries.

### Encrypt Entry

```bash
# Diary entry
echo "password" | node dist/cli.js encrypt --type diary --date 2026-11-17 --input entry.json --output ../public/data --stdin-password

# Course (4-column schema)
VAULT_PASSWORD="password" node dist/cli.js encrypt --type course --date 2026-11-17 --input course.json --output ../public/data

# Weekly/Monthly/Yearly review
VAULT_PASSWORD="password" node dist/cli.js encrypt --type weekly --period 2026-W46 --input review.json --output ../public/data
```

### Input Schemas

**Diary Entry** (`entry.json`):
```json
{
  "title": "今日日记",
  "content": "日记内容...",
  "tags": ["标签1", "标签2"],
  "mood": "开心",
  "weather": "晴",
  "images": ["path/to/photo.jpg"]
}
```

**Course Entry** (`course.json`) - 4-column UI schema:
```json
{
  "courses": [
    {
      "name": "英语",
      "targetMinutes": 30,
      "actualMinutes": 35,
      "completed": true,
      "materials": ["Duolingo Lesson 15", "BBC Learning English"],
      "exercises": ["单词记忆", "对话练习"],
      "reflection": "今天学习了新词汇..."
    },
    {
      "name": "泰语",
      "targetMinutes": 20,
      "actualMinutes": 0,
      "completed": false,
      "materials": ["Thai Basics"],
      "exercises": []
    },
    {
      "name": "修身养性",
      "targetMinutes": 15,
      "actualMinutes": 20,
      "completed": true
    },
    {
      "name": "生财有道",
      "targetMinutes": 25,
      "actualMinutes": 30,
      "completed": true
    }
  ],
  "totalMinutes": 85,
  "notes": "整体学习笔记..."
}
```

**Review Entry** (`review.json`):
```json
{
  "period": "2026-W46",
  "type": "weekly",
  "summary": "本周总结...",
  "highlights": ["成就1", "成就2"],
  "challenges": ["挑战1"],
  "nextSteps": ["下周计划"]
}
```

## Security

- Passwords ONLY via stdin (`--stdin-password`) or `VAULT_PASSWORD` environment variable
- NEVER pass password as command-line argument
- NEVER log passwords
- Bootstrap verifies password before overwriting existing manifest
- Encrypted images strip all EXIF/GPS/XMP metadata

## Implementation Notes

### Image Paths
- Input: `images: ["path/to/photo.jpg"]`
- Encrypted output: `data/img_<timestamp>_<rand>.jpg.enc`
- Manifest reference: `encryptedPath: "data/img_<timestamp>_<rand>.jpg.enc"`
- Browser loader: Fetches from `/data/img_<timestamp>_<rand>.jpg.enc`

### Atomic Manifest Updates
- Writes to temporary file first
- Renames atomically (no half-written manifest)
- Preserves remote encrypted files during upsert
- Idempotent: safe to run multiple times

### Course Schema
- Matches 4-column UI layout
- Sources in `materials[]`, not generic `content`
- Exercises tracked separately
- Reflection encrypted, not marked complete by push

## TODO for Parent

This is a work-in-progress CLI. Complete implementation requires:

1. Full TypeScript implementation with types
2. Commander.js argument parsing
3. Bootstrap command implementation
4. Image path fix (consistent data/ prefix)
5. Atomic rename for manifest
6. Course schema validation
7. Comprehensive error handling
8. Package with locked dependencies for portability

