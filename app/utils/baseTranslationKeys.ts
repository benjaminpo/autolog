// Shared translation keys for merging in language files
import {
  validateEmailString,
  validatePasswordString
} from './validationHelpers';

export const baseTranslationKeys = {
  title: 'AutoLog',
  loading: 'Loading...',
  save: 'Save',
  cancel: 'Cancel',
  edit: 'Edit',
  delete: 'Delete',
  add: 'Add',
  close: 'Close',
  confirm: 'Confirm',
  submit: 'Submit',
  required: validateEmailString(''), // 'Email is required'
  optional: 'Optional',
  search: 'Search',
  filter: 'Filter',
  sort: 'Sort',
  reset: 'Reset',
  clear: 'Clear',
  back: 'Back',
  next: 'Next',
  previous: 'Previous',
  continue: 'Continue',
  finish: 'Finish',
  done: 'Done',
  success: 'Success',
  error: 'Error',
  warning: 'Warning',
  info: 'Info',
  income: 'Income',
  passwordRequired: validatePasswordString(''), // 'Password is required'
  // ...add more as needed
};
