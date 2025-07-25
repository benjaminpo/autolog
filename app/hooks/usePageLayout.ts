import { useAuth } from '../context/AuthContext';
import { useTranslation } from './useTranslation';

/**
 * Common hook for page layout logic including auth state and translations
 */
export function usePageLayout() {
  const { user, loading } = useAuth();
  const { t } = useTranslation();

  return {
    user,
    loading,
    t,
    isAuthenticated: !!user,
  };
}
