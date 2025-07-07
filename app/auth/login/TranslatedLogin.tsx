'use client';

import React from 'react';
import Login from './page'; // Importing the original Login component

// This is a wrapper component that injects translations from context
// into the original Login component
export function TranslatedLogin() {
  // Pass translations to the Login component
  // No need to pass t explicitly since Login will use useLanguage directly
  return <Login />;
}

export default TranslatedLogin;
