// Mock Next.js server-side APIs for Jest testing environment

// Mock Request and Response for Next.js API routes
global.Request = class MockRequest {
  constructor(input, init = {}) {
    this.url = input;
    this.method = init.method || 'GET';
    this.headers = new Map(Object.entries(init.headers || {}));
    this.body = init.body;
    this._bodyUsed = false;
  }

  async json() {
    if (this._bodyUsed) {
      throw new Error('Body has already been consumed');
    }
    this._bodyUsed = true;
    try {
      return typeof this.body === 'string' ? JSON.parse(this.body) : this.body;
    } catch (error) {
      throw new Error('Invalid JSON');
    }
  }

  async text() {
    if (this._bodyUsed) {
      throw new Error('Body has already been consumed');
    }
    this._bodyUsed = true;
    return typeof this.body === 'string' ? this.body : JSON.stringify(this.body);
  }
};

global.Response = class MockResponse {
  constructor(body, init = {}) {
    this.body = body;
    this.status = init.status || 200;
    this.statusText = init.statusText || 'OK';
    this.headers = new Map(Object.entries(init.headers || {}));
  }

  async json() {
    try {
      return typeof this.body === 'string' ? JSON.parse(this.body) : this.body;
    } catch (error) {
      throw new Error('Invalid JSON');
    }
  }

  async text() {
    return typeof this.body === 'string' ? this.body : JSON.stringify(this.body);
  }
};

// Set up environment variables for testing
process.env.NODE_ENV = 'test';
process.env.NEXTAUTH_SECRET = 'test-secret';
process.env.NEXTAUTH_URL = 'http://localhost:3000'; 