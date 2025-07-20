import '@testing-library/jest-dom'

// Polyfills for Node.js environment
global.TextEncoder = require('util').TextEncoder
global.TextDecoder = require('util').TextDecoder

// Mock crypto modules to avoid ES module issues
jest.mock('jose', () => ({
  jwtVerify: jest.fn(),
  SignJWT: jest.fn().mockImplementation(() => ({
    setProtectedHeader: jest.fn().mockReturnThis(),
    setIssuedAt: jest.fn().mockReturnThis(),
    setExpirationTime: jest.fn().mockReturnThis(),
    sign: jest.fn(),
  })),
  importJWK: jest.fn(),
  generateKeyPair: jest.fn(),
}))

jest.mock('@panva/hkdf', () => ({
  default: jest.fn(),
}))

jest.mock('openid-client', () => ({
  Issuer: {
    discover: jest.fn(),
  },
  Client: jest.fn(),
}))

// Mock problematic ES modules
jest.mock('preact-render-to-string', () => ({
  render: jest.fn(() => '<div>mock render</div>'),
  renderToString: jest.fn(() => '<div>mock render</div>'),
}))

jest.mock('preact', () => ({
  Component: class Component {
    constructor(props, context) {
      this.props = props;
      this.context = context;
    }
    render() { return null; }
    setState() {}
    forceUpdate() {}
  },
  Fragment: 'Fragment',
  createElement: jest.fn(() => ({ type: 'div', props: {}, key: null, ref: null })),
  createRef: jest.fn(() => ({ current: null })),
  render: jest.fn(),
  hydrate: jest.fn(),
  cloneElement: jest.fn(),
  createContext: jest.fn(() => ({
    Provider: ({ children }) => children,
    Consumer: ({ children }) => children({}),
  })),
  isValidElement: jest.fn(() => true),
  toChildArray: jest.fn((children) => Array.isArray(children) ? children : [children]),
  options: {}
}))

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: null,
    status: 'unauthenticated',
  })),
  signIn: jest.fn(),
  signOut: jest.fn(),
  getSession: jest.fn(),
}))

jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}))

jest.mock('next-auth', () => {
  const mockHandler = jest.fn().mockReturnValue({
    status: 200,
    json: () => Promise.resolve({ message: 'Auth handler' })
  });
  return {
    __esModule: true,
    default: jest.fn(() => mockHandler),
    getServerSession: jest.fn(),
  };
})

// Mock MongoDB
jest.mock('mongodb', () => ({
  MongoClient: {
    connect: jest.fn(),
  },
}))

// Mock Mongoose
jest.mock('mongoose', () => {
  const mockSchema = jest.fn().mockImplementation(() => ({
    pre: jest.fn(),
    post: jest.fn(),
    index: jest.fn(),
    virtual: jest.fn(),
    plugin: jest.fn(),
    methods: {},
  }));

  mockSchema.Types = {
    ObjectId: 'ObjectId',
  };

  return {
    connect: jest.fn(),
    connection: {
      readyState: 1,
    },
    Schema: mockSchema,
    model: jest.fn(),
    models: {},
  };
})

// Global test utilities
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = localStorageMock

// Mock fetch
global.fetch = jest.fn()

// Mock navigator.language
Object.defineProperty(global.navigator, 'language', {
  writable: true,
  value: 'en-US',
})

// Mock window.matchMedia for theme detection
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false, // Default to light mode
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock Next.js server components
jest.mock('next/server', () => ({
  NextRequest: class MockNextRequest {
    constructor(input, init) {
      this.url = input
      this.method = init?.method || 'GET'
      this.headers = new Map(Object.entries(init?.headers || {}))
      this.body = init?.body
      this._bodyUsed = false
    }

    async json() {
      if (this._bodyUsed) {
        throw new Error('Body has already been consumed')
      }
      this._bodyUsed = true
      try {
        return typeof this.body === 'string' ? JSON.parse(this.body) : this.body
      } catch (error) {
        console.error('JSON parsing failed:', error)
        throw new Error('Invalid JSON')
      }
    }

    async text() {
      if (this._bodyUsed) {
        throw new Error('Body has already been consumed')
      }
      this._bodyUsed = true
      return typeof this.body === 'string' ? this.body : JSON.stringify(this.body)
    }
  },
  NextResponse: class MockNextResponse {
    constructor(body, init) {
      this.body = body
      this.status = init?.status || 200
      this.statusText = init?.statusText || 'OK'
      this.headers = new Map(Object.entries(init?.headers || {}))
    }

    static json(object, init) {
      return new this(JSON.stringify(object), {
        ...init,
        headers: {
          'content-type': 'application/json',
          ...init?.headers,
        },
      })
    }

    async json() {
      try {
        return typeof this.body === 'string' ? JSON.parse(this.body) : this.body
      } catch (error) {
        console.error('JSON parsing failed:', error)
        throw new Error('Invalid JSON')
      }
    }

    async text() {
      return typeof this.body === 'string' ? this.body : JSON.stringify(this.body)
    }
  },
}))

// Mock useLanguage hook - Dynamic based on localStorage
jest.mock('./app/context/LanguageContext', () => ({
  useLanguage: jest.fn(() => {
    // Check localStorage for language preference
    const storedLanguage = global.localStorage?.getItem?.('language') || 'en';
    return {
      language: storedLanguage,
      setLanguage: jest.fn(),
    };
  }),
  LanguageProvider: ({ children }) => children,
}))

// Mock useTheme hook
jest.mock('./app/context/ThemeContext', () => ({
  useTheme: jest.fn(() => ({
    theme: 'light',
    setTheme: jest.fn(),
  })),
  ThemeProvider: ({ children }) => children,
}))

// Mock AuthContext - Provide realistic auth functions
jest.mock('./app/context/AuthContext', () => ({
  useAuth: jest.fn(() => ({
    user: null,
    loading: false,
    error: null,
    setError: jest.fn(),
    login: jest.fn().mockImplementation(async (email, password, language) => {
      // Mock API call
      await global.fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      // Save language preference if provided
      if (language) {
        await global.fetch('/api/user-preferences', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ language }),
        });
      }

      return true;
    }),
    register: jest.fn().mockImplementation(async (name, email, password) => {
      // Mock API call
      const response = await global.fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Registration failed');
      }

      return true;
    }),
    logout: jest.fn(),
  })),
  AuthProvider: ({ children }) => children,
}))

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks()
  // Reset localStorage mock
  localStorageMock.getItem.mockReturnValue('en')
})
