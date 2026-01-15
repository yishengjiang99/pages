#!/bin/bash

# FinalCut GCP Server Setup Script
# This script automates the initial server setup for GCP Compute Engine instances
# Compatible with Ubuntu 22.04 LTS

set -e  # Exit on any error

echo "============================================"
echo "FinalCut GCP Server Setup Script"
echo "============================================"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run this script as root or with sudo"
    exit 1
fi

echo "This script will:"
echo "1. Update system packages"
echo "2. Install Node.js 18.x LTS"
echo "3. Install Nginx web server"
echo "4. Install PM2 process manager"
echo "5. Install Git"
echo "6. Configure firewall (UFW)"
echo "7. Create finalcut user account"
echo "8. Install Google Cloud SDK (gcloud)"
echo "9. Install Google Cloud Ops Agent"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Setup cancelled."
    exit 0
fi

echo ""
echo "Step 1/9: Updating system packages..."
apt update && apt upgrade -y

echo ""
echo "Step 2/9: Installing Node.js 18.x LTS..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs
node_version=$(node --version)
npm_version=$(npm --version)
echo "✓ Node.js $node_version installed"
echo "✓ npm $npm_version installed"

echo ""
echo "Step 3/9: Installing Nginx..."
apt install nginx -y
systemctl start nginx
systemctl enable nginx
echo "✓ Nginx installed and started"

echo ""
echo "Step 4/9: Installing PM2 process manager..."
npm install -g pm2
pm2_version=$(pm2 --version)
echo "✓ PM2 $pm2_version installed"

echo ""
echo "Step 5/9: Installing Git..."
apt install git -y
git_version=$(git --version)
echo "✓ $git_version installed"

echo ""
echo "Step 6/9: Configuring firewall (UFW)..."
ufw --force enable
ufw allow OpenSSH
ufw allow 'Nginx Full'
echo "✓ Firewall configured"

echo ""
echo "Step 7/9: Creating finalcut user..."
# Get the current non-root user
CURRENT_USER=$(logname 2>/dev/null || echo $SUDO_USER)

if id "finalcut" &>/dev/null; then
    echo "✓ User 'finalcut' already exists"
else
    adduser --disabled-password --gecos "" finalcut
    usermod -aG sudo finalcut
    
    # Copy SSH keys if they exist
    if [ -n "$CURRENT_USER" ] && [ -d "/home/$CURRENT_USER/.ssh" ]; then
        mkdir -p /home/finalcut/.ssh
        if [ -f "/home/$CURRENT_USER/.ssh/authorized_keys" ]; then
            cp /home/$CURRENT_USER/.ssh/authorized_keys /home/finalcut/.ssh/
            chown -R finalcut:finalcut /home/finalcut/.ssh
            chmod 700 /home/finalcut/.ssh
            chmod 600 /home/finalcut/.ssh/authorized_keys
            echo "✓ SSH keys copied to finalcut user"
        fi
    fi
    
    echo "✓ User 'finalcut' created"
fi

echo ""
echo "Step 8/9: Checking Google Cloud SDK..."
if command -v gcloud &> /dev/null; then
    echo "✓ Google Cloud SDK already installed"
else
    echo "Installing Google Cloud SDK..."
    apt-get install -y apt-transport-https ca-certificates gnupg
    echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] https://packages.cloud.google.com/apt cloud-sdk main" | tee -a /etc/apt/sources.list.d/google-cloud-sdk.list
    curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | apt-key --keyring /usr/share/keyrings/cloud.google.gpg add -
    apt-get update && apt-get install -y google-cloud-cli
    echo "✓ Google Cloud SDK installed"
fi

echo ""
echo "Step 9/9: Installing Google Cloud Ops Agent..."
if systemctl is-active --quiet google-cloud-ops-agent; then
    echo "✓ Google Cloud Ops Agent already installed and running"
else
    curl -sSO https://dl.google.com/cloudagents/add-google-cloud-ops-agent-repo.sh
    bash add-google-cloud-ops-agent-repo.sh --also-install
    rm add-google-cloud-ops-agent-repo.sh
    
    # Start and enable the agent
    systemctl start google-cloud-ops-agent
    systemctl enable google-cloud-ops-agent
    echo "✓ Google Cloud Ops Agent installed and started"
fi

echo ""
echo "============================================"
echo "✓ Server setup completed successfully!"
echo "============================================"
echo ""
echo "Next steps:"
echo "1. Switch to finalcut user: sudo su - finalcut"
echo "2. Create app directory: mkdir -p ~/apps && cd ~/apps"
echo "3. Clone repository: git clone https://github.com/yishengjiang99/pages.git"
echo "4. Navigate to finalcut: cd pages/finalcut"
echo "5. Install dependencies: npm install"
echo "6. Configure environment: cp .env.example .env && nano .env"
echo "7. Build application: npm run build"
echo "8. Start with PM2: pm2 start server.js --name finalcut-server"
echo "9. Save PM2 config: pm2 save && pm2 startup systemd"
echo "10. Configure Nginx (see DEPLOYMENT-GCP.md)"
echo "11. Set up DNS and SSL certificate"
echo ""
echo "For detailed instructions, see:"
echo "https://github.com/yishengjiang99/pages/blob/main/finalcut/DEPLOYMENT-GCP.md"
echo ""
echo "GCP-specific tips:"
echo "- Configure service accounts for proper access"
echo "- Review firewall rules in VPC network settings"
echo "- Set up Cloud Monitoring dashboards"
echo "- Enable automated snapshots for backups"
echo "- Consider using OS Login for SSH access"
echo ""
echo "View logs in Cloud Logging:"
echo "  gcloud logging read 'resource.type=gce_instance' --limit 50"
echo ""
echo "Monitor instance:"
echo "  gcloud compute instances describe [INSTANCE-NAME] --zone=[ZONE]"
echo ""
