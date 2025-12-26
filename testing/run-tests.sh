#!/bin/bash

# Script to run FinalCut Puppeteer tests
# This script sets up the environment and runs the test suite

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
REPO_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"
FINALCUT_DIR="$REPO_ROOT/finalcut"

echo "🚀 FinalCut Puppeteer Test Runner"
echo "=================================="
echo ""

# Check if finalcut is built
if [ ! -d "$FINALCUT_DIR/dist" ]; then
  echo "⚠️  FinalCut dist directory not found. Building..."
  cd "$FINALCUT_DIR"
  npm install
  npm run build
  cd "$SCRIPT_DIR"
  echo "✅ Build complete"
  echo ""
fi

# Install test dependencies if needed
if [ ! -d "$SCRIPT_DIR/node_modules" ]; then
  echo "📦 Installing test dependencies..."
  cd "$SCRIPT_DIR"
  npm install
  echo "✅ Dependencies installed"
  echo ""
fi

# Check if server is running
if ! curl -s http://localhost:3000 > /dev/null; then
  echo "⚠️  Server is not running on port 3000"
  echo "Please start the server first:"
  echo "  cd $REPO_ROOT"
  echo "  npm start"
  echo ""
  echo "Or run this in another terminal, then re-run this script."
  exit 1
fi

echo "✅ Server is running on port 3000"
echo ""

# Run tests
echo "🧪 Running Puppeteer tests..."
echo ""

cd "$SCRIPT_DIR"
npm test

echo ""
echo "✅ Tests complete!"
