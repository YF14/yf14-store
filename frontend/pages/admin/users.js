import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { NextSeo } from 'next-seo';
import AdminLayout from '../../components/admin/AdminLayout';
import useAuthStore from '../../store/authStore';
import { ADMIN_PERMISSION_KEYS, canAccessAdmin, hasAdminPermission, getDefaultAdminPath } from '../../lib/adminAccess';
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
  const c = t.common;
  const permLabels = a.permissionLabels || {};
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('user');
  const [accessUser, setAccessUser] = useState(null);
  const [draftRole, setDraftRole] = useState('staff');
  const [draftPerms, setDraftPerms] = useState([]);

  const canView = !!user && canAccessAdmin(user) && hasAdminPermission(user, 'users');

  useEffect(() => {
    if (!user) router.push('/login');
    else if (!canAccessAdmin(user)) router.push('/');
    else if (!hasAdminPermission(user, 'users')) router.replace(getDefaultAdminPath(user));
  }, [user, router]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading } = useQuery(
    ['admin-users', page, debouncedSearch, roleFilter],
    () => {
      const params = new URLSearchParams({ page, limit: 20, role: roleFilter });
      if (debouncedSearch) params.append('search', debouncedSearch);
      return api.get(`/users?${params}`).then((r) => r.data);
    },
    { enabled: canView, keepPreviousData: true }
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

  const saveAccess = useMutation(
    ({ id, role, adminPermissions }) => api.patch(`/users/${id}/access`, { role, adminPermissions }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-users');
        toast.success(a.accessUpdated);
        setAccessUser(null);
      },
      onError: () => toast.error(a.accessUpdateFailed),
    }
  );

  const openAccess = (u) => {
    setAccessUser(u);
    setDraftRole(u.role === 'staff' ? 'staff' : 'user');
    setDraftPerms(Array.isArray(u.adminPermissions) ? [...u.adminPermissions] : []);
  };

  const togglePerm = (key) => {
    setDraftPerms((prev) => (prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]));
  };

  const submitAccess = () => {
    if (!accessUser) return;
    if (draftRole === 'staff' && draftPerms.length === 0) {
      toast.error(a.staffPermissionsHint);
      return;
    }
    saveAccess.mutate({
      id: accessUser._id,
      role: draftRole,
      adminPermissions: draftRole === 'staff' ? draftPerms : [],
    });
  };

  if (!user || !canView) return null;

  return (
    <AdminLayout>
      <NextSeo title={`${a.customers} — Admin`} />
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-light">{a.customers}</h1>
          <p className="text-sm text-brand-warm-gray">{total} {a.registeredCustomers}</p>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-4 items-center">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={a.searchCustomers}
          className="input-luxury max-w-xs"
        />
        <div className="flex gap-2 text-xs">
          {[
            { id: 'user', label: a.filterRoleCustomers },
            { id: 'staff', label: a.filterRoleStaff },
            { id: 'all', label: a.filterRoleAll },
          ].map((x) => (
            <button
              key={x.id}
              type="button"
              onClick={() => { setRoleFilter(x.id); setPage(1); }}
              className={`px-3 py-1.5 border transition-colors ${
                roleFilter === x.id
                  ? 'bg-brand-black text-white border-brand-black'
                  : 'border-brand-black/20 text-brand-warm-gray hover:border-brand-gold'
              }`}
            >
              {x.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-brand-black/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-brand-black/10">
            <tr>
              <th className="text-start px-4 py-3 text-xs tracking-widest uppercase text-brand-warm-gray font-medium">{a.customer}</th>
              <th className="text-start px-4 py-3 text-xs tracking-widest uppercase text-brand-warm-gray font-medium hidden md:table-cell">{a.email}</th>
              <th className="text-start px-4 py-3 text-xs tracking-widest uppercase text-brand-warm-gray font-medium hidden sm:table-cell">{a.registered}</th>
              <th className="text-start px-4 py-3 text-xs tracking-widest uppercase text-brand-warm-gray font-medium">{a.roleColumn}</th>
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
                  <td className="px-4 py-3" colSpan={8}><div className="h-5 skeleton" /></td>
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-12 text-brand-warm-gray">{a.noCustomersFound}</td></tr>
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
                    {new Date(u.createdAt).toLocaleDateString('en-US')}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 ${u.role === 'staff' ? 'bg-indigo-50 text-indigo-800' : 'bg-gray-100 text-brand-warm-gray'}`}>
                      {u.role === 'staff' ? a.roleStaff : a.roleCustomer}
                    </span>
                  </td>
                  <td className="px-4 py-3"><span className="font-medium">{u.ordersCount}</span></td>
                  <td className="px-4 py-3 text-brand-warm-gray hidden lg:table-cell">{formatIQD(u.totalSpent)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 ${u.isActive !== false ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                      {u.isActive !== false ? a.active : a.inactive}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-end space-y-1">
                    <div className="flex flex-col items-end gap-1">
                      <button
                        type="button"
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
                      {user.role === 'admin' && u.role !== 'admin' && (
                        <button
                          type="button"
                          onClick={() => openAccess(u)}
                          className="text-xs px-3 py-1 border border-brand-black/20 text-brand-gold hover:border-brand-gold"
                        >
                          {u.role === 'staff' ? a.staffAccessTitle : a.promoteToStaff}
                        </button>
                      )}
                    </div>
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

      {accessUser && user.role === 'admin' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          onClick={() => setAccessUser(null)}
        >
          <div
            className="bg-white border border-brand-black/10 max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-display text-xl font-light">{a.staffAccessTitle}</h2>
            <p className="text-sm text-brand-warm-gray">{a.staffAccessHelp}</p>
            <p className="text-sm font-medium">{accessUser.firstName} {accessUser.lastName} — {accessUser.email}</p>

            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="role"
                  checked={draftRole === 'user'}
                  onChange={() => setDraftRole('user')}
                />
                {a.roleCustomer}
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="role"
                  checked={draftRole === 'staff'}
                  onChange={() => setDraftRole('staff')}
                />
                {a.roleStaff}
              </label>
            </div>

            {draftRole === 'staff' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                {ADMIN_PERMISSION_KEYS.map((key) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer border border-brand-black/10 px-2 py-1.5 hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={draftPerms.includes(key)}
                      onChange={() => togglePerm(key)}
                    />
                    <span>{permLabels[key] || key}</span>
                  </label>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAccessUser(null)}
                className="text-xs px-4 py-2 border border-brand-black/20 text-brand-warm-gray hover:border-brand-black"
              >
                {c.cancel}
              </button>
              <button
                type="button"
                onClick={submitAccess}
                disabled={saveAccess.isLoading}
                className="text-xs px-4 py-2 bg-brand-black text-white border border-brand-black hover:bg-brand-gold hover:border-brand-gold disabled:opacity-50"
              >
                {a.saveAccess}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
