# Base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install necessary packages for code compilation
RUN apk add --no-cache \
    gcc \
    g++ \
    libc-dev \
    openjdk11-jdk \
    python3 \
    py3-pip \
    bash \
    ruby \
    go \
    php \
    rust \
    icu-libs \
    zlib-dev \
    libintl

# Install .NET SDK
RUN wget https://dot.net/v1/dotnet-install.sh \
    && chmod +x dotnet-install.sh \
    && ./dotnet-install.sh --channel LTS \
    && ln -s /root/.dotnet/dotnet /usr/local/bin/dotnet

# Set up Python symlink
RUN ln -sf /usr/bin/python3 /usr/bin/python

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all files
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build the Next.js application
RUN npm run build

# Expose port 3000
EXPOSE 3000

# Start the application
CMD ["npm", "run", "dev"]