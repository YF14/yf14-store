/**
 * Locale-aware toast strings for code that runs OUTSIDE React (zustand stores,
 * plain helpers) where the useLang() hook isn't available. Reads the same
 * 'locale' key LanguageContext persists to localStorage. Defaults to Arabic.
 */
import en from './translations/en';
import ar from './translations/ar';

export function currentLocale() {
  if (typeof window === 'undefined') return 'ar';
  return localStorage.getItem('locale') === 'en' ? 'en' : 'ar';
}

/** Look up a key in the `toasts` table for the active locale, with an English fallback. */
export function tToast(key) {
  const dict = (currentLocale() === 'en' ? en : ar).toasts || {};
  return dict[key] || en.toasts?.[key] || key;
}
