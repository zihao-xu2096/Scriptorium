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
                updatedAt: new Date(),
                phoneNum: '1234567890',
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

async function populateDatabase() {
  try {
    console.log("Populating data...");

    // Create Users
    console.log("Creating Users...");
    const userPassword = process.env.USER_PASSWORD || 'password123';

    if (!userPassword) throw new Error('User password not provided');

    const hashedPassword = await bcrypt.hash(userPassword, 10);

    const users = await Promise.all(
      Array.from({ length: 9 }, (_, i) =>
        prisma.user.upsert({
            where: { email: `user${i + 1}` },
            update: {
                password: hashedPassword,
                updatedAt: new Date()
            },
            create: {
                email: `user${i + 1}@example.com`,
                password: hashedPassword,
                firstName: `First${i + 1}`,
                lastName: `Last${i + 1}`,
                avatarUrl: `https://example.com/avatar${i + 1}.png`,
                phoneNum: `12345678${i + 10}`,
            }
        })
      )
    );
    console.log("Users created");

    // Create Post Tags
    console.log("Creating Post Tags...");
    const postTags = await Promise.all(
      Array.from({ length: 30 }, (_, i) =>
        prisma.postTag.create({
          data: {
            label: `Tag${i + 1}`,
          },
        })
      )
    );
    console.log("Post Tags created");

    // Create Templates
    console.log("Creating Templates...");
    const languages = ["JavaScript", "Python", "C++", "Java", "C"];
    const templates = await Promise.all(
        Array.from({ length: 50 }, (_, i) => {
            const language = languages[i % languages.length];
            let codeSnippet;

            switch (language) {
            case "JavaScript":
                codeSnippet = `console.log('Template ${i + 1}');`;
                break;
            case "Python":
                codeSnippet = `print('Template ${i + 1}')`;
                break;
            case "C++":
                codeSnippet = `#include <iostream>\nusing namespace std;\nint main() {\n  cout << "Template ${i + 1}" << endl;\n  return 0;\n}`;
                break;
            case "Java":
                codeSnippet = `public class Template${i + 1} {\n  public static void main(String[] args) {\n    System.out.println("Template ${i + 1}");\n  }\n}`;
                break;
                case "C":
                codeSnippet = `#include <stdio.h>\nint main() {\n  printf("Template ${i + 1}\\n");\n  return 0;\n}`;
                break;
            default:
                codeSnippet = `console.log('Template ${i + 1}');`;
            }

            return prisma.codeTemplate.create({
            data: {
                title: `Template ${i + 1}`,
                explanation: `Explanation for template ${i + 1}`,
                language: language,
                code: codeSnippet,
                author: { connect: { id: users[i % users.length].id } },
            },
            });
        })
    );
    console.log("Templates created");



    // Create Posts for each user
    console.log("Creating Posts...");
    const posts = [];
    for (const user of users) {
        const numPosts = Math.floor(Math.random() * 5) + 1; // Random number of posts between 1 and 5
        const userPosts = await Promise.all(
            Array.from({ length: numPosts }, (_, i) => {
            const postData = {
                title: `Post ${i + 1} by ${user.firstName}`,
                content: `This is the content of post ${i + 1}`,
                description: `Description for post ${i + 1}`,
                createdBy: { connect: { id: user.id } },
                tags: {
                connect: [
                    { id: postTags[i % postTags.length].id },
                    { id: postTags[(i + 1) % postTags.length].id },
                ],
                },
                linkedTemplates: {
                connect: [
                    { id: templates[i % templates.length].id },
                    { id: templates[(i + 1) % templates.length].id },
                ],
                },
                upvotes: i * 10, // Simulating upvotes
                downvotes: i * 2, // Simulating downvotes
                votes: {
                create: Array.from({ length: 3 }, (_, j) => ({
                    voteType: j % 2 === 0 ? "UPVOTE" : "DOWNVOTE",
                    user: { connect: { id: users[j % users.length].id } },
                })),
            },
        };

        // Randomly add reports to some posts
        if (Math.random() < 0.3) { // 30% chance to add reports
            const numReports = Math.floor(Math.random() * 8) + 1; // Random number of reports between 1 and 8
            postData.reports = {
            create: Array.from({ length: numReports }, (_, j) => ({
                explanation: `Report ${j + 1} on post ${i + 1}`,
                createdBy: { connect: { id: users[j % users.length].id } },
            })),
            };
        }

        return prisma.post.create({ data: postData });
        })
    );


    // Create Comments for each post
    console.log("Creating Comments...");
    for (const post of posts) {
        const numComments = Math.floor(Math.random() * 4) + 1; // Random number of comments between 1 and 4
        await Promise.all(
            Array.from({ length: numComments }, (_, i) => {
            const commentData = {
                content: `Comment ${i + 1} on post ${post.title}`,
                post: { connect: { id: post.id } },
                createdBy: { connect: { id: users[i % users.length].id } },
                isHidden: i % 2 === 0, // Alternate between hidden and visible comments
            };

            // Randomly add reports to some comments
            if (Math.random() < 0.3) { // 30% chance to add reports
                const numReports = Math.floor(Math.random() * 5) + 1; // Random number of reports between 1 and 5
                commentData.reports = {
                create: Array.from({ length: numReports }, (_, j) => ({
                    explanation: `Report ${j + 1} on comment ${i + 1}`,
                    createdBy: { connect: { id: users[j % users.length].id } },
                })),
                };
            }

        return prisma.comment.create({ data: commentData });
        })
    );
    }




    posts.push(...userPosts);
    }
    console.log("Comments created");
    console.log("Posts created");

    console.log("Populating completed.");
  } catch (error) {
    console.error("Error populating database:", error);
  } finally {
    await prisma.$disconnect();
  }
}




createAdminUser();
populateDatabase();
EOF
)

if ! node -e "$NODE_SCRIPT"; then
    log_error "Failed to create admin user"
    exit 1
fi

echo -e "${GREEN}✅ Setup completed successfully!${NC}"
echo "Admin credentials:"
echo "Username: admin"
echo "Password: Admin123!"
echo ""

# Build and run Docker container

log_info "Building Docker image..."
if ! docker build -t scriptorium-image .; then
    log_error "Failed to build Docker image"
    exit 1
fi

