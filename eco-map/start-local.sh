#!/bin/bash

# Eco-Mapping Local Hosting Startup Script
# This script starts the application locally for development/hosting

set -e  # Exit on error

PROJECT_DIR="/Users/eoin/Documents/GitHub/eco-mapping/eco-map"

echo "🚀 Starting Eco-Mapping Local Hosting..."
echo "================================================"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

echo "✅ Docker is running"

# Start Docker Compose (backend + database)
echo ""
echo "📦 Starting Backend & Database..."
cd "$PROJECT_DIR"
docker-compose up --build -d

# Wait for services to start
echo "⏳ Waiting for services to be ready..."
sleep 5

# Start Frontend
echo ""
echo "🎨 Starting Frontend..."
cd "$PROJECT_DIR/frontend"
npm install --silent
npm run dev &
FRONTEND_PID=$!

echo ""
echo "================================================"
echo "✅ Eco-Mapping is running!"
echo "================================================"
echo ""
echo "🌐 Access Points:"
echo "  Frontend:    http://localhost:5173"
echo "  Backend:     http://localhost:8000"
echo "  API Docs:    http://localhost:8000/docs"
echo ""
echo "📖 To make it publicly accessible:"
echo "  1. Install ngrok: brew install ngrok"
echo "  2. Run: ngrok http 8000  (for backend)"
echo "  3. Run: ngrok http 5173  (for frontend)"
echo "  4. Update ALLOWED_ORIGINS in .env with ngrok URLs"
echo ""
echo "🛑 To stop all services:"
echo "  - Press Ctrl+C in this terminal (stops frontend)"
echo "  - Run: cd $PROJECT_DIR && docker-compose down"
echo ""

# Keep the script running
wait $FRONTEND_PID
