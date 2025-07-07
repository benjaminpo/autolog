"use client";

import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Modals } from './modals';

// This is a wrapper component that injects translations from context
// into the original Modals component
export function TranslatedModals(props: Omit<React.ComponentProps<typeof Modals>, 't'>) {
  // Get translations from context
  const { t } = useLanguage();

  // Pass down all props plus the translation object
  return <Modals t={t as any} {...props} />;
}

export default TranslatedModals;
