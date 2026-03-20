import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../lib/api';
import toast from 'react-hot-toast';

// ─── Guest cart helpers ───────────────────────────────────────────────────────
function loadGuestCart() {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem('guestCart') || '[]'); } catch { return []; }
}
function saveGuestCart(items) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('guestCart', JSON.stringify(items));
}

// ─── Store ────────────────────────────────────────────────────────────────────
const useCartStore = create((set, get) => ({
  // Server cart (logged-in users)
  cart: null,
  // Guest cart (not logged in) — array of items
  guestItems: [],
  isLoading: false,
  isOpen: false,
  // Guest promo
  guestPromoCode: null,
  guestPromoDiscount: 0,

  setOpen: (open) => set({ isOpen: open }),

  // Load guest cart from localStorage on boot
  initGuest: () => {
    set({ guestItems: loadGuestCart() });
  },

  // ── Server cart ────────────────────────────────────────────────────────────
  fetchCart: async () => {
    try {
      const { data } = await api.get('/cart');
      set({ cart: data.cart });
    } catch {}
  },

  addToCart: async (productId, variantId, quantity = 1, productData = null) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    if (!token) {
      // Guest mode — add to localStorage cart
      const prev = get().guestItems;
      const existing = prev.find(i => i.variantId === variantId);
      let updated;
      if (existing) {
        updated = prev.map(i =>
          i.variantId === variantId ? { ...i, quantity: i.quantity + quantity } : i
        );
      } else {
        updated = [...prev, {
          _id: variantId, // unique key
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
        }];
      }
      saveGuestCart(updated);
      set({ guestItems: updated, isOpen: true });
      toast.success('تمت الإضافة للسلة');
      return { success: true };
    }

    // Logged-in mode — server cart
    set({ isLoading: true });
    try {
      const { data } = await api.post('/cart/add', { productId, variantId, quantity });
      set({ cart: data.cart, isOpen: true });
      toast.success('تمت الإضافة للسلة');
      return { success: true };
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add to cart');
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
      set({ cart: data.cart });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update cart');
    }
  },

  removeItem: async (itemId) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    if (!token) {
      const updated = get().guestItems.filter(i => (i._id || i.variantId) !== itemId);
      saveGuestCart(updated);
      set({ guestItems: updated });
      toast.success('تم الحذف');
      return;
    }
    try {
      const { data } = await api.delete(`/cart/item/${itemId}`);
      set({ cart: data.cart });
      toast.success('تم الحذف');
    } catch {
      toast.error('Failed to remove item');
    }
  },

  clearCart: async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      saveGuestCart([]);
      set({ guestItems: [], guestPromoCode: null, guestPromoDiscount: 0 });
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
      const saved = data.type === 'percentage' ? `${data.value}% off` : `$${data.discount.toFixed(2)} off`;

      if (!token) {
        set({ guestPromoCode: data.code, guestPromoDiscount: data.discount });
      } else {
        set((state) => ({
          cart: {
            ...state.cart,
            promoCode: data.code,
            promoDiscount: data.discount,
            promoType: data.type,
            promoValue: data.value,
          },
        }));
      }
      toast.success(`تم تطبيق الكوبون! ${saved}`);
      return { success: true, discount: data.discount };
    } catch (err) {
      toast.error(err.response?.data?.error || 'كوبون غير صالح');
      return { success: false };
    }
  },

  removePromo: () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      set({ guestPromoCode: null, guestPromoDiscount: 0 });
    } else {
      set((state) => ({
        cart: { ...state.cart, promoCode: null, promoDiscount: 0, promoType: null, promoValue: null },
      }));
    }
    toast.success('تم إزالة الكوبون');
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

  activePromoDiscount: () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return token ? (get().cart?.promoDiscount || 0) : (get().guestPromoDiscount || 0);
  },
}));

export default useCartStore;
