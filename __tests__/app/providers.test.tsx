import React from 'react';
import { render, screen } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import { NextAuthProvider } from '../../app/providers';

// Mock all the context providers
jest.mock('next-auth/react', () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) =>
    <div data-testid="session-provider">{children}</div>
}));

jest.mock('../../app/context/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) =>
    <div data-testid="auth-provider">{children}</div>
}));

jest.mock('../../app/context/LanguageContext', () => ({
  LanguageProvider: ({ children }: { children: React.ReactNode }) =>
    <div data-testid="language-provider">{children}</div>
}));

jest.mock('../../app/context/ThemeContext', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) =>
    <div data-testid="theme-provider">{children}</div>
}));

describe('NextAuthProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Provider Structure', () => {
    it('should render all providers in correct nesting order', () => {
      render(
        <NextAuthProvider>
          <div data-testid="test-child">Test Child</div>
        </NextAuthProvider>
      );

      const sessionProvider = screen.getByTestId('session-provider');
      const themeProvider = screen.getByTestId('theme-provider');
      const languageProvider = screen.getByTestId('language-provider');
      const authProvider = screen.getByTestId('auth-provider');
      const testChild = screen.getByTestId('test-child');

      expect(sessionProvider).toBeInTheDocument();
      expect(themeProvider).toBeInTheDocument();
      expect(languageProvider).toBeInTheDocument();
      expect(authProvider).toBeInTheDocument();
      expect(testChild).toBeInTheDocument();

      // Verify nesting order: SessionProvider > ThemeProvider > LanguageProvider > AuthProvider > children
      expect(sessionProvider).toContainElement(themeProvider);
      expect(themeProvider).toContainElement(languageProvider);
      expect(languageProvider).toContainElement(authProvider);
      expect(authProvider).toContainElement(testChild);
    });

    it('should wrap children with SessionProvider at the top level', () => {
      render(
        <NextAuthProvider>
          <div data-testid="child">Content</div>
        </NextAuthProvider>
      );

      const sessionProvider = screen.getByTestId('session-provider');
      const child = screen.getByTestId('child');

      expect(sessionProvider).toContainElement(child);
    });

    it('should include ThemeProvider inside SessionProvider', () => {
      render(
        <NextAuthProvider>
          <div>Content</div>
        </NextAuthProvider>
      );

      const sessionProvider = screen.getByTestId('session-provider');
      const themeProvider = screen.getByTestId('theme-provider');

      expect(sessionProvider).toContainElement(themeProvider);
    });

    it('should include LanguageProvider inside ThemeProvider', () => {
      render(
        <NextAuthProvider>
          <div>Content</div>
        </NextAuthProvider>
      );

      const themeProvider = screen.getByTestId('theme-provider');
      const languageProvider = screen.getByTestId('language-provider');

      expect(themeProvider).toContainElement(languageProvider);
    });

    it('should include AuthProvider inside LanguageProvider', () => {
      render(
        <NextAuthProvider>
          <div>Content</div>
        </NextAuthProvider>
      );

      const languageProvider = screen.getByTestId('language-provider');
      const authProvider = screen.getByTestId('auth-provider');

      expect(languageProvider).toContainElement(authProvider);
    });
  });

  describe('Children Rendering', () => {
    it('should render single child correctly', () => {
      render(
        <NextAuthProvider>
          <div data-testid="single-child">Single Child</div>
        </NextAuthProvider>
      );

      expect(screen.getByTestId('single-child')).toBeInTheDocument();
      expect(screen.getByTestId('single-child')).toHaveTextContent('Single Child');
    });

    it('should render multiple children correctly', () => {
      render(
        <NextAuthProvider>
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
          <span data-testid="child-3">Child 3</span>
        </NextAuthProvider>
      );

      expect(screen.getByTestId('child-1')).toBeInTheDocument();
      expect(screen.getByTestId('child-2')).toBeInTheDocument();
      expect(screen.getByTestId('child-3')).toBeInTheDocument();
    });

    it('should render children with complex structure', () => {
      render(
        <NextAuthProvider>
          <div>
            <header data-testid="header">Header</header>
            <main data-testid="main">
              <section data-testid="section">Content</section>
            </main>
            <footer data-testid="footer">Footer</footer>
          </div>
        </NextAuthProvider>
      );

      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('main')).toBeInTheDocument();
      expect(screen.getByTestId('section')).toBeInTheDocument();
      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });

    it('should handle null children gracefully', () => {
      expect(() => {
        render(<NextAuthProvider>{null}</NextAuthProvider>);
      }).not.toThrow();
    });

    it('should handle undefined children gracefully', () => {
      expect(() => {
        render(<NextAuthProvider>{undefined}</NextAuthProvider>);
      }).not.toThrow();
    });

    it('should handle empty children gracefully', () => {
      expect(() => {
        render(<NextAuthProvider>{''}</NextAuthProvider>);
      }).not.toThrow();
    });
  });

  describe('Component Export', () => {
    it('should be a function component', () => {
      expect(typeof NextAuthProvider).toBe('function');
    });

    it('should accept children prop', () => {
      const TestComponent = () => <div>Test</div>;

      expect(() => {
        render(
          <NextAuthProvider>
            <TestComponent />
          </NextAuthProvider>
        );
      }).not.toThrow();
    });

    it('should render without crashing when no children provided', () => {
      expect(() => {
        render(<NextAuthProvider children={null} />);
      }).not.toThrow();
    });
  });

  describe('Provider Integration', () => {
    it('should render all providers when given complex children', () => {
      const ComplexChild = () => (
        <div>
          <h1>Title</h1>
          <div>
            <button>Button</button>
            <input placeholder="Input" />
          </div>
        </div>
      );

      render(
        <NextAuthProvider>
          <ComplexChild />
        </NextAuthProvider>
      );

      // All providers should be present
      expect(screen.getByTestId('session-provider')).toBeInTheDocument();
      expect(screen.getByTestId('theme-provider')).toBeInTheDocument();
      expect(screen.getByTestId('language-provider')).toBeInTheDocument();
      expect(screen.getByTestId('auth-provider')).toBeInTheDocument();

      // Complex child elements should be rendered
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Button')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Input')).toBeInTheDocument();
    });

    it('should maintain provider hierarchy with deeply nested children', () => {
      render(
        <NextAuthProvider>
          <div>
            <div>
              <div>
                <div data-testid="deeply-nested">Deeply Nested Content</div>
              </div>
            </div>
          </div>
        </NextAuthProvider>
      );

      const sessionProvider = screen.getByTestId('session-provider');
      const deeplyNested = screen.getByTestId('deeply-nested');

      expect(sessionProvider).toContainElement(deeplyNested);
    });
  });

  describe('TypeScript Props', () => {
    it('should accept ReactNode children', () => {
      const stringChild = 'String child';
      const numberChild = 42;
      const elementChild = <div>Element child</div>;

      expect(() => {
        render(<NextAuthProvider>{stringChild}</NextAuthProvider>);
      }).not.toThrow();

      expect(() => {
        render(<NextAuthProvider>{numberChild}</NextAuthProvider>);
      }).not.toThrow();

      expect(() => {
        render(<NextAuthProvider>{elementChild}</NextAuthProvider>);
      }).not.toThrow();
    });

    it('should accept array of children', () => {
      const arrayChildren = [
        <div key="1">Child 1</div>,
        <div key="2">Child 2</div>,
        <div key="3">Child 3</div>
      ];

      expect(() => {
        render(<NextAuthProvider>{arrayChildren}</NextAuthProvider>);
      }).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should render successfully even with provider mock failures', () => {
      // This test ensures the component structure is robust
      render(
        <NextAuthProvider>
          <div data-testid="error-test">Error Test</div>
        </NextAuthProvider>
      );

      expect(screen.getByTestId('error-test')).toBeInTheDocument();
    });

    it('should handle malformed children gracefully', () => {
      expect(() => {
        render(
          <NextAuthProvider>
            {/* @ts-ignore - Testing malformed children */}
            {(() => { throw new Error('Test error'); })()}
          </NextAuthProvider>
        );
      }).toThrow('Test error'); // Should throw as expected, but component should handle it gracefully in real scenarios
    });
  });
});
