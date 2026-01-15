#!/bin/bash

# FinalCut AWS Server Setup Script
# This script automates the initial server setup for AWS EC2 instances
# Compatible with Ubuntu 22.04 LTS

set -e  # Exit on any error

echo "============================================"
echo "FinalCut AWS Server Setup Script"
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
echo "8. Install AWS CLI"
echo "9. Install CloudWatch agent"
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
if id "finalcut" &>/dev/null; then
    echo "✓ User 'finalcut' already exists"
else
    adduser --disabled-password --gecos "" finalcut
    usermod -aG sudo finalcut
    
    # Copy SSH keys if they exist
    if [ -d "/home/ubuntu/.ssh" ]; then
        mkdir -p /home/finalcut/.ssh
        cp /home/ubuntu/.ssh/authorized_keys /home/finalcut/.ssh/ 2>/dev/null || true
        chown -R finalcut:finalcut /home/finalcut/.ssh
        chmod 700 /home/finalcut/.ssh
        chmod 600 /home/finalcut/.ssh/authorized_keys 2>/dev/null || true
        echo "✓ SSH keys copied to finalcut user"
    fi
    
    echo "✓ User 'finalcut' created"
fi

echo ""
echo "Step 8/9: Installing AWS CLI..."
if command -v aws &> /dev/null; then
    echo "✓ AWS CLI already installed"
else
    apt-get install -y unzip
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
    unzip -q awscliv2.zip
    ./aws/install
    rm -rf aws awscliv2.zip
    echo "✓ AWS CLI installed"
fi

echo ""
echo "Step 9/9: Installing CloudWatch agent..."
if [ -f "/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl" ]; then
    echo "✓ CloudWatch agent already installed"
else
    wget -q https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
    dpkg -i amazon-cloudwatch-agent.deb
    rm amazon-cloudwatch-agent.deb
    echo "✓ CloudWatch agent installed (needs configuration)"
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
echo "10. Configure Nginx (see DEPLOYMENT-AWS.md)"
echo "11. Set up DNS and SSL certificate"
echo ""
echo "For detailed instructions, see:"
echo "https://github.com/yishengjiang99/pages/blob/main/finalcut/DEPLOYMENT-AWS.md"
echo ""
echo "AWS-specific tips:"
echo "- Consider attaching an IAM role to this EC2 instance"
echo "- Review Security Group rules in AWS Console"
echo "- Set up CloudWatch alarms for monitoring"
echo "- Enable automated backups (EBS snapshots)"
echo ""
