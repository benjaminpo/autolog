import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock components for testing accessibility features
const AccessibleButton = ({ 
  onClick, 
  disabled = false, 
  ariaLabel, 
  children,
  type = 'button',
  ...rest
}: {
  onClick?: () => void;
  disabled?: boolean;
  ariaLabel?: string;
  children: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
} & React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    aria-label={ariaLabel}
    className="focus:outline-none focus:ring-2 focus:ring-blue-500"
    {...rest}
  >
    {children}
  </button>
);

const AccessibleForm = () => (
  <form role="form" aria-labelledby="form-title">
    <h2 id="form-title">Contact Form</h2>
    
    <div>
      <label htmlFor="name">Name (required)</label>
      <input
        id="name"
        type="text"
        required
        aria-required="true"
        aria-describedby="name-error"
      />
      <div id="name-error" role="alert" aria-live="polite"></div>
    </div>
    
    <div>
      <label htmlFor="email">Email</label>
      <input
        id="email"
        type="email"
        aria-describedby="email-help"
      />
      <div id="email-help">We'll never share your email</div>
    </div>
    
    <fieldset>
      <legend>Preferred Contact Method</legend>
      <div>
        <input type="radio" id="contact-email" name="contact" value="email" />
        <label htmlFor="contact-email">Email</label>
      </div>
      <div>
        <input type="radio" id="contact-phone" name="contact" value="phone" />
        <label htmlFor="contact-phone">Phone</label>
      </div>
    </fieldset>
    
    <AccessibleButton type="submit">Submit</AccessibleButton>
  </form>
);

const AccessibleModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  React.useEffect(() => {
    if (isOpen) {
      const focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
      const modal = document.querySelector('[role="dialog"]') as HTMLElement;
      const focusableContent = modal?.querySelectorAll(focusableElements);
      const firstFocusableElement = focusableContent?.[0] as HTMLElement;
      const lastFocusableElement = focusableContent?.[focusableContent.length - 1] as HTMLElement;

      const handleTabKey = (e: KeyboardEvent) => {
        if (e.key === 'Tab') {
          if (e.shiftKey) {
            if (document.activeElement === firstFocusableElement) {
              lastFocusableElement?.focus();
              e.preventDefault();
            }
          } else {
            if (document.activeElement === lastFocusableElement) {
              firstFocusableElement?.focus();
              e.preventDefault();
            }
          }
        }
        if (e.key === 'Escape') {
          onClose();
        }
      };

      document.addEventListener('keydown', handleTabKey);
      firstFocusableElement?.focus();

      return () => {
        document.removeEventListener('keydown', handleTabKey);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
    >
      <div className="bg-white p-6 rounded-lg">
        <h2 id="modal-title">Modal Title</h2>
        <p>Modal content goes here</p>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

const AccessibleDataTable = () => (
  <table role="table" aria-label="Vehicle expenses">
    <caption>Monthly vehicle expenses breakdown</caption>
    <thead>
      <tr>
        <th scope="col" aria-sort="none">Date</th>
        <th scope="col" aria-sort="none">Vehicle</th>
        <th scope="col" aria-sort="ascending">Amount</th>
        <th scope="col">Actions</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>2024-01-15</td>
        <td>Toyota Camry</td>
        <td>$45.50</td>
        <td>
          <button aria-label="Edit expense for Toyota Camry on 2024-01-15">Edit</button>
          <button aria-label="Delete expense for Toyota Camry on 2024-01-15">Delete</button>
        </td>
      </tr>
    </tbody>
  </table>
);

describe('Advanced Accessibility Tests', () => {
  describe('Keyboard Navigation', () => {
    it('should support tab navigation through interactive elements', async () => {
      const user = userEvent.setup();
      
      render(
        <div>
          <button data-testid="button1">Button 1</button>
          <input data-testid="input1" />
          <button data-testid="button2">Button 2</button>
        </div>
      );

      const button1 = screen.getByTestId('button1');
      const input1 = screen.getByTestId('input1');
      const button2 = screen.getByTestId('button2');

      button1.focus();
      expect(button1).toHaveFocus();

      await user.tab();
      expect(input1).toHaveFocus();

      await user.tab();
      expect(button2).toHaveFocus();

      // Test shift+tab for reverse navigation
      await user.tab({ shift: true });
      expect(input1).toHaveFocus();
    });

    it('should trap focus within modal dialogs', async () => {
      const user = userEvent.setup();
      let isOpen = true;
      const onClose = jest.fn(() => { isOpen = false; });

      render(<AccessibleModal isOpen={isOpen} onClose={onClose} />);

      const modal = screen.getByRole('dialog');
      expect(modal).toBeInTheDocument();

      // Test escape key closes modal
      await user.keyboard('{Escape}');
      expect(onClose).toHaveBeenCalled();
    });

    it('should support arrow key navigation in radio button groups', async () => {
      const user = userEvent.setup();
      
      render(<AccessibleForm />);

      const emailRadio = screen.getByLabelText('Email', { selector: 'input[type="radio"]' });
      const phoneRadio = screen.getByLabelText('Phone');

      emailRadio.focus();
      expect(emailRadio).toHaveFocus();

      await user.keyboard('{ArrowDown}');
      expect(phoneRadio).toHaveFocus();

      await user.keyboard('{ArrowUp}');
      expect(emailRadio).toHaveFocus();
    });
  });

  describe('ARIA Compliance', () => {
    it('should have proper ARIA labels and roles', () => {
      render(<AccessibleForm />);

      // Check form has proper role and labelling
      const form = screen.getByRole('form');
      expect(form).toHaveAttribute('aria-labelledby', 'form-title');

      // Check required fields are marked correctly
      const nameInput = screen.getByLabelText(/name/i);
      expect(nameInput).toHaveAttribute('aria-required', 'true');
      expect(nameInput).toHaveAttribute('required');

      // Check fieldset and legend are properly associated
      const fieldset = screen.getByRole('group', { name: /preferred contact method/i });
      expect(fieldset).toBeInTheDocument();

      // Check radio buttons are in a group
      const radioButtons = screen.getAllByRole('radio');
      expect(radioButtons).toHaveLength(2);
      radioButtons.forEach(radio => {
        expect(radio).toHaveAttribute('name', 'contact');
      });
    });

    it('should provide accessible table structure', () => {
      render(<AccessibleDataTable />);

      const table = screen.getByRole('table', { name: /vehicle expenses/i });
      expect(table).toBeInTheDocument();

      // Check table has caption
      const caption = screen.getByText(/monthly vehicle expenses breakdown/i);
      expect(caption).toBeInTheDocument();

      // Check column headers have proper scope
      const columnHeaders = screen.getAllByRole('columnheader');
      columnHeaders.forEach(header => {
        expect(header).toHaveAttribute('scope', 'col');
      });

      // Check action buttons have descriptive labels
      const editButton = screen.getByLabelText(/edit expense for toyota camry/i);
      const deleteButton = screen.getByLabelText(/delete expense for toyota camry/i);
      expect(editButton).toBeInTheDocument();
      expect(deleteButton).toBeInTheDocument();
    });

    it('should use live regions for dynamic content', () => {
      render(<AccessibleForm />);

      const errorRegion = screen.getByRole('alert');
      expect(errorRegion).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Screen Reader Support', () => {
    it('should provide alternative text for meaningful images', () => {
      render(
        <div>
          <img src="chart.png" alt="Monthly expenses showing 20% increase" />
          <img src="decorative.png" alt="" role="presentation" />
        </div>
      );

      const meaningfulImage = screen.getByAltText(/monthly expenses showing 20% increase/i);
      expect(meaningfulImage).toBeInTheDocument();

      const decorativeImage = screen.getByRole('presentation');
      expect(decorativeImage).toHaveAttribute('alt', '');
    });

    it('should provide accessible button labels', () => {
      const mockOnClick = jest.fn();
      
      render(
        <div>
          <AccessibleButton onClick={mockOnClick} ariaLabel="Close navigation menu">
            ×
          </AccessibleButton>
          <AccessibleButton onClick={mockOnClick}>
            Save Changes
          </AccessibleButton>
        </div>
      );

      const closeButton = screen.getByLabelText(/close navigation menu/i);
      expect(closeButton).toBeInTheDocument();

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      expect(saveButton).toBeInTheDocument();
    });

    it('should announce form validation errors', async () => {
      const user = userEvent.setup();
      
      const FormWithValidation = () => {
        const [error, setError] = React.useState('');
        
        const handleSubmit = (e: React.FormEvent) => {
          e.preventDefault();
          const formData = new FormData(e.target as HTMLFormElement);
          const name = formData.get('name') as string;
          
          if (!name) {
            setError('Name is required');
          } else {
            setError('');
          }
        };

        return (
          <form onSubmit={handleSubmit}>
            <label htmlFor="name">Name</label>
            <input id="name" name="name" aria-describedby="name-error" />
            <div id="name-error" role="alert" aria-live="assertive">
              {error}
            </div>
            <button type="submit">Submit</button>
          </form>
        );
      };

      render(<FormWithValidation />);

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toHaveTextContent('Name is required');
      expect(errorMessage).toHaveAttribute('aria-live', 'assertive');
    });
  });

  describe('Focus Management', () => {
    it('should provide visible focus indicators', () => {
      render(<AccessibleButton>Click me</AccessibleButton>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-blue-500');
    });

    it('should skip to main content with skip link', () => {
      render(
        <div>
          <a href="#main" className="sr-only focus:not-sr-only">
            Skip to main content
          </a>
          <nav>Navigation</nav>
          <main id="main">Main content</main>
        </div>
      );

      const skipLink = screen.getByText(/skip to main content/i);
      expect(skipLink).toBeInTheDocument();
      expect(skipLink).toHaveAttribute('href', '#main');
    });

    it('should manage focus when content changes dynamically', async () => {
      const user = userEvent.setup();
      
      const DynamicContent = () => {
        const [showContent, setShowContent] = React.useState(false);
        const contentRef = React.useRef<HTMLDivElement>(null);

        React.useEffect(() => {
          if (showContent && contentRef.current) {
            contentRef.current.focus();
          }
        }, [showContent]);

        return (
          <div>
            <button onClick={() => setShowContent(!showContent)}>
              {showContent ? 'Hide' : 'Show'} Content
            </button>
            {showContent && (
              <div ref={contentRef} tabIndex={-1} role="region" aria-label="Dynamic content">
                <h2>New Content</h2>
                <p>This content appeared dynamically</p>
              </div>
            )}
          </div>
        );
      };

      render(<DynamicContent />);

      const toggleButton = screen.getByRole('button');
      await user.click(toggleButton);

      const dynamicContent = screen.getByRole('region', { name: /dynamic content/i });
      expect(dynamicContent).toHaveFocus();
    });
  });

  describe('Color and Contrast', () => {
    it('should not rely solely on color to convey information', () => {
      render(
        <div>
          <span style={{ color: 'red' }} aria-label="Error: Invalid input">
            ⚠️ Invalid input
          </span>
          <span style={{ color: 'green' }} aria-label="Success: Form submitted">
            ✓ Success
          </span>
        </div>
      );

      const errorMessage = screen.getByLabelText(/error: invalid input/i);
      const successMessage = screen.getByLabelText(/success: form submitted/i);
      
      expect(errorMessage).toHaveTextContent('⚠️');
      expect(successMessage).toHaveTextContent('✓');
    });
  });

  describe('Responsive Design Accessibility', () => {
    it('should maintain accessibility across different viewport sizes', () => {
      // Mock viewport resize
      const originalInnerWidth = window.innerWidth;
      const originalInnerHeight = window.innerHeight;

      // Mobile viewport
      Object.defineProperty(window, 'innerWidth', { value: 375 });
      Object.defineProperty(window, 'innerHeight', { value: 667 });

      render(
        <nav role="navigation" aria-label="Main navigation">
          <button aria-expanded="false" aria-controls="mobile-menu">
            Menu
          </button>
          <div id="mobile-menu" role="menu">
            <a href="/home" role="menuitem">Home</a>
            <a href="/about" role="menuitem">About</a>
          </div>
        </nav>
      );

      const menuButton = screen.getByRole('button', { name: /menu/i });
      expect(menuButton).toHaveAttribute('aria-expanded', 'false');
      expect(menuButton).toHaveAttribute('aria-controls', 'mobile-menu');

      // Restore original values
      Object.defineProperty(window, 'innerWidth', { value: originalInnerWidth });
      Object.defineProperty(window, 'innerHeight', { value: originalInnerHeight });
    });
  });
}); 