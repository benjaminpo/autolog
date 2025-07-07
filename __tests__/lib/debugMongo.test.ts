import debugMongoConnection from '../../app/lib/debugMongo';
import mongoose from 'mongoose';
import config from '../../app/config';

// Mock dependencies
jest.mock('mongoose');
jest.mock('../../app/config');

const mockMongoose = mongoose as jest.Mocked<typeof mongoose>;
const mockConfig = config as jest.Mocked<typeof config>;

describe('debugMongo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    
    // Setup default config mock
    mockConfig.env = 'test';
    mockConfig.database = { name: 'test-db' } as any;
    
    // Setup default mongoose mock
    Object.defineProperty(mockMongoose, 'version', {
      value: '7.0.0',
      writable: true
    });
    Object.defineProperty(mockMongoose, 'models', {
      value: {},
      writable: true
    });
    Object.defineProperty(mockMongoose, 'connection', {
      value: {
        readyState: 1,
        db: {
          collections: jest.fn().mockResolvedValue([
            { collectionName: 'users' },
            { collectionName: 'vehicles' }
          ])
        }
      },
      writable: true
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('debugMongoConnection', () => {
    it('should log debug information for valid URI', async () => {
      const uri = 'mongodb://user:pass@localhost:27017/test-db';

      await debugMongoConnection(uri);

      expect(console.log).toHaveBeenCalledWith('=== MongoDB Debug Information ===');
      expect(console.log).toHaveBeenCalledWith('Environment: test');
      expect(console.log).toHaveBeenCalledWith('Database Name: test-db');
      expect(console.log).toHaveBeenCalledWith('Connection String: mongodb://***:***@localhost:27017/test-db');
      expect(console.log).toHaveBeenCalledWith('URI Structure Valid: Yes');
      expect(console.log).toHaveBeenCalledWith('Protocol: mongodb:');
      expect(console.log).toHaveBeenCalledWith('Host: localhost:27017');
      expect(console.log).toHaveBeenCalledWith('Detected Database Name in URI: test-db');
      expect(console.log).toHaveBeenCalledWith('Current Connection State:', 'Connected');
      expect(console.log).toHaveBeenCalledWith('=== End Debug Information ===');
    });

    it('should handle invalid URI', async () => {
      const uri = 'invalid-uri';

      await debugMongoConnection(uri);

      expect(console.log).toHaveBeenCalledWith('URI Structure Valid: No');
      expect(console.error).toHaveBeenCalledWith('Error parsing URI:', expect.objectContaining({
        message: expect.stringContaining('Invalid URL')
      }));
    });

    it('should warn about database name mismatch', async () => {
      const uri = 'mongodb://user:pass@localhost:27017/different-db';

      await debugMongoConnection(uri);

      expect(console.log).toHaveBeenCalledWith('Detected Database Name in URI: different-db');
      expect(console.log).toHaveBeenCalledWith('WARNING: Database name in URI (different-db) doesn\'t match configured database name (test-db)');
    });

    it('should handle URI without database name', async () => {
      const uri = 'mongodb://user:pass@localhost:27017/';

      await debugMongoConnection(uri);

      expect(console.log).toHaveBeenCalledWith('Warning: No database name detected in URI pathname');
    });

    it('should handle different connection states', async () => {
      Object.defineProperty(mockMongoose, 'connection', {
        value: { readyState: 0 },
        writable: true
      });

      const uri = 'mongodb://localhost:27017/test-db';

      await debugMongoConnection(uri);

      expect(console.log).toHaveBeenCalledWith('Current Connection State:', 'Disconnected');
    });

    it('should handle connecting state', async () => {
      Object.defineProperty(mockMongoose, 'connection', {
        value: { readyState: 2 },
        writable: true
      });

      const uri = 'mongodb://localhost:27017/test-db';

      await debugMongoConnection(uri);

      expect(console.log).toHaveBeenCalledWith('Current Connection State:', 'Connecting');
    });

    it('should handle disconnecting state', async () => {
      Object.defineProperty(mockMongoose, 'connection', {
        value: { readyState: 3 },
        writable: true
      });

      const uri = 'mongodb://localhost:27017/test-db';

      await debugMongoConnection(uri);

      expect(console.log).toHaveBeenCalledWith('Current Connection State:', 'Disconnecting');
    });

    it('should handle unknown connection state', async () => {
      Object.defineProperty(mockMongoose, 'connection', {
        value: { readyState: 99 },
        writable: true
      });

      const uri = 'mongodb://localhost:27017/test-db';

      await debugMongoConnection(uri);

      expect(console.log).toHaveBeenCalledWith('Current Connection State:', 'Unknown');
    });

    it('should handle database access errors', async () => {
      Object.defineProperty(mockMongoose, 'connection', {
        value: {
          readyState: 1,
          db: {
            collections: jest.fn().mockRejectedValue(new Error('Database access error'))
          }
        },
        writable: true
      });

      const uri = 'mongodb://localhost:27017/test-db';

      await debugMongoConnection(uri);

      expect(console.error).toHaveBeenCalledWith('Error accessing database information:', expect.any(Error));
    });

    it('should handle undefined database connection', async () => {
      Object.defineProperty(mockMongoose, 'connection', {
        value: {
          readyState: 1,
          db: undefined
        },
        writable: true
      });

      const uri = 'mongodb://localhost:27017/test-db';

      await debugMongoConnection(uri);

      // Should not throw error and should complete successfully
      expect(console.log).toHaveBeenCalledWith('=== End Debug Information ===');
    });
  });
}); 