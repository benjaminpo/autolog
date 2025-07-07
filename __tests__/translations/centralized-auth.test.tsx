import React from 'react';
import { render, screen } from '@testing-library/react';
import translations from '../../app/translations';

describe('Centralized Auth Translations', () => {
  describe('Translation Structure', () => {
    it('should have all required auth translation keys in English', () => {
      const t = translations.en;
      
      // Test login translations
      expect(t._('auth.login.title')).toBe('Login to AutoLog');
      expect(t._('auth.login.button')).toBe('Login');
      expect(t._('auth.login.prompt')).toBe('Already have an account?');
      expect(t._('auth.login.action')).toBe('Login');
      
      // Test register translations
      expect(t._('auth.register.title')).toBe('Create an Account');
      expect(t._('auth.register.button')).toBe('Register');
      expect(t._('auth.register.prompt')).toBe('Don\'t have an account?');
      expect(t._('auth.register.action')).toBe('Register');
      
      // Test field translations
      expect(t._('auth.fields.email')).toBe('Email');
      expect(t._('auth.fields.password')).toBe('Password');
      expect(t._('auth.fields.name')).toBe('Name');
      expect(t._('auth.fields.confirmPassword')).toBe('Confirm Password');
      expect(t._('auth.fields.currentPassword')).toBe('Current Password');
      expect(t._('auth.fields.newPassword')).toBe('New Password');
      
      // Test validation translations
      expect(t._('auth.validation.passwordMismatch')).toBe('Passwords do not match');
      expect(t._('auth.validation.passwordTooShort')).toBe('Password must be at least 8 characters long');
      expect(t._('auth.validation.emailCannotBeChanged')).toBe('Email cannot be changed');
      
      // Test OAuth translations
      expect(t._('auth.oauth.google')).toBe('Continue with Google');
      expect(t._('auth.oauth.or')).toBe('or');
      
      // Test action translations
      expect(t._('auth.actions.changePassword')).toBe('Change Password');
      expect(t._('auth.actions.accountInfo')).toBe('Account Information');
      expect(t._('auth.actions.saveChanges')).toBe('Save Changes');
    });

    it('should have all required auth translation keys in Chinese', () => {
      const t = translations.zh;
      
      // Test login translations
      expect(t._('auth.login.title')).toBe('登入 AutoLog');
      expect(t._('auth.login.button')).toBe('登入');
      expect(t._('auth.login.prompt')).toBe('已有帳戶？');
      expect(t._('auth.login.action')).toBe('登入');
      
      // Test register translations
      expect(t._('auth.register.title')).toBe('創建帳戶');
      expect(t._('auth.register.button')).toBe('註冊');
      expect(t._('auth.register.prompt')).toBe('還沒有帳戶？');
      expect(t._('auth.register.action')).toBe('註冊');
      
      // Test field translations
      expect(t._('auth.fields.email')).toBe('電子郵件');
      expect(t._('auth.fields.password')).toBe('密碼');
      expect(t._('auth.fields.name')).toBe('姓名');
      expect(t._('auth.fields.confirmPassword')).toBe('確認密碼');
      expect(t._('auth.fields.currentPassword')).toBe('目前密碼');
      expect(t._('auth.fields.newPassword')).toBe('新密碼');
      
      // Test validation translations
      expect(t._('auth.validation.passwordMismatch')).toBe('密碼不匹配');
      expect(t._('auth.validation.passwordTooShort')).toBe('密碼長度必須至少為8個字符');
      expect(t._('auth.validation.emailCannotBeChanged')).toBe('電子郵件不能更改');
      
      // Test OAuth translations
      expect(t._('auth.oauth.google')).toBe('使用 Google 繼續');
      expect(t._('auth.oauth.or')).toBe('或');
      
      // Test action translations
      expect(t._('auth.actions.changePassword')).toBe('更改密碼');
      expect(t._('auth.actions.accountInfo')).toBe('帳戶信息');
      expect(t._('auth.actions.saveChanges')).toBe('儲存更改');
    });
  });

  describe('Translation Function Behavior', () => {
    it('should return fallback for missing keys', () => {
      const t = translations.en;
      expect(t._('auth.nonexistent.key')).toBe('auth.nonexistent.key');
    });

    it('should handle nested key access correctly', () => {
      const t = translations.en;
      expect(t._('auth.login.title')).toBe('Login to AutoLog');
      expect(t._('auth.fields.email')).toBe('Email');
      expect(t._('auth.validation.passwordMismatch')).toBe('Passwords do not match');
    });

    it('should support string interpolation in translations', () => {
      const t = translations.en;
      // Test with a key that should support interpolation
      expect(t._('auth.login.title', { name: 'Test' })).toBe('Login to AutoLog');
    });
  });

  describe('Translation Consistency', () => {
    it('should have matching structure between English and Chinese', () => {
      const enKeys = getAllNestedKeys(translations.en, 'auth');
      const zhKeys = getAllNestedKeys(translations.zh, 'auth');
      
      expect(enKeys.sort()).toEqual(zhKeys.sort());
    });

    it('should not have empty translation values', () => {
      const enAuthKeys = getAllNestedKeys(translations.en, 'auth');
      const zhAuthKeys = getAllNestedKeys(translations.zh, 'auth');
      
      enAuthKeys.forEach(key => {
        expect(translations.en._(key)).toBeTruthy();
        expect(typeof translations.en._(key)).toBe('string');
      });
      
      zhAuthKeys.forEach(key => {
        expect(translations.zh._(key)).toBeTruthy();
        expect(typeof translations.zh._(key)).toBe('string');
      });
    });
  });

  describe('Type Safety', () => {
    it('should provide proper TypeScript types', () => {
      const t = translations.en;
      
      // These should compile without TypeScript errors
      expect(typeof t._).toBe('function');
      expect(typeof t._p).toBe('function');
      
      // Test that the return type is string
      const result = t._('auth.login.title');
      expect(typeof result).toBe('string');
    });
  });
});

// Helper function to get all nested keys for a specific namespace
function getAllNestedKeys(obj: any, namespace: string): string[] {
  const keys: string[] = [];
  
  function traverse(current: any, path: string[] = []) {
    if (typeof current === 'object' && current !== null) {
      Object.keys(current).forEach(key => {
        if (key === '_' || key === '_p') return; // Skip utility functions
        
        const newPath = [...path, key];
        if (newPath[0] === namespace) {
          if (typeof current[key] === 'string') {
            keys.push(newPath.join('.'));
          } else if (typeof current[key] === 'object') {
            traverse(current[key], newPath);
          }
        } else if (path.length === 0 && key === namespace) {
          traverse(current[key], newPath);
        }
      });
    }
  }
  
  traverse(obj);
  return keys;
} 