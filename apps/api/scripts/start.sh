#!/usr/bin/env sh
set -e

cd /app/apps/api

if [ -n "${DATABASE_URL:-}" ]; then
  npx prisma db push --schema prisma/schema.prisma --skip-generate
fi

node dist/index.js
