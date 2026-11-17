#!/bin/bash
# Restore production data after testing

set -e

echo "🔄 Restoring production data..."

if [ -d "public/data.test.backup" ]; then
  rm -rf public/data
  mv public/data.test.backup public/data
  echo "✅ Production data restored from backup!"
elif [ -d ".git" ]; then
  echo "📥 Restoring from git..."
  git checkout -- public/data/
  echo "✅ Production data restored from git!"
else
  echo "⚠️  No backup found and not in git repo. Production data may be lost."
  exit 1
fi
