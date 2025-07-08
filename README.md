# Vehicle Expense Tracker (AutoLog)

A comprehensive web and mobile application for tracking vehicle expenses, fuel consumption, and income. Built with Next.js, React, TypeScript, and Capacitor for cross-platform mobile support.

## 🚗 Features

- **Fuel Tracking**: Monitor fuel consumption, costs, and efficiency
- **Expense Management**: Track all vehicle-related expenses with categorization
- **Income Tracking**: Record income sources and financial analytics
- **Multi-Vehicle Support**: Manage multiple vehicles in one account
- **Financial Analytics**: Detailed reports and insights
- **Mobile Ready**: Cross-platform mobile app with Capacitor
- **Internationalization**: Multi-language support
- **Dark/Light Theme**: User preference themes
- **Authentication**: Secure user authentication with NextAuth.js
- **Data Export**: CSV export functionality
- **Real-time Updates**: Live data synchronization

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Mobile**: Capacitor (iOS & Android)
- **Database**: MongoDB with Mongoose
- **Authentication**: NextAuth.js
- **Testing**: Jest, React Testing Library
- **Deployment**: Vercel, Docker

## 📦 Installation

1. **Clone the repository**
   ```sh
   git clone <repository-url>
   cd vehicle-expense-tracker
   ```

2. **Install dependencies**
   ```sh
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file with the following variables:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   NEXTAUTH_SECRET=your_nextauth_secret
   NEXTAUTH_URL=http://localhost:3000
   GOOGLE_CLIENT_ID=your_google_oauth_client_id
   GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
   ```

4. **Run the development server**
   ```sh
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🚀 Available Scripts

### Development
```sh
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
```

### Testing
```sh
npm test             # Run all tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
npm run test:ci      # Run tests for CI/CD
npm run test:unit    # Run unit tests only
npm run test:integration # Run integration tests
npm run test:security   # Run security tests
npm run test:performance # Run performance tests
npm run test:accessibility # Run accessibility tests
npm run test:all     # Run type-check, lint, and tests
```

### Code Quality
```sh
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run type-check   # Run TypeScript type checking
npm run audit:security # Run security audit
```

## 📱 Mobile Development

### Building for Mobile
```sh
# Build the web app
npm run build

# Add mobile platforms
npx cap add android
npx cap add ios

# Sync web code to mobile
npx cap sync

# Open in native IDEs
npx cap open android
npx cap open ios
```

## 🧪 Test Coverage & Robustness

- **Comprehensive test coverage** for all major components, API utilities, and edge cases
- **Edge case tests** for null/undefined/empty/malformed data, large datasets, rapid prop changes, and internationalization
- **Stress tests** for performance and concurrent requests
- **Security tests** for input validation and authentication
- **Accessibility tests** for WCAG compliance
- **All tests pass** as of the latest update

## 📚 Documentation

- [API Architecture](./docs/API_ARCHITECTURE.md) - Detailed API design and endpoints
- [Testing Guide](./docs/testing.md) - Comprehensive testing documentation
- [Production OAuth Setup](./docs/PRODUCTION_OAUTH_SETUP.md) - OAuth configuration for production
- [MongoDB Production Troubleshooting](./docs/MONGODB_PRODUCTION_TROUBLESHOOTING.md) - Database deployment guide
- [Google OAuth Setup](./GOOGLE_OAUTH_SETUP.md) - Google authentication configuration
- [Production Configuration](./PRODUCTION_CONFIG.md) - Production deployment guide

## 🐳 Docker Deployment

### Development
```sh
docker-compose up
```

### Production
```sh
docker-compose -f docker-compose.production.yml up -d
```

## 🔧 Configuration

### Environment Variables
- `MONGODB_URI`: MongoDB connection string
- `NEXTAUTH_SECRET`: Secret for NextAuth.js
- `NEXTAUTH_URL`: Base URL for authentication
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret

### Capacitor Configuration
The mobile app is configured in `capacitor.config.ts` with:
- App ID: `com.vehicletracker.app`
- App Name: `vehicle-expense-tracker`
- Web Directory: `build`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Check the [documentation](./docs/) directory
- Review existing [issues](../../issues)
- Create a new issue with detailed information

## 🔒 Security

- All user data is encrypted and securely stored
- Authentication is handled through NextAuth.js
- Input validation and sanitization on all endpoints
- Regular security audits and dependency updates
- HTTPS enforced in production

---

**Note**: The codebase is robust against unexpected input and API/network errors. All unused files and functions have been removed for maintainability. See the `/__tests__/components/` and `/__tests__/lib/` directories for detailed test cases.