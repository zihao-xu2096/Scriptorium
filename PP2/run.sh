#!/bin/bash
set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Add logging function
log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }

# Check if Node.js and npm are installed
if ! command -v node &> /dev/null; then
    log_error "Node.js is not installed"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    log_error "npm is not installed"
    exit 1
fi

# Check if the application has been built
if [ ! -d ".next" ]; then
    log_warn "Application build not found"
    log_info "Running build process..."
    if ! npm run build; then
        log_error "Build process failed"
        exit 1
    fi
fi

# Check if environment variables are set
if [ ! -f .env ]; then
    log_error ".env file not found"
    exit 1
fi

# Check if database is accessible
log_info "Checking database connection..."
if ! npx prisma db push --skip-generate; then
    log_error "Database connection failed"
    exit 1
fi

# Start the server
log_info "Starting Docker containers..."
if ! docker compose up; then
    log_error "Failed to start Docker containers"
    exit 1
fi