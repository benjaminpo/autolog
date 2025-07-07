'use client';

import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Navigation } from './Navigation';
import { SetStateAction, Dispatch } from 'react';

type TabType = 'lists' | 'stats';

// This is a wrapper component that injects translations from context
// into the original Navigation component
export function TranslatedNavigation(props: {
  onTabChange?: Dispatch<SetStateAction<TabType>>;
  activeTab?: TabType;
  showTabs?: boolean;
}) {
  // Get translations from context
  const { t } = useLanguage();

  // Pass down all props plus the translation object
  return <Navigation t={t as any} {...props} />;
}

export default TranslatedNavigation;
