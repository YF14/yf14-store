import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useQuery } from 'react-query';
import { NextSeo } from 'next-seo';
import AdminLayout from '../../../components/admin/AdminLayout';
import useAuthStore from '../../../store/authStore';
import api from '../../../lib/api';
import toast from 'react-hot-toast';

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

const emptyVariant = { size: 'S', color: '', colorCode: '#000000', stock: 0, price: '' };

export default function NewProductPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [saving, setSaving] = useState(false);
  const [images, setImages] = useState([{ url: '', alt: '', isPrimary: true }]);
  const [variants, setVariants] = useState([{ ...emptyVariant }]);
  const [form, setForm] = useState({
    name: '', slug: '', description: '', shortDescription: '',
    price: '', comparePrice: '', category: '',
    tags: '', material: '', careInstructions: '',
    isActive: true, isFeatured: false, isNewArrival: false, isBestSeller: false,
  });

  const { data: catData } = useQuery('categories', () => api.get('/categories').then(r => r.data));
  const categories = catData?.categories || [];

  useEffect(() => {
    if (user && user.role !== 'admin') router.push('/');
  }, [user]);

  useEffect(() => {
    if (form.name && !router.query.id) {
      const slug = form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      setForm(f => ({ ...f, slug }));
    }
  }, [form.name]);

  const handleVariantChange = (i, field, value) => {
    setVariants(v => v.map((variant, idx) => idx === i ? { ...variant, [field]: value } : variant));
  };

  const handleImageChange = (i, field, value) => {
    setImages(imgs => imgs.map((img, idx) => idx === i ? { ...img, [field]: value } : img));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        comparePrice: form.comparePrice ? Number(form.comparePrice) : undefined,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        images: images.filter(img => img.url),
        variants: variants.map(v => ({ ...v, stock: Number(v.stock), price: v.price ? Number(v.price) : undefined })),
      };
      await api.post('/products', payload);
      toast.success('Product created successfully!');
      router.push('/admin/products');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create product');
    } finally {
      setSaving(false);
    }
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <AdminLayout>
      <NextSeo title="Add Product — Admin" />
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/products" className="text-sm text-brand-warm-gray hover:text-brand-gold">← Products</Link>
      </div>
      <h1 className="font-display text-3xl font-light mb-8">Add New Product</h1>

      <form onSubmit={handleSubmit} className="grid lg:grid-cols-[1fr_360px] gap-8">
        {/* Left */}
        <div className="space-y-6">
          {/* Basic info */}
          <div className="bg-white border border-brand-black/10 p-6">
            <h2 className="font-medium text-sm tracking-wider uppercase mb-5">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs tracking-widest uppercase mb-2">Product Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input-luxury" required />
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase mb-2">Slug *</label>
                <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} className="input-luxury font-mono text-sm" required />
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase mb-2">Short Description</label>
                <input value={form.shortDescription} onChange={e => setForm(f => ({ ...f, shortDescription: e.target.value }))} className="input-luxury" />
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase mb-2">Full Description *</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={5} className="input-luxury resize-none" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs tracking-widest uppercase mb-2">Material</label>
                  <input value={form.material} onChange={e => setForm(f => ({ ...f, material: e.target.value }))} className="input-luxury" />
                </div>
                <div>
                  <label className="block text-xs tracking-widest uppercase mb-2">Care Instructions</label>
                  <input value={form.careInstructions} onChange={e => setForm(f => ({ ...f, careInstructions: e.target.value }))} className="input-luxury" />
                </div>
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase mb-2">Tags (comma separated)</label>
                <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="evening, silk, luxury" className="input-luxury" />
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="bg-white border border-brand-black/10 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-medium text-sm tracking-wider uppercase">Images</h2>
              <button type="button" onClick={() => setImages(imgs => [...imgs, { url: '', alt: '', isPrimary: false }])}
                className="text-xs text-brand-gold hover:underline">+ Add Image</button>
            </div>
            <div className="space-y-3">
              {images.map((img, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <div className="flex-1 space-y-2">
                    <input value={img.url} onChange={e => handleImageChange(i, 'url', e.target.value)} placeholder="Image URL (Cloudinary or external)" className="input-luxury text-sm" />
                    <input value={img.alt} onChange={e => handleImageChange(i, 'alt', e.target.value)} placeholder="Alt text" className="input-luxury text-sm" />
                  </div>
                  <div className="flex flex-col gap-2 items-center">
                    <label className="text-xs text-brand-warm-gray">Primary</label>
                    <input type="radio" name="primaryImg" checked={img.isPrimary} onChange={() => setImages(imgs => imgs.map((im, idx) => ({ ...im, isPrimary: idx === i })))} />
                    {images.length > 1 && (
                      <button type="button" onClick={() => setImages(imgs => imgs.filter((_, idx) => idx !== i))} className="text-red-400 text-xs">✕</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Variants */}
          <div className="bg-white border border-brand-black/10 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-medium text-sm tracking-wider uppercase">Variants (Size × Color × Stock)</h2>
              <button type="button" onClick={() => setVariants(v => [...v, { ...emptyVariant }])}
                className="text-xs text-brand-gold hover:underline">+ Add Variant</button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-5 gap-2 text-xs tracking-widest uppercase text-brand-warm-gray">
                <span>Size</span><span>Color Name</span><span>Color Hex</span><span>Stock</span><span>Price Override</span>
              </div>
              {variants.map((v, i) => (
                <div key={i} className="grid grid-cols-5 gap-2 items-center">
                  <select value={v.size} onChange={e => handleVariantChange(i, 'size', e.target.value)} className="input-luxury text-xs py-2">
                    {SIZES.map(s => <option key={s}>{s}</option>)}
                  </select>
                  <input value={v.color} onChange={e => handleVariantChange(i, 'color', e.target.value)} placeholder="Midnight Black" className="input-luxury text-xs py-2" required />
                  <div className="flex items-center gap-1">
                    <input type="color" value={v.colorCode} onChange={e => handleVariantChange(i, 'colorCode', e.target.value)} className="w-8 h-9 cursor-pointer border-0 bg-transparent" />
                    <input value={v.colorCode} onChange={e => handleVariantChange(i, 'colorCode', e.target.value)} className="input-luxury text-xs py-2 font-mono" />
                  </div>
                  <input type="number" value={v.stock} onChange={e => handleVariantChange(i, 'stock', e.target.value)} min={0} className="input-luxury text-xs py-2" />
                  <div className="flex gap-1">
                    <input type="number" value={v.price} onChange={e => handleVariantChange(i, 'price', e.target.value)} placeholder="—" className="input-luxury text-xs py-2 flex-1" />
                    {variants.length > 1 && (
                      <button type="button" onClick={() => setVariants(v => v.filter((_, idx) => idx !== i))} className="text-red-400 text-sm px-1">✕</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-5">
          <div className="bg-white border border-brand-black/10 p-5">
            <h2 className="font-medium text-sm tracking-wider uppercase mb-4">Pricing & Category</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs tracking-widest uppercase mb-2">Price ($) *</label>
                <input type="number" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} className="input-luxury" required min={0} />
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase mb-2">Compare At Price ($)</label>
                <input type="number" step="0.01" value={form.comparePrice} onChange={e => setForm(f => ({ ...f, comparePrice: e.target.value }))} className="input-luxury" min={0} />
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase mb-2">Category *</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="input-luxury cursor-pointer" required>
                  <option value="">Select category...</option>
                  {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white border border-brand-black/10 p-5">
            <h2 className="font-medium text-sm tracking-wider uppercase mb-4">Status & Flags</h2>
            <div className="space-y-3">
              {[
                { key: 'isActive', label: 'Active (visible on store)' },
                { key: 'isFeatured', label: 'Featured on homepage' },
                { key: 'isNewArrival', label: 'New Arrival' },
                { key: 'isBestSeller', label: 'Best Seller' },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))}
                    className="w-4 h-4 accent-brand-gold" />
                  <span className="text-sm">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <button type="submit" disabled={saving} className="btn-primary w-full">
            {saving ? 'Creating...' : 'Create Product'}
          </button>
          <Link href="/admin/products" className="btn-outline w-full text-center block">Cancel</Link>
        </div>
      </form>
    </AdminLayout>
  );
}
