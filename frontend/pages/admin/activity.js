import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useQuery } from 'react-query';
import { NextSeo } from 'next-seo';
import AdminLayout from '../../components/admin/AdminLayout';
import useAuthStore from '../../store/authStore';
import { canAccessAdmin, hasAdminPermission, getDefaultAdminPath } from '../../lib/adminAccess';
import { useLang } from '../../contexts/LanguageContext';
import api from '../../lib/api';

const ENTITY_TYPES = ['product', 'order', 'category'];

function formatDetails(obj) {
  if (!obj || typeof obj !== 'object') return '—';
  try {
    return JSON.stringify(obj, null, 0);
  } catch {
    return String(obj);
  }
}

function normalizeEntityId(raw) {
  if (raw == null) return null;
  if (typeof raw === 'object' && raw._id != null) return String(raw._id);
  const s = String(raw).trim();
  return /^[a-f\d]{24}$/i.test(s) ? s : null;
}

function ActivityTargetCell({ row, user, openProductTitle }) {
  const productId = row.entityType === 'product' ? normalizeEntityId(row.entityId) : null;
  const label = row.entityLabel || productId || '—';
  const canOpenProduct = productId && hasAdminPermission(user, 'products');

  if (canOpenProduct) {
    return (
      <Link
        href={`/admin/products/${productId}/edit`}
        className="text-brand-gold hover:underline font-medium"
        title={openProductTitle}
      >
        {row.entityLabel || `Product ${productId.slice(-6)}`}
      </Link>
    );
  }

  return <span className="text-xs max-w-[200px] break-words inline-block">{label}</span>;
}

export default function AdminActivityPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { t, isRTL } = useLang();
  const a = t.admin;
  const labels = a.activityActionLabels || {};

  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');

  const canView = !!user && canAccessAdmin(user) && hasAdminPermission(user, 'activity');

  useEffect(() => {
    if (!user) router.push('/login');
    else if (!canAccessAdmin(user)) router.push('/');
    else if (!hasAdminPermission(user, 'activity')) router.replace(getDefaultAdminPath(user));
  }, [user, router]);

  useEffect(() => {
    setPage(1);
  }, [actionFilter, entityFilter]);

  const queryKey = ['admin-activity', page, actionFilter, entityFilter];
  const { data, isLoading, isError } = useQuery(
    queryKey,
    () => {
      const params = new URLSearchParams({ page: String(page), limit: '40' });
      if (actionFilter) params.set('action', actionFilter);
      if (entityFilter) params.set('entityType', entityFilter);
      return api.get(`/admin/activity?${params}`).then((r) => r.data);
    },
    { enabled: canView, keepPreviousData: true }
  );

  const logs = data?.logs || [];
  const pages = data?.pages || 1;

  const actionOptions = useMemo(() => Object.keys(labels).sort(), [labels]);

  if (!user || !canView) return null;

  return (
    <AdminLayout>
      <NextSeo title={`${a.activityPageTitle} — Admin`} />
      <h1 className="font-display text-3xl font-light mb-2">{a.activityPageTitle}</h1>
      <p className="text-sm text-brand-warm-gray mb-8 max-w-3xl">{a.activityPageHelp}</p>

      <div className={`flex flex-wrap gap-4 mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div>
          <label className="block text-[10px] tracking-widest uppercase text-brand-warm-gray mb-1">{a.activityFilterAction}</label>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="input-luxury text-sm py-2 min-w-[200px]"
          >
            <option value="">{a.activityAll}</option>
            {actionOptions.map((key) => (
              <option key={key} value={key}>
                {labels[key] || key}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] tracking-widest uppercase text-brand-warm-gray mb-1">{a.activityFilterEntity}</label>
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="input-luxury text-sm py-2 min-w-[160px]"
          >
            <option value="">{a.activityAll}</option>
            {ENTITY_TYPES.map((et) => (
              <option key={et} value={et}>
                {et}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isError && <p className="text-sm text-red-500 mb-4">{a.activityLoadFailed}</p>}

      <div className="bg-white border border-brand-black/10 overflow-x-auto">
        <table className="w-full text-sm min-w-[800px]">
          <thead>
            <tr className="border-b border-brand-black/10 text-left">
              <th className="p-3 text-xs tracking-widest uppercase text-brand-warm-gray font-normal">{a.activityWhen}</th>
              <th className="p-3 text-xs tracking-widest uppercase text-brand-warm-gray font-normal">{a.activityWho}</th>
              <th className="p-3 text-xs tracking-widest uppercase text-brand-warm-gray font-normal">{a.activityAction}</th>
              <th className="p-3 text-xs tracking-widest uppercase text-brand-warm-gray font-normal">{a.activityTarget}</th>
              <th className="p-3 text-xs tracking-widest uppercase text-brand-warm-gray font-normal">{a.activityDetails}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-brand-warm-gray">
                  …
                </td>
              </tr>
            )}
            {!isLoading && logs.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-brand-warm-gray">
                  {a.activityNoEntries}
                </td>
              </tr>
            )}
            {!isLoading &&
              logs.map((row) => {
                const actor = row.actor;
                const who = actor
                  ? `${actor.firstName || ''} ${actor.lastName || ''}`.trim() || actor.email
                  : row.actorEmail || '—';
                const when = row.createdAt ? new Date(row.createdAt).toLocaleString() : '—';
                const actionLabel = labels[row.action] || row.action;
                return (
                  <tr key={row._id} className="border-b border-brand-black/5 align-top hover:bg-gray-50/80">
                    <td className="p-3 whitespace-nowrap text-xs text-brand-warm-gray">{when}</td>
                    <td className="p-3">
                      <div className="font-medium text-brand-black">{who}</div>
                      <div className="text-[10px] text-brand-warm-gray">{row.actorEmail}</div>
                      {row.actorRole && (
                        <div className="text-[10px] text-brand-warm-gray uppercase">{row.actorRole}</div>
                      )}
                    </td>
                    <td className="p-3">
                      <span className="text-xs">{actionLabel}</span>
                      {row.requestId && (
                        <div className="text-[10px] text-brand-warm-gray mt-1">
                          {a.activityRequestId}: {row.requestId.slice(0, 12)}…
                        </div>
                      )}
                    </td>
                    <td className="p-3 max-w-[220px]">
                      <ActivityTargetCell row={row} user={user} openProductTitle={a.activityOpenProduct} />
                    </td>
                    <td className="p-3 text-[11px] font-mono text-brand-warm-gray max-w-md break-all">
                      {formatDetails(row.details)}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex justify-center gap-2 mt-6 flex-wrap">
          {Array.from({ length: pages }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setPage(i + 1)}
              className={`w-9 h-9 text-xs border transition-colors ${
                page === i + 1
                  ? 'bg-brand-black text-white border-brand-black'
                  : 'border-brand-black/20 hover:border-brand-gold text-brand-warm-gray'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
