'use client';

import React from 'react';
import Register from './page'; // Importing the original Register component

// This is a wrapper component that injects translations from context
// into the original Register component
export function TranslatedRegister() {
  // Pass translations to the Register component
  // No need to pass t explicitly since Register will use useLanguage directly
  return <Register />;
}

export default TranslatedRegister;
