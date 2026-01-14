# FinalCut Deployment Documentation Index

This directory contains comprehensive documentation and scripts for deploying the FinalCut video editor application to DigitalOcean with DNS configuration on GoDaddy.

## 📚 Documentation Files

### Getting Started

1. **[DEPLOYMENT-CHECKLIST.md](./DEPLOYMENT-CHECKLIST.md)** ⭐ **START HERE**
   - Step-by-step checklist for your deployment
   - Track your progress through the deployment process
   - Printable format for offline reference

2. **[DEPLOYMENT.md](./DEPLOYMENT.md)** 📖 **MAIN GUIDE**
   - Complete deployment guide (14,000+ words)
   - Detailed instructions for every step
   - Prerequisites, setup, and configuration
   - DNS and SSL certificate setup
   - Security and optimization tips

### Reference Guides

3. **[QUICK-REFERENCE.md](./QUICK-REFERENCE.md)** ⚡ **QUICK COMMANDS**
   - Quick reference for common tasks
   - Command cheatsheet
   - Useful for day-to-day operations
   - Bookmark this for regular use

4. **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** 🔧 **PROBLEM SOLVING**
   - Common issues and solutions
   - Diagnostic steps for problems
   - Error message explanations
   - Performance optimization tips

## 🛠 Scripts and Configuration Files

### Deployment Scripts

5. **[setup-server.sh](./setup-server.sh)** 🚀 **INITIAL SETUP**
   - Automated server setup script
   - Installs Node.js, Nginx, PM2
   - Configures firewall and user accounts
   - Run once on new droplet
   ```bash
   chmod +x setup-server.sh
   sudo ./setup-server.sh
   ```

6. **[deploy.sh](./deploy.sh)** 🔄 **UPDATE DEPLOYMENT**
   - Automated deployment script
   - Updates application code
   - Builds and restarts application
   - Use for subsequent deployments
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

### Configuration Files

7. **[nginx.conf](./nginx.conf)** 🌐 **WEB SERVER CONFIG**
   - Nginx reverse proxy configuration
   - Serves static files and proxies API
   - CORS headers for FFmpeg WebAssembly
   - SSL-ready configuration

8. **[finalcut.service](./finalcut.service)** ⚙️ **SYSTEMD SERVICE**
   - SystemD service file (alternative to PM2)
   - Process management at OS level
   - Auto-restart on failure

9. **[.env.production](./.env.production)** 🔐 **ENVIRONMENT TEMPLATE**
   - Production environment variables template
   - Security guidelines
   - Configuration checklist

10. **[.github/workflows/deploy-finalcut.yml](../.github/workflows/deploy-finalcut.yml)** 🤖 **CI/CD WORKFLOW**
    - GitHub Actions workflow for automated deployment
    - Optional continuous deployment
    - Triggers on push to main branch

## 🎯 Quick Start Guide

### For First-Time Deployment

1. **Review Prerequisites**
   ```bash
   - DigitalOcean account
   - GoDaddy domain
   - xAI API token
   - SSH keys configured
   ```

2. **Follow the Checklist**
   - Open [DEPLOYMENT-CHECKLIST.md](./DEPLOYMENT-CHECKLIST.md)
   - Check off items as you complete them
   - Refer to [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions

3. **Use Automated Setup**
   ```bash
   # On your DigitalOcean droplet
   wget https://raw.githubusercontent.com/yishengjiang99/pages/main/finalcut/setup-server.sh
   chmod +x setup-server.sh
   sudo ./setup-server.sh
   ```

4. **Configure and Deploy**
   - Follow the post-setup instructions
   - Configure environment variables
   - Build and start the application

### For Updates

```bash
# SSH into your server
ssh finalcut@your-droplet-ip

# Navigate to app directory
cd /home/finalcut/apps/pages/finalcut

# Run deployment script
./deploy.sh
```

## 📋 Deployment Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Internet                          │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│              GoDaddy DNS                             │
│   yourdomain.com → YOUR_DROPLET_IP                  │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│          DigitalOcean Droplet                       │
│  ┌───────────────────────────────────────────────┐ │
│  │            Nginx (Port 80/443)                │ │
│  │  - SSL/TLS Termination                        │ │
│  │  - Static File Serving                        │ │
│  │  - Reverse Proxy                              │ │
│  └───────────────────────────────────────────────┘ │
│                      │                               │
│                      ├─── /dist/* → Static Files     │
│                      │                               │
│                      └─── /api/* → Proxy to:         │
│                                                       │
│  ┌───────────────────────────────────────────────┐ │
│  │       Node.js + Express (Port 3001)           │ │
│  │  - PM2 Process Manager                        │ │
│  │  - API Endpoints                              │ │
│  │  - xAI API Proxy                              │ │
│  └───────────────────────────────────────────────┘ │
│                      │                               │
│                      ▼                               │
│               xAI Grok API                           │
└─────────────────────────────────────────────────────┘

Frontend:
- React 18 + Vite
- FFmpeg WebAssembly
- Built to /dist directory
- Served by Nginx

Backend:
- Node.js + Express
- Managed by PM2
- Proxies xAI API requests
- Handles CORS
```

## 🔑 Key Components

### Technology Stack

- **Frontend**: React 18, Vite, FFmpeg.wasm
- **Backend**: Node.js 18+, Express
- **Web Server**: Nginx
- **Process Manager**: PM2 (or SystemD)
- **SSL**: Let's Encrypt (Certbot)
- **DNS**: GoDaddy
- **Hosting**: DigitalOcean

### File Structure

```
finalcut/
├── DEPLOYMENT.md              # Main deployment guide
├── DEPLOYMENT-CHECKLIST.md    # Step-by-step checklist
├── QUICK-REFERENCE.md         # Command reference
├── TROUBLESHOOTING.md         # Problem solving guide
├── deploy.sh                  # Deployment script
├── setup-server.sh            # Server setup script
├── nginx.conf                 # Nginx configuration
├── finalcut.service           # SystemD service file
├── .env.production            # Environment template
├── README.md                  # Project documentation
├── package.json               # Dependencies
├── server.js                  # Express server
├── src/                       # React source code
└── dist/                      # Built files (generated)
```

## 💡 Usage Scenarios

### Scenario 1: New Deployment
1. Start with [DEPLOYMENT-CHECKLIST.md](./DEPLOYMENT-CHECKLIST.md)
2. Run `setup-server.sh` on new droplet
3. Follow checklist to complete deployment

### Scenario 2: Code Update
1. Push code to GitHub
2. SSH into server
3. Run `./deploy.sh`

### Scenario 3: Troubleshooting
1. Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
2. Review logs with commands in [QUICK-REFERENCE.md](./QUICK-REFERENCE.md)
3. Use diagnostic commands from guides

### Scenario 4: DNS/SSL Issues
1. Refer to DNS section in [DEPLOYMENT.md](./DEPLOYMENT.md)
2. Check DNS propagation tools
3. Follow SSL setup steps

## 🔒 Security Checklist

Before going live, ensure:

- [ ] `.env` file is not committed to Git
- [ ] UFW firewall is enabled and configured
- [ ] SSH key authentication is set up
- [ ] SSL certificate is installed and valid
- [ ] ALLOWED_ORIGINS is set to your domain only
- [ ] File permissions are correct (`.env` should be 600)
- [ ] Server packages are up to date
- [ ] Regular backups are configured

## 📊 Monitoring

After deployment, monitor:

- **Application**: `pm2 monit`
- **Logs**: `pm2 logs finalcut-server`
- **Server Resources**: `htop`
- **Disk Space**: `df -h`
- **SSL Certificate**: `sudo certbot certificates`

## 🆘 Getting Help

### Documentation Order

1. **Quick issue?** → [QUICK-REFERENCE.md](./QUICK-REFERENCE.md)
2. **Problem?** → [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
3. **New deployment?** → [DEPLOYMENT-CHECKLIST.md](./DEPLOYMENT-CHECKLIST.md)
4. **Detailed info?** → [DEPLOYMENT.md](./DEPLOYMENT.md)

### External Resources

- **GitHub Issues**: https://github.com/yishengjiang99/pages/issues
- **DigitalOcean Docs**: https://docs.digitalocean.com/
- **Nginx Docs**: https://nginx.org/en/docs/
- **PM2 Docs**: https://pm2.keymetrics.io/docs/

## 🎓 Learning Path

### Beginner
1. Read [DEPLOYMENT-CHECKLIST.md](./DEPLOYMENT-CHECKLIST.md)
2. Follow checklist step-by-step
3. Use automated scripts
4. Bookmark [QUICK-REFERENCE.md](./QUICK-REFERENCE.md)

### Intermediate
1. Study [DEPLOYMENT.md](./DEPLOYMENT.md) in detail
2. Understand Nginx configuration
3. Learn PM2 commands
4. Set up monitoring

### Advanced
1. Customize Nginx configuration
2. Set up CI/CD with GitHub Actions
3. Implement load balancing
4. Add caching layers
5. Optimize performance

## 📝 Notes

- All scripts are tested on Ubuntu 22.04 LTS
- Node.js 18+ required
- Minimum 1GB RAM recommended (2GB preferred)
- DNS propagation can take 1-48 hours
- SSL certificate renews automatically

## 🚀 Deployment Status

Track your deployment:

- [ ] Documentation reviewed
- [ ] Server set up
- [ ] Application deployed
- [ ] DNS configured
- [ ] SSL installed
- [ ] Testing completed
- [ ] Production ready

---

**Ready to deploy?** Start with [DEPLOYMENT-CHECKLIST.md](./DEPLOYMENT-CHECKLIST.md)! 🎉
