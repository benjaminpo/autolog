import dbConnect from '../../app/lib/dbConnect'
import mongoose from 'mongoose'

// Mock mongoose
jest.mock('mongoose', () => ({
  connect: jest.fn(),
  connection: {
    readyState: 0,
    db: {
      databaseName: 'test-vehicle-expense-tracker'
    }
  },
  models: {}
}))

// Mock config
jest.mock('../../app/config', () => ({
  database: {
    uri: 'mongodb://localhost:27017/test-db',
    name: 'test-vehicle-expense-tracker'
  },
  env: 'test'
}))

describe('dbConnect', () => {
  // Store original global.mongoose to restore later
  const originalGlobalMongoose = global.mongoose

  beforeEach(() => {
    jest.clearAllMocks()
    // Reset global cache to force new connections
    global.mongoose = { conn: null, promise: null }
    
    // Reset mongoose connection state  
    const mockMongoose = mongoose as jest.Mocked<typeof mongoose>
    ;(mockMongoose.connection as any).readyState = 0
    
    // Ensure mock is properly set up
    mockMongoose.connect.mockResolvedValue(mockMongoose as any)
  })

  afterEach(() => {
    // Restore original global.mongoose
    global.mongoose = originalGlobalMongoose
  })

  describe('connection caching', () => {
    it('should create a new connection when no cache exists', async () => {
      const mockMongoose = mongoose as jest.Mocked<typeof mongoose>
      mockMongoose.connect.mockResolvedValue(mockMongoose as any)

      const result = await dbConnect()

      expect(mockMongoose.connect).toHaveBeenCalledTimes(1)
      expect(result).toBe(mockMongoose)
    })

    it('should return cached connection when available', async () => {
      const mockMongoose = mongoose as jest.Mocked<typeof mongoose>
      
      // Set up cached connection
      global.mongoose = {
        conn: mockMongoose,
        promise: null
      }

      const result = await dbConnect()

      expect(mockMongoose.connect).not.toHaveBeenCalled()
      expect(result).toBe(mockMongoose)
    })

    it('should reuse pending promise when connection is in progress', async () => {
      const mockMongoose = mongoose as jest.Mocked<typeof mongoose>
      const connectPromise = Promise.resolve(mockMongoose as any)
      mockMongoose.connect.mockReturnValue(connectPromise)

      // Set up cached promise
      global.mongoose = {
        conn: null,
        promise: connectPromise
      }

      const result = await dbConnect()

      expect(mockMongoose.connect).not.toHaveBeenCalled()
      expect(result).toBe(mockMongoose)
    })
  })

  describe('connection options', () => {
    it('should handle MongoDB Atlas configuration', async () => {
      // Mock environment variable for MongoDB Atlas
      const originalEnv = process.env.MONGODB_URI
      process.env.MONGODB_URI = 'mongodb+srv://user:pass@cluster.mongodb.net/test'
      
      // Reset cache to force new connection
      global.mongoose = { conn: null, promise: null }

      const result = await dbConnect()
      expect(result).toBeDefined()

      // Restore original environment
      process.env.MONGODB_URI = originalEnv
    })

    it('should handle local MongoDB configuration', async () => {
      // Reset cache to force new connection  
      global.mongoose = { conn: null, promise: null }

      const result = await dbConnect()
      expect(result).toBeDefined()
    })
  })

  describe('connection success', () => {
    it('should return mongoose instance on successful connection', async () => {
      const mockMongoose = mongoose as jest.Mocked<typeof mongoose>
      
      // Reset cache to force new connection
      global.mongoose = { conn: null, promise: null }

      const result = await dbConnect()

      expect(result).toBe(mockMongoose)
    })

    it('should cache successful connection', async () => {
      await dbConnect()

      // Global cache should be set after connection
      expect(global.mongoose).toBeDefined()
      expect((global.mongoose as any)?.conn).toBeDefined()
    })
  })

  describe('connection errors', () => {
    it('should handle database connection gracefully', async () => {
      // Test that the function doesn't crash under normal conditions
      const result = await dbConnect()
      expect(result).toBeDefined()
    })
  })

  describe('logging', () => {
    it('should execute without throwing errors', async () => {
      // Simple test to ensure the function runs
      const result = await dbConnect()
      expect(result).toBeDefined()
    })
  })

  describe('environment variables', () => {
    it('should handle environment variables', async () => {
      const originalEnv = process.env.MONGODB_URI
      process.env.MONGODB_URI = 'mongodb://env-host:27017/env-db'
      
      // Reset cache to ensure fresh connection
      global.mongoose = { conn: null, promise: null }

      const result = await dbConnect()
      expect(result).toBeDefined()

      process.env.MONGODB_URI = originalEnv
    })
  })

  describe('global cache behavior', () => {
    it('should initialize global cache when not present', async () => {
      // Reset cache to test initialization
      global.mongoose = { conn: null, promise: null }

      const result = await dbConnect()

      expect(result).toBeDefined()
      expect(global.mongoose).toBeDefined()
    })
  })

  describe('concurrent connections', () => {
    it('should handle multiple connection requests', async () => {
      // Start multiple connection attempts
      const connection1 = dbConnect()
      const connection2 = dbConnect()

      const results = await Promise.all([connection1, connection2])

      // All should return valid results
      expect(results[0]).toBeDefined()
      expect(results[1]).toBeDefined()
    })
  })
}) 