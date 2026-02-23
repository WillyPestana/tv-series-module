#!/usr/bin/env bash
set -euo pipefail

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is required to seed the database." >&2
  exit 1
fi

pushd apps/api > /dev/null
npx prisma db push
popd > /dev/null

printf '\n==> Database schema applied\n'
