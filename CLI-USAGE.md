# CLI Usage Examples

## Installation

```bash
# Extract portable package
tar -xzf portable-encryption-cli-v2.tar.gz
cd package
npm ci
```

## Bootstrap Vault

```bash
# From stdin (recommended)
echo "YourSecurePassword" | node dist/cli.js bootstrap --output ../public/data --stdin-password

# From environment
VAULT_PASSWORD="YourSecurePassword" node dist/cli.js bootstrap --output ../public/data
```

## Encrypt Course (4-Column)

**Input**: `course-2026-11-17.json`
```json
{
  "courses": [
    {
      "name": "英语",
      "targetMinutes": 30,
      "actualMinutes": 35,
      "completed": true,
      "materials": ["Duolingo Lesson 15"],
      "exercises": ["单词记忆", "对话练习"],
      "reflection": "学习商务英语"
    },
    {
      "name": "泰语",
      "targetMinutes": 20,
      "actualMinutes": 15,
      "completed": false,
      "materials": ["Thai Basics"],
      "exercises": ["基础问候2-3句"]
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
  "totalMinutes": 100,
  "notes": "今日学习良好"
}
```

**Command**:
```bash
VAULT_PASSWORD="YourPassword" node dist/cli.js encrypt \
  --type course \
  --date 2026-11-17 \
  --input course-2026-11-17.json \
  --output ../public/data
```

## Encrypt Diary with Images

**Input**: `diary-2026-11-17.json`
```json
{
  "title": "今日日记",
  "content": "今天天气很好...",
  "tags": ["生活", "学习"],
  "mood": "开心",
  "weather": "晴",
  "images": ["photo1.jpg", "photo2.jpg"]
}
```

**Command**:
```bash
VAULT_PASSWORD="YourPassword" node dist/cli.js encrypt \
  --type diary \
  --date 2026-11-17 \
  --input diary-2026-11-17.json \
  --output ../public/data
```

## Encrypt Weekly Review

**Input**: `weekly-2026-W46.json`
```json
{
  "period": "2026-W46",
  "type": "weekly",
  "summary": "本周总结...",
  "highlights": ["完成学习目标"],
  "challenges": ["时间管理需改进"],
  "nextSteps": ["下周计划"]
}
```

**Command**:
```bash
VAULT_PASSWORD="YourPassword" node dist/cli.js encrypt \
  --type weekly \
  --period 2026-W46 \
  --input weekly-2026-W46.json \
  --output ../public/data
```

## Security Notes

- **Password ONLY via environment or stdin**
- Never pass password as command-line argument
- Wrong password preserves all existing data
- Images automatically strip EXIF/GPS/XMP metadata
- Manifest updates are atomic (no half-written files)

## Image Paths

- Input: `images: ["path/to/photo.jpg"]`
- Output: `data/img_<timestamp>_<rand>.jpg.enc`
- Browser loads: `/data/img_<timestamp>_<rand>.jpg.enc`
- No `/data/data/` duplication

## Verification

```bash
# Check manifest
cat ../public/data/manifest.json | jq '.entries[]'

# List encrypted files
ls -lh ../public/data/encrypted/
ls -lh ../public/data/*.enc
```
