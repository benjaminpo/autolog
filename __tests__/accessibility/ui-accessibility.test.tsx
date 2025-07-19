import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider } from '../../app/context/ThemeContext';
import { LanguageProvider } from '../../app/context/LanguageContext';

// Mock Next.js components
jest.mock('next/image', () => {
  return ({ src, alt, ...props }: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} {...props} />;
  };
});

jest.mock('next/link', () => {
  return ({ children, href, ...props }: any) => {
    return <a href={href} {...props}>{children}</a>;
  };
});

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>
    <LanguageProvider>
      {children}
    </LanguageProvider>
  </ThemeProvider>
);

describe('UI Accessibility Tests', () => {
  describe('Basic Accessibility Compliance', () => {
    it('should have proper ARIA labels for form elements', () => {
      const TestForm = () => (
        <form role="form" aria-label="Test form">
          <div>
            <label htmlFor="email">Email Address</label>
            <input 
              type="email" 
              id="email" 
              name="email" 
              required 
              aria-describedby="email-help"
            />
            <div id="email-help">Enter your email address</div>
          </div>
          
          <div>
            <label htmlFor="password">Password</label>
            <input 
              type="password" 
              id="password" 
              name="password" 
              required 
              aria-describedby="password-help"
              minLength={8}
            />
            <div id="password-help">Password must be at least 8 characters</div>
          </div>
          
          <button type="submit" aria-describedby="submit-help">
            Submit Form
          </button>
          <div id="submit-help">Click to submit the form</div>
        </form>
      );

      render(
        <TestWrapper>
          <TestForm />
        </TestWrapper>
      );

      // Check that form elements have proper labels and descriptions
      expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      expect(screen.getByText('Enter your email address')).toBeInTheDocument();
      expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Submit Form' })).toBeInTheDocument();
    });

    it('should have proper ARIA labels for interactive elements', () => {
      const TestInteractiveElements = () => (
        <div>
          <button aria-label="Add new vehicle">
            <span aria-hidden="true">+</span>
          </button>
          
          <button aria-describedby="delete-description">
            Delete Vehicle
          </button>
          <div id="delete-description">
            This action cannot be undone
          </div>
          
          <input 
            type="search" 
            placeholder="Search vehicles..." 
            aria-label="Search vehicles"
          />
          
          <select aria-label="Filter by fuel type">
            <option value="">All fuel types</option>
            <option value="gasoline">Gasoline</option>
            <option value="diesel">Diesel</option>
            <option value="electric">Electric</option>
          </select>
        </div>
      );

      render(
        <TestWrapper>
          <TestInteractiveElements />
        </TestWrapper>
      );

      expect(screen.getByLabelText('Add new vehicle')).toBeInTheDocument();
      expect(screen.getByLabelText('Search vehicles')).toBeInTheDocument();
      expect(screen.getByLabelText('Filter by fuel type')).toBeInTheDocument();
      expect(screen.getByText('This action cannot be undone')).toBeInTheDocument();
    });

    it('should have proper heading hierarchy', () => {
      const TestHeadingHierarchy = () => (
        <main>
          <h1>Vehicle Expense Tracker</h1>
          <section>
            <h2>Dashboard Overview</h2>
            <article>
              <h3>Recent Fuel Entries</h3>
              <h4>This Week</h4>
              <h4>Last Week</h4>
            </article>
            <article>
              <h3>Vehicle Statistics</h3>
              <h4>Fuel Efficiency</h4>
              <h4>Maintenance Costs</h4>
            </article>
          </section>
          <section>
            <h2>Quick Actions</h2>
            <h3>Add New Entry</h3>
            <h3>Generate Report</h3>
          </section>
        </main>
      );

      render(
        <TestWrapper>
          <TestHeadingHierarchy />
        </TestWrapper>
      );

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Vehicle Expense Tracker');
      expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(2);
      expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(4);
      expect(screen.getAllByRole('heading', { level: 4 })).toHaveLength(4);
    });

    it('should have proper tab order for form elements', () => {
      const TestFormTabOrder = () => (
        <form>
          <input type="text" placeholder="First field" />
          <input type="text" placeholder="Second field" />
          <select>
            <option value="">Select option</option>
            <option value="1">Option 1</option>
          </select>
          <textarea placeholder="Comments"></textarea>
          <button type="submit">Submit</button>
          <button type="button">Cancel</button>
        </form>
      );

      render(
        <TestWrapper>
          <TestFormTabOrder />
        </TestWrapper>
      );

      const firstField = screen.getByPlaceholderText('First field');
      const secondField = screen.getByPlaceholderText('Second field');
      const selectField = screen.getByRole('combobox');
      const textArea = screen.getByPlaceholderText('Comments');
      const submitButton = screen.getByText('Submit');
      const cancelButton = screen.getByText('Cancel');

      expect(firstField).toHaveAttribute('tabIndex', '1');
      expect(secondField).toHaveAttribute('tabIndex', '2');
      expect(selectField).toHaveAttribute('tabIndex', '3');
      expect(textArea).toHaveAttribute('tabIndex', '4');
      expect(submitButton).toHaveAttribute('tabIndex', '5');
      expect(cancelButton).toHaveAttribute('tabIndex', '6');
    });

    it('should provide accessible error messages', () => {
      const TestErrorMessages = () => {
        const [errors] = React.useState({
          email: 'Please enter a valid email address',
          password: 'Password must be at least 8 characters long'
        });

        return (
          <form>
            <div className="form-field">
              <label htmlFor="email">Email</label>
              <input 
                type="email" 
                id="email" 
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
              />
              {errors.email && (
                <div 
                  id="email-error" 
                  role="alert" 
                  className="error-message"
                >
                  {errors.email}
                </div>
              )}
            </div>
            
            <div className="form-field">
              <label htmlFor="password">Password</label>
              <input 
                type="password" 
                id="password" 
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? 'password-error' : undefined}
              />
              {errors.password && (
                <div 
                  id="password-error" 
                  role="alert" 
                  className="error-message"
                >
                  {errors.password}
                </div>
              )}
            </div>
          </form>
        );
      };

      render(
        <TestWrapper>
          <TestErrorMessages />
        </TestWrapper>
      );

      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');

      expect(emailInput).toHaveAttribute('aria-invalid', 'true');
      expect(passwordInput).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
      expect(screen.getByText('Password must be at least 8 characters long')).toBeInTheDocument();
      expect(screen.getByText('Please enter a valid email address')).toHaveAttribute('role', 'alert');
      expect(screen.getByText('Password must be at least 8 characters long')).toHaveAttribute('role', 'alert');
    });

    it('should not rely solely on color for information', () => {
      const TestColorIndependence = () => (
        <div>
          <div className="status-indicators">
            <div className="status-item">
              <span className="status-icon" aria-hidden="true">✓</span>
              <span className="status-text">Active</span>
            </div>
            <div className="status-item">
              <span className="status-icon" aria-hidden="true">⚠</span>
              <span className="status-text">Warning</span>
            </div>
            <div className="status-item">
              <span className="status-icon" aria-hidden="true">✗</span>
              <span className="status-text">Error</span>
            </div>
          </div>
          
          <form>
            <div className="form-field">
              <label htmlFor="required-field">
                Required Field
                <span className="required-indicator" aria-label="required">*</span>
              </label>
              <input 
                type="text" 
                id="required-field" 
                required 
                aria-required="true"
              />
            </div>
            
            <div className="form-field">
              <label htmlFor="optional-field">Optional Field</label>
              <input type="text" id="optional-field" />
            </div>
          </form>
        </div>
      );

      render(
        <TestWrapper>
          <TestColorIndependence />
        </TestWrapper>
      );

      // Status should be indicated by both icon and text
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Warning')).toBeInTheDocument();
      expect(screen.getByText('Error')).toBeInTheDocument();
      
      // Required field should be indicated by both visual and semantic means
      expect(screen.getByLabelText('required')).toBeInTheDocument();
      expect(screen.getByLabelText(/Required Field/)).toHaveAttribute('aria-required', 'true');
    });

    it('should have proper landmark roles', () => {
      const TestLandmarks = () => (
        <div>
          <header role="banner">
            <h1>Site Header</h1>
          </header>
          <nav role="navigation" aria-label="Main navigation">
            <ul>
              <li><a href="/">Home</a></li>
              <li><a href="/dashboard">Dashboard</a></li>
            </ul>
          </nav>
          <main role="main">
            <h2>Main Content</h2>
            <section aria-labelledby="section-heading">
              <h3 id="section-heading">Important Section</h3>
              <p>Section content here.</p>
            </section>
          </main>
          <aside role="complementary" aria-label="Sidebar">
            <h3>Sidebar Content</h3>
          </aside>
          <footer role="contentinfo">
            <p>Footer content</p>
          </footer>
        </div>
      );

      render(
        <TestWrapper>
          <TestLandmarks />
        </TestWrapper>
      );

      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('complementary')).toBeInTheDocument();
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    });

    it('should provide keyboard navigation support', () => {
      const TestKeyboardNavigation = () => (
        <div>
          <button onKeyDown={(e) => e.key === 'Enter' && console.log('activated')}>
            Keyboard Accessible Button
          </button>
          
          <div 
            role="button" 
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                console.log('custom button activated');
              }
            }}
          >
            Custom Button with Keyboard Support
          </div>
          
          <ul role="listbox" aria-label="Options">
            <li 
              role="option" 
              tabIndex={0} 
              aria-selected="false"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  console.log('option 1 selected');
                }
              }}
            >
              Option 1
            </li>
            <li 
              role="option" 
              tabIndex={-1} 
              aria-selected="true"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  console.log('option 2 selected');
                }
              }}
            >
              Option 2 (Selected)
            </li>
            <li 
              role="option" 
              tabIndex={-1} 
              aria-selected="false"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  console.log('option 3 selected');
                }
              }}
            >
              Option 3
            </li>
          </ul>
        </div>
      );

      render(
        <TestWrapper>
          <TestKeyboardNavigation />
        </TestWrapper>
      );

      expect(screen.getByText('Keyboard Accessible Button')).toBeInTheDocument();
      expect(screen.getByText('Custom Button with Keyboard Support')).toHaveAttribute('tabIndex', '0');
      expect(screen.getByText('Option 2 (Selected)')).toHaveAttribute('aria-selected', 'true');
    });
  });
}); 