# AlignOS Staging Deployment Guide

This guide explains how to deploy the AlignOS application to your staging server.

## Prerequisites

- Windows staging server (tested on Windows 10/11/Server)
- Administrator access to the staging server
- Network access to the staging server (e.g., `192.168.50.209`)
- Remote Desktop Connection enabled

## Repository

- **GitHub Repository**: https://github.com/thewebkid/alignos.git
- **Branch**: main

## Deployment Steps

### Step 1: Initial Setup (One-time)

RDP into your staging server and run the setup script as Administrator:

```powershell
# Download the setup script from the repository
# Or copy setup-staging.ps1 to the staging server

# Run as Administrator
.\setup-staging.ps1
```

This script will install:
- ✓ Chocolatey package manager
- ✓ Node.js LTS (with npm)
- ✓ Git
- ✓ MongoDB Community Edition
- ✓ PM2 (Node.js process manager)
- ✓ PM2 Windows service support

**Installation time**: ~10-15 minutes depending on internet speed

### Step 2: Deploy Application

After the initial setup is complete, run the deployment script:

```powershell
# Run from any directory
.\deploy-to-staging.ps1
```

This script will:
1. Clone the repository (first time) or pull latest changes
2. Install server dependencies
3. Install client dependencies
4. Build the Vue.js frontend
5. Create `.env` configuration file (if needed)
6. Start/restart the application with PM2

### Step 3: Access the Application

Once deployed, the application will be available at:

```
http://192.168.50.209:5000
http://localhost:5000 (from the staging server)
```

## Configuration

### Environment Variables

The deployment script creates a `.env` file in the `server` directory:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/alignos
NODE_ENV=production
```

Edit `C:\inetpub\alignos\server\.env` to customize these settings.

### MongoDB

MongoDB is installed and configured to run as a Windows service. It will start automatically on boot.

- **Data directory**: `C:\data\db`
- **Log directory**: `C:\data\log`
- **Connection string**: `mongodb://localhost:27017/alignos`

## PM2 Process Management

The application runs as a PM2-managed process named `alignos`.

### Useful Commands

```powershell
# View application status
pm2 status

# View logs (live tail)
pm2 logs alignos

# Restart application
pm2 restart alignos

# Stop application
pm2 stop alignos

# Start application
pm2 start alignos

# Real-time monitoring
pm2 monit

# View detailed info
pm2 show alignos
```

### Application Management

PM2 is configured to:
- ✓ Auto-restart on crashes
- ✓ Watch for file changes (in development mode)
- ✓ Start on system boot
- ✓ Maintain process logs

## Updating the Application

To deploy updates:

1. Push your changes to GitHub:
   ```bash
   git add .
   git commit -m "Your changes"
   git push origin main
   ```

2. On the staging server, run the deployment script:
   ```powershell
   .\deploy-to-staging.ps1
   ```

The script will automatically:
- Pull the latest code
- Reinstall dependencies (if package.json changed)
- Rebuild the frontend
- Restart the application

## Troubleshooting

### Check Application Logs

```powershell
pm2 logs alignos --lines 100
```

### Check MongoDB Service

```powershell
Get-Service MongoDB
```

If MongoDB is not running:
```powershell
Start-Service MongoDB
```

### Check Port Availability

```powershell
netstat -ano | findstr :5000
```

### Restart Everything

```powershell
pm2 restart alignos
Restart-Service MongoDB
```

### Clean Install

If something goes wrong, you can remove and redeploy:

```powershell
pm2 delete alignos
Remove-Item -Path C:\inetpub\alignos -Recurse -Force
.\deploy-to-staging.ps1
```

## Application Structure

```
C:\inetpub\alignos\
├── client\                 # Vue.js frontend
│   ├── dist\              # Built frontend (served by Express)
│   ├── src\               # Source files
│   └── package.json
├── server\                 # Express backend
│   ├── index.js           # Main server file
│   ├── .env               # Environment configuration
│   └── package.json
├── setup-staging.ps1       # Initial setup script
└── deploy-to-staging.ps1   # Deployment script
```

## Security Notes

1. **Firewall**: Ensure port 5000 is open on the Windows Firewall if you need external access
2. **MongoDB**: Consider setting up authentication for production use
3. **Environment Variables**: Store sensitive data in the `.env` file (it's gitignored)
4. **HTTPS**: Consider setting up nginx or IIS with SSL for production

## Advanced: Serving on Port 80/443

For production, you may want to serve the application on standard HTTP/HTTPS ports:

### Option 1: nginx Reverse Proxy
```powershell
choco install nginx -y
```

Configure nginx to:
- Serve static files from `client/dist` on port 80
- Proxy API requests to Express on port 5000

### Option 2: IIS Reverse Proxy
Use IIS with URL Rewrite module to:
- Serve frontend files
- Proxy backend requests

## Support

For issues or questions:
- GitHub Issues: https://github.com/thewebkid/alignos/issues
- Check PM2 logs: `pm2 logs alignos`
- Check server logs in MongoDB log directory

---

Last updated: January 2, 2026
