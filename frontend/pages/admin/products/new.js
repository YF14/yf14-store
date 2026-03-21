import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useQuery, useQueryClient } from 'react-query';
import { NextSeo } from 'next-seo';
import AdminLayout from '../../../components/admin/AdminLayout';
import useAuthStore from '../../../store/authStore';
import { useLang } from '../../../contexts/LanguageContext';
import api from '../../../lib/api';
import { classifyProductMediaFile } from '../../../lib/mediaClassify';
import { catName } from '../../../lib/currency';
import toast from 'react-hot-toast';
import VideoPreviewThumb from '../../../components/admin/VideoPreviewThumb';

const ALL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
const DEFAULT_SIZES = ['M', 'L', 'XL', 'XXL'];
const DEFAULT_STOCK = 6;

function buildSizesForColor(colorName, colorCode) {
  return DEFAULT_SIZES.map(size => ({ size, color: colorName, colorCode, stock: DEFAULT_STOCK, price: '' }));
}

function groupByColor(variants) {
  const map = new Map();
  variants.forEach(v => {
    const key = v.color;
    if (!map.has(key)) map.set(key, { color: v.color, colorCode: v.colorCode, variants: [] });
    map.get(key).variants.push(v);
  });
  return [...map.values()];
}

export default function NewProductPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const { t, isRTL } = useLang();
  const a = t.admin;
  const mediaInputRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [videoPending, setVideoPending] = useState(null);
  const [variants, setVariants] = useState([]);
  const [customColor, setCustomColor] = useState('');
  const [customColorCode, setCustomColorCode] = useState('#000000');
  const [deletingColorId, setDeletingColorId] = useState(null);
  const [form, setForm] = useState({
    name: '', shortDescription: '', price: '', comparePrice: '', category: '',
    tags: '', isActive: true, isFeatured: false, isNewArrival: false, isBestSeller: false,
  });

  const { data: catData } = useQuery('categories', () => api.get('/categories').then(r => r.data));
  const categories = catData?.categories || [];

  const { data: colorData } = useQuery('global-colors', () => api.get('/colors').then(r => r.data));
  const globalColors = colorData?.colors || [];

  useEffect(() => { if (user && user.role !== 'admin') router.push('/'); }, [user]);

  const colorGroups = groupByColor(variants);
  const usedColors = colorGroups.map(g => g.color);

  const addColor = (colorName, colorCode) => {
    if (usedColors.includes(colorName)) { toast.error(`${colorName} ${a.alreadyAdded}`); return; }
    setVariants(v => [...v, ...buildSizesForColor(colorName, colorCode)]);
  };

  const saveAndAddCustomColor = async () => {
    const name = customColor.trim();
    if (!name) return;
    try {
      await api.post('/colors', { name, code: customColorCode });
      queryClient.invalidateQueries('global-colors');
      addColor(name, customColorCode);
      setCustomColor('');
      toast.success(`"${name}" ${a.colorSaved}`);
    } catch (err) {
      if (err.response?.data?.error === 'Color already exists') {
        addColor(name, customColorCode);
        setCustomColor('');
      } else {
        toast.error(err.response?.data?.error || 'Failed to save color');
      }
    }
  };

  const deleteGlobalColor = async (colorId) => {
    setDeletingColorId(colorId);
    try {
      await api.delete(`/colors/${colorId}`);
      queryClient.invalidateQueries('global-colors');
      toast.success(a.colorRemoved);
    } catch (err) { toast.error(a.colorRemoved); }
    finally { setDeletingColorId(null); }
  };

  const removeColorFromProduct = (colorName) => {
    setVariants(v => v.filter(variant => variant.color !== colorName));
  };

  const addSizeToColor = (colorName, colorCode, size) => {
    if (variants.find(v => v.color === colorName && v.size === size)) return;
    setVariants(v => [...v, { size, color: colorName, colorCode, stock: DEFAULT_STOCK, price: '' }]);
  };

  const removeVariant = (idx) => { setVariants(v => v.filter((_, i) => i !== idx)); };

  const handleVariantStock = (idx, stock) => {
    setVariants(v => v.map((variant, i) => i === idx ? { ...variant, stock } : variant));
  };

  const commitImageFiles = async (imageFiles) => {
    try {
      const started = performance.now();
      const formData = new FormData();
      imageFiles.forEach(f => formData.append('images', f));
      const { data } = await api.post('/upload/product', formData, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60000 });
      const secs = ((performance.now() - started) / 1000).toFixed(1);
      setImages(prev => [...prev, ...data.images.map((img, i) => ({ ...img, isPrimary: prev.length === 0 && i === 0 }))]);
      const msg = (a.imagesUploadedIn || '{count} image(s) uploaded in {time}s')
        .replace('{count}', String(data.images.length))
        .replace('{time}', secs);
      toast.success(msg);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed');
      throw err;
    }
  };

  const commitVideoFile = async (file) => {
    const previewUrl = URL.createObjectURL(file);
    setVideoPending({ url: previewUrl });
    const started = performance.now();
    try {
      const formData = new FormData();
      formData.append('video', file);
      const { data } = await api.post('/upload/video', formData, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 120000 });
      const secs = ((performance.now() - started) / 1000).toFixed(1);
      setVideos(prev => [...prev, { url: data.url, fileId: data.fileId }]);
      URL.revokeObjectURL(previewUrl);
      setVideoPending(null);
      toast.success(a.videoUploadedIn.replace('{time}', secs));
    } catch (err) {
      URL.revokeObjectURL(previewUrl);
      setVideoPending(null);
      toast.error(err.response?.data?.error || 'Video upload failed');
      throw err;
    }
  };

  const handleMediaUpload = async (e) => {
    const fileList = e.target.files;
    const input = e.target;
    if (!fileList?.length) return;
    const files = Array.from(fileList);
    input.value = '';

    const imageFiles = files.filter(f => classifyProductMediaFile(f) === 'image');
    const videoFiles = files.filter(f => classifyProductMediaFile(f) === 'video');
    const unknown = files.filter(f => classifyProductMediaFile(f) === 'unknown');
    if (unknown.length) toast.error(a.unsupportedMediaType);
    if (!imageFiles.length && !videoFiles.length) return;

    setUploading(true);
    try {
      if (imageFiles.length) await commitImageFiles(imageFiles);
      for (const vf of videoFiles) {
        await commitVideoFile(vf);
      }
    } catch {
      /* errors already toasted in commit* */
    } finally {
      setUploading(false);
    }
  };

  const removeImage = async (idx) => {
    const img = images[idx];
    if (img.fileId) { try { await api.delete('/upload/image', { data: { fileId: img.fileId } }); } catch {} }
    setImages(prev => { const next = prev.filter((_, i) => i !== idx); if (next.length && !next.some(im => im.isPrimary)) next[0].isPrimary = true; return next; });
  };

  const removeVideo = async (idx) => {
    const vid = videos[idx];
    if (vid.fileId) { try { await api.delete('/upload/video', { data: { fileId: vid.fileId } }); } catch {} }
    setVideos(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (images.length === 0) { toast.error(a.uploadOneImage); return; }
    if (variants.length === 0) { toast.error(a.addOneColorSize); return; }
    setSaving(true);
    try {
      const slug = form.name.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]+/g, '-').replace(/^-|-$/g, '') || `product-${Date.now()}`;
      const payload = {
        ...form, slug,
        description: form.shortDescription || form.name,
        price: Number(form.price),
        comparePrice: form.comparePrice ? Number(form.comparePrice) : undefined,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        images: images.map((img, i) => ({ url: img.url, fileId: img.fileId, alt: form.name, isPrimary: img.isPrimary || i === 0 })),
        videos: videos.map(v => ({ url: v.url, fileId: v.fileId })),
        variants: variants.map(v => ({ ...v, stock: Number(v.stock), price: v.price ? Number(v.price) : undefined })),
      };
      await api.post('/products', payload);
      toast.success(a.productCreated);
      router.push('/admin/products');
    } catch (err) { toast.error(err.response?.data?.error || a.failedCreate); }
    finally { setSaving(false); }
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <AdminLayout>
      <NextSeo title={`${a.addNewProduct} — Admin`} />
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/products" className="text-sm text-brand-warm-gray hover:text-brand-gold">← {a.products}</Link>
      </div>
      <h1 className="font-display text-3xl font-light mb-8">{a.addNewProduct}</h1>

      <form onSubmit={handleSubmit} className="grid lg:grid-cols-[1fr_360px] gap-8">
        <div className="space-y-6">
          {/* Basic info */}
          <div className="bg-white border border-brand-black/10 p-6">
            <h2 className="font-medium text-sm tracking-wider uppercase mb-5">{a.basicInfo}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs tracking-widest uppercase mb-2">{a.productName} *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input-luxury" required />
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase mb-2">{a.shortDescription}</label>
                <textarea value={form.shortDescription} onChange={e => setForm(f => ({ ...f, shortDescription: e.target.value }))} rows={3} className="input-luxury resize-none" placeholder={a.descPlaceholder} />
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase mb-2">{a.tags}</label>
                <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder={a.tagsPlaceholder} className="input-luxury" />
              </div>
            </div>
          </div>

          {/* Media */}
          <div className="bg-white border border-brand-black/10 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-medium text-sm tracking-wider uppercase">{a.images} & {a.videoBadge}</h2>
              <div>
                <button type="button" onClick={() => mediaInputRef.current?.click()} disabled={uploading} className="text-xs text-brand-gold hover:underline">
                  {uploading ? '...' : a.uploadPhotosOrVideo}
                </button>
                <input
                  ref={mediaInputRef}
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  className="hidden"
                  onChange={handleMediaUpload}
                />
              </div>
            </div>
            {images.length === 0 && videos.length === 0 && !videoPending ? (
              <div className="border-2 border-dashed border-brand-black/10 p-8 text-center cursor-pointer hover:border-brand-gold transition-colors" onClick={() => mediaInputRef.current?.click()}>
                <p className="text-brand-warm-gray text-sm">{a.clickUploadMedia}</p>
                <p className="text-xs text-brand-warm-gray mt-1">{a.supportsFormatsMedia}</p>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-3">
                {images.map((img, i) => (
                  <div key={i} className="relative group aspect-square bg-gray-50">
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                    {img.isPrimary && <span className="absolute top-1 start-1 text-[9px] bg-brand-gold text-white px-1.5 py-0.5">{a.mainBadge}</span>}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button type="button" onClick={() => setImages(imgs => imgs.map((im, idx) => ({ ...im, isPrimary: idx === i })))} className="text-white text-xs bg-brand-gold px-2 py-1">★</button>
                      <button type="button" onClick={() => removeImage(i)} className="text-white text-xs bg-red-500 px-2 py-1">✕</button>
                    </div>
                  </div>
                ))}
                {videoPending && (
                  <div key="video-pending" className="relative aspect-square bg-gray-900 overflow-hidden">
                    <VideoPreviewThumb src={videoPending.url} className="w-full h-full object-cover" />
                    <span className="absolute top-1 start-1 text-[9px] bg-blue-500 text-white px-1.5 py-0.5">{a.videoBadge}</span>
                    <div className="absolute inset-0 bg-black/55 flex items-center justify-center px-2 text-center">
                      <span className="text-white text-xs font-medium">{a.videoUploading}</span>
                    </div>
                  </div>
                )}
                {videos.map((vid, i) => (
                  <div key={`v-${i}`} className="relative group aspect-square bg-gray-900 overflow-hidden">
                    <VideoPreviewThumb src={vid.url} className="w-full h-full object-cover" />
                    <span className="absolute top-1 start-1 text-[9px] bg-blue-500 text-white px-1.5 py-0.5">{a.videoBadge}</span>
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button type="button" onClick={() => removeVideo(i)} className="text-white text-xs bg-red-500 px-2 py-1">✕</button>
                    </div>
                  </div>
                ))}
                <div className="aspect-square border-2 border-dashed border-brand-black/10 flex items-center justify-center cursor-pointer hover:border-brand-gold transition-colors" onClick={() => mediaInputRef.current?.click()}>
                  <span className="text-2xl text-brand-warm-gray">+</span>
                </div>
              </div>
            )}
          </div>

          {/* Colors & Sizes */}
          <div className="bg-white border border-brand-black/10 p-6">
            <h2 className="font-medium text-sm tracking-wider uppercase mb-5">{a.colorsAndSizes}</h2>

            {/* Global color palette */}
            <div className="mb-4">
              <p className="text-xs text-brand-warm-gray mb-2">{a.colorPaletteHint}</p>
              <div className="flex flex-wrap gap-2">
                {globalColors.map(c => {
                  const isUsed = usedColors.includes(c.name);
                  return (
                    <div key={c._id} className="relative group">
                      <button type="button" onClick={() => addColor(c.name, c.code)} disabled={isUsed}
                        className={`flex items-center gap-2 px-3 py-2 border text-xs transition-colors ${isUsed ? 'border-green-400 bg-green-50 opacity-70' : 'border-brand-black/10 hover:border-brand-gold'}`}>
                        <span className="w-4 h-4 rounded-full border border-black/10" style={{ backgroundColor: c.code }} />
                        {c.name} {isUsed && '✓'}
                      </button>
                      <button type="button" onClick={() => deleteGlobalColor(c._id)} disabled={deletingColorId === c._id}
                        className="absolute -top-1.5 -end-1.5 w-4 h-4 bg-red-500 text-white rounded-full text-[8px] leading-none flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        title={a.deleteFromPalette}>✕</button>
                    </div>
                  );
                })}
                {globalColors.length === 0 && (
                  <p className="text-xs text-brand-warm-gray italic">{a.noColorsSaved}</p>
                )}
              </div>
            </div>

            {/* Add new color to palette */}
            <div className="flex gap-2 items-center mb-6 p-3 bg-gray-50 border border-dashed border-brand-black/10">
              <input type="color" value={customColorCode} onChange={e => setCustomColorCode(e.target.value)} className="w-8 h-8 cursor-pointer border-0 bg-transparent" />
              <input value={customColor} onChange={e => setCustomColor(e.target.value)} placeholder={a.newColorName} className="input-luxury text-xs py-2 flex-1" />
              <button type="button" onClick={saveAndAddCustomColor} className="text-xs px-3 py-2 border border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-white transition-colors whitespace-nowrap">
                {a.saveAndAdd}
              </button>
            </div>

            {/* Color groups on this product */}
            {colorGroups.length === 0 && (
              <p className="text-sm text-brand-warm-gray py-4 text-center">{a.noColorsAdded}</p>
            )}

            <div className="space-y-4">
              {colorGroups.map(group => {
                const sizesInGroup = group.variants.map(v => v.size);
                const availableSizes = ALL_SIZES.filter(s => !sizesInGroup.includes(s));
                return (
                  <div key={group.color} className="border border-brand-black/10 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full border border-black/10" style={{ backgroundColor: group.colorCode }} />
                        <span className="text-sm font-medium">{group.color}</span>
                        <span className="text-xs text-brand-warm-gray">({group.variants.length} {a.sizes})</span>
                      </div>
                      <button type="button" onClick={() => removeColorFromProduct(group.color)} className="text-xs text-red-400 hover:text-red-600">{a.removeFromProduct}</button>
                    </div>
                    <div className="space-y-1.5">
                      {group.variants.map(v => {
                        const globalIdx = variants.findIndex(gv => gv.color === v.color && gv.size === v.size);
                        return (
                          <div key={v.size} className="flex items-center gap-3">
                            <span className="w-10 h-7 flex items-center justify-center bg-gray-100 text-xs font-medium">{v.size}</span>
                            <input type="number" value={v.stock} onChange={e => handleVariantStock(globalIdx, e.target.value)} min={0} className="input-luxury text-xs py-1.5 w-20" />
                            <span className="text-[10px] text-brand-warm-gray">{a.stockLabel}</span>
                            <button type="button" onClick={() => removeVariant(globalIdx)} className="text-red-400 text-xs ms-auto">✕</button>
                          </div>
                        );
                      })}
                    </div>
                    {availableSizes.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {availableSizes.map(s => (
                          <button key={s} type="button" onClick={() => addSizeToColor(group.color, group.colorCode, s)}
                            className="text-[10px] px-2 py-1 border border-dashed border-brand-black/20 hover:border-brand-gold text-brand-warm-gray hover:text-brand-gold transition-colors">
                            + {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-5">
          <div className="bg-white border border-brand-black/10 p-5">
            <h2 className="font-medium text-sm tracking-wider uppercase mb-4">{a.pricingCategory}</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs tracking-widest uppercase mb-2">{a.priceDollar} *</label>
                <input type="number" step="500" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} className="input-luxury" required min={0} placeholder="25000" />
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase mb-2">{a.comparePrice}</label>
                <input type="number" step="500" value={form.comparePrice} onChange={e => setForm(f => ({ ...f, comparePrice: e.target.value }))} className="input-luxury" min={0} placeholder="35000" />
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase mb-2">{a.category} *</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="input-luxury cursor-pointer" required>
                  <option value="">{a.selectCategory}</option>
                  {categories.map(c => <option key={c._id} value={c._id}>{catName(c, isRTL)}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white border border-brand-black/10 p-5">
            <h2 className="font-medium text-sm tracking-wider uppercase mb-4">{a.statusFlags}</h2>
            <div className="space-y-3">
              {[
                { key: 'isActive', label: a.activeVisible },
                { key: 'isFeatured', label: a.featuredHomepage },
                { key: 'isNewArrival', label: a.newArrivalFlag },
                { key: 'isBestSeller', label: a.bestSellerFlag },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))} className="w-4 h-4 accent-brand-gold" />
                  <span className="text-sm">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <button type="submit" disabled={saving || uploading} className="btn-primary w-full">
            {saving ? a.creating : a.createProduct}
          </button>
          <Link href="/admin/products" className="btn-outline w-full text-center block">{a.cancel}</Link>
        </div>
      </form>
    </AdminLayout>
  );
}
