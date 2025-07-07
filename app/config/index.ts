// Environment-specific configuration

interface DatabaseConfig {
  uri: string;
  user: string;
  password: string;
  name: string;
}

interface Config {
  database: DatabaseConfig;
  apiUrl: string;
  env: string;
}

// Development configuration (default)
const devConfig: Config = {
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
    user: process.env.DB_USER || '',
    password: process.env.DB_PASSWORD || '',
    name: 'autolog-db'  // Changed to match the new app name AutoLog
  },
  apiUrl: 'http://localhost:3000/api',
  env: 'development'
};

// Production configuration
const prodConfig: Config = {
  database: {
    uri: process.env.MONGODB_URI || 'mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority&appName=AppName',
    user: process.env.DB_USER || 'username',
    password: process.env.DB_PASSWORD || 'password',
    name: 'autolog-db'  // Changed to match the new app name AutoLog
  },
  apiUrl: process.env.API_URL || 'https://autolog.vercel.app/api',
  env: 'production'
};

// Determine which configuration to use based on NODE_ENV
const config: Config = process.env.NODE_ENV === 'production' ? prodConfig : devConfig;

export default config;
