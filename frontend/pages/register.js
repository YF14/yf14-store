import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { NextSeo } from 'next-seo';
import useAuthStore from '../store/authStore';
import { useLang } from '../contexts/LanguageContext';

function DarkInput({ type = 'text', value, onChange, placeholder, required, autoComplete, dir }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      autoComplete={autoComplete}
      dir={dir}
      className="w-full min-h-[44px] px-4 py-3 rounded-lg text-base sm:text-sm font-body text-white placeholder-white/30 focus:outline-none transition-all duration-200"
      style={{
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.1)',
      }}
      onFocus={(e) => {
        e.target.style.border = '1px solid rgba(139,43,226,0.6)';
        e.target.style.boxShadow = '0 0 0 3px rgba(139,43,226,0.15)';
      }}
      onBlur={(e) => {
        e.target.style.border = '1px solid rgba(255,255,255,0.1)';
        e.target.style.boxShadow = 'none';
      }}
    />
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const register = useAuthStore((s) => s.register);
  const { t, isRTL } = useLang();
  const isLoading = useAuthStore((s) => s.isLoading);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');

  // Pre-fill from guest checkout query params
  useEffect(() => {
    const { firstName, lastName, email } = router.query;
    if (firstName || lastName || email) {
      setForm((f) => ({
        ...f,
        firstName: typeof firstName === 'string' ? firstName : f.firstName,
        lastName: typeof lastName === 'string' ? lastName : f.lastName,
        email: typeof email === 'string' ? email : f.email,
      }));
    }
  }, [router.query]);

  const update = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return; }
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    const result = await register({ firstName: form.firstName, lastName: form.lastName, email: form.email, password: form.password });
    if (result.success) {
      const r = router.query.redirect;
      const dest = typeof r === 'string' && r.startsWith('/') && !r.startsWith('//') ? r : '/';
      router.push(dest);
    } else {
      setError(result.error);
    }
  };

  return (
    <>
      <NextSeo title={t.auth.register} />
      <div className="min-h-screen grid md:grid-cols-2 bg-[#0f0f1a]">

        {/* Image panel */}
        <div className={`hidden md:block relative min-h-[420px] ${isRTL ? 'order-2' : 'order-1'}`}>
          <Image
            src="https://images.unsplash.com/photo-1539008835657-9e8e9680c956?auto=format&fit=crop&w=1600&q=88"
            alt=""
            fill
            className="object-cover object-[center_30%]"
            sizes="50vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20 flex flex-col items-center justify-end pb-16 px-12">
            <Link href="/" className="text-white font-display text-4xl tracking-[0.2em] mb-4 drop-shadow-lg">
              {t.siteName}
            </Link>
            <p className="text-white/70 text-sm tracking-wider text-center">
              {t.auth.registerSubtitle}
            </p>
          </div>
        </div>

        {/* Form panel */}
        <div
          className={`flex items-center justify-center p-6 sm:p-10 pb-[max(2rem,env(safe-area-inset-bottom,0px)+1rem)] min-h-[100dvh] md:min-h-0 ${isRTL ? 'order-1' : 'order-2'}`}
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          <div className="w-full max-w-md">

            {/* Mobile logo */}
            <div className="mb-8 md:hidden">
              <Link href="/" className="font-display text-3xl tracking-[0.2em] text-white">
                {t.siteName}
              </Link>
            </div>

            {/* Header */}
            <p className="text-brand-purple-light text-[11px] tracking-[0.25em] uppercase font-body mb-3">
              {isRTL ? 'انضم إلينا' : 'Join Us'}
            </p>
            <h1 className="font-display text-3xl md:text-4xl font-light text-white tracking-tight mb-2">
              {t.auth.registerTitle}
            </h1>
            <p className="text-white/50 text-sm font-body mb-8">{t.auth.registerSubtitle}</p>

            {error && (
              <div
                className="text-sm px-4 py-3 rounded-lg mb-6 font-body"
                style={{
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.25)',
                  color: '#fca5a5',
                }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] tracking-[0.2em] uppercase text-white/50 font-body mb-2">
                    {t.auth.firstName}
                  </label>
                  <DarkInput
                    type="text"
                    value={form.firstName}
                    onChange={update('firstName')}
                    required
                    autoComplete="given-name"
                  />
                </div>
                <div>
                  <label className="block text-[11px] tracking-[0.2em] uppercase text-white/50 font-body mb-2">
                    {t.auth.lastName}
                  </label>
                  <DarkInput
                    type="text"
                    value={form.lastName}
                    onChange={update('lastName')}
                    required
                    autoComplete="family-name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] tracking-[0.2em] uppercase text-white/50 font-body mb-2">
                  {t.auth.email}
                </label>
                <DarkInput
                  type="email"
                  value={form.email}
                  onChange={update('email')}
                  placeholder="your@email.com"
                  required
                  autoComplete="email"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-[11px] tracking-[0.2em] uppercase text-white/50 font-body mb-2">
                  {t.auth.password}
                </label>
                <DarkInput
                  type="password"
                  value={form.password}
                  onChange={update('password')}
                  required
                  autoComplete="new-password"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-[11px] tracking-[0.2em] uppercase text-white/50 font-body mb-2">
                  {t.auth.confirmPassword}
                </label>
                <DarkInput
                  type="password"
                  value={form.confirmPassword}
                  onChange={update('confirmPassword')}
                  required
                  autoComplete="new-password"
                  dir="ltr"
                />
              </div>

              <p className="text-[12px] text-white/35 font-body leading-relaxed pt-1">
                {t.auth.agreeToTerms}{' '}
                <Link href="/terms" className="text-brand-purple hover:text-white transition-colors underline underline-offset-4">
                  {t.auth.terms}
                </Link>{' '}
                {t.auth.and}{' '}
                <Link href="/privacy" className="text-brand-purple hover:text-white transition-colors underline underline-offset-4">
                  {t.auth.privacy}
                </Link>.
              </p>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full mt-2 rounded-lg disabled:opacity-60"
              >
                {isLoading ? t.common.loading : t.auth.register}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-4 my-7">
              <span className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
              <span className="text-[11px] text-white/35 tracking-widest uppercase font-body">{t.common.or}</span>
              <span className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
            </div>

            {/* Google */}
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL}/auth/google`}
              className="w-full min-h-[44px] inline-flex items-center justify-center gap-3 rounded-lg text-xs tracking-widest uppercase font-body font-medium transition-all duration-200"
              style={{
                border: '1px solid rgba(139,43,226,0.4)',
                color: '#c084fc',
                background: 'rgba(139,43,226,0.06)',
              }}
              onPointerEnter={(e) => {
                if (e.pointerType === 'touch') return;
                e.currentTarget.style.background = 'rgba(139,43,226,0.15)';
                e.currentTarget.style.borderColor = 'rgba(139,43,226,0.7)';
              }}
              onPointerLeave={(e) => {
                if (e.pointerType === 'touch') return;
                e.currentTarget.style.background = 'rgba(139,43,226,0.06)';
                e.currentTarget.style.borderColor = 'rgba(139,43,226,0.4)';
              }}
            >
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {t.auth.continueWithGoogle}
            </a>

            <p className="text-center text-sm text-white/40 font-body mt-8">
              {t.auth.hasAccount}{' '}
              <Link
                href="/login"
                className="text-brand-purple hover:text-white transition-colors underline underline-offset-4"
              >
                {t.auth.signInLink}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
