#!/bin/bash

# Production deployment script for Vehicle Expense Tracker
# Usage: ./deploy-production.sh

echo "🚀 Starting production deployment for Vehicle Expense Tracker..."

# Check if docker and docker-compose are installed
if ! command -v docker &> /dev/null || ! command -v docker-compose &> /dev/null; then
    echo "❌ Error: Docker and docker-compose are required for deployment"
    echo "Please install Docker and docker-compose first"
    exit 1
fi

# Generate a secure NEXTAUTH_SECRET if not already set
if [ -z "${NEXTAUTH_SECRET}" ]; then
    echo "Generating secure NEXTAUTH_SECRET..."
    export NEXTAUTH_SECRET=$(openssl rand -base64 32)
    echo "New NEXTAUTH_SECRET generated: ${NEXTAUTH_SECRET}"
    echo "Consider adding this to your environment permanently"
fi

# Pull latest code if in a git repository
if [ -d ".git" ]; then
    echo "📥 Pulling latest code from repository..."
    git pull
fi

echo "🔧 Building production Docker image..."
docker-compose -f docker-compose.production.yml build

echo "🧹 Cleaning up old containers and volumes..."
docker-compose -f docker-compose.production.yml down

echo "🚀 Starting production services..."
docker-compose -f docker-compose.production.yml up -d

echo "✅ Deployment complete! The application should be running at:"
echo "   http://localhost:3000 (or your configured domain)"
echo
echo "📊 To view container logs:"
echo "   docker-compose -f docker-compose.production.yml logs -f"

# Check if the application is running
echo "⏳ Checking if the application is running..."
sleep 10
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Application is running successfully!"
else
    echo "⚠️ Application might not be running correctly. Check the logs for more details."
fi
