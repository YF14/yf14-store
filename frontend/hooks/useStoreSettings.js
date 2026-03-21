import { useQuery } from 'react-query';
import api from '../lib/api';

export const STORE_LOGO_FALLBACK = '/logo-yf14.png';

export function useStoreSettings() {
  return useQuery(
    ['store-settings'],
    () => api.get('/settings').then((r) => r.data),
    { staleTime: 10 * 60 * 1000, retry: 1 }
  );
}

export function useStoreLogoSrc() {
  const { data } = useStoreSettings();
  return data?.logoUrl || STORE_LOGO_FALLBACK;
}
