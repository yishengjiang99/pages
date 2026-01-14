#!/bin/bash

###############################################################################
# FinalCut Server Setup Script
#
# This script automates the initial setup of a DigitalOcean droplet or
# any Ubuntu/Debian server for hosting the FinalCut application.
#
# Usage: 
#   wget https://raw.githubusercontent.com/yishengjiang99/pages/main/finalcut/setup-server.sh
#   chmod +x setup-server.sh
#   sudo ./setup-server.sh
#
# What this script does:
# - Updates system packages
# - Installs Node.js 18 LTS
# - Installs Nginx
# - Installs PM2
# - Configures firewall
# - Creates application user
# - Sets up directory structure
#
# Prerequisites:
# - Ubuntu 22.04 LTS or Debian 11/12
# - Root or sudo access
# - Internet connection
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_USER="finalcut"
APP_DIR="/home/$APP_USER/apps"
NODE_VERSION="18"

###############################################################################
# Helper Functions
###############################################################################

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

check_root() {
    if [ "$EUID" -ne 0 ]; then
        log_error "This script must be run as root or with sudo"
        exit 1
    fi
}

check_os() {
    log_step "Checking operating system..."
    
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$NAME
        VER=$VERSION_ID
        log_info "Detected OS: $OS $VER"
        
        if [[ "$ID" != "ubuntu" && "$ID" != "debian" ]]; then
            log_warn "This script is designed for Ubuntu/Debian. It may not work on $OS."
            read -p "Do you want to continue anyway? (y/N) " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                exit 1
            fi
        fi
    else
        log_error "Cannot detect operating system"
        exit 1
    fi
}

update_system() {
    log_step "Updating system packages..."
    
    apt update
    apt upgrade -y
    
    log_info "System packages updated"
}

install_dependencies() {
    log_step "Installing basic dependencies..."
    
    apt install -y \
        curl \
        wget \
        git \
        build-essential \
        ufw \
        software-properties-common
    
    log_info "Basic dependencies installed"
}

install_nodejs() {
    log_step "Installing Node.js $NODE_VERSION..."
    
    # Check if Node.js is already installed
    if command -v node &> /dev/null; then
        CURRENT_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$CURRENT_VERSION" -ge "$NODE_VERSION" ]; then
            log_info "Node.js $CURRENT_VERSION is already installed"
            return
        fi
    fi
    
    # Install Node.js from NodeSource
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
    apt install -y nodejs
    
    # Verify installation
    log_info "Node.js version: $(node -v)"
    log_info "npm version: $(npm -v)"
}

install_nginx() {
    log_step "Installing Nginx..."
    
    if command -v nginx &> /dev/null; then
        log_info "Nginx is already installed"
        return
    fi
    
    apt install -y nginx
    
    # Start and enable Nginx
    systemctl start nginx
    systemctl enable nginx
    
    log_info "Nginx installed and started"
}

install_pm2() {
    log_step "Installing PM2..."
    
    if command -v pm2 &> /dev/null; then
        log_info "PM2 is already installed"
        return
    fi
    
    npm install -g pm2
    
    log_info "PM2 installed globally"
}

create_app_user() {
    log_step "Creating application user..."
    
    # Check if user already exists
    if id "$APP_USER" &>/dev/null; then
        log_info "User $APP_USER already exists"
        return
    fi
    
    # Create user without password prompt
    adduser --disabled-password --gecos "" $APP_USER
    
    # Add user to sudo group (optional)
    usermod -aG sudo $APP_USER
    
    log_info "User $APP_USER created"
}

setup_directories() {
    log_step "Setting up directory structure..."
    
    # Create app directory
    mkdir -p $APP_DIR
    chown -R $APP_USER:$APP_USER $APP_DIR
    
    log_info "Directory structure created"
}

configure_firewall() {
    log_step "Configuring firewall..."
    
    # Allow SSH
    ufw allow OpenSSH
    
    # Allow HTTP and HTTPS
    ufw allow 'Nginx Full'
    
    # Enable firewall (will prompt for confirmation)
    echo "y" | ufw enable
    
    log_info "Firewall configured and enabled"
    ufw status
}

setup_pm2_startup() {
    log_step "Configuring PM2 startup..."
    
    # Configure PM2 to start on boot
    env PATH=$PATH:/usr/bin pm2 startup systemd -u $APP_USER --hp /home/$APP_USER
    
    log_info "PM2 startup configured"
}

display_next_steps() {
    echo ""
    echo "========================================"
    log_info "Server setup completed successfully! 🎉"
    echo "========================================"
    echo ""
    echo "Next steps:"
    echo ""
    echo "1. Switch to the application user:"
    echo "   sudo su - $APP_USER"
    echo ""
    echo "2. Clone the repository:"
    echo "   cd $APP_DIR"
    echo "   git clone https://github.com/yishengjiang99/pages.git"
    echo "   cd pages/finalcut"
    echo ""
    echo "3. Configure environment variables:"
    echo "   cp .env.example .env"
    echo "   nano .env"
    echo ""
    echo "4. Install dependencies and build:"
    echo "   npm install"
    echo "   npm run build"
    echo ""
    echo "5. Start the application:"
    echo "   pm2 start server.js --name finalcut-server"
    echo "   pm2 save"
    echo ""
    echo "6. Configure Nginx:"
    echo "   sudo cp nginx.conf /etc/nginx/sites-available/finalcut"
    echo "   sudo nano /etc/nginx/sites-available/finalcut  # Update domain"
    echo "   sudo ln -s /etc/nginx/sites-available/finalcut /etc/nginx/sites-enabled/"
    echo "   sudo nginx -t"
    echo "   sudo systemctl reload nginx"
    echo ""
    echo "7. Set up SSL with Let's Encrypt:"
    echo "   sudo apt install certbot python3-certbot-nginx -y"
    echo "   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com"
    echo ""
    echo "For detailed instructions, see:"
    echo "  $APP_DIR/pages/finalcut/DEPLOYMENT.md"
    echo ""
}

###############################################################################
# Main Setup Process
###############################################################################

main() {
    echo ""
    echo "========================================"
    echo "  FinalCut Server Setup Script"
    echo "========================================"
    echo ""
    
    check_root
    check_os
    
    echo ""
    log_warn "This script will install Node.js, Nginx, PM2, and configure your server."
    read -p "Do you want to continue? (y/N) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Setup cancelled"
        exit 0
    fi
    echo ""
    
    # Run setup steps
    update_system
    install_dependencies
    install_nodejs
    install_nginx
    install_pm2
    create_app_user
    setup_directories
    configure_firewall
    setup_pm2_startup
    
    display_next_steps
}

# Run main function
main "$@"
