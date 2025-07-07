'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef, Dispatch, SetStateAction } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { TranslationType } from '../translations';

type TabType = 'lists' | 'stats';

interface Language {
  [key: string]: string;
}

interface NavigationProps {
  onTabChange?: Dispatch<SetStateAction<TabType>>;
  activeTab?: TabType;
  showTabs?: boolean;
  t?: Language;
}

export function Navigation({ onTabChange, activeTab, showTabs = true, t }: NavigationProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Get translations from the LanguageContext
  const { t: contextT } = useLanguage();

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const isActive = (path: string) => {
    if (path !== '/' && pathname.startsWith(path)) return true;
    return false;
  };

  // Default text if translations aren't provided
  const defaultText = {
    profile: 'Profile',
    fuelTab: 'Fuel Entry',
    expenseTab: 'Expense Entry',
    listsTab: 'Manage Lists',
    statsTab: 'Statistics',
    fuelHistory: 'Fuel History',
    expenseHistory: 'Expense History',
    incomeHistory: 'Income History',
    addFuel: 'Add Fuel',
    addExpense: 'Add Expense',
    addIncome: 'Add Income',
    manageLists: 'Manage Lists',
    statistics: 'Statistics',
    financialAnalysis: 'Financial Analysis',
    import: 'Import Data',
    export: 'Export Data',
    manageCategories: 'Manage Categories',
    menu: 'Menu',
    sections: 'Sections'
  };

  // Use translations with proper fallback priority
  const getText = (key: keyof typeof defaultText) => {
    // First check prop t (passed from TranslatedNavigation)
    if (t && typeof t === 'object') {
      // Check navigation namespace first
      if ((t as any)?.navigation && key in (t as any).navigation) {
        const value = (t as any).navigation[key];
        if (typeof value === 'string') return value;
      }
      
      // Special handling for import and export
      if (key === 'import') {
        if ((t as any)?.navigation?.import) {
          return (t as any).navigation.import;
        }
        if ((t as any)?.import?.title) {
          return (t as any).import.title;
        }
      }
      if (key === 'export') {
        if ((t as any)?.navigation?.export) {
          return (t as any).navigation.export;
        }
        if ((t as any)?.export?.title) {
          return (t as any).export.title;
        }
      }
      
      // Check top-level keys
      if (key in (t as any)) {
        const value = (t as any)[key];
        if (typeof value === 'string') return value;
      }
    }
    
    // Then check global context translations - try navigation namespace first
    if ((contextT as any)?.navigation && key in (contextT as any).navigation) {
      const value = (contextT as any).navigation[key];
      return typeof value === 'string' ? value : defaultText[key];
    }
    
    // Then check top-level context translations
    else if (contextT && key in (contextT as any)) {
      const value = (contextT as any)[key as keyof TranslationType];
      return typeof value === 'string' ? value : defaultText[key];
    }
    
    // Finally use default text
    return defaultText[key];
  };

  // Get current page title for mobile menu
  const getCurrentPageTitle = () => {
    if (pathname === '/profile') return getText('profile');
    if (pathname.startsWith('/fuel-history')) return getText('fuelHistory');
    if (pathname.startsWith('/expense-history')) return getText('expenseHistory');
    if (pathname.startsWith('/income-history')) return getText('incomeHistory');
    if (pathname.startsWith('/add-fuel')) return getText('addFuel');
    if (pathname.startsWith('/add-expense')) return getText('addExpense');
    if (pathname.startsWith('/add-income')) return getText('addIncome');
    if (pathname.startsWith('/manage-categories')) return getText('manageCategories');
    if (pathname.startsWith('/manage-lists')) return getText('manageLists');
    if (pathname.startsWith('/statistics')) return getText('statistics');
    if (pathname.startsWith('/financial-analysis')) return getText('financialAnalysis');
    if (pathname.startsWith('/import')) return getText('import');
    if (pathname.startsWith('/export')) return getText('export');
    return 'Navigation';
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full flex-grow transition-colors" ref={menuRef}>
      <div className="max-w-7xl mx-auto">
        {/* Mobile Menu Button */}
        <div className="sm:hidden px-4 py-2 border-b dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800 transition-colors">
          <div className="font-medium text-gray-900 dark:text-gray-200">
            {getCurrentPageTitle()}
          </div>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center p-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-white dark:hover:bg-gray-700 rounded transition-colors"
            aria-label="Toggle menu"
            title="Toggle navigation menu"
          >
            <span className="mr-1 text-sm font-medium">{getText('menu')}</span>
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
              />
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        <div className={`sm:hidden ${menuOpen ? 'block' : 'hidden'} bg-white dark:bg-gray-800 transition-colors`}>
          <div className="px-2 pt-2 pb-3 space-y-1">
            {/* Main Navigation */}
            <div className="border-b dark:border-gray-700 pb-2 mb-2">
              <Link
                href="/fuel-history"
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  isActive('/fuel-history') 
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                    : 'text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
                onClick={() => setMenuOpen(false)}
              >
                {getText('fuelHistory')}
              </Link>
              <Link
                href="/expense-history"
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  isActive('/expense-history') 
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                    : 'text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
                onClick={() => setMenuOpen(false)}
              >
                {getText('expenseHistory')}
              </Link>
              <Link
                href="/income-history"
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  isActive('/income-history') 
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                    : 'text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
                onClick={() => setMenuOpen(false)}
              >
                {getText('incomeHistory')}
              </Link>
              <Link
                href="/add-fuel"
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  isActive('/add-fuel') 
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                    : 'text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
                onClick={() => setMenuOpen(false)}
              >
                {getText('addFuel')}
              </Link>
              <Link
                href="/add-expense"
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  isActive('/add-expense') 
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                    : 'text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
                onClick={() => setMenuOpen(false)}
              >
                {getText('addExpense')}
              </Link>
              <Link
                href="/add-income"
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  isActive('/add-income') 
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                    : 'text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
                onClick={() => setMenuOpen(false)}
              >
                {getText('addIncome')}
              </Link>
              <Link
                href="/manage-categories"
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  isActive('/manage-categories') 
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                    : 'text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
                onClick={() => setMenuOpen(false)}
              >
                {getText('manageCategories')}
              </Link>
              <Link
                href="/manage-lists"
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  isActive('/manage-lists') 
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                    : 'text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
                onClick={() => setMenuOpen(false)}
              >
                {getText('manageLists')}
              </Link>
              <Link
                href="/statistics"
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  isActive('/statistics') 
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                    : 'text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
                onClick={() => setMenuOpen(false)}
              >
                {getText('statistics')}
              </Link>
              <Link
                href="/financial-analysis"
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  isActive('/financial-analysis') 
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                    : 'text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
                onClick={() => setMenuOpen(false)}
              >
                {getText('financialAnalysis')}
              </Link>
              <Link
                href="/import"
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  isActive('/import') 
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                    : 'text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
                onClick={() => setMenuOpen(false)}
              >
                {getText('import')}
              </Link>
              <Link
                href="/export"
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  isActive('/export') 
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                    : 'text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
                onClick={() => setMenuOpen(false)}
              >
                {getText('export')}
              </Link>
              <Link
                href="/profile"
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  isActive('/profile') 
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                    : 'text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
                onClick={() => setMenuOpen(false)}
              >
                {getText('profile')}
              </Link>
            </div>
          </div>
        </div>

        {/* Desktop Menu */}
        <div className="hidden sm:block bg-white dark:bg-gray-800 transition-colors">
          <div className="flex border-b dark:border-gray-700">
            {/* Main Nav */}
            <div className="flex">
              <Link
                href="/fuel-history"
                className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                  isActive('/fuel-history')
                    ? 'border-blue-500 dark:border-blue-400 text-blue-500 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                {getText('fuelHistory')}
              </Link>
              <Link
                href="/expense-history"
                className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                  isActive('/expense-history')
                    ? 'border-blue-500 dark:border-blue-400 text-blue-500 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                {getText('expenseHistory')}
              </Link>
              <Link
                href="/income-history"
                className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                  isActive('/income-history')
                    ? 'border-blue-500 dark:border-blue-400 text-blue-500 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                {getText('incomeHistory')}
              </Link>
              <Link
                href="/add-fuel"
                className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                  isActive('/add-fuel')
                    ? 'border-blue-500 dark:border-blue-400 text-blue-500 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                {getText('addFuel')}
              </Link>
              <Link
                href="/add-expense"
                className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                  isActive('/add-expense')
                    ? 'border-blue-500 dark:border-blue-400 text-blue-500 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                {getText('addExpense')}
              </Link>
              <Link
                href="/add-income"
                className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                  isActive('/add-income')
                    ? 'border-blue-500 dark:border-blue-400 text-blue-500 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                {getText('addIncome')}
              </Link>
              <Link
                href="/manage-categories"
                className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                  isActive('/manage-categories')
                    ? 'border-blue-500 dark:border-blue-400 text-blue-500 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                {getText('manageCategories')}
              </Link>
              <Link
                href="/manage-lists"
                className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                  isActive('/manage-lists')
                    ? 'border-blue-500 dark:border-blue-400 text-blue-500 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                {getText('manageLists')}
              </Link>
              <Link
                href="/statistics"
                className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                  isActive('/statistics')
                    ? 'border-blue-500 dark:border-blue-400 text-blue-500 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                {getText('statistics')}
              </Link>
              <Link
                href="/financial-analysis"
                className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                  isActive('/financial-analysis')
                    ? 'border-blue-500 dark:border-blue-400 text-blue-500 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                {getText('financialAnalysis')}
              </Link>
              <Link
                href="/import"
                className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                  isActive('/import')
                    ? 'border-blue-500 dark:border-blue-400 text-blue-500 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                {getText('import')}
              </Link>
              <Link
                href="/export"
                className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                  isActive('/export')
                    ? 'border-blue-500 dark:border-blue-400 text-blue-500 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                {getText('export')}
              </Link>
              <Link
                href="/profile"
                className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                  isActive('/profile')
                    ? 'border-blue-500 dark:border-blue-400 text-blue-500 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                {getText('profile')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
