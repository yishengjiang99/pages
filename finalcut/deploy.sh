#!/bin/bash

###############################################################################
# FinalCut Deployment Script
# 
# This script automates the deployment process for the FinalCut application
# on DigitalOcean or any Linux server with Node.js, PM2, and Nginx installed.
#
# Usage: ./deploy.sh
#
# Prerequisites:
# - Node.js 18+ installed
# - PM2 installed globally
# - Nginx configured
# - Git repository cloned
# - .env file configured
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="finalcut-server"
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="/tmp/finalcut-backups"

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

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed. Please install Node.js 18 or higher."
        exit 1
    fi
    
    # Check Node.js version
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        log_error "Node.js version must be 18 or higher. Current version: $(node -v)"
        exit 1
    fi
    
    # Check if npm is installed
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed."
        exit 1
    fi
    
    # Check if PM2 is installed
    if ! command -v pm2 &> /dev/null; then
        log_error "PM2 is not installed. Install with: npm install -g pm2"
        exit 1
    fi
    
    # Check if .env file exists
    if [ ! -f "$APP_DIR/.env" ]; then
        log_error ".env file not found. Please create it from .env.example"
        exit 1
    fi
    
    log_info "All prerequisites met!"
}

create_backup() {
    log_info "Creating backup of current deployment..."
    
    # Create backup directory if it doesn't exist
    mkdir -p "$BACKUP_DIR"
    
    # Create backup with timestamp
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="$BACKUP_DIR/finalcut_backup_$TIMESTAMP.tar.gz"
    
    # Backup dist directory if it exists
    if [ -d "$APP_DIR/dist" ]; then
        tar -czf "$BACKUP_FILE" -C "$APP_DIR" dist node_modules package-lock.json 2>/dev/null || true
        log_info "Backup created: $BACKUP_FILE"
    else
        log_warn "No dist directory found, skipping backup"
    fi
    
    # Keep only last 5 backups
    ls -t "$BACKUP_DIR"/finalcut_backup_*.tar.gz 2>/dev/null | tail -n +6 | xargs -r rm
}

pull_latest_code() {
    log_info "Pulling latest code from Git..."
    
    cd "$APP_DIR"
    
    # Check if we're in a git repository
    if [ ! -d ".git" ]; then
        log_error "Not a git repository. Please clone the repository first."
        exit 1
    fi
    
    # Stash any local changes
    if [[ -n $(git status -s) ]]; then
        log_warn "Local changes detected. Stashing..."
        git stash
    fi
    
    # Pull latest changes
    git pull origin main || git pull origin master || {
        log_error "Failed to pull latest code"
        exit 1
    }
    
    log_info "Code updated successfully!"
}

install_dependencies() {
    log_info "Installing dependencies..."
    
    cd "$APP_DIR"
    
    # Install Node.js dependencies
    npm ci --production=false || npm install || {
        log_error "Failed to install dependencies"
        exit 1
    }
    
    log_info "Dependencies installed successfully!"
}

build_application() {
    log_info "Building application..."
    
    cd "$APP_DIR"
    
    # Build the frontend
    npm run build || {
        log_error "Build failed"
        exit 1
    }
    
    log_info "Build completed successfully!"
}

restart_application() {
    log_info "Restarting application with PM2..."
    
    cd "$APP_DIR"
    
    # Check if app is already running
    if pm2 describe "$APP_NAME" &> /dev/null; then
        log_info "Application is running, restarting..."
        pm2 restart "$APP_NAME" || {
            log_error "Failed to restart application"
            exit 1
        }
    else
        log_info "Application not running, starting..."
        pm2 start server.js --name "$APP_NAME" || {
            log_error "Failed to start application"
            exit 1
        }
    fi
    
    # Save PM2 process list
    pm2 save
    
    log_info "Application restarted successfully!"
}

reload_nginx() {
    log_info "Reloading Nginx..."
    
    # Test Nginx configuration
    if sudo nginx -t &> /dev/null; then
        sudo systemctl reload nginx || {
            log_warn "Failed to reload Nginx, but continuing..."
        }
        log_info "Nginx reloaded successfully!"
    else
        log_warn "Nginx configuration test failed. Skipping reload."
    fi
}

show_status() {
    log_info "Deployment status:"
    echo ""
    
    # Show PM2 status
    pm2 describe "$APP_NAME" || log_warn "Application not found in PM2"
    
    echo ""
    log_info "Recent logs:"
    pm2 logs "$APP_NAME" --lines 10 --nostream || true
}

cleanup() {
    log_info "Cleaning up..."
    
    # Remove old node_modules if needed
    # Uncomment if you want to clean up during deployment
    # rm -rf "$APP_DIR/node_modules/.cache"
    
    log_info "Cleanup completed!"
}

###############################################################################
# Main Deployment Process
###############################################################################

main() {
    echo ""
    echo "========================================"
    echo "   FinalCut Deployment Script"
    echo "========================================"
    echo ""
    
    # Run deployment steps
    check_prerequisites
    create_backup
    pull_latest_code
    install_dependencies
    build_application
    restart_application
    reload_nginx
    cleanup
    
    echo ""
    echo "========================================"
    log_info "Deployment completed successfully! 🚀"
    echo "========================================"
    echo ""
    
    show_status
    
    echo ""
    log_info "Next steps:"
    echo "  - Visit your application: https://yourdomain.com"
    echo "  - Check logs: pm2 logs $APP_NAME"
    echo "  - Monitor status: pm2 monit"
    echo ""
}

# Run main function
main "$@"
