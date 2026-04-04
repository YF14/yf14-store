import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { NextSeo } from 'next-seo';
import toast from 'react-hot-toast';
import AdminLayout from '../../../../components/admin/AdminLayout';
import AdminProductForm from '../../../../components/admin/AdminProductForm';
import useAuthStore from '../../../../store/authStore';
import { canAccessAdmin, hasAdminPermission, getDefaultAdminPath } from '../../../../lib/adminAccess';
import { useLang } from '../../../../contexts/LanguageContext';
import api from '../../../../lib/api';

export default function EditProductPage() {
  const router = useRouter();
  const { id } = router.query;
  const user = useAuthStore((s) => s.user);
  const isAuthReady = useAuthStore((s) => s.isAuthReady);
  const { t } = useLang();
  const a = t.admin;
  const [deleting, setDeleting] = useState(false);

  const handleDeleteProduct = async () => {
    if (!id) return;
    if (!confirm(a.deleteProductEditConfirm)) return;
    setDeleting(true);
    try {
      await api.delete(`/products/${id}`);
      toast.success(a.productDeletedPermanently);
      router.push('/admin/products');
    } catch (err) {
      toast.error(err.response?.data?.error || a.productDeleteFailed);
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    if (!isAuthReady) return;
    if (!user) router.push('/login');
    else if (!canAccessAdmin(user)) router.push('/');
    else if (!hasAdminPermission(user, 'products')) router.replace(getDefaultAdminPath(user));
  }, [user, isAuthReady, router]);

  if (!user || !canAccessAdmin(user) || !hasAdminPermission(user, 'products')) return null;
  if (!router.isReady || !id) return null;

  return (
    <AdminLayout>
      <NextSeo title={`${a.editProduct} — Admin`} />
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/products" className="text-sm text-brand-warm-gray hover:text-brand-gold">
          ← {a.products}
        </Link>
      </div>
      <h1 className="font-display text-3xl font-light mb-8">{a.editProduct}</h1>
      <AdminProductForm productId={String(id)} onSuccess={() => router.push('/admin/products')} />

      <section className="mt-12 pt-10 border-t border-red-200/60 max-w-4xl" dir={t.dir}>
        <h2 className="text-sm font-medium uppercase tracking-widest text-red-600/90 mb-2">{a.deleteProductSection}</h2>
        <p className="text-sm text-brand-warm-gray mb-4 max-w-xl leading-relaxed">{a.deleteProductEditHint}</p>
        <button
          type="button"
          disabled={deleting}
          onClick={handleDeleteProduct}
          className="text-sm px-4 py-2 border border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 transition-colors disabled:opacity-50"
        >
          {deleting ? '…' : a.deleteProduct}
        </button>
      </section>
    </AdminLayout>
  );
}
