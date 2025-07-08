'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './context/AuthContext';
import { ThemeToggle } from './components/ThemeToggle';

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [showLanding, setShowLanding] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (user) {
        // Redirect authenticated users to fuel-history page
        router.replace('/fuel-history');
      } else {
        // Show landing page for unauthenticated users
        setShowLanding(true);
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-800 transition-colors">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  if (!showLanding) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors">
      {/* Header */}
      <header className="relative z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  🚗 AutoLog
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <button
                onClick={() => router.push('/auth/login')}
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Login
              </button>
              <button
                onClick={() => router.push('/auth/register')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 sm:pt-24 sm:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl lg:text-6xl">
              Track Your Vehicle Expenses
              <span className="block text-blue-600 dark:text-blue-400">
                Like Never Before
              </span>
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-600 dark:text-gray-300 leading-8">
              Take control of your vehicle finances with AutoLog. Monitor fuel consumption, 
              track expenses, manage income, and get insights that help you save money.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.push('/auth/register')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg font-medium transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                Start Tracking Free
              </button>
              <button
                onClick={() => router.push('/auth/login')}
                className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 px-8 py-3 rounded-lg text-lg font-medium transition-colors"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
              Everything You Need to Manage Your Vehicle
            </h2>
            <p className="mt-4 text-xl text-gray-600 dark:text-gray-300">
              Comprehensive tools to track, analyze, and optimize your vehicle expenses
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-gray-200 dark:border-gray-700">
              <div className="text-blue-600 dark:text-blue-400 text-3xl mb-4">⛽</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Fuel Tracking
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Monitor fuel consumption, track prices, and analyze your vehicle's efficiency 
                with detailed fuel history and consumption statistics.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-gray-200 dark:border-gray-700">
              <div className="text-green-600 dark:text-green-400 text-3xl mb-4">💰</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Expense Management
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Track maintenance costs, repairs, insurance, and all vehicle-related expenses 
                with categorized entries and detailed reporting.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-gray-200 dark:border-gray-700">
              <div className="text-purple-600 dark:text-purple-400 text-3xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Financial Analytics
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Get insights into your spending patterns, fuel efficiency trends, 
                and comprehensive financial analysis to make informed decisions.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-gray-200 dark:border-gray-700">
              <div className="text-orange-600 dark:text-orange-400 text-3xl mb-4">🚙</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Multi-Vehicle Support
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Manage multiple vehicles with separate tracking for cars, motorcycles, 
                trucks, and other vehicle types with customizable settings.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-gray-200 dark:border-gray-700">
              <div className="text-red-600 dark:text-red-400 text-3xl mb-4">📱</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Mobile Ready
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Access your data anywhere with our responsive web app that works 
                perfectly on desktop, tablet, and mobile devices.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-gray-200 dark:border-gray-700">
              <div className="text-teal-600 dark:text-teal-400 text-3xl mb-4">📈</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Income Tracking
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Track vehicle-related income for rideshare, delivery, or business use 
                with detailed categorization and tax-ready reports.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
              Why Choose AutoLog?
            </h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold">✓</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Save Money
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Identify spending patterns and optimize your vehicle expenses to save hundreds of dollars annually.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold">✓</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Stay Organized
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Keep all your vehicle records in one place with easy-to-use categorization and search features.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold">✓</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Make Informed Decisions
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Use detailed analytics and reports to make smart decisions about maintenance, fuel, and vehicle purchases.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 rounded-2xl text-white">
              <h3 className="text-2xl font-bold mb-4">Ready to Get Started?</h3>
              <p className="text-blue-100 mb-6">
                Join thousands of users who are already saving money and staying organized with AutoLog.
              </p>
              <button
                onClick={() => router.push('/auth/register')}
                className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg"
              >
                Create Your Free Account
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-blue-400 mb-4">🚗 AutoLog</h3>
            <p className="text-gray-400 mb-8">
              Your complete vehicle expense tracking solution
            </p>
            <div className="flex justify-center space-x-6">
              <button
                onClick={() => router.push('/auth/login')}
                className="text-gray-400 hover:text-white transition-colors"
              >
                Login
              </button>
              <button
                onClick={() => router.push('/auth/register')}
                className="text-gray-400 hover:text-white transition-colors"
              >
                Register
              </button>
            </div>
            <div className="mt-8 pt-8 border-t border-gray-800 text-gray-500 text-sm">
              <p>&copy; 2024 AutoLog. Built for vehicle owners who care about their finances.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 