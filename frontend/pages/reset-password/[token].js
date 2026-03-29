import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { NextSeo } from 'next-seo';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { useLang } from '../../contexts/LanguageContext';
import useAuthStore from '../../store/authStore';

/** Same rule as register + backend reset-password validation */
const PASSWORD_STRENGTH = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;

function isValidResetToken(t) {
  return typeof t === 'string' && /^[a-f0-9]{64}$/i.test(t);
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const { t, isRTL } = useLang();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const token = router.query?.token;
  const ready = router.isReady;
  const invalidToken = ready && !isValidResetToken(token);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValidResetToken(token)) return;
    if (password !== confirm) {
      toast.error(t.errors.passwordMismatch);
      return;
    }
    if (password.length < 8) {
      toast.error(t.errors.shortPassword);
      return;
    }
    if (!PASSWORD_STRENGTH.test(password)) {
      toast.error(t.auth.registerPasswordWeak);
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post(`/auth/reset-password/${encodeURIComponent(token)}`, { password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('refreshToken', data.refreshToken);
      useAuthStore.setState({
        user: data.user,
        token: data.token,
        refreshToken: data.refreshToken,
      });
      toast.success(t.success.passwordChanged);
      router.replace('/');
    } catch (err) {
      const detail =
        err.response?.data?.details?.[0]?.message || err.response?.data?.details?.[0]?.msg;
      const msg = detail || err.response?.data?.error || t.errors.genericError;
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <NextSeo title={t.auth.setNewPasswordTitle} />
      <div className="min-h-screen bg-brand-cream flex items-center justify-center p-8" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="w-full max-w-md">
          <Link href="/" className="font-display text-3xl tracking-[0.2em] text-brand-black block mb-10">
            {t.siteName}
          </Link>

          {!ready ? (
            <p className="text-sm text-brand-warm-gray text-center py-12">{t.common.loading}</p>
          ) : invalidToken ? (
            <div className="text-center space-y-6">
              <p className="text-sm text-red-700 bg-red-50 border border-red-200 px-4 py-3 rounded-lg">{t.auth.resetLinkInvalid}</p>
              <Link href="/forgot-password" className="btn-primary inline-block">
                {t.auth.sendReset}
              </Link>
              <p>
                <Link href="/login" className="text-sm text-brand-warm-gray hover:text-brand-gold underline">
                  ← {t.auth.backToLogin}
                </Link>
              </p>
            </div>
          ) : (
            <>
              <h1 className="font-display text-4xl font-light mb-2">{t.auth.setNewPasswordTitle}</h1>
              <p className="text-sm text-brand-warm-gray mb-2">{t.auth.setNewPasswordSubtitle}</p>
              <p className="text-xs text-brand-warm-gray mb-8">{t.auth.registerPasswordHint}</p>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs tracking-widest uppercase mb-2">{t.account.newPassword}</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-luxury"
                    required
                    autoComplete="new-password"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-xs tracking-widest uppercase mb-2">{t.account.confirmNewPassword}</label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="input-luxury"
                    required
                    autoComplete="new-password"
                    dir="ltr"
                  />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full">
                  {loading ? t.common.loading : t.auth.saveNewPassword}
                </button>
              </form>
              <p className="text-center text-sm text-brand-warm-gray mt-8">
                <Link href="/login" className="hover:text-brand-gold transition-colors underline">
                  ← {t.auth.backToLogin}
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
}
