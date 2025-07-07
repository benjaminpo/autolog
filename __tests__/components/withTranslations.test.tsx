import React from 'react';
import { render, screen } from '@testing-library/react';
import { withTranslations } from '../../app/components/withTranslations';
import { useLanguage } from '../../app/context/LanguageContext';

// Mock the LanguageContext
jest.mock('../../app/context/LanguageContext', () => ({
  useLanguage: jest.fn(),
}));

const mockUseLanguage = useLanguage as jest.MockedFunction<typeof useLanguage>;

// Mock component to test the HOC
interface TestComponentProps {
  title: string;
  count?: number;
  t?: {
    _: (key: string, params?: any) => string;
    _p: (count: number, key: string, params?: any) => string;
  };
}

const TestComponent: React.FC<TestComponentProps> = ({ title, count = 0, t }) => {
  return (
    <div>
      <h1 data-testid="title">{title}</h1>
      <p data-testid="count">{count}</p>
      {t && (
        <>
          <span data-testid="translation">{t._('test.key')}</span>
          <span data-testid="plural">{t._p(count, 'test.plural')}</span>
        </>
      )}
    </div>
  );
};

describe('withTranslations HOC', () => {
  const mockTranslations = {
    _: jest.fn((key: string) => `translated_${key}`),
    _p: jest.fn((count: number, key: string) => `plural_${key}_${count}`),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLanguage.mockReturnValue({
      language: 'en',
      t: mockTranslations,
      setLanguage: jest.fn(),
      saveLanguagePreference: jest.fn(),
    });
  });

  describe('Basic Functionality', () => {
    it('should wrap component and inject translations', () => {
      const WrappedComponent = withTranslations(TestComponent);
      
      render(<WrappedComponent title="Test Title" count={5} />);
      
      expect(screen.getByTestId('title')).toHaveTextContent('Test Title');
      expect(screen.getByTestId('count')).toHaveTextContent('5');
      expect(screen.getByTestId('translation')).toHaveTextContent('translated_test.key');
      expect(screen.getByTestId('plural')).toHaveTextContent('plural_test.plural_5');
    });

    it('should pass through all props except t', () => {
      const WrappedComponent = withTranslations(TestComponent);
      
      render(<WrappedComponent title="Another Title" />);
      
      expect(screen.getByTestId('title')).toHaveTextContent('Another Title');
      expect(screen.getByTestId('count')).toHaveTextContent('0'); // default value
    });

    it('should work with components that have no props', () => {
      const SimpleComponent: React.FC<{ t?: any }> = ({ t }) => (
        <div data-testid="simple">{t ? 'has-translations' : 'no-translations'}</div>
      );
      
      const WrappedComponent = withTranslations(SimpleComponent);
      
      render(<WrappedComponent />);
      
      expect(screen.getByTestId('simple')).toHaveTextContent('has-translations');
    });
  });

  describe('Translation Integration', () => {
    it('should call translation functions correctly', () => {
      const WrappedComponent = withTranslations(TestComponent);
      
      render(<WrappedComponent title="Test" count={3} />);
      
      expect(mockTranslations._).toHaveBeenCalledWith('test.key');
      expect(mockTranslations._p).toHaveBeenCalledWith(3, 'test.plural');
    });

    it('should handle different translation contexts', () => {
      const differentTranslations = {
        _: jest.fn((key: string) => `different_${key}`),
        _p: jest.fn((count: number, key: string) => `different_plural_${key}_${count}`),
      };

      mockUseLanguage.mockReturnValue({
        language: 'zh',
        t: differentTranslations,
        setLanguage: jest.fn(),
        saveLanguagePreference: jest.fn(),
      });

      const WrappedComponent = withTranslations(TestComponent);
      
      render(<WrappedComponent title="Test" count={2} />);
      
      expect(screen.getByTestId('translation')).toHaveTextContent('different_test.key');
      expect(screen.getByTestId('plural')).toHaveTextContent('different_plural_test.plural_2');
    });
  });

  describe('Component Display Names', () => {
    it('should set proper display name for named component', () => {
      const NamedComponent = ({ t }: { t?: any }) => <div>Named</div>;
      NamedComponent.displayName = 'CustomDisplayName';
      
      const WrappedComponent = withTranslations(NamedComponent);
      
      expect(WrappedComponent.displayName).toBe('withTranslations(CustomDisplayName)');
    });

    it('should use component name if no display name', () => {
      function ComponentWithName({ t }: { t?: any }) {
        return <div>Named Function</div>;
      }
      
      const WrappedComponent = withTranslations(ComponentWithName);
      
      expect(WrappedComponent.displayName).toBe('withTranslations(ComponentWithName)');
    });

    it('should use fallback name for anonymous components', () => {
      const AnonymousComponent = ({ t }: { t?: any }) => <div>Anonymous</div>;
      
      const WrappedComponent = withTranslations(AnonymousComponent);
      
      expect(WrappedComponent.displayName).toBe('withTranslations(AnonymousComponent)');
    });
  });

  describe('Props Handling', () => {
    it('should not accept t prop in wrapped component', () => {
      const WrappedComponent = withTranslations(TestComponent);
      
      // This should compile without t prop
      render(<WrappedComponent title="Test" count={1} />);
      
      expect(screen.getByTestId('translation')).toBeInTheDocument();
    });

    it('should preserve all other prop types', () => {
      interface ComplexProps {
        stringProp: string;
        numberProp: number;
        booleanProp: boolean;
        arrayProp: string[];
        objectProp: { key: string };
        functionProp: () => void;
        t?: any;
      }

      const ComplexComponent: React.FC<ComplexProps> = ({ 
        stringProp, 
        numberProp, 
        booleanProp, 
        arrayProp, 
        objectProp, 
        functionProp,
        t 
      }) => (
        <div>
          <span data-testid="string">{stringProp}</span>
          <span data-testid="number">{numberProp}</span>
          <span data-testid="boolean">{booleanProp.toString()}</span>
          <span data-testid="array">{arrayProp.join(',')}</span>
          <span data-testid="object">{objectProp.key}</span>
          <button data-testid="function" onClick={functionProp}>Click</button>
          <span data-testid="has-t">{t ? 'yes' : 'no'}</span>
        </div>
      );

      const WrappedComponent = withTranslations(ComplexComponent);
      const mockFunction = jest.fn();

      render(
        <WrappedComponent
          stringProp="test"
          numberProp={42}
          booleanProp={true}
          arrayProp={['a', 'b', 'c']}
          objectProp={{ key: 'value' }}
          functionProp={mockFunction}
        />
      );

      expect(screen.getByTestId('string')).toHaveTextContent('test');
      expect(screen.getByTestId('number')).toHaveTextContent('42');
      expect(screen.getByTestId('boolean')).toHaveTextContent('true');
      expect(screen.getByTestId('array')).toHaveTextContent('a,b,c');
      expect(screen.getByTestId('object')).toHaveTextContent('value');
      expect(screen.getByTestId('has-t')).toHaveTextContent('yes');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing translation context gracefully', () => {
      mockUseLanguage.mockReturnValue({
        language: 'en',
        t: undefined as any,
        setLanguage: jest.fn(),
        saveLanguagePreference: jest.fn(),
      });

      const WrappedComponent = withTranslations(TestComponent);
      
      expect(() => {
        render(<WrappedComponent title="Test" />);
      }).not.toThrow();
    });

    it('should handle components that throw errors', () => {
      const ErrorComponent = ({ t }: { t?: any }) => {
        if (!t) throw new Error('No translations');
        return <div>Success</div>;
      };

      const WrappedComponent = withTranslations(ErrorComponent);
      
      // Component should receive translations so shouldn't throw
      expect(() => {
        render(<WrappedComponent />);
      }).not.toThrow();
    });
  });

  describe('Performance', () => {
    it('should not cause unnecessary re-renders', () => {
      let renderCount = 0;
      const CountingComponent = ({ title, t }: { title: string; t?: any }) => {
        renderCount++;
        return <div>{title}</div>;
      };

      const WrappedComponent = withTranslations(CountingComponent);
      const { rerender } = render(<WrappedComponent title="Test" />);

      const initialRenderCount = renderCount;
      
      // Re-render with same props
      rerender(<WrappedComponent title="Test" />);
      
      // Should only render once more
      expect(renderCount).toBe(initialRenderCount + 1);
    });
  });
}); 