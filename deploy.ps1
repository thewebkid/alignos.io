# AlignOS Simple Deployment Script
# Deploys the application on port 80 (Caddy handles SSL termination and proxying)
# Run this after any manual changes or to redeploy fresh

param(
    [string]$Branch = "main"
)

$appPath = "C:\inetpub\alignos"
$repoUrl = "https://github.com/thewebkid/alignos.git"

# Store starting directory to return to later
$startingDir = Get-Location

# Pull latest code in the current development directory (if in a git repo)
Write-Host "=== Pulling Latest Code in Development Directory ===" -ForegroundColor Cyan
if (Test-Path ".git") {
    git stash
    git pull origin $Branch
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to pull in development directory" -ForegroundColor Red
        Set-Location $startingDir
        exit 1
    }
    Write-Host "Development directory updated" -ForegroundColor Green
} else {
    Write-Host "WARNING: Not in a git repository. Skipping development pull." -ForegroundColor Yellow
}
Write-Host ""

# Clone or update the production repository
Write-Host "=== Updating Production Repository ===" -ForegroundColor Cyan
if (!(Test-Path "$appPath\.git")) {
    Write-Host "Cloning repository..." -ForegroundColor Green
    if (Test-Path $appPath) {
        Remove-Item -Path $appPath -Recurse -Force
    }
    git clone $repoUrl $appPath
    Set-Location $appPath
    git checkout $Branch
} else {
    Write-Host "Updating existing repository..." -ForegroundColor Green
    Set-Location $appPath
    git stash
    git checkout $Branch
    git pull origin $Branch
}

Write-Host "Repository updated" -ForegroundColor Green

# Install dependencies
Write-Host ""
Write-Host "Installing server dependencies (production)..." -ForegroundColor Green
Set-Location "$appPath\server"
npm install --production

Write-Host ""
Write-Host "Installing & building client..." -ForegroundColor Green
Set-Location "$appPath\client"
npm install
npm run build

# Deploy on port 80 (Caddy handles SSL)
Set-Location "$appPath\server"

Write-Host ""
Write-Host "Stopping any existing AlignOS instances..." -ForegroundColor Yellow
pm2 delete alignos 2>$null
pm2 delete alignos-80 2>$null
pm2 delete alignos-443 2>$null

Write-Host ""
Write-Host "Starting AlignOS on port 80..." -ForegroundColor Green
$envContent = "PORT=8888`nMONGODB_URI=mongodb://localhost:27017/alignos`nNODE_ENV=production"
[System.IO.File]::WriteAllText("$appPath\server\.env", $envContent)
pm2 start index.js --name alignos

pm2 save

Write-Host ""
Write-Host "=== Deployment Complete! ===" -ForegroundColor Green
Write-Host ""
Write-Host "=== Application Status ===" -ForegroundColor Cyan
pm2 status

Write-Host ""
Write-Host "=== Access URLs ===" -ForegroundColor Cyan
Write-Host "  HTTPS: https://alignos.cosmiccreation.net" -ForegroundColor Green
Write-Host "  HTTP:  http://alignos.cosmiccreation.net" -ForegroundColor Green
Write-Host ""
Write-Host "Note: Caddy handles SSL termination and proxies to Express on port 80" -ForegroundColor Yellow

# Return to starting directory
Set-Location $startingDir
Write-Host ""
Write-Host "Returned to starting directory: $startingDir" -ForegroundColor Cyan
