# Capacitor Setup Guide

This guide explains how to set up and develop the Vehicle Expense Tracker app using Capacitor for mobile deployment.

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Build and sync with Capacitor:**
   ```bash
   npm run cap:dev
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

## Development Workflow

### For Android Development

1. Install Android Studio and set up the Android SDK
2. Run the development script:
   ```bash
   npm run cap:dev
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open the app in Android Studio:
   ```bash
   npx cap open android
   ```
5. Run on device/emulator:
   ```bash
   npx cap run android
   ```

### For iOS Development (macOS only)

1. Install Xcode from the App Store
2. Run the development script:
   ```bash
   npm run cap:dev
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open the app in Xcode:
   ```bash
   npx cap open ios
   ```
5. Run on device/simulator:
   ```bash
   npx cap run ios
   ```

## Configuration

The app is configured to use a development server at `http://localhost:3000`. This allows the mobile app to connect to the Next.js development server for API calls.

### Capacitor Configuration

The `capacitor.config.ts` file contains:
- App ID: `com.vehicletracker.app`
- App Name: `vehicle-expense-tracker`
- Web Directory: `build`
- Development Server: `http://localhost:3000`

## Troubleshooting

### Common Issues

1. **"No valid Android SDK root found"**
   - Install Android Studio and set up the Android SDK
   - Make sure ANDROID_HOME environment variable is set

2. **"xcodebuild: error: tool 'xcodebuild' requires Xcode"**
   - Install Xcode from the App Store (macOS only)
   - Run `sudo xcode-select --install` to install command line tools

3. **"Could not find the web assets directory: ./build"**
   - Run `npm run build:capacitor` to create the build directory
   - Make sure the build completed successfully

4. **API calls not working on device**
   - Make sure the development server is running (`npm run dev`)
   - Check that the device can access `http://localhost:3000`
   - For physical devices, you may need to use your computer's IP address instead of localhost

### Development Tips

- The app uses Next.js API routes, so a development server is required
- For production builds, consider using a backend service or static export without API routes
- Use `npx cap sync` whenever you make changes to the web assets
- Use `npx cap copy` to copy only web assets without updating native dependencies

## Production Build

For production deployment, you'll need to:

1. Set up a backend service for API calls
2. Update the Capacitor configuration to point to your production server
3. Build the app for distribution

```bash
# Build for production
npm run build:capacitor

# Sync with Capacitor
npx cap sync

# Open in native IDE for final build
npx cap open android  # or ios
``` 