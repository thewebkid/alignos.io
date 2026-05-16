# AlignOS Staging Server Setup Script
# Run this script as Administrator on your staging PC (192.168.50.209)
# This will install all required software and configure the environment

Write-Host "=== AlignOS Staging Server Setup ===" -ForegroundColor Cyan
Write-Host "This script will install: Node.js, Git, MongoDB, PM2" -ForegroundColor Yellow
Write-Host ""

# Check if running as Administrator
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "ERROR: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    exit 1
}

# Install Chocolatey if not already installed
if (!(Test-Path "$env:ProgramData\chocolatey\choco.exe")) {
    Write-Host "`nInstalling Chocolatey..." -ForegroundColor Green
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
    
    # Refresh environment variables
    $env:ChocolateyInstall = Convert-Path "$((Get-Command choco).Path)\..\.."
    Import-Module "$env:ChocolateyInstall\helpers\chocolateyProfile.psm1"
    refreshenv
} else {
    Write-Host "`nChocolatey is already installed" -ForegroundColor Green
}

Write-Host "`n=== Installing Required Software ===" -ForegroundColor Cyan

# Install Node.js LTS (includes npm)
Write-Host "`nInstalling Node.js LTS..." -ForegroundColor Green
choco install nodejs-lts -y

# Install Git
Write-Host "`nInstalling Git..." -ForegroundColor Green
choco install git -y

# Install MongoDB Community Edition
Write-Host "`nInstalling MongoDB..." -ForegroundColor Green
choco install mongodb -y

# Refresh environment to pick up new PATH entries
Write-Host "`nRefreshing environment variables..." -ForegroundColor Green
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
refreshenv

# Install PM2 globally via npm
Write-Host "`nInstalling PM2..." -ForegroundColor Green
npm install -g pm2

# Install PM2 Windows service support
Write-Host "`nInstalling PM2 Windows service support..." -ForegroundColor Green
npm install -g pm2-windows-service

Write-Host "`n=== Verifying Installations ===" -ForegroundColor Cyan
try {
    $nodeVersion = node --version
    Write-Host "✓ Node version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js not found" -ForegroundColor Red
}

try {
    $npmVersion = npm --version
    Write-Host "✓ npm version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ npm not found" -ForegroundColor Red
}

try {
    $gitVersion = git --version
    Write-Host "✓ Git version: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Git not found" -ForegroundColor Red
}

try {
    $mongoVersion = mongod --version | Select-Object -First 1
    Write-Host "✓ MongoDB version: $mongoVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ MongoDB not found" -ForegroundColor Red
}

try {
    $pm2Version = pm2 --version
    Write-Host "✓ PM2 version: $pm2Version" -ForegroundColor Green
} catch {
    Write-Host "✗ PM2 not found" -ForegroundColor Red
}

Write-Host "`n=== Creating Application Directory ===" -ForegroundColor Cyan
$appPath = "C:\inetpub\alignos"
if (!(Test-Path $appPath)) {
    New-Item -ItemType Directory -Path $appPath -Force | Out-Null
    Write-Host "✓ Created directory: $appPath" -ForegroundColor Green
} else {
    Write-Host "✓ Directory already exists: $appPath" -ForegroundColor Green
}

Write-Host "`n=== MongoDB Setup ===" -ForegroundColor Cyan
# Create MongoDB data and log directories
$mongoDataPath = "C:\data\db"
$mongoLogPath = "C:\data\log"

if (!(Test-Path $mongoDataPath)) {
    New-Item -ItemType Directory -Path $mongoDataPath -Force | Out-Null
    Write-Host "✓ Created MongoDB data directory: $mongoDataPath" -ForegroundColor Green
} else {
    Write-Host "✓ MongoDB data directory exists" -ForegroundColor Green
}

if (!(Test-Path $mongoLogPath)) {
    New-Item -ItemType Directory -Path $mongoLogPath -Force | Out-Null
    Write-Host "✓ Created MongoDB log directory: $mongoLogPath" -ForegroundColor Green
} else {
    Write-Host "✓ MongoDB log directory exists" -ForegroundColor Green
}

# Start MongoDB service
Write-Host "`nStarting MongoDB service..." -ForegroundColor Green
try {
    Start-Service MongoDB -ErrorAction Stop
    Write-Host "✓ MongoDB service started" -ForegroundColor Green
} catch {
    Write-Host "✗ Could not start MongoDB service. You may need to configure it manually." -ForegroundColor Yellow
}

# Configure PM2 startup
Write-Host "`n=== Configuring PM2 Startup ===" -ForegroundColor Cyan
try {
    pm2 startup
    Write-Host "✓ PM2 startup configured" -ForegroundColor Green
} catch {
    Write-Host "✗ Could not configure PM2 startup" -ForegroundColor Yellow
}

Write-Host "`n=== Setup Complete! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Run the deploy-to-staging.ps1 script to clone and deploy the application" -ForegroundColor White
Write-Host "2. Or manually clone: git clone https://github.com/thewebkid/alignos.git $appPath" -ForegroundColor White
Write-Host ""
Write-Host "Repository: https://github.com/thewebkid/alignos.git" -ForegroundColor Yellow
Write-Host "Install path: $appPath" -ForegroundColor Yellow
Write-Host ""
