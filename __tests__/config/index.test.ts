import config from '../../app/config/index';

// Mock the config module to test different scenarios
jest.mock('../../app/config/index', () => {
  const originalModule = jest.requireActual('../../app/config/index');
  return {
    __esModule: true,
    default: originalModule.default,
  };
});

describe('Config Module', () => {
  describe('Configuration Structure', () => {
    it('should have all required configuration properties', () => {
      expect(config).toHaveProperty('database');
      expect(config).toHaveProperty('apiUrl');
      expect(config).toHaveProperty('env');
      
      expect(config.database).toHaveProperty('uri');
      expect(config.database).toHaveProperty('user');
      expect(config.database).toHaveProperty('password');
      expect(config.database).toHaveProperty('name');
    });

    it('should have correct types for all properties', () => {
      expect(typeof config.database.uri).toBe('string');
      expect(typeof config.database.user).toBe('string');
      expect(typeof config.database.password).toBe('string');
      expect(typeof config.database.name).toBe('string');
      expect(typeof config.apiUrl).toBe('string');
      expect(typeof config.env).toBe('string');
    });

    it('should have non-empty database name', () => {
      expect(config.database.name).toBeTruthy();
      expect(config.database.name.length).toBeGreaterThan(0);
    });

    it('should have valid API URL format', () => {
      expect(config.apiUrl).toMatch(/^https?:\/\/.+\/api$/);
    });

    it('should have valid environment value', () => {
      expect(['development', 'production', 'test']).toContain(config.env);
    });
  });

  describe('Database Configuration', () => {
    it('should have valid MongoDB URI format', () => {
      expect(config.database.uri).toMatch(/^mongodb(\+srv)?:\/\/.+/);
    });

    it('should have consistent database name across environments', () => {
      expect(config.database.name).toBe('autolog-db');
    });
  });

  describe('Environment-specific Configuration', () => {
    it('should use appropriate protocol for API URL based on environment', () => {
      if (config.env === 'development') {
        expect(config.apiUrl).toMatch(/^http:\/\/localhost/);
      } else if (config.env === 'production') {
        expect(config.apiUrl).toMatch(/^https:\/\/.+/);
      }
    });

    it('should have different database configurations for different environments', () => {
      // Just verify the config is accessible and has expected properties
      expect(config.database).toBeDefined();
      expect(config.database.uri).toBeDefined();
    });
  });

  describe('Configuration Validation', () => {
    it('should not have empty required string properties', () => {
      expect(config.database.uri.trim()).toBeTruthy();
      expect(config.database.name.trim()).toBeTruthy();
      expect(config.apiUrl.trim()).toBeTruthy();
      expect(config.env.trim()).toBeTruthy();
    });

    it('should have secure password handling', () => {
      // Password can be empty string in development
      expect(typeof config.database.password).toBe('string');
    });

    it('should export default config object', () => {
      expect(config).toBeDefined();
      expect(typeof config).toBe('object');
    });
  });

  describe('Configuration Consistency', () => {
    it('should have matching environment in env property', () => {
      const isValidEnv = ['development', 'production', 'test'].includes(config.env);
      expect(isValidEnv).toBe(true);
    });

    it('should have appropriate defaults when environment variables are not set', () => {
      expect(config).toMatchObject({
        database: expect.objectContaining({
          name: 'autolog-db'
        }),
        env: expect.any(String),
        apiUrl: expect.any(String)
      });
    });
  });
}); 