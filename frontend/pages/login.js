import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { NextSeo } from 'next-seo';
import useAuthStore from '../store/authStore';
import { useLang } from '../contexts/LanguageContext';

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const isLoading = useAuthStore((s) => s.isLoading);
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const { t, isRTL } = useLang();

  const GOOGLE_ERRORS = {
    google_failed: isRTL ? 'فشل تسجيل الدخول بـ Google. يرجى المحاولة مرة أخرى.' : 'Google sign-in failed. Please try again.',
    account_deactivated: isRTL ? 'تم تعطيل حسابك. يرجى التواصل مع الدعم.' : 'Your account has been deactivated. Please contact support.',
  };

  useEffect(() => {
    if (router.query.error) setError(GOOGLE_ERRORS[router.query.error] || t.errors.genericError);
  }, [router.query.error, isRTL]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const result = await login(form.email, form.password);
    if (result.success) {
      router.push(router.query.redirect || '/');
    } else if (result.code === 'google_sign_in_only') {
      setError(t.errors.googleSignInOnly);
    } else {
      setError(result.error || t.errors.loginFailed);
    }
  };

  return (
    <>
      <NextSeo title={t.auth.signIn} />
      <div className="min-h-screen grid md:grid-cols-2">
        {/* Image panel */}
        <div className={`hidden md:block relative ${isRTL ? 'order-2' : 'order-1'}`}>
          <Image
            src="https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=900&q=80"
            alt="Fashion"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-end pb-16 px-12">
            <Link href="/" className="text-white font-display text-4xl tracking-[0.2em] mb-4">YF14 Store</Link>
            <p className="text-white/75 font-display text-base md:text-lg tracking-wide text-center">{t.footer.tagline}</p>
          </div>
        </div>

        {/* Form panel */}
        <div className={`flex items-center justify-center p-8 bg-brand-cream ${isRTL ? 'order-1' : 'order-2'}`}>
          <div className="w-full max-w-md">
            <div className="mb-10 md:hidden">
              <Link href="/" className="font-display text-3xl tracking-[0.2em] text-brand-black">YF14 Store</Link>
            </div>

            <h1 className="font-display text-4xl font-light mb-2">{t.auth.signInTitle}</h1>
            <p className="text-sm text-brand-warm-gray mb-10">{t.auth.signInSubtitle}</p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs tracking-widest uppercase mb-2">{t.auth.email}</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                  className="input-luxury"
                  placeholder="your@email.com"
                  required
                  autoComplete="email"
                  dir="ltr"
                />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <label className="block text-xs tracking-widest uppercase">{t.auth.password}</label>
                  <Link href="/forgot-password" className="text-xs text-brand-warm-gray hover:text-brand-gold transition-colors">
                    {t.auth.forgotPassword}
                  </Link>
                </div>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
                  className="input-luxury"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  dir="ltr"
                />
              </div>

              <button type="submit" disabled={isLoading} className="btn-primary w-full mt-8">
                {isLoading ? t.common.loading : t.auth.signIn}
              </button>
            </form>

            <div className="divider-luxury my-8">
              <span className="text-xs text-brand-warm-gray tracking-widest uppercase">{t.common.or}</span>
            </div>

            <a
              href={`${process.env.NEXT_PUBLIC_API_URL}/auth/google`}
              className="btn-outline w-full flex items-center justify-center gap-3"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {t.auth.continueWithGoogle}
            </a>

            <p className="text-center text-sm text-brand-warm-gray mt-8">
              {t.auth.noAccount}{' '}
              <Link href="/register" className="text-brand-black hover:text-brand-gold transition-colors underline">
                {t.auth.createOne}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
