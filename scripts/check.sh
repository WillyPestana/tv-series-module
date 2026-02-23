#!/usr/bin/env bash
set -euo pipefail

printf '\n==> tv-series-module checks\n\n'

if ! command -v npm >/dev/null 2>&1; then
  echo "npm is required but not found."
  exit 1
fi

npm ci
npm run lint
npm run test
npm run build

printf '\n==> Checks passed\n'
