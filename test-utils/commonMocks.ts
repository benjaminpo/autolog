import React from 'react';

/**
 * Common test mocks for integration tests
 */
export const commonTestMocks = {
  authContext: () => ({
    useAuth: () => ({
      user: { id: 'test-user', email: 'test@example.com' },
      loading: false,
    }),
  }),

  languageContext: () => ({
    useLanguage: () => ({}),
  }),

  translation: () => ({
    useTranslation: () => ({
      t: {
        navigation: {
          incomeHistory: 'Income History',
          expenseHistory: 'Expense History',
        },
        common: {
          loading: 'Loading...',
          loadingExpenses: 'Loading expenses...',
        },
        confirmDelete: 'Are you sure you want to delete this entry?',
      },
    }),
  }),

  vehicles: () => ({
    useVehicles: () => ({
      cars: [
        { _id: '1', name: 'Test Car 1' },
        { _id: '2', name: 'Test Car 2' },
      ],
      loading: false,
    }),
  }),

  pageContainer: () => ({
    __esModule: true,
    default: ({ children, className }: { children: React.ReactNode; className?: string }) =>
      React.createElement('div', { 'data-testid': 'page-container', className }, children),
  }),

  withTranslations: () => ({
    __esModule: true,
    default: (Component: any) => Component,
  }),

  authButton: () => ({
    AuthButton: () => React.createElement('button', { 'data-testid': 'auth-button' }, 'Auth'),
  }),

  navigation: () => ({
    TranslatedNavigation: () => React.createElement('nav', { 'data-testid': 'navigation' }, 'Navigation'),
  }),

  languageSelector: () => ({
    GlobalLanguageSelector: () => React.createElement('div', { 'data-testid': 'language-selector' }, 'Language'),
  }),

  themeToggle: () => ({
    SimpleThemeToggle: () => React.createElement('button', { 'data-testid': 'theme-toggle' }, 'Theme'),
  }),

  imageUpload: () => ({
    __esModule: true,
    default: (props: any) => React.createElement('div', { 'data-testid': 'image-upload' }, 'Image Upload'),
  }),
};

/**
 * Apply common mocks for integration tests
 */
export function setupCommonMocks() {
  jest.mock('../app/context/AuthContext', commonTestMocks.authContext);
  jest.mock('../app/context/LanguageContext', commonTestMocks.languageContext);
  jest.mock('../app/hooks/useTranslation', commonTestMocks.translation);
  jest.mock('../app/hooks/useVehicles', commonTestMocks.vehicles);
  jest.mock('../app/components/PageContainer', commonTestMocks.pageContainer);
  jest.mock('../app/components/withTranslations', commonTestMocks.withTranslations);
  jest.mock('../app/components/AuthButton', commonTestMocks.authButton);
  jest.mock('../app/components/TranslatedNavigation', commonTestMocks.navigation);
  jest.mock('../app/components/GlobalLanguageSelector', commonTestMocks.languageSelector);
  jest.mock('../app/components/ThemeToggle', commonTestMocks.themeToggle);
  jest.mock('../app/components/ImageUpload', commonTestMocks.imageUpload);
}
