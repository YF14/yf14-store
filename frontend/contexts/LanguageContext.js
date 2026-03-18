import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import ar from '../lib/translations/ar';
import en from '../lib/translations/en';

const translations = { ar, en };

const LanguageContext = createContext({
  locale: 'ar',
  t: ar,
  setLocale: () => {},
  isRTL: true,
});

export function LanguageProvider({ children }) {
  const [locale, setLocaleState] = useState('ar');

  // Hydrate from localStorage on mount
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('locale') : null;
    if (saved && translations[saved]) {
      setLocaleState(saved);
    }
  }, []);

  // Apply dir and lang to <html> and update document font
  useEffect(() => {
    const t = translations[locale];
    document.documentElement.setAttribute('lang', t.lang);
    document.documentElement.setAttribute('dir', t.dir);
    // Add/remove arabic font class
    if (locale === 'ar') {
      document.documentElement.classList.add('font-arabic');
    } else {
      document.documentElement.classList.remove('font-arabic');
    }
  }, [locale]);

  const setLocale = useCallback((newLocale) => {
    if (!translations[newLocale]) return;
    setLocaleState(newLocale);
    localStorage.setItem('locale', newLocale);
  }, []);

  const value = {
    locale,
    t: translations[locale],
    setLocale,
    isRTL: locale === 'ar',
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

// Short alias — use this in components: const { t, isRTL, locale, setLocale } = useLang();
export const useLang = useLanguage;
