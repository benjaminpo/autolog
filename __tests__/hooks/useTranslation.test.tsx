import { renderHook } from '@testing-library/react'
import React from 'react'

// Clear the jest setup mock for this test file  
jest.unmock('../../app/context/LanguageContext');

import { useTranslation } from '../../app/hooks/useTranslation'
import { LanguageProvider, useLanguage } from '../../app/context/LanguageContext'

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
})

// Mock the translation files
jest.mock('../../app/translations', () => ({
  en: {
    app: {
      title: 'AutoLog'
    },
    actions: {
      save: 'Save',
      cancel: 'Cancel'
    }
  },
  zh: {
    app: {
      title: '車輛中心'
    },
    actions: {
      save: '儲存',
      cancel: '取消'
    }
  }
}))

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <LanguageProvider>
    {children}
  </LanguageProvider>
)

describe('useTranslation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue('en')
  })

  it('should return translation object', () => {
    const { result } = renderHook(() => useTranslation(), { wrapper })
    
    expect(result.current.t).toBeDefined()
    expect(result.current.t.app).toBeDefined()
    expect(result.current.t.actions).toBeDefined()
  })

  it('should integrate with LanguageProvider correctly', () => {
    const { result } = renderHook(() => {
      const translation = useTranslation()
      const language = useLanguage()
      return { translation, language }
    }, { wrapper })
    
    expect(result.current.translation.t).toBe(result.current.language.t)
  })

  it('should handle missing translation keys gracefully', () => {
    const { result } = renderHook(() => useTranslation(), { wrapper })
    
    // Should not throw when accessing non-existent keys
    expect(() => {
      const nonExistent = result.current.t.nonExistent?.key
    }).not.toThrow()
  })
}) 