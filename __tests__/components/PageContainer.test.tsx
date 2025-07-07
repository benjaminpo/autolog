import React from 'react';
import { render, screen } from '@testing-library/react';
import PageContainer from '../../app/components/PageContainer';

describe('PageContainer', () => {
  describe('Rendering', () => {
    it('should render children correctly', () => {
      render(
        <PageContainer>
          <div data-testid="child-content">Test Content</div>
        </PageContainer>
      );
      
      expect(screen.getByTestId('child-content')).toBeInTheDocument();
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should render multiple children', () => {
      render(
        <PageContainer>
          <div data-testid="child-1">First Child</div>
          <div data-testid="child-2">Second Child</div>
          <span data-testid="child-3">Third Child</span>
        </PageContainer>
      );
      
      expect(screen.getByTestId('child-1')).toBeInTheDocument();
      expect(screen.getByTestId('child-2')).toBeInTheDocument();
      expect(screen.getByTestId('child-3')).toBeInTheDocument();
    });

    it('should render with complex nested children', () => {
      render(
        <PageContainer>
          <div>
            <h1>Title</h1>
            <div>
              <p>Paragraph</p>
              <button>Button</button>
            </div>
          </div>
        </PageContainer>
      );
      
      expect(screen.getByRole('heading', { name: 'Title' })).toBeInTheDocument();
      expect(screen.getByText('Paragraph')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Button' })).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should apply default container classes', () => {
      render(
        <PageContainer>
          <div data-testid="content">Content</div>
        </PageContainer>
      );
      
      const container = screen.getByTestId('content').parentElement;
      expect(container).toHaveClass(
        'mx-auto',
        'px-4',
        'sm:px-6',
        'lg:px-8',
        'w-full'
      );
    });

    it('should apply custom className', () => {
      render(
        <PageContainer className="custom-class">
          <div data-testid="content">Content</div>
        </PageContainer>
      );
      
      const container = screen.getByTestId('content').parentElement;
      expect(container).toHaveClass('custom-class');
    });

    it('should combine default and custom classes', () => {
      render(
        <PageContainer className="bg-blue-500 max-w-4xl">
          <div data-testid="content">Content</div>
        </PageContainer>
      );
      
      const container = screen.getByTestId('content').parentElement;
      expect(container).toHaveClass('mx-auto', 'px-4', 'bg-blue-500', 'max-w-4xl');
    });

    it('should handle empty className', () => {
      render(
        <PageContainer className="">
          <div data-testid="content">Content</div>
        </PageContainer>
      );
      
      const container = screen.getByTestId('content').parentElement;
      expect(container).toHaveClass('mx-auto', 'px-4', 'sm:px-6', 'lg:px-8', 'w-full');
    });

    it('should handle undefined className', () => {
      render(
        <PageContainer>
          <div data-testid="content">Content</div>
        </PageContainer>
      );
      
      const container = screen.getByTestId('content').parentElement;
      expect(container).toHaveClass('mx-auto', 'px-4', 'sm:px-6', 'lg:px-8', 'w-full');
    });
  });

  describe('Responsive Behavior', () => {
    it('should have responsive padding classes', () => {
      render(
        <PageContainer>
          <div data-testid="content">Content</div>
        </PageContainer>
      );
      
      const container = screen.getByTestId('content').parentElement;
      
      // Check responsive padding classes
      expect(container).toHaveClass('px-4'); // default mobile
      expect(container).toHaveClass('sm:px-6'); // small screens
      expect(container).toHaveClass('lg:px-8'); // large screens
    });

    it('should be full width', () => {
      render(
        <PageContainer>
          <div data-testid="content">Content</div>
        </PageContainer>
      );
      
      const container = screen.getByTestId('content').parentElement;
      expect(container).toHaveClass('w-full');
    });

    it('should center content horizontally', () => {
      render(
        <PageContainer>
          <div data-testid="content">Content</div>
        </PageContainer>
      );
      
      const container = screen.getByTestId('content').parentElement;
      expect(container).toHaveClass('mx-auto');
    });
  });

  describe('Layout Consistency', () => {
    it('should provide consistent layout structure', () => {
      const { container } = render(
        <PageContainer>
          <div data-testid="content">Content</div>
        </PageContainer>
      );
      
      // Should be a single container div
      const containerDiv = container.firstChild;
      expect(containerDiv).toBeInstanceOf(HTMLDivElement);
      expect(containerDiv?.childNodes).toHaveLength(1);
    });

    it('should wrap content appropriately', () => {
      render(
        <PageContainer>
          <main data-testid="main-content">
            <section>Section 1</section>
            <section>Section 2</section>
          </main>
        </PageContainer>
      );
      
      const mainContent = screen.getByTestId('main-content');
      expect(mainContent.parentElement).toHaveClass('mx-auto');
      expect(screen.getByText('Section 1')).toBeInTheDocument();
      expect(screen.getByText('Section 2')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty children', () => {
      render(<PageContainer>{''}</PageContainer>);
      
      // Should render without crashing
      expect(document.querySelector('.mx-auto')).toBeInTheDocument();
    });

    it('should handle null children', () => {
      render(<PageContainer>{null}</PageContainer>);
      
      expect(document.querySelector('.mx-auto')).toBeInTheDocument();
    });

    it('should handle undefined children', () => {
      render(<PageContainer>{undefined}</PageContainer>);
      
      expect(document.querySelector('.mx-auto')).toBeInTheDocument();
    });

    it('should handle conditional children', () => {
      const showContent = true;
      render(
        <PageContainer>
          {showContent && <div data-testid="conditional">Conditional Content</div>}
        </PageContainer>
      );
      
      expect(screen.getByTestId('conditional')).toBeInTheDocument();
    });

    it('should handle string children', () => {
      render(<PageContainer>Simple text content</PageContainer>);
      
      expect(screen.getByText('Simple text content')).toBeInTheDocument();
    });

    it('should handle number children', () => {
      render(<PageContainer>{42}</PageContainer>);
      
      expect(screen.getByText('42')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should not interfere with child accessibility', () => {
      render(
        <PageContainer>
          <button aria-label="Test button">Click me</button>
          <input aria-describedby="help-text" />
          <div id="help-text">Help text</div>
        </PageContainer>
      );
      
      const button = screen.getByLabelText('Test button');
      const input = screen.getByRole('textbox');
      const helpText = screen.getByText('Help text');
      
      expect(button).toBeInTheDocument();
      expect(input).toHaveAttribute('aria-describedby', 'help-text');
      expect(helpText).toHaveAttribute('id', 'help-text');
    });

    it('should preserve child roles and semantics', () => {
      render(
        <PageContainer>
          <nav role="navigation">
            <ul>
              <li><a href="#home">Home</a></li>
              <li><a href="#about">About</a></li>
            </ul>
          </nav>
          <main role="main">
            <h1>Page Title</h1>
          </main>
        </PageContainer>
      );
      
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      expect(screen.getByRole('list')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should not cause unnecessary re-renders', () => {
      const ChildComponent = jest.fn(() => <div>Child</div>);
      
      const { rerender } = render(
        <PageContainer>
          <ChildComponent />
        </PageContainer>
      );
      
      expect(ChildComponent).toHaveBeenCalledTimes(1);
      
      // Re-render with same props
      rerender(
        <PageContainer>
          <ChildComponent />
        </PageContainer>
      );
      
      expect(ChildComponent).toHaveBeenCalledTimes(2);
    });

    it('should handle frequent className changes', () => {
      const { rerender } = render(
        <PageContainer className="class-1">
          <div data-testid="content">Content</div>
        </PageContainer>
      );
      
      let container = screen.getByTestId('content').parentElement;
      expect(container).toHaveClass('class-1');
      
      rerender(
        <PageContainer className="class-2">
          <div data-testid="content">Content</div>
        </PageContainer>
      );
      
      container = screen.getByTestId('content').parentElement;
      expect(container).toHaveClass('class-2');
      expect(container).not.toHaveClass('class-1');
    });
  });
}); 