import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { NextSeo } from 'next-seo';
import useAuthStore from '../store/authStore';

export default function RegisterPage() {
  const router = useRouter();
  const register = useAuthStore((s) => s.register);
  const isLoading = useAuthStore((s) => s.isLoading);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');

  const update = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return; }
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    const result = await register({ firstName: form.firstName, lastName: form.lastName, email: form.email, password: form.password });
    if (result.success) {
      router.push('/');
    } else {
      setError(result.error);
    }
  };

  return (
    <>
      <NextSeo title="Create Account" />
      <div className="min-h-screen grid md:grid-cols-2">
        {/* Left image */}
        <div className="hidden md:block relative">
          <Image src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=900&q=80" alt="Fashion" fill className="object-cover" />
          <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-end pb-16 px-12">
            <Link href="/" className="text-white font-display text-4xl tracking-[0.2em] mb-4">YF14 Store</Link>
            <p className="text-white/70 text-sm tracking-wider text-center">Join Our Exclusive Community</p>
          </div>
        </div>

        {/* Form */}
        <div className="flex items-center justify-center p-8 bg-brand-cream">
          <div className="w-full max-w-md">
            <h1 className="font-display text-4xl font-light mb-2">Create Account</h1>
            <p className="text-sm text-brand-warm-gray mb-10">Join YF14 Store and discover timeless elegance</p>

            {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 mb-6">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs tracking-widest uppercase mb-2">First Name</label>
                  <input type="text" value={form.firstName} onChange={update('firstName')} className="input-luxury" placeholder="Jane" required autoComplete="given-name" />
                </div>
                <div>
                  <label className="block text-xs tracking-widest uppercase mb-2">Last Name</label>
                  <input type="text" value={form.lastName} onChange={update('lastName')} className="input-luxury" placeholder="Doe" required autoComplete="family-name" />
                </div>
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase mb-2">Email</label>
                <input type="email" value={form.email} onChange={update('email')} className="input-luxury" placeholder="your@email.com" required autoComplete="email" />
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase mb-2">Password</label>
                <input type="password" value={form.password} onChange={update('password')} className="input-luxury" placeholder="Min. 8 characters" required autoComplete="new-password" />
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase mb-2">Confirm Password</label>
                <input type="password" value={form.confirmPassword} onChange={update('confirmPassword')} className="input-luxury" placeholder="Repeat password" required autoComplete="new-password" />
              </div>
              <p className="text-xs text-brand-warm-gray">
                By creating an account, you agree to our{' '}
                <Link href="/terms" className="underline hover:text-brand-gold">Terms</Link>{' '}and{' '}
                <Link href="/privacy" className="underline hover:text-brand-gold">Privacy Policy</Link>.
              </p>
              <button type="submit" disabled={isLoading} className="btn-primary w-full mt-2">
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>

            <div className="divider-luxury my-8">
              <span className="text-xs text-brand-warm-gray tracking-widest uppercase">or</span>
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
              Continue with Google
            </a>

            <p className="text-center text-sm text-brand-warm-gray mt-8">
              Already have an account?{' '}
              <Link href="/login" className="text-brand-black hover:text-brand-gold transition-colors underline">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
