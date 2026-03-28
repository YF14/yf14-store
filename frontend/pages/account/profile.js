import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { NextSeo } from 'next-seo';
import Layout from '../../components/layout/Layout';
import useAuthStore from '../../store/authStore';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { useLang } from '../../contexts/LanguageContext';

export default function ProfilePage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isAuthReady = useAuthStore((s) => s.isAuthReady);
  const setUser = useAuthStore((s) => s.setUser);
  const { t, isRTL } = useLang();

  const [form, setForm] = useState({ firstName: '', lastName: '', email: '' });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isAuthReady) return;
    if (!user) { router.push('/login'); return; }
    setForm({ firstName: user.firstName, lastName: user.lastName, email: user.email });
  }, [user, isAuthReady]);

  const updateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put('/users/profile', form);
      setUser(data.user);
      toast.success(t.success.profileUpdated);
    } catch (err) {
      toast.error(err.response?.data?.error || t.errors.genericError);
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) { toast.error(t.errors.passwordMismatch); return; }
    if (passwords.newPassword.length < 8) { toast.error(t.errors.shortPassword); return; }
    setSaving(true);
    try {
      await api.put('/users/change-password', { currentPassword: passwords.currentPassword, newPassword: passwords.newPassword });
      toast.success(t.success.passwordChanged);
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || t.errors.genericError);
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <Layout>
      <NextSeo title={t.account.profileSettings} />
      <div className="container-luxury py-12" dir={isRTL ? 'rtl' : 'ltr'}>
        <Link href="/account" className="text-sm text-brand-warm-gray hover:text-brand-gold mb-6 inline-block">
          ← {t.account.backToAccount}
        </Link>
        <h1 className="font-display text-4xl font-light mb-10">{t.account.profileSettings}</h1>

        <div className="grid md:grid-cols-2 gap-10 max-w-3xl">
          <div>
            <h2 className="font-display text-2xl font-light mb-6">{t.account.personalInformation}</h2>
            <form onSubmit={updateProfile} className="space-y-4">
              <div>
                <label className="block text-xs tracking-widest uppercase mb-2">{t.auth.firstName}</label>
                <input value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} className="input-luxury" required />
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase mb-2">{t.auth.lastName}</label>
                <input value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} className="input-luxury" required />
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase mb-2">{t.auth.email}</label>
                <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} type="email" className="input-luxury" required dir="ltr" />
              </div>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? t.account.saving : t.account.saveChanges}
              </button>
            </form>
          </div>

          <div>
            <h2 className="font-display text-2xl font-light mb-6">{t.account.changePassword}</h2>
            <form onSubmit={changePassword} className="space-y-4">
              <div>
                <label className="block text-xs tracking-widest uppercase mb-2">{t.account.currentPassword}</label>
                <input type="password" value={passwords.currentPassword} onChange={e => setPasswords(p => ({ ...p, currentPassword: e.target.value }))} className="input-luxury" required />
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase mb-2">{t.account.newPassword}</label>
                <input type="password" value={passwords.newPassword} onChange={e => setPasswords(p => ({ ...p, newPassword: e.target.value }))} className="input-luxury" required />
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase mb-2">{t.account.confirmNewPassword}</label>
                <input type="password" value={passwords.confirmPassword} onChange={e => setPasswords(p => ({ ...p, confirmPassword: e.target.value }))} className="input-luxury" required />
              </div>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? t.account.changingPassword : t.account.changePasswordBtn}
              </button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}
