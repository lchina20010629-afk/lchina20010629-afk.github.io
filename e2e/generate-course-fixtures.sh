#!/bin/bash
# Generate temporary course and review test fixtures

set -e

FIXTURE_DIR="/tmp/test-course-fixtures"
PASSWORD="TestPass123!"

rm -rf "$FIXTURE_DIR"
mkdir -p "$FIXTURE_DIR"

echo "🔧 Generating course and review fixtures..."

# Course 1: 2024-03-15 - English only
cat > "$FIXTURE_DIR/course1.json" << 'EOF'
{
  "id": "course-2024-03-15",
  "date": "2024-03-15",
  "courses": [
    {
      "name": "English",
      "targetMinutes": 10,
      "actualMinutes": 10,
      "completed": true,
      "materials": ["Cambridge Grammar Book", "BBC Learning English"],
      "exercises": ["Past tense exercises", "Vocabulary quiz"],
      "reflection": "Made good progress on past tenses today"
    },
    {
      "name": "Thai",
      "targetMinutes": 8,
      "actualMinutes": 0,
      "completed": false
    },
    {
      "name": "修身养性",
      "targetMinutes": 6,
      "actualMinutes": 0,
      "completed": false
    },
    {
      "name": "生财有道案例",
      "targetMinutes": 6,
      "actualMinutes": 0,
      "completed": false
    }
  ],
  "totalMinutes": 10
}
EOF

# Course 2: 2024-03-16 - All completed
cat > "$FIXTURE_DIR/course2.json" << 'EOF'
{
  "id": "course-2024-03-16",
  "date": "2024-03-16",
  "courses": [
    {
      "name": "English",
      "targetMinutes": 10,
      "actualMinutes": 10,
      "completed": true,
      "materials": ["TED Talk: The power of words"],
      "reflection": "Learned new idioms"
    },
    {
      "name": "Thai",
      "targetMinutes": 8,
      "actualMinutes": 8,
      "completed": true,
      "materials": ["Thai script practice"],
      "reflection": "Practiced consonants"
    },
    {
      "name": "修身养性",
      "targetMinutes": 6,
      "actualMinutes": 6,
      "completed": true,
      "materials": ["道德经 第一章"],
      "reflection": "Reflected on simplicity"
    },
    {
      "name": "生财有道案例",
      "targetMinutes": 6,
      "actualMinutes": 6,
      "completed": true,
      "materials": ["Tesla vertical integration case"],
      "reflection": "Supply chain strategy insights"
    }
  ],
  "totalMinutes": 30
}
EOF

# Weekly review
cat > "$FIXTURE_DIR/weekly.json" << 'EOF'
{
  "id": "weekly-2024-W11",
  "period": "2024-W11",
  "type": "weekly",
  "title": "第11周总结",
  "content": "本周完成了两天的学习任务，英语和泰语有明显进步。需要加强修身养性的持续性。",
  "achievements": ["完成英语10分钟×2", "完成泰语8分钟×1"],
  "challenges": ["修身养性坚持不够"],
  "nextGoals": ["每天至少完成2列学习"]
}
EOF

# Monthly review
cat > "$FIXTURE_DIR/monthly.json" << 'EOF'
{
  "id": "monthly-2024-03",
  "period": "2024-03",
  "type": "monthly",
  "title": "三月总结",
  "content": "三月份建立了四列学习法的框架，开始践行每日学习。语言学习有明显收获，商业思维开始启蒙。",
  "achievements": ["建立学习系统", "英语口语提升"],
  "challenges": ["时间分配不均"],
  "nextGoals": ["四月每日完成率80%"]
}
EOF

# Yearly review
cat > "$FIXTURE_DIR/yearly.json" << 'EOF'
{
  "id": "yearly-2024",
  "period": "2024",
  "type": "yearly",
  "title": "2024年度总结",
  "content": "2024年是个人成长系统化的一年。建立了四列学习法，养成了每日复盘的习惯，语言能力和商业思维都有显著提升。",
  "achievements": ["建立个人成长系统", "英语达到中级水平", "泰语入门"],
  "challenges": ["执行力不稳定", "深度学习时间不足"],
  "nextGoals": ["2025年冲刺英语高级", "泰语达到日常交流水平"]
}
EOF

echo "📦 Encrypting fixtures..."

# Encrypt all fixtures
export VAULT_PASSWORD="$PASSWORD"
for file in "$FIXTURE_DIR"/*.json; do
  # Extract type and date from JSON content
  TYPE=$(jq -r '.type // "course"' "$file")
  if [[ "$TYPE" == "course" ]]; then
    DATE=$(jq -r '.date' "$file")
  else
    DATE=$(jq -r '.period' "$file")
  fi
  
  TITLE=$(jq -r '.title // .id' "$file")
  
  npx tsx scripts/encrypt-entry.ts \
    --type "$TYPE" \
    --date "$DATE" \
    --title "$TITLE" \
    --input "$file" \
    --manifest "$FIXTURE_DIR/manifest.json" \
    --output "$FIXTURE_DIR" || {
      echo "❌ Encryption failed for $file"
      exit 1
    }
done

echo "✅ Generated fixtures in $FIXTURE_DIR"
ls -lh "$FIXTURE_DIR"
