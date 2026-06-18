import { create } from 'zustand';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { trackAddToCart } from '../lib/analytics';
import { tToast } from '../lib/uiToast';
import { formatIQD } from '../lib/currency';

// ─── Guest cart helpers ───────────────────────────────────────────────────────
function loadGuestCart() {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem('guestCart') || '[]'); } catch { return []; }
}
function saveGuestCart(items) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('guestCart', JSON.stringify(items));
}

// Applied promo persists across page loads/navigation (the store is in-memory only).
// We store the coupon RULE (type/value/caps), NOT a fixed discount amount, and compute
// the discount from the CURRENT subtotal every time — so it stays correct when the cart
// changes (add/remove/qty). Re-validated server-side on order creation.
function loadPromoMeta() {
  if (typeof window === 'undefined') return null;
  try {
    const p = JSON.parse(localStorage.getItem('guestPromo') || 'null');
    return p && p.code ? p : null;
  } catch { return null; }
}
function savePromoMeta(meta) {
  if (typeof window === 'undefined') return;
  if (meta && meta.code) localStorage.setItem('guestPromo', JSON.stringify(meta));
  else localStorage.removeItem('guestPromo');
}
/** Discount for the active coupon at a given subtotal (mirrors backend calculateDiscount + min-order gate). */
function computePromoDiscount(meta, subtotal) {
  if (!meta || !meta.code || !subtotal || subtotal <= 0) return 0;
  if (meta.minOrderAmount && subtotal < Number(meta.minOrderAmount)) return 0;
  let d = 0;
  if (meta.type === 'percentage') {
    d = (subtotal * Number(meta.value)) / 100;
    if (meta.maxDiscount) d = Math.min(d, Number(meta.maxDiscount));
  } else {
    d = Math.min(Number(meta.value), subtotal);
  }
  return Math.round(d);
}
// The server cart doesn't store the applied promo. Re-attach just the code when we
// replace the cart from the server so the UI shows it active; the amount is always
// recomputed from the current subtotal.
function attachPersistedPromo(cart) {
  if (!cart) return cart;
  const meta = loadPromoMeta();
  if (meta?.code && !cart.promoCode) return { ...cart, promoCode: meta.code };
  return cart;
}

function guestLineKey(variantId, heightCm, weightKg) {
  const h = heightCm != null && !Number.isNaN(Number(heightCm)) ? String(Number(heightCm)) : '';
  const w = weightKg != null && !Number.isNaN(Number(weightKg)) ? String(Number(weightKg)) : '';
  return `${variantId}_${h}_${w}`;
}

// ─── Store ────────────────────────────────────────────────────────────────────
const useCartStore = create((set, get) => ({
  // Server cart (logged-in users)
  cart: null,
  // Guest cart (not logged in) — array of items
  guestItems: [],
  isLoading: false,
  isOpen: false,
  // Active promo code (the rule + amount are derived from localStorage; see computePromoDiscount)
  guestPromoCode: null,

  setOpen: (open) => set({ isOpen: open }),

  // Load guest cart + promo from localStorage on boot
  initGuest: () => {
    const meta = loadPromoMeta();
    set({ guestItems: loadGuestCart(), guestPromoCode: meta?.code || null });
  },

  // ── Server cart ────────────────────────────────────────────────────────────
  fetchCart: async () => {
    try {
      const { data } = await api.get('/cart');
      set({ cart: attachPersistedPromo(data.cart) });
    } catch {}
  },

  addToCart: async (productId, variantId, quantity = 1, productData = null) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    if (!token) {
      // Guest mode — add to localStorage cart
      const prev = get().guestItems;
      const h = productData?.customerHeightCm != null ? Number(productData.customerHeightCm) : null;
      const w = productData?.customerWeightKg != null ? Number(productData.customerWeightKg) : null;
      const lineKey = guestLineKey(variantId, h, w);
      const existing = prev.find(
        (i) => guestLineKey(i.variantId, i.customerHeightCm, i.customerWeightKg) === lineKey,
      );
      let updated;
      if (existing) {
        updated = prev.map((i) =>
          guestLineKey(i.variantId, i.customerHeightCm, i.customerWeightKg) === lineKey
            ? { ...i, quantity: i.quantity + quantity }
            : i,
        );
      } else {
        updated = [...prev, {
          _id: lineKey,
          variantId,
          productId,
          name: productData?.name || '',
          image: productData?.image || '',
          price: productData?.price || 0,
          size: productData?.size || '',
          color: productData?.color || '',
          colorCode: productData?.colorCode || '',
          stock: productData?.stock ?? 99,
          quantity,
          ...(h != null && !Number.isNaN(h) ? { customerHeightCm: h } : {}),
          ...(w != null && !Number.isNaN(w) ? { customerWeightKg: w } : {}),
        }];
      }
      saveGuestCart(updated);
      set({ guestItems: updated, isOpen: true });
      toast.success(tToast('addedToCart'));
      const unit = Number(productData?.price) || 0;
      trackAddToCart({
        contentId: productId,
        contentName: productData?.name || '',
        value: unit * quantity,
        quantity,
        currency: 'IQD',
      });
      return { success: true };
    }

    // Logged-in mode — server cart
    set({ isLoading: true });
    try {
      const h = productData?.customerHeightCm != null ? Number(productData.customerHeightCm) : undefined;
      const w = productData?.customerWeightKg != null ? Number(productData.customerWeightKg) : undefined;
      const { data } = await api.post('/cart/add', {
        productId,
        variantId,
        quantity,
        ...(h != null && !Number.isNaN(h) ? { customerHeightCm: h } : {}),
        ...(w != null && !Number.isNaN(w) ? { customerWeightKg: w } : {}),
      });
      set({ cart: attachPersistedPromo(data.cart), isOpen: true });
      toast.success(tToast('addedToCart'));
      const unit = Number(productData?.price) || 0;
      trackAddToCart({
        contentId: productId,
        contentName: productData?.name || '',
        value: unit * quantity,
        quantity,
        currency: 'IQD',
      });
      return { success: true };
    } catch (err) {
      toast.error(err.response?.data?.error || tToast('addToCartFailed'));
      return { success: false };
    } finally {
      set({ isLoading: false });
    }
  },

  updateItem: async (itemId, quantity) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    if (!token) {
      if (quantity <= 0) {
        const updated = get().guestItems.filter(i => (i._id || i.variantId) !== itemId);
        saveGuestCart(updated);
        set({ guestItems: updated });
      } else {
        const updated = get().guestItems.map(i =>
          (i._id || i.variantId) === itemId ? { ...i, quantity } : i
        );
        saveGuestCart(updated);
        set({ guestItems: updated });
      }
      return;
    }
    try {
      const { data } = await api.put(`/cart/item/${itemId}`, { quantity });
      set({ cart: attachPersistedPromo(data.cart) });
    } catch (err) {
      toast.error(err.response?.data?.error || tToast('updateCartFailed'));
    }
  },

  removeItem: async (itemId) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    if (!token) {
      const updated = get().guestItems.filter(i => (i._id || i.variantId) !== itemId);
      saveGuestCart(updated);
      set({ guestItems: updated });
      toast.success(tToast('removedFromCart'));
      return;
    }
    try {
      const { data } = await api.delete(`/cart/item/${itemId}`);
      set({ cart: attachPersistedPromo(data.cart) });
      toast.success(tToast('removedFromCart'));
    } catch {
      toast.error(tToast('removeItemFailed'));
    }
  },

  clearCart: async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      saveGuestCart([]);
      savePromoMeta(null);
      set({ guestItems: [], guestPromoCode: null });
      return;
    }
    try {
      await api.delete('/cart');
      set({ cart: null });
    } catch {}
  },

  applyPromo: async (code) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    try {
      const subtotal = get().subtotal();
      const { data } = await api.post('/promos/validate', { code, orderAmount: subtotal });
      const saved = data.type === 'percentage' ? `${data.value}%` : formatIQD(data.discount);

      // Mark the coupon active (reactive), and persist its RULE so the discount can be
      // recomputed from the live subtotal whenever the cart changes.
      if (!token) {
        set({ guestPromoCode: data.code });
      } else {
        set((state) => ({ cart: { ...state.cart, promoCode: data.code } }));
      }
      savePromoMeta({
        code: data.code,
        type: data.type,
        value: data.value,
        maxDiscount: data.maxDiscount ?? null,
        minOrderAmount: data.minOrderAmount ?? 0,
      });
      toast.success(tToast('couponApplied').replace('{saved}', saved));
      return { success: true, discount: data.discount };
    } catch (err) {
      toast.error(err.response?.data?.error || tToast('invalidCoupon'));
      return { success: false };
    }
  },

  removePromo: () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      set({ guestPromoCode: null });
    } else {
      set((state) => ({ cart: { ...state.cart, promoCode: null } }));
    }
    savePromoMeta(null);
    toast.success(tToast('couponRemoved'));
  },

  // ── Computed ───────────────────────────────────────────────────────────────
  isGuest: () => {
    if (typeof window === 'undefined') return true;
    return !localStorage.getItem('token');
  },

  activeItems: () => {
    const { cart, guestItems } = get();
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return token ? (cart?.items || []) : guestItems;
  },

  itemCount: () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      const cart = get().cart;
      if (!cart?.items) return 0;
      return cart.items.reduce((sum, i) => sum + i.quantity, 0);
    }
    return get().guestItems.reduce((sum, i) => sum + i.quantity, 0);
  },

  subtotal: () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      const cart = get().cart;
      if (!cart?.items) return 0;
      return cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    }
    return get().guestItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  },

  activePromoCode: () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return token ? get().cart?.promoCode : get().guestPromoCode;
  },

  // Always derived from the current subtotal, so it tracks cart changes and never
  // over-discounts after items are removed.
  activePromoDiscount: () => {
    if (!get().activePromoCode()) return 0;
    return computePromoDiscount(loadPromoMeta(), get().subtotal());
  },
}));

export default useCartStore;
