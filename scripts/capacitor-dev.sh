#!/bin/bash

# Capacitor Development Script
# This script helps with the Capacitor development workflow

echo "🚀 Capacitor Development Script"
echo "================================"

# Build the Next.js app
echo "📦 Building Next.js app..."
npm run build:capacitor

# Sync with Capacitor
echo "🔄 Syncing with Capacitor..."
npx cap sync

echo "✅ Done! Your app is ready for Capacitor development."
echo ""
echo "Next steps:"
echo "1. For Android: Install Android Studio and run 'npx cap run android'"
echo "2. For iOS: Install Xcode and run 'npx cap run ios'"
echo "3. For web development: run 'npm run dev'"
echo ""
echo "Note: The app is configured to use a development server at http://localhost:3000"
echo "Make sure to start the dev server with 'npm run dev' when testing on device" 