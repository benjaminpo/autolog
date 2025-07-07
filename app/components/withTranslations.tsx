"use client";

import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { EnhancedTranslationType } from '../translations';

/**
 * Higher-order component (HOC) that injects translation context into components
 * This allows us to gradually migrate components to use the new translation system
 * without breaking existing components that expect translations as props
 */
export function withTranslations<T>(
  Component: React.ComponentType<T & { t?: EnhancedTranslationType }>
): React.FC<Omit<T & { t?: EnhancedTranslationType }, 't'>> {
  // Create a wrapper component that maintains the original component's props structure
  const WrappedComponent = (props: Omit<T & { t?: EnhancedTranslationType }, 't'>) => {
    // Get translations from context
    const { t } = useLanguage();

    // Pass the translation object directly to allow proper nested access
    const allProps = { ...props, t } as T & { t: EnhancedTranslationType };

    return <Component {...allProps} />;
  };

  // Set display name for better debugging
  const componentName = Component.displayName || Component.name || 'Component';
  WrappedComponent.displayName = `withTranslations(${componentName})`;

  return WrappedComponent;
}

export default withTranslations;
