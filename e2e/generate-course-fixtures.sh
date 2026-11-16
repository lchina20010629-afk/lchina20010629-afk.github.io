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
  "title": "2024-03-15 Course",
  "content": "{\"id\":\"course-2024-03-15\",\"date\":\"2024-03-15\",\"courses\":[{\"name\":\"English\",\"targetMinutes\":10,\"actualMinutes\":10,\"completed\":true,\"materials\":[\"Cambridge Grammar Book\",\"BBC Learning English\"],\"exercises\":[\"Past tense exercises\",\"Vocabulary quiz\"],\"reflection\":\"Made good progress on past tenses today\"},{\"name\":\"Thai\",\"targetMinutes\":8,\"actualMinutes\":0,\"completed\":false},{\"name\":\"修身养性\",\"targetMinutes\":6,\"actualMinutes\":0,\"completed\":false},{\"name\":\"生财有道案例\",\"targetMinutes\":6,\"actualMinutes\":0,\"completed\":false}],\"totalMinutes\":10}"
}
EOF

# Course 2: 2024-03-16 - All completed
cat > "$FIXTURE_DIR/course2.json" << 'EOF'
{
  "title": "2024-03-16 Course",
  "content": "{\"id\":\"course-2024-03-16\",\"date\":\"2024-03-16\",\"courses\":[{\"name\":\"English\",\"targetMinutes\":10,\"actualMinutes\":10,\"completed\":true,\"materials\":[\"TED Talk: The power of words\"],\"reflection\":\"Learned new idioms\"},{\"name\":\"Thai\",\"targetMinutes\":8,\"actualMinutes\":8,\"completed\":true,\"materials\":[\"Thai script practice\"],\"reflection\":\"Practiced consonants\"},{\"name\":\"修身养性\",\"targetMinutes\":6,\"actualMinutes\":6,\"completed\":true,\"materials\":[\"道德经 第一章\"],\"reflection\":\"Reflected on simplicity\"},{\"name\":\"生财有道案例\",\"targetMinutes\":6,\"actualMinutes\":6,\"completed\":true,\"materials\":[\"Tesla vertical integration case\"],\"reflection\":\"Supply chain strategy insights\"}],\"totalMinutes\":30}"
}
EOF

# Weekly review
cat > "$FIXTURE_DIR/weekly.json" << 'EOF'
{
  "title": "第11周总结",
  "content": "本周完成了两天的学习任务，英语和泰语有明显进步。需要加强修身养性的持续性。"
}
EOF

# Monthly review
cat > "$FIXTURE_DIR/monthly.json" << 'EOF'
{
  "title": "三月总结",
  "content": "三月份建立了四列学习法的框架，开始践行每日学习。语言学习有明显收获，商业思维开始启蒙。"
}
EOF

# Yearly review
cat > "$FIXTURE_DIR/yearly.json" << 'EOF'
{
  "title": "2024年度总结",
  "content": "2024年是个人成长系统化的一年。建立了四列学习法，养成了每日复盘的习惯，语言能力和商业思维都有显著提升。"
}
EOF

echo "📦 Encrypting fixtures..."

# Encrypt all fixtures
export VAULT_PASSWORD="$PASSWORD"

# Courses
npx tsx scripts/encrypt-entry.ts \
  --type "course" \
  --date "2024-03-15" \
  --input "$FIXTURE_DIR/course1.json" \
  --manifest "$FIXTURE_DIR/manifest.json" \
  --output "$FIXTURE_DIR" || {
    echo "❌ Encryption failed for course 2024-03-15"
    exit 1
  }

npx tsx scripts/encrypt-entry.ts \
  --type "course" \
  --date "2024-03-16" \
  --input "$FIXTURE_DIR/course2.json" \
  --manifest "$FIXTURE_DIR/manifest.json" \
  --output "$FIXTURE_DIR" || {
    echo "❌ Encryption failed for course 2024-03-16"
    exit 1
  }

# Reviews
npx tsx scripts/encrypt-entry.ts \
  --type "weekly" \
  --period "2024-W11" \
  --input "$FIXTURE_DIR/weekly.json" \
  --manifest "$FIXTURE_DIR/manifest.json" \
  --output "$FIXTURE_DIR" || {
    echo "❌ Encryption failed for weekly review"
    exit 1
  }

npx tsx scripts/encrypt-entry.ts \
  --type "monthly" \
  --period "2024-03" \
  --input "$FIXTURE_DIR/monthly.json" \
  --manifest "$FIXTURE_DIR/manifest.json" \
  --output "$FIXTURE_DIR" || {
    echo "❌ Encryption failed for monthly review"
    exit 1
  }

npx tsx scripts/encrypt-entry.ts \
  --type "yearly" \
  --period "2024" \
  --input "$FIXTURE_DIR/yearly.json" \
  --manifest "$FIXTURE_DIR/manifest.json" \
  --output "$FIXTURE_DIR" || {
    echo "❌ Encryption failed for yearly review"
    exit 1
  }

echo "✅ Generated fixtures in $FIXTURE_DIR"
ls -lh "$FIXTURE_DIR"
