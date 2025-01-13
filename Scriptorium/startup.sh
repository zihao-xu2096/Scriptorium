#!/bin/bash
set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Add logging function
log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_warn() { echo -e "\033[0;33m[WARN]${NC} $1"; }

# Function to check if a command exists and install if needed
check_and_install() {
    local package_name=$1
    local min_version=$2

    # Check if package exists in node_modules
    if [ ! -d "node_modules/$package_name" ]; then
        log_error "$package_name is not installed"
        log_info "Installing $package_name..."
        if ! npm install "$package_name"; then
            log_error "Failed to install $package_name"
            exit 1
        fi
    elif [ ! -z "$min_version" ]; then
        # Check version from package.json in node_modules
        local current_version=$(node -p "require('./node_modules/$package_name/package.json').version")
        if [[ "$(printf '%s\n' "$min_version" "$current_version" | sort -V | head -n1)" == "$current_version" ]]; then
            if [[ "$min_version" != "$current_version" ]]; then
                log_warn "$package_name version $current_version is below required version $min_version"
                log_info "Updating $package_name..."
                if ! npm install "$package_name@$min_version"; then
                    log_error "Failed to update $package_name to version $min_version"
                    exit 1
                fi
                log_info "Successfully updated $package_name to version $min_version"
            fi
        fi
    fi
}

echo "🚀 Starting setup process..."

# Check for Node and npm first as they're required
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js is not installed${NC}"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}npm is not installed${NC}"
    echo "Please install npm (usually comes with Node.js)"
    exit 1
fi

# Check Node.js version
if [ -f "package.json" ]; then
    NODE_REQUIRED=$(node -p "require('./package.json').engines?.node?.replace(/[^0-9.]/g, '') || '16.0'")
    NODE_VERSION=$(node -v | cut -d 'v' -f 2)
    
    # Simple version comparison using bash
    if [[ "$(printf '%s\n' "$NODE_REQUIRED" "$NODE_VERSION" | sort -V | head -n1)" == "$NODE_VERSION" ]]; then
        if [[ "$NODE_REQUIRED" != "$NODE_VERSION" ]]; then
            echo -e "${RED}Error: Node.js version must be $NODE_REQUIRED or higher${NC}"
            exit 1
        fi
    fi
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Add checks for critical dependencies
check_and_install "prisma" "5.21.1"
check_and_install "@prisma/client" "5.21.1"
check_and_install "bcryptjs" "2.4.3"
check_and_install "bcrypt" "5.1.1"

# Check if .env file exists, if not create it
if [ ! -f .env ]; then
    if [ ! -f .env.example ]; then
        log_error ".env.example not found. Cannot create .env file"
        exit 1
    fi
    log_info "Creating .env file from .env.example..."
    cp .env.example .env
    log_warn "Please update .env with your production values"
fi

# Run database migrations if they exist
if [ ! -d "prisma" ]; then
    log_error "Prisma directory not found"
    exit 1
fi

log_info "Cleaning up existing database..."
if [ -f "prisma/dev.db" ]; then
    rm prisma/dev.db
    log_info "Existing database deleted"
fi

log_info "Cleaning up migrations..."
if [ -d "prisma/migrations" ]; then
    rm -rf prisma/migrations
    log_info "Existing migrations deleted"
fi

log_info "Adding migrations..."
if ! npx prisma migrate dev --name init; then
    log_error "Failed to generate Prisma client"
    exit 1
fi

log_info "Running database migrations..."
if ! npx prisma generate; then
    log_error "Failed to generate Prisma client"
    exit 1
fi

log_info "Pushing database migrations..."
if ! npx prisma db push; then
    log_error "Failed to generate Prisma client"
    exit 1
fi

# Create admin user
log_info "Creating admin user..."

NODE_SCRIPT=$(cat startup-database.txt)

if ! node -e "$NODE_SCRIPT"; then
    log_error "Failed to create admin user"
    exit 1
fi

log_info "Admin user created successfully"

echo -e "${GREEN}✅ Setup completed successfully!${NC}"
echo "Admin credentials:"
echo "Username: admin"
echo "Password: Admin123!"
echo ""


# Build and run Docker container
log_info "Starting Docker build process..."
log_info "Building Docker image..."

if ! docker build -t scriptorium-image .; then
    log_error "Failed to build Docker image"
    exit 1
fi

log_info "Docker image built successfully"

# Check if a container with the same name already exists
if [ "$(docker ps -aq -f name=scriptorium-container)" ]; then
    log_warn "Container with the name 'scriptorium-container' already exists. Removing it..."
    docker rm -f scriptorium-container
    log_info "Existing container removed"
fi

log_info "Running Docker container..."
if ! docker run -p 3000:3000 --name scriptorium-container scriptorium-image; then
    log_error "Failed to run Docker container"
    exit 1
fi

log_info "Docker container is running successfully"