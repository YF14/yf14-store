import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { NextSeo } from 'next-seo';
import Layout from '../../components/layout/Layout';
import useAuthStore from '../../store/authStore';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [form, setForm] = useState({ firstName: '', lastName: '', email: '' });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    setForm({ firstName: user.firstName, lastName: user.lastName, email: user.email });
  }, [user]);

  const updateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put('/users/profile', form);
      setUser(data.user);
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) { toast.error('Passwords do not match'); return; }
    if (passwords.newPassword.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setSaving(true);
    try {
      await api.put('/users/change-password', { currentPassword: passwords.currentPassword, newPassword: passwords.newPassword });
      toast.success('Password changed successfully');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <Layout>
      <NextSeo title="Profile Settings" />
      <div className="container-luxury py-12">
        <Link href="/account" className="text-sm text-brand-warm-gray hover:text-brand-gold mb-6 inline-block">← Account</Link>
        <h1 className="font-display text-4xl font-light mb-10">Profile Settings</h1>

        <div className="grid md:grid-cols-2 gap-10 max-w-3xl">
          {/* Personal Info */}
          <div>
            <h2 className="font-display text-2xl font-light mb-6">Personal Information</h2>
            <form onSubmit={updateProfile} className="space-y-4">
              <div>
                <label className="block text-xs tracking-widest uppercase mb-2">First Name</label>
                <input value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} className="input-luxury" required />
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase mb-2">Last Name</label>
                <input value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} className="input-luxury" required />
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase mb-2">Email</label>
                <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} type="email" className="input-luxury" required />
              </div>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>

          {/* Change Password */}
          <div>
            <h2 className="font-display text-2xl font-light mb-6">Change Password</h2>
            <form onSubmit={changePassword} className="space-y-4">
              <div>
                <label className="block text-xs tracking-widest uppercase mb-2">Current Password</label>
                <input type="password" value={passwords.currentPassword} onChange={e => setPasswords(p => ({ ...p, currentPassword: e.target.value }))} className="input-luxury" required />
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase mb-2">New Password</label>
                <input type="password" value={passwords.newPassword} onChange={e => setPasswords(p => ({ ...p, newPassword: e.target.value }))} className="input-luxury" required />
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase mb-2">Confirm New Password</label>
                <input type="password" value={passwords.confirmPassword} onChange={e => setPasswords(p => ({ ...p, confirmPassword: e.target.value }))} className="input-luxury" required />
              </div>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Changing...' : 'Change Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}
