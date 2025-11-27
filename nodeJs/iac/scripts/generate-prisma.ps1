$ErrorActionPreference = 'Stop'

$root = (Resolve-Path "$PSScriptRoot/../../").Path

$defaultDbUrl = 'postgresql://app:app@localhost:5432/app'

$coreUrl = $defaultDbUrl + '?schema=core'
$productsUrl = $defaultDbUrl + '?schema=products'
$accountsUrl = $defaultDbUrl + '?schema=accounts'

$env:DATABASE_URL_CORE     = $coreUrl
$env:DATABASE_URL_PRODUCTS = $productsUrl
$env:DATABASE_URL_ACCOUNTS = $accountsUrl

$schemas = @(
  @{ Path = 'libs/core/src/providers/prisma/schema.prisma';          Name = 'core';     EnvVar = 'DATABASE_URL_CORE' },
  @{ Path = 'libs/products/src/infrastructure/prisma/schema.prisma'; Name = 'products'; EnvVar = 'DATABASE_URL_PRODUCTS' },
  @{ Path = 'libs/accounts/src/infrastructure/prisma/schema.prisma'; Name = 'accounts'; EnvVar = 'DATABASE_URL_ACCOUNTS' }
)

function Invoke-PrismaGenerate {
  param (
    [string] $SchemaPath,
    [string] $Name,
    [string] $EnvVarName,
    [string] $DbUrl
  )

  $fullPath = Resolve-Path -LiteralPath (Join-Path $root $SchemaPath)
  Write-Host ""
  Write-Host "Generating Prisma client for $Name..." -ForegroundColor Cyan
  Write-Host "Using environment variable: $EnvVarName = '$DbUrl'" -ForegroundColor Gray

  Set-Item -Path "Env:$EnvVarName" -Value $DbUrl
  
  $verifyValue = (Get-Item "Env:$EnvVarName" -ErrorAction SilentlyContinue).Value
  if ($verifyValue -ne $DbUrl) {
    throw "Failed to set environment variable '$EnvVarName'. Expected '$DbUrl', got '$verifyValue'"
  }

  & npx prisma generate --schema $fullPath

  if ($LASTEXITCODE -ne 0) {
    throw "Prisma generate failed for '$Name' (exit code: $LASTEXITCODE)"
  }
  
  Write-Host "✅ Prisma client generated for '$Name'" -ForegroundColor Green
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
    
    Invoke-PrismaGenerate -SchemaPath $schema.Path -Name $schema.Name -EnvVarName $schema.EnvVar -DbUrl $dbUrl
  }

  Write-Host ""
  Write-Host "✅ All Prisma clients generated successfully." -ForegroundColor Green
}
catch {
  Write-Error "Client generation failed: $_"
  exit 1
}
finally {
  Pop-Location
}
