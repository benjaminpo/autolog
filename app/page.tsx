'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './context/AuthContext';
import { useLanguage } from './context/LanguageContext';
import { ThemeToggle } from './components/ThemeToggle';
import { LanguageSelector } from './components/LanguageSelector';

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { language, setLanguage, t } = useLanguage();
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
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  🚗 AutoLog
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <LanguageSelector
                language={language}
                onChange={setLanguage}
              />
              <ThemeToggle />
              <button
                onClick={() => router.push('/auth/login')}
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                {t._('homepage.header.login')}
              </button>
              <button
                onClick={() => router.push('/auth/register')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                {t._('homepage.header.getStarted')}
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
              {t._('homepage.hero.title')}
              <span className="block text-blue-600 dark:text-blue-400">
                {t._('homepage.hero.subtitle')}
              </span>
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-600 dark:text-gray-300 leading-8">
              {t._('homepage.hero.description')}
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.push('/auth/register')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg font-medium transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                {t._('homepage.hero.startTrackingFree')}
              </button>
              <button
                onClick={() => router.push('/auth/login')}
                className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 px-8 py-3 rounded-lg text-lg font-medium transition-colors"
              >
                {t._('homepage.hero.signIn')}
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
              {t._('homepage.features.title')}
            </h2>
            <p className="mt-4 text-xl text-gray-600 dark:text-gray-300">
              {t._('homepage.features.description')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-gray-200 dark:border-gray-700">
              <div className="text-blue-600 dark:text-blue-400 text-3xl mb-4">⛽</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                {t._('homepage.features.fuelTracking.title')}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {t._('homepage.features.fuelTracking.description')}
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-gray-200 dark:border-gray-700">
              <div className="text-green-600 dark:text-green-400 text-3xl mb-4">💰</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                {t._('homepage.features.expenseManagement.title')}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {t._('homepage.features.expenseManagement.description')}
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-gray-200 dark:border-gray-700">
              <div className="text-purple-600 dark:text-purple-400 text-3xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                {t._('homepage.features.financialAnalytics.title')}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {t._('homepage.features.financialAnalytics.description')}
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-gray-200 dark:border-gray-700">
              <div className="text-orange-600 dark:text-orange-400 text-3xl mb-4">🚙</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                {t._('homepage.features.multiVehicleSupport.title')}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {t._('homepage.features.multiVehicleSupport.description')}
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-gray-200 dark:border-gray-700">
              <div className="text-red-600 dark:text-red-400 text-3xl mb-4">📱</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                {t._('homepage.features.mobileReady.title')}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {t._('homepage.features.mobileReady.description')}
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-gray-200 dark:border-gray-700">
              <div className="text-teal-600 dark:text-teal-400 text-3xl mb-4">📈</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                {t._('homepage.features.incomeTracking.title')}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {t._('homepage.features.incomeTracking.description')}
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
              {t._('homepage.benefits.title')}
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
                    {t._('homepage.benefits.saveMoney.title')}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    {t._('homepage.benefits.saveMoney.description')}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold">✓</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {t._('homepage.benefits.stayOrganized.title')}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    {t._('homepage.benefits.stayOrganized.description')}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold">✓</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {t._('homepage.benefits.makeInformedDecisions.title')}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    {t._('homepage.benefits.makeInformedDecisions.description')}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 rounded-2xl text-white">
              <h3 className="text-2xl font-bold mb-4">{t._('homepage.benefits.cta.title')}</h3>
              <p className="text-blue-100 mb-6">
                {t._('homepage.benefits.cta.description')}
              </p>
              <button
                onClick={() => router.push('/auth/register')}
                className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg"
              >
                {t._('homepage.benefits.cta.createAccount')}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400 mb-4">🚗 AutoLog</div>
            <p className="text-gray-400 mb-8">
              {t._('homepage.footer.description')}
            </p>
            <div className="flex justify-center space-x-6">
              <button
                onClick={() => router.push('/auth/login')}
                className="text-gray-400 hover:text-white transition-colors"
              >
                {t._('homepage.footer.login')}
              </button>
              <button
                onClick={() => router.push('/auth/register')}
                className="text-gray-400 hover:text-white transition-colors"
              >
                {t._('homepage.footer.register')}
              </button>
            </div>
            <div className="mt-8 pt-8 border-t border-gray-800 text-gray-500 text-sm">
              <p>{t._('homepage.footer.copyright')}</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 