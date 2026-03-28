import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { NextSeo } from 'next-seo';
import AdminLayout from '../../../../components/admin/AdminLayout';
import AdminProductForm from '../../../../components/admin/AdminProductForm';
import useAuthStore from '../../../../store/authStore';
import { canAccessAdmin, hasAdminPermission, getDefaultAdminPath } from '../../../../lib/adminAccess';
import { useLang } from '../../../../contexts/LanguageContext';

export default function EditProductPage() {
  const router = useRouter();
  const { id } = router.query;
  const user = useAuthStore((s) => s.user);
  const isAuthReady = useAuthStore((s) => s.isAuthReady);
  const { t } = useLang();
  const a = t.admin;

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
    </AdminLayout>
  );
}
