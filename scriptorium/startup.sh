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
        if (( $(echo "$current_version < $min_version" | bc -l) )); then
            log_error "$package_name version $current_version is below required version $min_version"
            exit 1
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
    if (( $(echo "$NODE_VERSION < $NODE_REQUIRED" | bc -l) )); then
        echo -e "${RED}Error: Node.js version must be $NODE_REQUIRED or higher${NC}"
        exit 1
    fi
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Add checks for critical dependencies
check_and_install "prisma" "@prisma/cli"
check_and_install "bcrypt" "bcryptjs"

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

log_info "Running database migrations..."
if ! npx prisma generate; then
    log_error "Failed to generate Prisma client"
    exit 1
fi

if ! npx prisma migrate deploy; then
    log_error "Failed to run database migrations"
    exit 1
fi

# Create admin user
log_info "Creating admin user..."

NODE_SCRIPT=$(cat <<'EOF'
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdminUser() {
    try {
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@scriptorium.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';
        
        if (!adminPassword) throw new Error('Admin password not provided');
        
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        
        await prisma.user.upsert({
            where: { email: adminEmail },
            update: {
                password: hashedPassword,
                updatedAt: new Date()
            },
            create: {
                email: adminEmail,
                password: hashedPassword,
                userType: 'ADMIN',
                firstName: 'Admin',
                lastName: 'User',
                createdAt: new Date(),
                updatedAt: new Date()
            }
        });
        
        console.log('Admin user created successfully');
        console.log('Email:', adminEmail);
        console.log('Password:', adminPassword);
    } catch (error) {
        console.error('Error creating admin user:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

createAdminUser();
EOF
)

if ! node -e "$NODE_SCRIPT"; then
    log_error "Failed to create admin user"
    exit 1
fi

# Build the Next.js application
log_info "Building Next.js application..."
if ! npm run build; then
    log_error "Failed to build Next.js application"
    exit 1
fi

echo -e "${GREEN}✅ Setup completed successfully!${NC}"
echo "Admin credentials:"
echo "Username: admin"
echo "Password: Admin123!"
echo ""
echo "You can now run the application using: npm run start"