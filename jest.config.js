const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    // Handle module aliases (this will be automatically configured for you based on your tsconfig.json paths)
    '^@/components/(.*)$': '<rootDir>/app/components/$1',
    '^@/lib/(.*)$': '<rootDir>/app/lib/$1',
    '^@/hooks/(.*)$': '<rootDir>/app/hooks/$1',
    '^@/context/(.*)$': '<rootDir>/app/context/$1',
    '^@/translations/(.*)$': '<rootDir>/app/translations/$1',
    // Handle ES modules
    '^jose/(.*)$': '<rootDir>/node_modules/jose/dist/node/cjs/$1',
    '^jose$': '<rootDir>/node_modules/jose/dist/node/cjs/index.js',
  },
  testEnvironment: 'jest-environment-jsdom',
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
  ],
  modulePathIgnorePatterns: [
    '<rootDir>/.next/',
  ],
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    '!app/**/*.d.ts',
    '!app/node_modules/**',
    '!app/.next/**',
  ],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    },
  },
  // Mock Next.js server-side APIs
  setupFiles: ['<rootDir>/jest.env.js'],
  // Transform ES modules from node_modules
  transformIgnorePatterns: [
    'node_modules/(?!(jose|@panva|@auth|openid-client|next-auth|preact|preact-render-to-string|uuid)/)',
  ],
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig) 