$ErrorActionPreference = 'Stop'

$root = (Resolve-Path "$PSScriptRoot/../../").Path

$defaultDbUrl = 'postgresql://app:app@localhost:5432/app'

Write-Host "=== DEBUG ===" -ForegroundColor Magenta
Write-Host "defaultDbUrl value: '$defaultDbUrl'"
Write-Host "defaultDbUrl length: $($defaultDbUrl.Length)"
Write-Host ""

Write-Host "=== BEFORE SET ===" -ForegroundColor DarkYellow
Write-Host "DATABASE_URL_CORE (raw):     '$($env:DATABASE_URL_CORE)'" 
Write-Host "DATABASE_URL_PRODUCTS (raw): '$($env:DATABASE_URL_PRODUCTS)'"
Write-Host "DATABASE_URL_ACCOUNTS (raw): '$($env:DATABASE_URL_ACCOUNTS)'"
Write-Host ""

Remove-Item Env:\DATABASE_URL_CORE -ErrorAction SilentlyContinue
Remove-Item Env:\DATABASE_URL_PRODUCTS -ErrorAction SilentlyContinue
Remove-Item Env:\DATABASE_URL_ACCOUNTS -ErrorAction SilentlyContinue

$coreUrl = $defaultDbUrl + '?schema=core'
$productsUrl = $defaultDbUrl + '?schema=products'
$accountsUrl = $defaultDbUrl + '?schema=accounts'

$env:DATABASE_URL_CORE     = $coreUrl
$env:DATABASE_URL_PRODUCTS = $productsUrl
$env:DATABASE_URL_ACCOUNTS = $accountsUrl

Write-Host "=== AFTER SET ===" -ForegroundColor DarkGreen
Write-Host "DATABASE_URL_CORE:     '$env:DATABASE_URL_CORE'"
Write-Host "DATABASE_URL_PRODUCTS: '$env:DATABASE_URL_PRODUCTS'"
Write-Host "DATABASE_URL_ACCOUNTS: '$env:DATABASE_URL_ACCOUNTS'"
Write-Host ""

$schemas = @(
  @{ Path = 'libs/core/src/providers/prisma/schema.prisma';          Name = 'core';     EnvVar = 'DATABASE_URL_CORE' },
  @{ Path = 'libs/products/src/infrastructure/prisma/schema.prisma'; Name = 'products'; EnvVar = 'DATABASE_URL_PRODUCTS' },
  @{ Path = 'libs/accounts/src/infrastructure/prisma/schema.prisma'; Name = 'accounts'; EnvVar = 'DATABASE_URL_ACCOUNTS' }
)

function Invoke-PrismaMigrate {
  param (
    [string] $SchemaPath,
    [string] $Name,
    [string] $EnvVarName,
    [string] $DbUrl
  )

  $fullPath = Resolve-Path -LiteralPath (Join-Path $root $SchemaPath)
  $migrationsPath = Join-Path (Split-Path $fullPath -Parent) "migrations"

  Write-Host ""
  Write-Host "=== Migrating '$Name' schema ===" -ForegroundColor Cyan
  Write-Host "Schema path: $fullPath"
  Write-Host "Using environment variable: $EnvVarName = '$DbUrl'" -ForegroundColor Gray

  Set-Item -Path "Env:$EnvVarName" -Value $DbUrl
  
  $verifyValue = (Get-Item "Env:$EnvVarName" -ErrorAction SilentlyContinue).Value
  if ($verifyValue -ne $DbUrl) {
    throw "Failed to set environment variable '$EnvVarName'. Expected '$DbUrl', got '$verifyValue'"
  }

  if (-not (Test-Path $migrationsPath)) {
    Write-Host "No migrations found. Creating initial migration..." -ForegroundColor Yellow
    
    Set-Item -Path "Env:$EnvVarName" -Value $DbUrl
    & npx prisma migrate dev --name init --schema "$fullPath" --create-only
    
    if ($LASTEXITCODE -ne 0) {
      throw "Prisma migrate dev failed for '$Name' (exit code: $LASTEXITCODE)"
    }
  }

  Set-Item -Path "Env:$EnvVarName" -Value $DbUrl
  & npx prisma migrate deploy --schema "$fullPath"

  if ($LASTEXITCODE -ne 0) {
    throw "Prisma migrate deploy failed for '$Name' (exit code: $LASTEXITCODE)"
  }
  
  Write-Host "✅ Migration completed for '$Name'" -ForegroundColor Green
}

try {
  Push-Location -LiteralPath $root

  Write-Host "Working directory: $root" -ForegroundColor Yellow

  foreach ($schema in $schemas) {
    $dbUrl = switch ($schema.EnvVar) {
      'DATABASE_URL_CORE'     { $coreUrl }
      'DATABASE_URL_PRODUCTS' { $productsUrl }
      'DATABASE_URL_ACCOUNTS' { $accountsUrl }
      default { throw "Unknown environment variable: $($schema.EnvVar)" }
    }
    
    Invoke-PrismaMigrate -SchemaPath $schema.Path -Name $schema.Name -EnvVarName $schema.EnvVar -DbUrl $dbUrl
  }

  Write-Host ""
  Write-Host "✅ All modules migrated successfully." -ForegroundColor Green
}
catch {
  Write-Host ""
  Write-Error "❌ Migration failed: $($_.Exception.Message)"
  Write-Host ""
}
finally {
  Pop-Location
  Read-Host "Press ENTER to exit"
}
