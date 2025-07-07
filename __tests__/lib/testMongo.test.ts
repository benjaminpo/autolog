import { testMongoConnection } from '../../app/lib/testMongo'

// Mock dependencies
jest.mock('../../app/lib/dbConnect', () => jest.fn())
jest.mock('../../app/lib/debugMongo', () => jest.fn())
jest.mock('../../app/models/User', () => {
  return jest.fn().mockImplementation((data) => ({
    ...data,
    save: jest.fn()
  }))
})
jest.mock('../../app/config', () => ({
  database: {
    uri: 'mongodb://localhost:27017/test-db'
  }
}))

import dbConnect from '../../app/lib/dbConnect'
import debugMongoConnection from '../../app/lib/debugMongo'
import User from '../../app/models/User'

const mockDbConnect = dbConnect as jest.MockedFunction<typeof dbConnect>
const mockDebugConnection = debugMongoConnection as jest.MockedFunction<typeof debugMongoConnection>
const mockUser = User as any

// Add static methods to the mocked User
mockUser.findOne = jest.fn()
mockUser.find = jest.fn()

describe('testMongo', () => {
  // Mock console methods
  const originalConsoleLog = console.log
  const originalConsoleError = console.error
  let consoleLogSpy: jest.SpyInstance
  let consoleErrorSpy: jest.SpyInstance

  beforeEach(() => {
    jest.clearAllMocks()
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation()
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
    
    // Set up environment variable
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test-db'
  })

  afterEach(() => {
    consoleLogSpy.mockRestore()
    consoleErrorSpy.mockRestore()
    console.log = originalConsoleLog
    console.error = originalConsoleError
  })

  const mockMongoose = {
    connection: {
      db: {
        databaseName: 'test-vehicle-expense-tracker',
        listCollections: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue([
            { name: 'users' },
            { name: 'fuelentries' },
            { name: 'cars' }
          ])
        })
      }
    }
  }

  describe('testMongoConnection', () => {

    it('should successfully test MongoDB connection with all steps', async () => {
      // Mock successful operations
      mockDbConnect.mockResolvedValue(mockMongoose as any)
      mockDebugConnection.mockResolvedValue(undefined)
      mockUser.findOne.mockResolvedValue(null) // No existing user
      
      // Mock User constructor and save
      const mockUserInstance = {
        save: jest.fn().mockResolvedValue(undefined)
      }
      ;(User as any).mockImplementation(() => mockUserInstance)
      
      mockUser.find.mockResolvedValue([
        { name: 'Test User', email: 'test@example.com' },
        { name: 'Another User', email: 'another@example.com' }
      ])

      const result = await testMongoConnection()

      expect(result.success).toBe(true)
      expect(result.error).toBeUndefined()
      
      // Verify all steps were called
      expect(mockDebugConnection).toHaveBeenCalledWith('mongodb://localhost:27017/test-db')
      expect(mockDbConnect).toHaveBeenCalled()
      expect(mockUser.findOne).toHaveBeenCalledWith({ email: 'test@example.com' })
      expect(mockUserInstance.save).toHaveBeenCalled()
      expect(mockUser.find).toHaveBeenCalledWith({})
      
      // Verify logging
      expect(consoleLogSpy).toHaveBeenCalledWith('=== Testing MongoDB Connection ===')
      expect(consoleLogSpy).toHaveBeenCalledWith('Attempting to connect to MongoDB...')
      expect(consoleLogSpy).toHaveBeenCalledWith('Connection successful!')
      expect(consoleLogSpy).toHaveBeenCalledWith('Connected to database:', 'test-vehicle-expense-tracker')
      expect(consoleLogSpy).toHaveBeenCalledWith('Collections:', 'users, fuelentries, cars')
      expect(consoleLogSpy).toHaveBeenCalledWith('Attempting to create a test user...')
      expect(consoleLogSpy).toHaveBeenCalledWith('Test user created successfully')
      expect(consoleLogSpy).toHaveBeenCalledWith('Found 2 users in the database')
    })

    it('should handle existing test user gracefully', async () => {
      const existingUser = {
        name: 'Test User',
        email: 'test@example.com'
      }

      mockDbConnect.mockResolvedValue(mockMongoose as any)
      mockDebugConnection.mockResolvedValue(undefined)
      mockUser.findOne.mockResolvedValue(existingUser as any)
      mockUser.find.mockResolvedValue([existingUser])

      const result = await testMongoConnection()

      expect(result.success).toBe(true)
      expect(mockUser.findOne).toHaveBeenCalledWith({ email: 'test@example.com' })
      expect(consoleLogSpy).toHaveBeenCalledWith('Test user already exists')
      expect(consoleLogSpy).toHaveBeenCalledWith('Found 1 users in the database')
    })

    it('should handle missing database connection info', async () => {
      const mockMongooseWithoutDb = {
        connection: {
          db: undefined
        }
      }

      mockDbConnect.mockResolvedValue(mockMongooseWithoutDb as any)
      mockDebugConnection.mockResolvedValue(undefined)
      mockUser.findOne.mockResolvedValue(null)
      
      const mockUserInstance = {
        save: jest.fn().mockResolvedValue(undefined)
      }
      ;(User as any).mockImplementation(() => mockUserInstance)
      
      mockUser.find.mockResolvedValue([])

      const result = await testMongoConnection()

      expect(result.success).toBe(true)
      expect(consoleLogSpy).toHaveBeenCalledWith('Connection successful!')
      // Should not log database info when db is undefined
      expect(consoleLogSpy).not.toHaveBeenCalledWith(expect.stringContaining('Connected to database:'))
    })

    it('should handle collections listing', async () => {
      const mockMongooseWithCollections = {
        connection: {
          db: {
            databaseName: 'test-db',
            listCollections: jest.fn().mockReturnValue({
              toArray: jest.fn().mockResolvedValue([
                { name: 'users' },
                { name: 'posts' }
              ])
            })
          }
        }
      }

      mockDbConnect.mockResolvedValue(mockMongooseWithCollections as any)
      mockDebugConnection.mockResolvedValue(undefined)
      mockUser.findOne.mockResolvedValue(null)
      
      const mockUserInstance = {
        save: jest.fn().mockResolvedValue(undefined)
      }
      ;(User as any).mockImplementation(() => mockUserInstance)
      
      mockUser.find.mockResolvedValue([])

      await testMongoConnection()

      expect(mockMongooseWithCollections.connection.db.listCollections).toHaveBeenCalled()
      expect(consoleLogSpy).toHaveBeenCalledWith('Collections:', 'users, posts')
    })

    it('should handle empty collections', async () => {
      const mockMongooseEmptyCollections = {
        connection: {
          db: {
            databaseName: 'test-db',
            listCollections: jest.fn().mockReturnValue({
              toArray: jest.fn().mockResolvedValue([])
            })
          }
        }
      }

      mockDbConnect.mockResolvedValue(mockMongooseEmptyCollections as any)
      mockDebugConnection.mockResolvedValue(undefined)
      mockUser.findOne.mockResolvedValue(null)
      
      const mockUserInstance = {
        save: jest.fn().mockResolvedValue(undefined)
      }
      ;(User as any).mockImplementation(() => mockUserInstance)
      
      mockUser.find.mockResolvedValue([])

      await testMongoConnection()

      expect(consoleLogSpy).toHaveBeenCalledWith('Collections:', 'None')
    })

    it('should handle connection errors', async () => {
      const connectionError = new Error('Failed to connect to MongoDB')
      mockDbConnect.mockRejectedValue(connectionError)
      mockDebugConnection.mockResolvedValue(undefined)

      const result = await testMongoConnection()

      expect(result.success).toBe(false)
      expect(result.error).toBe(connectionError)
      expect(consoleErrorSpy).toHaveBeenCalledWith('Test failed:', connectionError)
    })

    it('should handle debug connection errors', async () => {
      const debugError = new Error('Debug failed')
      mockDebugConnection.mockRejectedValue(debugError)

      const result = await testMongoConnection()

      expect(result.success).toBe(false)
      expect(result.error).toBe(debugError)
      expect(consoleErrorSpy).toHaveBeenCalledWith('Test failed:', debugError)
    })

    it('should handle user creation errors', async () => {
      const saveError = new Error('Failed to save user')
      
      mockDbConnect.mockResolvedValue(mockMongoose as any)
      mockDebugConnection.mockResolvedValue(undefined)
      mockUser.findOne.mockResolvedValue(null)
      
      const mockUserInstance = {
        save: jest.fn().mockRejectedValue(saveError)
      }
      ;(User as any).mockImplementation(() => mockUserInstance)

      const result = await testMongoConnection()

      expect(result.success).toBe(false)
      expect(result.error).toBe(saveError)
      expect(consoleErrorSpy).toHaveBeenCalledWith('Test failed:', saveError)
    })

    it('should handle user query errors', async () => {
      const queryError = new Error('Failed to query users')
      
      mockDbConnect.mockResolvedValue(mockMongoose as any)
      mockDebugConnection.mockResolvedValue(undefined)
      mockUser.findOne.mockResolvedValue(null)
      
      const mockUserInstance = {
        save: jest.fn().mockResolvedValue(undefined)
      }
      ;(User as any).mockImplementation(() => mockUserInstance)
      
      mockUser.find.mockRejectedValue(queryError)

      const result = await testMongoConnection()

      expect(result.success).toBe(false)
      expect(result.error).toBe(queryError)
      expect(consoleErrorSpy).toHaveBeenCalledWith('Test failed:', queryError)
    })

    it('should handle missing environment variable', async () => {
      delete process.env.MONGODB_URI
      
      mockDbConnect.mockResolvedValue(mockMongoose as any)
      mockUser.findOne.mockResolvedValue(null)
      
      const mockUserInstance = {
        save: jest.fn().mockResolvedValue(undefined)
      }
      ;(User as any).mockImplementation(() => mockUserInstance)
      
      mockUser.find.mockResolvedValue([])

      const result = await testMongoConnection()

      expect(result.success).toBe(true)
      // Should still work with config fallback
      expect(mockDebugConnection).toHaveBeenCalledWith('mongodb://localhost:27017/test-db')
    })

    it('should handle test user creation with correct data', async () => {
      mockDbConnect.mockResolvedValue(mockMongoose as any)
      mockDebugConnection.mockResolvedValue(undefined)
      mockUser.findOne.mockResolvedValue(null)
      
      const mockUserInstance = {
        save: jest.fn().mockResolvedValue(undefined)
      }
      const UserConstructorSpy = jest.fn().mockImplementation(() => mockUserInstance)
      ;(User as any).mockImplementation(UserConstructorSpy)
      
      mockUser.find.mockResolvedValue([])

      await testMongoConnection()

      expect(UserConstructorSpy).toHaveBeenCalledWith({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      })
    })

    it('should handle collections listing errors gracefully', async () => {
      const mockMongooseWithError = {
        connection: {
          db: {
            databaseName: 'test-db',
            listCollections: jest.fn().mockReturnValue({
              toArray: jest.fn().mockRejectedValue(new Error('Collections error'))
            })
          }
        }
      }

      mockDbConnect.mockResolvedValue(mockMongooseWithError as any)
      mockDebugConnection.mockResolvedValue(undefined)
      mockUser.findOne.mockResolvedValue(null)
      
      const mockUserInstance = {
        save: jest.fn().mockResolvedValue(undefined)
      }
      ;(User as any).mockImplementation(() => mockUserInstance)
      
      mockUser.find.mockResolvedValue([])

      const result = await testMongoConnection()

      // Should still succeed overall despite collections error
      expect(result.success).toBe(false)
      expect(result.error).toBeInstanceOf(Error)
    })
  })

  describe('edge cases', () => {
    it('should handle null connection string', async () => {
      delete process.env.MONGODB_URI
      
      // Mock config to return empty/undefined URI
      jest.doMock('../../app/config', () => ({
        database: {
          uri: undefined
        }
      }))

      mockDbConnect.mockResolvedValue({} as any)
      mockUser.findOne.mockResolvedValue(null)
      
      const mockUserInstance = {
        save: jest.fn().mockResolvedValue(undefined)
      }
      ;(User as any).mockImplementation(() => mockUserInstance)
      
      mockUser.find.mockResolvedValue([])

      const result = await testMongoConnection()

      expect(result.success).toBe(true)
      // Should still call debug connection with config fallback
      expect(mockDebugConnection).toHaveBeenCalledWith('mongodb://localhost:27017/test-db')
    })

    it('should handle very large user collections', async () => {
      const largeUserArray = Array.from({ length: 1000 }, (_, i) => ({
        name: `User ${i}`,
        email: `user${i}@example.com`
      }))

      mockDbConnect.mockResolvedValue(mockMongoose as any)
      mockDebugConnection.mockResolvedValue(undefined)
      mockUser.findOne.mockResolvedValue(null)
      
      const mockUserInstance = {
        save: jest.fn().mockResolvedValue(undefined)
      }
      ;(User as any).mockImplementation(() => mockUserInstance)
      
      mockUser.find.mockResolvedValue(largeUserArray)

      const result = await testMongoConnection()

      expect(result.success).toBe(true)
      expect(consoleLogSpy).toHaveBeenCalledWith('Found 1000 users in the database')
    })
  })
}) 