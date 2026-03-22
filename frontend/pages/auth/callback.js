import { useEffect } from 'react';
import { useRouter } from 'next/router';
import useAuthStore from '../../store/authStore';
import api from '../../lib/api';
import { useLang } from '../../contexts/LanguageContext';

export default function AuthCallbackPage() {
  const router = useRouter();
  const { t, isRTL } = useLang();

  useEffect(() => {
    if (!router.isReady) return;

    const { token, refreshToken, error } = router.query;

    if (error) {
      const msg = error === 'account_deactivated' ? 'account_deactivated' : 'google_failed';
      router.replace(`/login?error=${msg}`);
      return;
    }

    if (!token) {
      router.replace('/login?error=google_failed');
      return;
    }

    const rt = refreshToken || null;
    localStorage.setItem('token', token);
    if (rt) localStorage.setItem('refreshToken', rt);

    api.get('/auth/me')
      .then(({ data }) => {
        useAuthStore.setState({
          user: data.user,
          token: String(token),
          refreshToken: rt,
        });
        router.replace('/');
      })
      .catch(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        useAuthStore.setState({ user: null, token: null, refreshToken: null });
        router.replace('/login?error=google_failed');
      });
  }, [router.isReady]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-cream" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-brand-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-brand-warm-gray tracking-widest uppercase">{t.pages.signingIn}</p>
      </div>
    </div>
  );
}
