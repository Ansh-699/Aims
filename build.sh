#!/bin/bash

# Simple AIMS Docker Build Script
# Usage: ./build.sh

set -e

echo "🚀 Building AIMS Docker image..."
echo ""

# Build the Docker image
echo "📦 Building Docker image..."
docker build -t ansh7845/aims:latest -f dockerfile .

echo ""
echo "✅ Build complete!"

# Show image size
echo ""
echo "📊 Image size:"
docker images ansh7845/aims:latest

echo ""
echo "🔧 To run locally:"
echo "  docker run -p 3000:3000 ansh7845/aims:latest"
echo ""
echo "🚀 To push to registry:"
echo "  docker push ansh7845/aims:latest"