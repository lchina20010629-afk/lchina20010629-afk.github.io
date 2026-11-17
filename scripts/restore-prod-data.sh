#!/bin/bash
# Restore production data after testing

set -e

echo "🔄 Restoring production data..."

if [ -d "public/data.prod.backup" ]; then
  rm -rf public/data
  mv public/data.prod.backup public/data
  echo "✅ Production data restored!"
else
  echo "⚠️  No backup found. Production data may already be in place."
fi
