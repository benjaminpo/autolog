import { useLanguage } from '../context/LanguageContext';

export function useTranslation() {
  const { t } = useLanguage();
  return { t: t as any };
}
