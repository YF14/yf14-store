import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { NextSeo } from 'next-seo';
import AdminLayout from '../../components/admin/AdminLayout';
import useAuthStore from '../../store/authStore';
import { useLang } from '../../contexts/LanguageContext';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { formatIQD } from '../../lib/currency';

export default function AdminUsersPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const { t } = useLang();
  const a = t.admin;
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    if (user && user.role !== 'admin') router.push('/');
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading } = useQuery(
    ['admin-users', page, debouncedSearch],
    () => {
      const params = new URLSearchParams({ page, limit: 20 });
      if (debouncedSearch) params.append('search', debouncedSearch);
      return api.get(`/users?${params}`).then((r) => r.data);
    },
    { enabled: !!user && user.role === 'admin', keepPreviousData: true }
  );

  const users = data?.users || [];
  const pages = data?.pages || 1;
  const total = data?.total || 0;

  const toggleStatus = useMutation(
    ({ id, isActive }) => api.patch(`/users/${id}/status`, { isActive }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-users');
        toast.success(a.statusUpdatedSuccess);
      },
      onError: () => toast.error(a.failedUpdateCustomer),
    }
  );

  if (!user || user.role !== 'admin') return null;

  return (
    <AdminLayout>
      <NextSeo title={`${a.customers} — Admin`} />
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-light">{a.customers}</h1>
          <p className="text-sm text-brand-warm-gray">{total} {a.registeredCustomers}</p>
        </div>
      </div>

      <div className="mb-6">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={a.searchCustomers}
          className="input-luxury max-w-xs"
        />
      </div>

      <div className="bg-white border border-brand-black/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-brand-black/10">
            <tr>
              <th className="text-start px-4 py-3 text-xs tracking-widest uppercase text-brand-warm-gray font-medium">{a.customer}</th>
              <th className="text-start px-4 py-3 text-xs tracking-widest uppercase text-brand-warm-gray font-medium hidden md:table-cell">{a.email}</th>
              <th className="text-start px-4 py-3 text-xs tracking-widest uppercase text-brand-warm-gray font-medium hidden sm:table-cell">{a.registered}</th>
              <th className="text-start px-4 py-3 text-xs tracking-widest uppercase text-brand-warm-gray font-medium">{a.ordersCount}</th>
              <th className="text-start px-4 py-3 text-xs tracking-widest uppercase text-brand-warm-gray font-medium hidden lg:table-cell">{a.totalSpent}</th>
              <th className="text-start px-4 py-3 text-xs tracking-widest uppercase text-brand-warm-gray font-medium">{a.statusLabel}</th>
              <th className="text-end px-4 py-3 text-xs tracking-widest uppercase text-brand-warm-gray font-medium">{a.actions}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-brand-black/5">
                  <td className="px-4 py-3" colSpan={7}><div className="h-5 skeleton" /></td>
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12 text-brand-warm-gray">{a.noCustomersFound}</td></tr>
            ) : (
              users.map((u) => (
                <tr key={u._id} className="border-b border-brand-black/5 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-gold/10 text-brand-gold flex items-center justify-center text-xs font-medium flex-shrink-0">
                        {(u.firstName?.[0] || '').toUpperCase()}{(u.lastName?.[0] || '').toUpperCase()}
                      </div>
                      <span className="font-medium text-sm">{u.firstName} {u.lastName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-brand-warm-gray hidden md:table-cell">{u.email}</td>
                  <td className="px-4 py-3 text-brand-warm-gray text-xs hidden sm:table-cell">
                    {new Date(u.createdAt).toLocaleDateString(t.lang === 'ar' ? 'ar-IQ' : 'en-US')}
                  </td>
                  <td className="px-4 py-3"><span className="font-medium">{u.ordersCount}</span></td>
                  <td className="px-4 py-3 text-brand-warm-gray hidden lg:table-cell">{formatIQD(u.totalSpent)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 ${u.isActive !== false ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                      {u.isActive !== false ? a.active : a.inactive}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-end">
                    <button
                      onClick={() => toggleStatus.mutate({ id: u._id, isActive: u.isActive === false })}
                      disabled={toggleStatus.isLoading}
                      className={`text-xs px-3 py-1 border transition-colors ${
                        u.isActive !== false
                          ? 'border-red-200 text-red-400 hover:border-red-400 hover:text-red-600'
                          : 'border-green-200 text-green-600 hover:border-green-400 hover:text-green-700'
                      }`}
                    >
                      {u.isActive !== false ? a.deactivate : a.activate}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: pages }, (_, i) => (
            <button key={i} onClick={() => setPage(i + 1)} className={`w-9 h-9 text-xs border transition-colors ${page === i + 1 ? 'bg-brand-black text-white border-brand-black' : 'border-brand-black/20 hover:border-brand-gold text-brand-warm-gray'}`}>
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
