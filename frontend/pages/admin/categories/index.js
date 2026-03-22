import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { NextSeo } from 'next-seo';
import AdminLayout from '../../../components/admin/AdminLayout';
import useAuthStore from '../../../store/authStore';
import { canAccessAdmin, hasAdminPermission, getDefaultAdminPath } from '../../../lib/adminAccess';
import { useLang } from '../../../contexts/LanguageContext';
import api from '../../../lib/api';
import toast from 'react-hot-toast';

const CARD = '#1a1d2e';
const BORDER = 'rgba(255,255,255,0.07)';
const TEXT = '#e8e8f0';
const MUTED = '#9ca3af';
const MUTED2 = '#6b7280';
const PURPLE_BORDER = 'rgba(139,92,246,0.3)';

function slugify(s) {
  return String(s || '')
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function filterCategoriesForSearch(flat, q) {
  if (!q.trim()) return flat;
  const lower = q.toLowerCase();
  const match = (c) =>
    c.name?.toLowerCase().includes(lower) ||
    (c.nameAr && c.nameAr.includes(q)) ||
    c.slug?.toLowerCase().includes(lower);
  const ids = new Set();
  flat.forEach((c) => {
    if (!match(c)) return;
    ids.add(String(c._id));
    let p = c.parent;
    while (p) {
      ids.add(String(p));
      const parent = flat.find((x) => String(x._id) === String(p));
      p = parent?.parent;
    }
  });
  let added = true;
  while (added) {
    added = false;
    flat.forEach((c) => {
      if (ids.has(String(c._id))) return;
      if (c.parent && ids.has(String(c.parent))) {
        ids.add(String(c._id));
        added = true;
      }
    });
  }
  return flat.filter((c) => ids.has(String(c._id)));
}

function buildTree(flat) {
  const byId = new Map(flat.map((c) => [String(c._id), { ...c, children: [] }]));
  const roots = [];
  for (const c of byId.values()) {
    if (c.parent) {
      const p = byId.get(String(c.parent));
      if (p) p.children.push(c);
      else roots.push(c);
    } else roots.push(c);
  }
  const sortFn = (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0) || String(a.name).localeCompare(String(b.name));
  roots.sort(sortFn);
  roots.forEach((r) => r.children.sort(sortFn));
  return roots;
}

function descendantIdSet(flat, rootId) {
  const out = new Set();
  const walk = (pid) => {
    flat
      .filter((c) => String(c.parent) === String(pid))
      .forEach((c) => {
        out.add(String(c._id));
        walk(c._id);
      });
  };
  walk(rootId);
  return out;
}

function CategoryRow({
  node,
  depth,
  expandedIds,
  toggleExpand,
  flatAll,
  onEdit,
  a,
  isRTL,
}) {
  const hasChildren = node.children?.length > 0;
  const childCount = flatAll.filter((c) => String(c.parent) === String(node._id)).length;
  const expanded = expandedIds.has(String(node._id));
  const icon = (node.icon && node.icon.trim()) || '📁';

  return (
    <>
      <div
        className="flex items-center gap-3 py-3 px-4 border-b transition-colors hover:bg-white/[0.03]"
        style={{ borderColor: BORDER, paddingInlineStart: `${16 + depth * 20}px` }}
      >
        <div className="w-6 flex justify-center shrink-0">
          {hasChildren ? (
            <button
              type="button"
              onClick={() => toggleExpand(String(node._id))}
              className="text-lg leading-none text-white/50 hover:text-white w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5"
              aria-expanded={expanded}
            >
              {expanded ? '▼' : isRTL ? '◀' : '▶'}
            </button>
          ) : (
            <span className="w-8" />
          )}
        </div>
        <Link
          href={`/admin/categories/${node._id}`}
          className="flex-1 min-w-0 flex items-center gap-3 text-start min-h-[44px] rounded-lg -mx-1 px-1 hover:bg-white/[0.04] transition-colors"
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
            style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: `1px solid ${BORDER}` }}
          >
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-sm truncate" style={{ color: TEXT }}>
              {isRTL && node.nameAr ? node.nameAr : node.name}
            </p>
            <p className="text-xs font-mono truncate mt-0.5" style={{ color: MUTED2 }}>
              {node.slug}
            </p>
          </div>
        </Link>
        <span className="text-xs shrink-0 hidden sm:inline w-14 text-center" style={{ color: MUTED }}>
          {hasChildren ? a.catSubCount.replace('{n}', String(childCount)) : ''}
        </span>
        <div
          className="w-[5.5rem] sm:w-28 shrink-0 text-center"
          title={a.catColumnFlag}
        >
          {node.flag?.trim() ? (
            <span className="text-[10px] px-2 py-1 rounded-md font-semibold bg-amber-500/20 text-amber-200 border border-amber-500/30">
              {node.flag.trim()}
            </span>
          ) : node.isFeatured ? (
            <span className="text-[10px] px-2 py-1 rounded-md bg-violet-500/15 text-violet-300 border border-violet-500/25">
              ★ {a.catFeaturedShort}
            </span>
          ) : (
            <span className="text-xs" style={{ color: MUTED2 }}>
              —
            </span>
          )}
        </div>
        <div className="w-[4.5rem] sm:w-24 shrink-0 flex justify-center" title={a.catColumnStatus}>
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-medium ${
              node.isActive ? 'text-emerald-300 bg-emerald-500/15' : 'text-orange-300 bg-orange-500/15'
            }`}
          >
            {node.isActive ? a.statusLive : a.statusHidden}
          </span>
        </div>
        <button
          type="button"
          onClick={() => onEdit(node)}
          className="text-xs px-3 py-1.5 rounded-lg border shrink-0 transition-colors hover:bg-white/5"
          style={{ borderColor: 'rgba(255,255,255,0.2)', color: MUTED }}
        >
          {a.edit}
        </button>
      </div>
      {hasChildren && expanded && node.children.map((ch) => (
        <CategoryRow
          key={ch._id}
          node={ch}
          depth={depth + 1}
          expandedIds={expandedIds}
          toggleExpand={toggleExpand}
          flatAll={flatAll}
          onEdit={onEdit}
          a={a}
          isRTL={isRTL}
        />
      ))}
    </>
  );
}

export default function AdminCategoriesPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { t, isRTL } = useLang();
  const a = t.admin;
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [expandedIds, setExpandedIds] = useState(new Set());
  const expandedInit = useRef(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: '',
    nameAr: '',
    slug: '',
    parent: '',
    icon: '',
    flag: '',
    isFeatured: false,
    sortOrder: 0,
    isActive: true,
  });

  useEffect(() => {
    if (!user) router.push('/login');
    else if (!canAccessAdmin(user)) router.push('/');
    else if (!hasAdminPermission(user, 'categories')) router.replace(getDefaultAdminPath(user));
  }, [user, router]);

  const catOk = !!user && canAccessAdmin(user) && hasAdminPermission(user, 'categories');

  const { data, isLoading } = useQuery(
    ['admin-categories-all'],
    () => api.get('/categories/admin/all').then((r) => r.data),
    { enabled: catOk }
  );

  const { data: saleListMeta } = useQuery(
    ['admin-sale-product-count'],
    () => api.get('/products?filter=sale&showAll=1&limit=1').then((r) => r.data),
    { enabled: catOk }
  );
  const saleProductTotal = saleListMeta?.total ?? 0;

  const { data: featuredListMeta } = useQuery(
    ['admin-featured-product-count'],
    () => api.get('/products?filter=featured&showAll=1&limit=1').then((r) => r.data),
    { enabled: catOk }
  );
  const featuredProductTotal = featuredListMeta?.total ?? 0;

  const { data: newArrivalListMeta } = useQuery(
    ['admin-new-arrival-product-count'],
    () => api.get('/products?filter=new&showAll=1&limit=1').then((r) => r.data),
    { enabled: catOk }
  );
  const newArrivalProductTotal = newArrivalListMeta?.total ?? 0;

  const flatAll = data?.categories || [];

  useEffect(() => {
    if (!flatAll.length || expandedInit.current) return;
    expandedInit.current = true;
    const ids = new Set();
    flatAll.forEach((c) => {
      if (flatAll.some((x) => String(x.parent) === String(c._id))) ids.add(String(c._id));
    });
    setExpandedIds(ids);
  }, [flatAll]);

  const filteredFlat = useMemo(() => filterCategoriesForSearch(flatAll, search), [flatAll, search]);
  const tree = useMemo(() => buildTree(filteredFlat), [filteredFlat]);

  const stats = useMemo(() => {
    const total = flatAll.length;
    const active = flatAll.filter((c) => c.isActive).length;
    const withSubs = flatAll.filter((c) => flatAll.some((x) => String(x.parent) === String(c._id))).length;
    return { total, active, withSubs };
  }, [flatAll]);

  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openNew = () => {
    setEditing(null);
    setForm({
      name: '',
      nameAr: '',
      slug: '',
      parent: '',
      icon: '',
      flag: '',
      isFeatured: false,
      sortOrder: 0,
      isActive: true,
    });
    setModalOpen(true);
  };

  const openEdit = (cat) => {
    setEditing(cat);
    setForm({
      name: cat.name || '',
      nameAr: cat.nameAr || '',
      slug: cat.slug || '',
      parent: cat.parent ? String(cat.parent) : '',
      icon: cat.icon || '',
      flag: cat.flag || '',
      isFeatured: !!cat.isFeatured,
      sortOrder: cat.sortOrder ?? 0,
      isActive: !!cat.isActive,
    });
    setModalOpen(true);
  };

  const saveMutation = useMutation(
    async (payload) => {
      if (editing) {
        const { data: res } = await api.put(`/categories/${editing._id}`, payload);
        return res;
      }
      const { data: res } = await api.post('/categories', payload);
      return res;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['admin-categories-all']);
        queryClient.invalidateQueries('categories');
        toast.success(a.categorySaved);
        setModalOpen(false);
      },
      onError: (err) => {
        toast.error(err.response?.data?.error || a.failedCategorySave);
      },
    }
  );

  const deleteMutation = useMutation(
    async (id) => api.delete(`/categories/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['admin-categories-all']);
        queryClient.invalidateQueries('categories');
        toast.success(a.categoryDeleted);
        setModalOpen(false);
      },
      onError: (err) => {
        toast.error(err.response?.data?.error || a.cannotDeleteCategory);
      },
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    const slug = (form.slug || slugify(form.name)).trim();
    if (!form.name.trim() || !slug) {
      toast.error(a.failedCategorySave);
      return;
    }
    const payload = {
      name: form.name.trim(),
      nameAr: form.nameAr.trim(),
      slug: slugify(slug),
      parent: form.parent || null,
      icon: form.icon.trim(),
      flag: form.flag.trim(),
      isFeatured: form.isFeatured,
      sortOrder: Number(form.sortOrder) || 0,
      isActive: form.isActive,
    };
    saveMutation.mutate(payload);
  };

  const handleDelete = () => {
    if (!editing) return;
    if (!confirm(a.deleteCategoryConfirm)) return;
    deleteMutation.mutate(editing._id);
  };

  const parentOptions = useMemo(() => {
    const excl = editing ? new Set([String(editing._id), ...descendantIdSet(flatAll, editing._id)]) : new Set();
    return flatAll.filter((c) => !excl.has(String(c._id)));
  }, [flatAll, editing]);

  if (!user || !canAccessAdmin(user) || !hasAdminPermission(user, 'categories')) return null;

  return (
    <AdminLayout>
      <NextSeo title={`${a.categoriesTitle} — Admin`} />
      <div
        className="-mx-8 -mt-8 -mb-8 px-6 sm:px-8 pt-8 pb-16 min-h-screen"
        style={{ backgroundColor: '#0f1117', color: TEXT }}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: TEXT }}>
              {a.categoriesTitle}
            </h1>
            <button
              type="button"
              onClick={openNew}
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-semibold border transition-colors hover:bg-white/[0.06]"
              style={{ borderColor: 'rgba(255,255,255,0.25)', color: TEXT }}
            >
              {a.addCategoryBtn}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
            {[
              { label: a.catStatTotal, value: stats.total },
              { label: a.catStatActive, value: stats.active },
              { label: a.catStatWithSubs, value: stats.withSubs },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border px-4 py-4 sm:px-5 sm:py-5"
                style={{ backgroundColor: CARD, borderColor: BORDER }}
              >
                <p className="text-xs mb-1" style={{ color: MUTED2 }}>
                  {s.label}
                </p>
                <p className="text-2xl sm:text-3xl font-semibold tabular-nums" style={{ color: TEXT }}>
                  {s.value}
                </p>
              </div>
            ))}
          </div>

          <div className="mb-6">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={a.searchCategories}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none border transition-colors focus:border-violet-500/50"
              style={{
                backgroundColor: CARD,
                borderColor: BORDER,
                color: TEXT,
              }}
            />
          </div>

          <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: CARD, borderColor: BORDER }}>
            {!isLoading && tree.length > 0 && (
              <div
                className="flex items-center gap-3 py-2 px-4 border-b text-[10px] uppercase tracking-wider font-semibold"
                style={{ borderColor: BORDER, color: MUTED2 }}
              >
                <span className="w-6 shrink-0" aria-hidden />
                <span className="flex-1 min-w-0 ps-1">{a.catColumnCategory}</span>
                <span className="w-14 shrink-0 hidden sm:inline text-center">{a.catStatWithSubs}</span>
                <span className="w-[5.5rem] sm:w-28 shrink-0 text-center">{a.catColumnFlag}</span>
                <span className="w-[4.5rem] sm:w-24 shrink-0 text-center">{a.catColumnStatus}</span>
                <span className="w-[52px] shrink-0 text-center">{a.actions}</span>
              </div>
            )}
            {isLoading ? (
              <div className="py-16 text-center text-sm" style={{ color: MUTED }}>
                …
              </div>
            ) : tree.length === 0 ? (
              <div className="py-16 text-center text-sm" style={{ color: MUTED }}>
                {a.noCategoriesYet}
              </div>
            ) : (
              tree.map((node) => (
                <CategoryRow
                  key={node._id}
                  node={node}
                  depth={0}
                  expandedIds={expandedIds}
                  toggleExpand={toggleExpand}
                  flatAll={flatAll}
                  onEdit={openEdit}
                  a={a}
                  isRTL={isRTL}
                />
              ))
            )}
          </div>

          <div className="rounded-2xl border overflow-hidden mt-8" style={{ backgroundColor: CARD, borderColor: BORDER }}>
            <div
              className="flex items-center gap-3 py-2 px-4 border-b text-[10px] uppercase tracking-wider font-semibold"
              style={{ borderColor: BORDER, color: MUTED2 }}
            >
              <span className="w-6 shrink-0" aria-hidden />
              <span className="flex-1 min-w-0 ps-1">{a.salesAssortmentSection}</span>
              <span className="w-14 shrink-0 hidden sm:inline text-center">—</span>
              <span className="w-[5.5rem] sm:w-28 shrink-0 text-center">—</span>
              <span className="w-[4.5rem] sm:w-24 shrink-0 text-center">{a.catColumnStatus}</span>
              <span className="w-[52px] shrink-0 text-center">{a.actions}</span>
            </div>
            <Link
              href="/admin/sales"
              className="flex items-center gap-3 py-3 px-4 transition-colors hover:bg-white/[0.03]"
            >
              <div className="w-6 shrink-0" />
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                style={{ backgroundColor: 'rgba(219,39,119,0.12)', border: `1px solid ${BORDER}` }}
              >
                🏷️
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate" style={{ color: TEXT }}>
                  {a.salesAssortmentRowTitle}
                </p>
                <p className="text-xs font-mono truncate mt-0.5" style={{ color: MUTED2 }}>
                  {a.salesAssortmentRowMeta.replace('{n}', String(saleProductTotal))}
                </p>
              </div>
              <span className="text-xs shrink-0 hidden sm:inline w-14 text-center" style={{ color: MUTED }}>
                —
              </span>
              <div className="w-[5.5rem] sm:w-28 shrink-0 text-center">
                <span className="text-[10px] px-2 py-1 rounded-md bg-rose-500/15 text-rose-200 border border-rose-500/25">
                  {t.shop.onSale}
                </span>
              </div>
              <div className="w-[4.5rem] sm:w-24 shrink-0 flex justify-center">
                <span className="text-xs px-2.5 py-1 rounded-full font-medium text-emerald-300 bg-emerald-500/15">
                  {a.statusLive}
                </span>
              </div>
              <span
                className="text-xs px-3 py-1.5 rounded-lg border shrink-0 transition-colors hover:bg-white/5"
                style={{ borderColor: 'rgba(255,255,255,0.2)', color: MUTED }}
              >
                {a.open}
              </span>
            </Link>
            <Link
              href="/admin/featured"
              className="flex items-center gap-3 py-3 px-4 transition-colors hover:bg-white/[0.03] border-t"
              style={{ borderColor: BORDER }}
            >
              <div className="w-6 shrink-0" />
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                style={{ backgroundColor: 'rgba(139,92,246,0.15)', border: `1px solid ${BORDER}` }}
              >
                ✦
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate" style={{ color: TEXT }}>
                  {a.featuredAssortmentRowTitle}
                </p>
                <p className="text-xs font-mono truncate mt-0.5" style={{ color: MUTED2 }}>
                  {a.featuredAssortmentRowMeta.replace('{n}', String(featuredProductTotal))}
                </p>
              </div>
              <span className="text-xs shrink-0 hidden sm:inline w-14 text-center" style={{ color: MUTED }}>
                —
              </span>
              <div className="w-[5.5rem] sm:w-28 shrink-0 text-center">
                <span className="text-[10px] px-2 py-1 rounded-md bg-violet-500/15 text-violet-200 border border-violet-500/25">
                  {t.nav.featured}
                </span>
              </div>
              <div className="w-[4.5rem] sm:w-24 shrink-0 flex justify-center">
                <span className="text-xs px-2.5 py-1 rounded-full font-medium text-emerald-300 bg-emerald-500/15">
                  {a.statusLive}
                </span>
              </div>
              <span
                className="text-xs px-3 py-1.5 rounded-lg border shrink-0 transition-colors hover:bg-white/5"
                style={{ borderColor: 'rgba(255,255,255,0.2)', color: MUTED }}
              >
                {a.open}
              </span>
            </Link>
            <Link
              href="/admin/new-arrivals"
              className="flex items-center gap-3 py-3 px-4 transition-colors hover:bg-white/[0.03] border-t"
              style={{ borderColor: BORDER }}
            >
              <div className="w-6 shrink-0" />
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                style={{ backgroundColor: 'rgba(14,165,233,0.12)', border: `1px solid ${BORDER}` }}
              >
                ✨
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate" style={{ color: TEXT }}>
                  {a.newArrivalsAssortmentRowTitle}
                </p>
                <p className="text-xs font-mono truncate mt-0.5" style={{ color: MUTED2 }}>
                  {a.newArrivalsAssortmentRowMeta.replace('{n}', String(newArrivalProductTotal))}
                </p>
              </div>
              <span className="text-xs shrink-0 hidden sm:inline w-14 text-center" style={{ color: MUTED }}>
                —
              </span>
              <div className="w-[5.5rem] sm:w-28 shrink-0 text-center">
                <span className="text-[10px] px-2 py-1 rounded-md bg-sky-500/15 text-sky-200 border border-sky-500/25">
                  {t.nav.newArrivals}
                </span>
              </div>
              <div className="w-[4.5rem] sm:w-24 shrink-0 flex justify-center">
                <span className="text-xs px-2.5 py-1 rounded-full font-medium text-emerald-300 bg-emerald-500/15">
                  {a.statusLive}
                </span>
              </div>
              <span
                className="text-xs px-3 py-1.5 rounded-lg border shrink-0 transition-colors hover:bg-white/5"
                style={{ borderColor: 'rgba(255,255,255,0.2)', color: MUTED }}
              >
                {a.open}
              </span>
            </Link>
          </div>
        </div>

        {modalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70" dir={isRTL ? 'rtl' : 'ltr'}>
            <div
              className="w-full max-w-md rounded-2xl border p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
              style={{ backgroundColor: CARD, borderColor: PURPLE_BORDER }}
            >
              <h2 className="text-lg font-bold mb-4" style={{ color: TEXT }}>
                {editing ? a.editCategoryTitle : a.newCategoryTitle}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: MUTED }}>
                    {a.categoryNameEn} *
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setForm((f) => ({
                        ...f,
                        name,
                        slug: editing ? f.slug : slugify(name),
                      }));
                    }}
                    className="w-full px-3 py-2.5 rounded-lg text-sm border outline-none"
                    style={{ backgroundColor: 'rgba(0,0,0,0.25)', borderColor: BORDER, color: TEXT }}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: MUTED }}>
                    {a.categoryNameAr}
                  </label>
                  <input
                    value={form.nameAr}
                    onChange={(e) => setForm((f) => ({ ...f, nameAr: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-lg text-sm border outline-none"
                    style={{ backgroundColor: 'rgba(0,0,0,0.25)', borderColor: BORDER, color: TEXT }}
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: MUTED }}>
                    {a.slug} *
                  </label>
                  <input
                    value={form.slug}
                    onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-lg text-sm border outline-none font-mono"
                    style={{ backgroundColor: 'rgba(0,0,0,0.25)', borderColor: BORDER, color: TEXT }}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: MUTED }}>
                    {a.parentCategory}
                  </label>
                  <select
                    value={form.parent}
                    onChange={(e) => setForm((f) => ({ ...f, parent: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-lg text-sm border outline-none cursor-pointer"
                    style={{ backgroundColor: 'rgba(0,0,0,0.25)', borderColor: BORDER, color: TEXT }}
                  >
                    <option value="">{a.rootCategory}</option>
                    {parentOptions.map((c) => (
                      <option key={c._id} value={c._id}>
                        {isRTL && c.nameAr ? c.nameAr : c.name} ({c.slug})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: MUTED }}>
                    {a.categoryIconEmoji}
                  </label>
                  <input
                    value={form.icon}
                    onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                    placeholder="📁"
                    className="w-full px-3 py-2.5 rounded-lg text-sm border outline-none"
                    style={{ backgroundColor: 'rgba(0,0,0,0.25)', borderColor: BORDER, color: TEXT }}
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: MUTED }}>
                    {a.catFlagField}
                  </label>
                  <input
                    value={form.flag}
                    onChange={(e) => setForm((f) => ({ ...f, flag: e.target.value }))}
                    placeholder={a.catFlagPlaceholder}
                    maxLength={32}
                    className="w-full px-3 py-2.5 rounded-lg text-sm border outline-none"
                    style={{ backgroundColor: 'rgba(0,0,0,0.25)', borderColor: BORDER, color: TEXT }}
                  />
                  <p className="text-[10px] mt-1" style={{ color: MUTED2 }}>
                    {a.catFlagHint}
                  </p>
                </div>
                <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: MUTED }}>
                  <input
                    type="checkbox"
                    checked={form.isFeatured}
                    onChange={(e) => setForm((f) => ({ ...f, isFeatured: e.target.checked }))}
                    className="rounded border-gray-500"
                  />
                  {a.catFeaturedCategory}
                </label>
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: MUTED }}>
                    {a.sortOrderLabel}
                  </label>
                  <input
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-lg text-sm border outline-none"
                    style={{ backgroundColor: 'rgba(0,0,0,0.25)', borderColor: BORDER, color: TEXT }}
                  />
                </div>
                <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: MUTED }}>
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                    className="rounded border-gray-500"
                  />
                  <span>
                    <span className="font-medium text-white/90">{a.catStatusLabel}</span>
                    <span className="text-white/50"> — </span>
                    {a.visibilityOnStore}
                  </span>
                </label>
                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={saveMutation.isLoading}
                    className="flex-1 min-w-[120px] py-3 rounded-xl text-white text-sm font-semibold transition-opacity disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)' }}
                  >
                    {saveMutation.isLoading ? '…' : editing ? a.updateCategory : a.createCategory}
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-5 py-3 rounded-xl text-sm border"
                    style={{ borderColor: BORDER, color: MUTED }}
                  >
                    {a.cancel}
                  </button>
                  {editing && (
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={deleteMutation.isLoading}
                      className="px-5 py-3 rounded-xl text-sm text-orange-300 border border-orange-500/30 hover:bg-orange-500/10"
                    >
                      {a.deleteCategoryBtn}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
