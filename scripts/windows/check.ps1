Write-Host "==> tv-series-module checks"

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
  Write-Error "npm is required but not found."
  exit 1
}

npm ci
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npm run lint
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npm run test
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npm run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "==> Checks passed"
