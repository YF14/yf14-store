import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { useQuery, useQueryClient } from 'react-query';
import { NextSeo } from 'next-seo';
import AdminLayout from '../../components/admin/AdminLayout';
import useAuthStore from '../../store/authStore';
import { useLang } from '../../contexts/LanguageContext';
import api from '../../lib/api';
import { STORE_LOGO_FALLBACK } from '../../hooks/useStoreSettings';
import toast from 'react-hot-toast';

export default function AdminStoreSettingsPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { t, isRTL } = useLang();
  const a = t.admin;
  const queryClient = useQueryClient();
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const { data: settings, isLoading } = useQuery(
    ['store-settings'],
    () => api.get('/settings').then((r) => r.data),
    { staleTime: 0 }
  );

  const previewSrc = settings?.logoUrl || STORE_LOGO_FALLBACK;

  useEffect(() => {
    if (user && user.role !== 'admin') router.push('/');
  }, [user, router]);

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

  if (!user || user.role !== 'admin') return null;

  return (
    <AdminLayout>
      <NextSeo title={`${a.storeSettings} — ${t.siteName}`} />
      <div className="max-w-xl" dir={isRTL ? 'rtl' : 'ltr'}>
        <h1 className="font-display text-3xl font-light text-brand-black mb-2">{a.storeLogoTitle}</h1>
        <p className="text-sm text-gray-600 mb-8 leading-relaxed">{a.storeLogoHelp}</p>

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
      </div>
    </AdminLayout>
  );
}
