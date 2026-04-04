import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { useQuery, useQueryClient, useMutation } from 'react-query';
import { NextSeo } from 'next-seo';
import AdminLayout from '../../components/admin/AdminLayout';
import useAuthStore from '../../store/authStore';
import { canAccessAdmin, hasAdminPermission, getDefaultAdminPath } from '../../lib/adminAccess';
import { useLang } from '../../contexts/LanguageContext';
import api from '../../lib/api';
import { STORE_LOGO_FALLBACK } from '../../hooks/useStoreSettings';
import toast from 'react-hot-toast';

export default function AdminStoreSettingsPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isAuthReady = useAuthStore((s) => s.isAuthReady);
  const { t, isRTL } = useLang();
  const a = t.admin;
  const queryClient = useQueryClient();
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [enText, setEnText] = useState('');
  const [arText, setArText] = useState('');

  const { data: settings, isLoading } = useQuery(
    ['store-settings'],
    () => api.get('/settings').then((r) => r.data),
    { staleTime: 0 }
  );

  useEffect(() => {
    if (!settings) return;
    const en = settings.announcementMessagesEn;
    const ar = settings.announcementMessagesAr;
    setEnText(Array.isArray(en) ? en.join('\n') : '');
    setArText(Array.isArray(ar) ? ar.join('\n') : '');
  }, [settings]);

  const previewSrc = settings?.logoUrl || STORE_LOGO_FALLBACK;

  useEffect(() => {
    if (!isAuthReady) return;
    if (!user) router.push('/login');
    else if (!canAccessAdmin(user)) router.push('/');
    else if (!hasAdminPermission(user, 'settings')) router.replace(getDefaultAdminPath(user));
  }, [user, isAuthReady, router]);

  const [cacheScope, setCacheScope] = useState('all');

  const {
    data: cacheStats,
    refetch: refetchCacheStats,
    isError: cacheStatsError,
  } = useQuery(
    ['admin-cache-stats'],
    () => api.get('/admin/cache/stats').then((r) => r.data),
    { enabled: !!user && hasAdminPermission(user, 'settings'), staleTime: 10_000, retry: false }
  );

  const clearCacheMutation = useMutation(
    (scope) => api.post('/admin/cache/clear', { scope }),
    {
      onSuccess: () => {
        refetchCacheStats();
        toast.success(a.cacheCleared);
      },
      onError: (err) => toast.error(err.response?.data?.error || a.cacheClearError),
    }
  );

  const saveAnnouncementsMutation = useMutation(
    () =>
      api.put('/settings', {
        announcementMessagesEn: enText.split('\n').map((s) => s.trim()).filter(Boolean),
        announcementMessagesAr: arText.split('\n').map((s) => s.trim()).filter(Boolean),
      }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['store-settings']);
        toast.success(a.announcementBarSaved);
      },
      onError: (err) => toast.error(err.response?.data?.error || a.announcementBarSaveError),
    }
  );

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error(a.storeLogoError);
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('logo', file);
      await api.post('/upload/store-logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
      });
      await queryClient.invalidateQueries(['store-settings']);
      toast.success(a.storeLogoSuccess);
    } catch (err) {
      toast.error(err.response?.data?.error || a.storeLogoError);
    } finally {
      setUploading(false);
    }
  };

  if (!user || !canAccessAdmin(user) || !hasAdminPermission(user, 'settings')) return null;

  return (
    <AdminLayout>
      <NextSeo title={`${a.storeSettings} — ${t.siteName}`} />
      <div className="max-w-2xl space-y-10" dir={isRTL ? 'rtl' : 'ltr'}>
        <h1 className="font-display text-3xl font-light text-brand-black mb-2">{a.storeSettings}</h1>

        <section>
          <h2 className="font-display text-xl font-light text-brand-black mb-2">{a.storeLogoTitle}</h2>
          <p className="text-sm text-gray-600 mb-6 leading-relaxed">{a.storeLogoHelp}</p>

          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <p className="text-xs uppercase tracking-widest text-gray-500 mb-3">{a.storeLogoCurrent}</p>
            <div className="flex items-center justify-center w-28 h-28 rounded-full overflow-hidden bg-gray-100 mb-6 mx-auto sm:mx-0 shadow-inner">
              {isLoading ? (
                <div className="w-full h-full skeleton rounded-full" />
              ) : (
                <Image
                  src={previewSrc}
                  alt=""
                  width={112}
                  height={112}
                  className="object-contain w-[92%] h-[92%] rounded-full"
                  unoptimized={previewSrc.startsWith('http')}
                />
              )}
            </div>

            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
            <button
              type="button"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
              className="btn-primary disabled:opacity-50"
            >
              {uploading ? '…' : a.storeLogoUpload}
            </button>
          </div>
        </section>

        <section>
          <h2 className="font-display text-xl font-light text-brand-black mb-2">{a.announcementBarTitle}</h2>
          <p className="text-sm text-gray-600 mb-6 leading-relaxed">{a.announcementBarHelp}</p>

          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-5">
            <div>
              <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">{a.announcementBarEnLabel}</label>
              <textarea
                value={enText}
                onChange={(e) => setEnText(e.target.value)}
                rows={5}
                className="input-luxury w-full font-mono text-sm min-h-[120px]"
                spellCheck={false}
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">{a.announcementBarArLabel}</label>
              <textarea
                value={arText}
                onChange={(e) => setArText(e.target.value)}
                rows={5}
                className="input-luxury w-full font-mono text-sm min-h-[120px]"
                dir="rtl"
                spellCheck={false}
              />
            </div>
            <button
              type="button"
              disabled={saveAnnouncementsMutation.isLoading}
              onClick={() => saveAnnouncementsMutation.mutate()}
              className="btn-primary disabled:opacity-50"
            >
              {saveAnnouncementsMutation.isLoading ? '…' : a.announcementBarSave}
            </button>
          </div>
        </section>

        <section>
          <h2 className="font-display text-xl font-light text-brand-black mb-2">{a.cacheTitle}</h2>
          <p className="text-sm text-gray-600 mb-6 leading-relaxed">{a.cacheHelp}</p>

          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-4">
            {cacheStats && !cacheStatsError ? (
              <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                <div>
                  <dt className="text-xs uppercase tracking-widest text-gray-500">{a.cacheEnabled}</dt>
                  <dd className="font-medium text-brand-black mt-1">
                    {cacheStats.enabled ? a.cacheOn : a.cacheOff}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-widest text-gray-500">{a.cacheEntries}</dt>
                  <dd className="font-medium text-brand-black mt-1">{cacheStats.entries}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-widest text-gray-500">{a.cacheHitRate}</dt>
                  <dd className="font-medium text-brand-black mt-1">
                    {Math.round((cacheStats.hitRate || 0) * 100)}%
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-widest text-gray-500">{a.cacheHits}</dt>
                  <dd className="font-medium text-brand-black mt-1">{cacheStats.hits}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-widest text-gray-500">{a.cacheMisses}</dt>
                  <dd className="font-medium text-brand-black mt-1">{cacheStats.misses}</dd>
                </div>
              </dl>
            ) : cacheStatsError ? (
              <p className="text-sm text-gray-500">{a.cacheLoadError}</p>
            ) : (
              <p className="text-sm text-gray-500">…</p>
            )}

            <div className="flex flex-col sm:flex-row sm:items-end gap-3 pt-2">
              <div className="flex-1">
                <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">{a.cacheClearScope}</label>
                <select
                  value={cacheScope}
                  onChange={(e) => setCacheScope(e.target.value)}
                  className="input-luxury w-full sm:max-w-xs text-sm"
                >
                  <option value="all">{a.cacheClearAll}</option>
                  <option value="products">{a.cacheClearProducts}</option>
                  <option value="categories">{a.cacheClearCategories}</option>
                  <option value="settings">{a.cacheClearSettings}</option>
                  <option value="colors">{a.cacheClearColors}</option>
                </select>
              </div>
              <button
                type="button"
                disabled={clearCacheMutation.isLoading}
                onClick={() => clearCacheMutation.mutate(cacheScope)}
                className="btn-secondary disabled:opacity-50 whitespace-nowrap"
              >
                {clearCacheMutation.isLoading ? '…' : a.cacheClearButton}
              </button>
            </div>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}
