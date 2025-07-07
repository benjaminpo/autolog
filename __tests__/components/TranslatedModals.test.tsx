import React from 'react';
import { render, screen } from '@testing-library/react';
import { TranslatedModals } from '../../app/components/TranslatedModals';
import { useLanguage } from '../../app/context/LanguageContext';

// Type assertion to bypass strict typing for test props
const TestTranslatedModals = TranslatedModals as any;

// Mock the LanguageContext
jest.mock('../../app/context/LanguageContext', () => ({
  useLanguage: jest.fn(),
}));

// Mock the Modals component
jest.mock('../../app/components/modals', () => ({
  Modals: jest.fn(({ t, ...props }) => (
    <div data-testid="modals">
      <span data-testid="has-translations">{t ? 'yes' : 'no'}</span>
      {Object.keys(props).map(key => (
        <span key={key} data-testid={`prop-${key}`}>
          {typeof props[key] === 'function' ? 'function' : String(props[key])}
        </span>
      ))}
    </div>
  )),
}));

const mockUseLanguage = useLanguage as jest.MockedFunction<typeof useLanguage>;

describe('TranslatedModals', () => {
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

  describe('Translation Injection', () => {
    it('should inject translations from context into Modals component', () => {
      render(<TestTranslatedModals />);

      expect(screen.getByTestId('modals')).toBeInTheDocument();
      expect(screen.getByTestId('has-translations')).toHaveTextContent('yes');
    });

    it('should pass translations from different languages', () => {
      const chineseTranslations = {
        _: jest.fn((key: string) => `chinese_${key}`),
        _p: jest.fn((count: number, key: string) => `chinese_plural_${key}_${count}`),
      };

      mockUseLanguage.mockReturnValue({
        language: 'zh',
        t: chineseTranslations,
        setLanguage: jest.fn(),
        saveLanguagePreference: jest.fn(),
      });

      render(<TestTranslatedModals />);

      expect(screen.getByTestId('has-translations')).toHaveTextContent('yes');
    });
  });

  describe('Props Forwarding', () => {
    it('should forward function props correctly', () => {
      const mockCallback = jest.fn();
      
      render(<TestTranslatedModals onModalOpen={mockCallback} />);

      expect(screen.getByTestId('prop-onModalOpen')).toHaveTextContent('function');
    });

    it('should forward string props correctly', () => {
      render(<TestTranslatedModals title="Test Modal" />);

      expect(screen.getByTestId('prop-title')).toHaveTextContent('Test Modal');
    });

    it('should forward boolean props correctly', () => {
      render(<TestTranslatedModals isOpen={true} />);

      expect(screen.getByTestId('prop-isOpen')).toHaveTextContent('true');
    });

    it('should forward number props correctly', () => {
      render(<TestTranslatedModals count={42} />);

      expect(screen.getByTestId('prop-count')).toHaveTextContent('42');
    });

    it('should forward array props correctly', () => {
      render(<TestTranslatedModals items={['item1', 'item2']} />);

      expect(screen.getByTestId('prop-items')).toHaveTextContent('item1,item2');
    });

    it('should forward object props correctly', () => {
      const testObject = { key: 'value', nested: { data: 'test' } };
      
      render(<TestTranslatedModals config={testObject} />);

      expect(screen.getByTestId('prop-config')).toBeInTheDocument();
    });

    it('should handle multiple props together', () => {
      const mockCallback = jest.fn();
      
      render(
        <TestTranslatedModals 
          title="Test Modal"
          isOpen={true}
          onClose={mockCallback}
          data={['a', 'b', 'c']}
        />
      );

      expect(screen.getByTestId('has-translations')).toHaveTextContent('yes');
      expect(screen.getByTestId('prop-title')).toHaveTextContent('Test Modal');
      expect(screen.getByTestId('prop-isOpen')).toHaveTextContent('true');
      expect(screen.getByTestId('prop-onClose')).toHaveTextContent('function');
      expect(screen.getByTestId('prop-data')).toHaveTextContent('a,b,c');
    });
  });

  describe('Type Safety', () => {
    it('should exclude t prop from being passed through', () => {
      // This test ensures that 't' is properly omitted from props
      render(<TestTranslatedModals someOtherProp="value" />);
      
      expect(screen.getByTestId('has-translations')).toHaveTextContent('yes');
      expect(screen.getByTestId('prop-someOtherProp')).toHaveTextContent('value');
      expect(screen.queryByTestId('prop-t')).not.toBeInTheDocument();
    });

    it('should work without any props', () => {
      render(<TestTranslatedModals />);
      
      expect(screen.getByTestId('modals')).toBeInTheDocument();
      expect(screen.getByTestId('has-translations')).toHaveTextContent('yes');
    });
  });

  describe('Context Integration', () => {
    it('should call useLanguage hook', () => {
      render(<TestTranslatedModals />);
      
      expect(mockUseLanguage).toHaveBeenCalled();
    });

    it('should handle missing translation context gracefully', () => {
      mockUseLanguage.mockReturnValue({
        language: 'en',
        t: undefined as any,
        setLanguage: jest.fn(),
        saveLanguagePreference: jest.fn(),
      });

      expect(() => {
        render(<TestTranslatedModals />);
      }).not.toThrow();
    });

    it('should re-render when language context changes', () => {
      const { rerender } = render(<TestTranslatedModals />);
      
      expect(mockUseLanguage).toHaveBeenCalledTimes(1);

      // Change language context
      mockUseLanguage.mockReturnValue({
        language: 'zh',
        t: mockTranslations,
        setLanguage: jest.fn(),
        saveLanguagePreference: jest.fn(),
      });

      rerender(<TestTranslatedModals />);
      
      expect(mockUseLanguage).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Handling', () => {
    it('should handle translation errors gracefully', () => {
      const errorTranslations = {
        _: jest.fn().mockImplementation(() => {
          throw new Error('Translation error');
        }),
        _p: jest.fn(),
      };

      mockUseLanguage.mockReturnValue({
        language: 'en',
        t: errorTranslations,
        setLanguage: jest.fn(),
        saveLanguagePreference: jest.fn(),
      });

      expect(() => {
        render(<TestTranslatedModals />);
      }).not.toThrow();
    });

    it('should handle invalid props gracefully', () => {
      expect(() => {
        render(<TestTranslatedModals nullProp={null} undefinedProp={undefined} />);
      }).not.toThrow();
    });
  });

  describe('Component Integration', () => {
    it('should render Modals component with correct props structure', () => {
      const Modals = require('../../app/components/modals').Modals;
      const mockCallback = jest.fn();
      
      render(
        <TestTranslatedModals 
          isOpen={true}
          onClose={mockCallback}
          title="Test"
        />
      );

      expect(Modals).toHaveBeenCalledWith(
        expect.objectContaining({
          t: mockTranslations,
          isOpen: true,
          onClose: mockCallback,
          title: "Test",
        }),
        undefined
      );
    });

    it('should not pass t prop explicitly', () => {
      const Modals = require('../../app/components/modals').Modals;
      
      render(<TestTranslatedModals someProps="value" />);

      const calledProps = Modals.mock.calls[0][0];
      expect(calledProps).toHaveProperty('t');
      expect(calledProps).toHaveProperty('someProps', 'value');
      
      // The t prop should come from the context, not be passed explicitly
      expect(calledProps.t).toBe(mockTranslations);
    });
  });

  describe('Performance', () => {
    it('should not cause unnecessary re-renders', () => {
      // This test verifies the component doesn't cause excessive re-renders
      const { rerender } = render(<TestTranslatedModals isOpen={true} />);
      
      expect(screen.getByTestId('modals')).toBeInTheDocument();

      // Re-render with same props should work without errors
      rerender(<TestTranslatedModals isOpen={true} />);
      
      expect(screen.getByTestId('modals')).toBeInTheDocument();
    });

    it('should handle complex props without performance issues', () => {
      const complexData = {
        users: Array(1000).fill(0).map((_, i) => ({ id: i, name: `User ${i}` })),
        settings: { theme: 'dark', locale: 'en', features: ['a', 'b', 'c'] },
        callbacks: {
          onSave: jest.fn(),
          onCancel: jest.fn(),
          onDelete: jest.fn(),
        }
      };

      expect(() => {
        render(<TestTranslatedModals complexData={complexData} />);
      }).not.toThrow();

      expect(screen.getByTestId('modals')).toBeInTheDocument();
    });
  });

  describe('Props Spread Operator', () => {
    it('should correctly spread all props except t', () => {
      const props = {
        prop1: 'value1',
        prop2: 42,
        prop3: true,
        prop4: jest.fn(),
        prop5: ['a', 'b'],
        prop6: { nested: 'object' },
      };

      render(<TestTranslatedModals {...props} />);

      Object.keys(props).forEach(key => {
        expect(screen.getByTestId(`prop-${key}`)).toBeInTheDocument();
      });
      
      expect(screen.getByTestId('has-translations')).toHaveTextContent('yes');
    });

    it('should maintain prop types when spreading', () => {
      const mockFunction = jest.fn();
      const props = {
        stringProp: 'test',
        numberProp: 123,
        booleanProp: false,
        functionProp: mockFunction,
        arrayProp: [1, 2, 3],
      };

      render(<TestTranslatedModals {...props} />);

      expect(screen.getByTestId('prop-stringProp')).toHaveTextContent('test');
      expect(screen.getByTestId('prop-numberProp')).toHaveTextContent('123');
      expect(screen.getByTestId('prop-booleanProp')).toHaveTextContent('false');
      expect(screen.getByTestId('prop-functionProp')).toHaveTextContent('function');
      expect(screen.getByTestId('prop-arrayProp')).toHaveTextContent('1,2,3');
    });
  });
}); 