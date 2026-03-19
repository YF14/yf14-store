import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { NextSeo } from 'next-seo';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/admin/AdminLayout';
import useAuthStore from '../../store/authStore';
import api from '../../lib/api';

const EMPTY_FORM = {
  code: '',
  description: '',
  type: 'percentage',
  value: '',
  minOrderAmount: 0,
  maxDiscount: '',
  usageLimit: '',
  perUserLimit: 1,
  startDate: '',
  endDate: '',
  isActive: true,
};

function PromoModal({ promo, onClose, onSave }) {
  const [form, setForm] = useState(promo ? {
    ...promo,
    startDate: promo.startDate ? promo.startDate.slice(0, 10) : '',
    endDate: promo.endDate ? promo.endDate.slice(0, 10) : '',
    maxDiscount: promo.maxDiscount || '',
    usageLimit: promo.usageLimit || '',
  } : EMPTY_FORM);
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        code: form.code.toUpperCase(),
        value: Number(form.value),
        minOrderAmount: Number(form.minOrderAmount) || 0,
        maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : undefined,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
        perUserLimit: Number(form.perUserLimit) || 1,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
      };
      await onSave(payload);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save promo code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="font-display text-xl font-light">{promo ? 'Edit Promo Code' : 'New Promo Code'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-widest text-gray-500 mb-1">Code *</label>
              <input
                value={form.code}
                onChange={e => set('code', e.target.value.toUpperCase())}
                required
                className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-brand-gold font-mono uppercase"
                placeholder="SUMMER20"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-gray-500 mb-1">Type *</label>
              <select
                value={form.type}
                onChange={e => set('type', e.target.value)}
                className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-brand-gold"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount ($)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-widest text-gray-500 mb-1">
                {form.type === 'percentage' ? 'Discount %' : 'Discount Amount $'} *
              </label>
              <input
                type="number"
                min="0"
                max={form.type === 'percentage' ? 100 : undefined}
                step="0.01"
                value={form.value}
                onChange={e => set('value', e.target.value)}
                required
                className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-brand-gold"
              />
            </div>
            {form.type === 'percentage' && (
              <div>
                <label className="block text-xs uppercase tracking-widest text-gray-500 mb-1">Max Discount Cap ($)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.maxDiscount}
                  onChange={e => set('maxDiscount', e.target.value)}
                  className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-brand-gold"
                  placeholder="No cap"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-gray-500 mb-1">Description</label>
            <input
              value={form.description}
              onChange={e => set('description', e.target.value)}
              className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-brand-gold"
              placeholder="Optional internal note"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-widest text-gray-500 mb-1">Min Order Amount ($)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.minOrderAmount}
                onChange={e => set('minOrderAmount', e.target.value)}
                className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-brand-gold"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-gray-500 mb-1">Per User Limit</label>
              <input
                type="number"
                min="1"
                value={form.perUserLimit}
                onChange={e => set('perUserLimit', e.target.value)}
                className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-brand-gold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-widest text-gray-500 mb-1">Total Usage Limit</label>
              <input
                type="number"
                min="1"
                value={form.usageLimit}
                onChange={e => set('usageLimit', e.target.value)}
                className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-brand-gold"
                placeholder="Unlimited"
              />
            </div>
            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={e => set('isActive', e.target.checked)}
                  className="w-4 h-4 accent-brand-gold"
                />
                <span className="text-sm font-medium">Active</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-widest text-gray-500 mb-1">Start Date</label>
              <input
                type="date"
                value={form.startDate}
                onChange={e => set('startDate', e.target.value)}
                className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-brand-gold"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-gray-500 mb-1">End Date</label>
              <input
                type="date"
                value={form.endDate}
                onChange={e => set('endDate', e.target.value)}
                className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-brand-gold"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 text-white text-sm font-medium disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #9333ea, #db2777)' }}
            >
              {loading ? 'Saving...' : (promo ? 'Update Promo' : 'Create Promo')}
            </button>
            <button type="button" onClick={onClose} className="px-6 py-2.5 border border-gray-200 text-sm hover:border-gray-400 transition-colors">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminPromos() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [modal, setModal] = useState(null); // null | 'new' | promoObject

  useEffect(() => {
    if (user && user.role !== 'admin') router.push('/');
    if (!user) router.push('/login');
  }, [user]);

  const { data, isLoading } = useQuery('admin-promos', () =>
    api.get('/promos').then(r => r.data.promos), { enabled: !!user && user.role === 'admin' }
  );

  const saveMutation = useMutation(
    async ({ id, payload }) => {
      if (id) return api.put(`/promos/${id}`, payload);
      return api.post('/promos', payload);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-promos');
        toast.success('Promo code saved!');
      },
    }
  );

  const deleteMutation = useMutation(
    (id) => api.delete(`/promos/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-promos');
        toast.success('Promo code deleted');
      },
    }
  );

  const handleSave = (payload) => {
    const id = modal?._id;
    return saveMutation.mutateAsync({ id, payload });
  };

  const handleDelete = (id, code) => {
    if (!confirm(`Delete promo code "${code}"?`)) return;
    deleteMutation.mutate(id);
  };

  if (!user || user.role !== 'admin') return null;

  const promos = data || [];

  return (
    <AdminLayout>
      <NextSeo title="Promo Codes — Admin" />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-4xl font-light">Promo Codes</h1>
            <p className="text-sm text-brand-warm-gray mt-1">{promos.length} codes total</p>
          </div>
          <button
            onClick={() => setModal('new')}
            className="px-5 py-2.5 text-white text-sm font-medium"
            style={{ background: 'linear-gradient(135deg, #9333ea, #db2777)' }}
          >
            + New Promo Code
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-20 text-brand-warm-gray">Loading...</div>
        ) : promos.length === 0 ? (
          <div className="bg-white border border-brand-black/10 p-16 text-center">
            <p className="text-4xl mb-4">🏷️</p>
            <p className="font-display text-xl font-light mb-2">No promo codes yet</p>
            <p className="text-sm text-brand-warm-gray mb-6">Create your first promo code to offer discounts to your customers.</p>
            <button
              onClick={() => setModal('new')}
              className="px-6 py-3 text-white text-sm"
              style={{ background: 'linear-gradient(135deg, #9333ea, #db2777)' }}
            >
              Create Promo Code
            </button>
          </div>
        ) : (
          <div className="bg-white border border-brand-black/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-black/10 bg-gray-50">
                  <th className="text-left px-5 py-3 text-xs uppercase tracking-widest text-brand-warm-gray font-normal">Code</th>
                  <th className="text-left px-5 py-3 text-xs uppercase tracking-widest text-brand-warm-gray font-normal">Discount</th>
                  <th className="text-left px-5 py-3 text-xs uppercase tracking-widest text-brand-warm-gray font-normal hidden md:table-cell">Usage</th>
                  <th className="text-left px-5 py-3 text-xs uppercase tracking-widest text-brand-warm-gray font-normal hidden lg:table-cell">Expires</th>
                  <th className="text-left px-5 py-3 text-xs uppercase tracking-widest text-brand-warm-gray font-normal">Status</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-black/5">
                {promos.map((promo) => {
                  const isExpired = promo.endDate && new Date(promo.endDate) < new Date();
                  const isMaxed = promo.usageLimit && promo.usedCount >= promo.usageLimit;
                  const statusLabel = !promo.isActive ? 'Inactive' : isExpired ? 'Expired' : isMaxed ? 'Exhausted' : 'Active';
                  const statusColor = statusLabel === 'Active'
                    ? 'text-green-700 bg-green-50'
                    : 'text-red-700 bg-red-50';

                  return (
                    <tr key={promo._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4">
                        <div>
                          <span className="font-mono font-semibold text-brand-black tracking-wider">{promo.code}</span>
                          {promo.description && (
                            <p className="text-xs text-brand-warm-gray mt-0.5">{promo.description}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className="font-semibold"
                          style={{ color: '#9333ea' }}
                        >
                          {promo.type === 'percentage'
                            ? `${promo.value}% off`
                            : `$${promo.value} off`}
                        </span>
                        {promo.minOrderAmount > 0 && (
                          <p className="text-xs text-brand-warm-gray mt-0.5">Min. ${promo.minOrderAmount}</p>
                        )}
                        {promo.maxDiscount && (
                          <p className="text-xs text-brand-warm-gray">Cap: ${promo.maxDiscount}</p>
                        )}
                      </td>
                      <td className="px-5 py-4 hidden md:table-cell">
                        <span className="text-brand-black">{promo.usedCount}</span>
                        {promo.usageLimit && (
                          <span className="text-brand-warm-gray"> / {promo.usageLimit}</span>
                        )}
                        {!promo.usageLimit && <span className="text-brand-warm-gray"> / ∞</span>}
                      </td>
                      <td className="px-5 py-4 hidden lg:table-cell text-brand-warm-gray">
                        {promo.endDate
                          ? new Date(promo.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                          : 'No expiry'}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor}`}>
                          {statusLabel}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => setModal(promo)}
                            className="text-xs text-brand-gold hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(promo._id, promo.code)}
                            className="text-xs text-red-400 hover:text-red-600"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <PromoModal
          promo={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </AdminLayout>
  );
}
