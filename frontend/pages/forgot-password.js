import { useState } from 'react';
import Link from 'next/link';
import { NextSeo } from 'next-seo';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch { toast.error('Something went wrong. Please try again.'); }
    finally { setLoading(false); }
  };

  return (
    <>
      <NextSeo title="Forgot Password" />
      <div className="min-h-screen bg-brand-cream flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Link href="/" className="font-display text-3xl tracking-[0.2em] text-brand-black block mb-10">YF14 Store</Link>
          {sent ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-50 border border-green-200 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">✉</div>
              <h1 className="font-display text-3xl font-light mb-4">Check Your Email</h1>
              <p className="text-sm text-brand-warm-gray mb-8">If an account with that email exists, we've sent a password reset link.</p>
              <Link href="/login" className="btn-primary">Back to Login</Link>
            </div>
          ) : (
            <>
              <h1 className="font-display text-4xl font-light mb-2">Reset Password</h1>
              <p className="text-sm text-brand-warm-gray mb-10">Enter your email and we'll send you a reset link.</p>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs tracking-widest uppercase mb-2">Email Address</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-luxury" required placeholder="your@email.com" />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? 'Sending...' : 'Send Reset Link'}</button>
              </form>
              <p className="text-center text-sm text-brand-warm-gray mt-8">
                <Link href="/login" className="hover:text-brand-gold transition-colors underline">← Back to Login</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
}
