import { create } from 'zustand';
import api from '../lib/api';
import toast from 'react-hot-toast';

const useCartStore = create((set, get) => ({
  cart: null,
  isLoading: false,
  isOpen: false,

  setOpen: (open) => set({ isOpen: open }),

  fetchCart: async () => {
    try {
      const { data } = await api.get('/cart');
      set({ cart: data.cart });
    } catch {}
  },

  addToCart: async (productId, variantId, quantity = 1) => {
    set({ isLoading: true });
    try {
      const { data } = await api.post('/cart/add', { productId, variantId, quantity });
      set({ cart: data.cart, isOpen: true });
      toast.success('Added to cart');
      return { success: true };
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add to cart');
      return { success: false };
    } finally {
      set({ isLoading: false });
    }
  },

  updateItem: async (itemId, quantity) => {
    try {
      const { data } = await api.put(`/cart/item/${itemId}`, { quantity });
      set({ cart: data.cart });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update cart');
    }
  },

  removeItem: async (itemId) => {
    try {
      const { data } = await api.delete(`/cart/item/${itemId}`);
      set({ cart: data.cart });
      toast.success('Item removed');
    } catch (err) {
      toast.error('Failed to remove item');
    }
  },

  clearCart: async () => {
    try {
      await api.delete('/cart');
      set({ cart: null });
    } catch {}
  },

  applyPromo: async (code) => {
    try {
      const subtotal = get().subtotal();
      const { data } = await api.post('/promos/validate', { code, orderAmount: subtotal });
      set((state) => ({
        cart: {
          ...state.cart,
          promoCode: data.code,
          promoDiscount: data.discount,
          promoType: data.type,
          promoValue: data.value,
        },
      }));
      const saved = data.type === 'percentage'
        ? `${data.value}% off`
        : `$${data.discount.toFixed(2)} off`;
      toast.success(`Coupon applied! ${saved}`);
      return { success: true, discount: data.discount };
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid coupon code');
      return { success: false };
    }
  },

  removePromo: () => {
    set((state) => ({
      cart: { ...state.cart, promoCode: null, promoDiscount: 0, promoType: null, promoValue: null },
    }));
    toast.success('Coupon removed');
  },

  itemCount: () => {
    const cart = get().cart;
    if (!cart?.items) return 0;
    return cart.items.reduce((sum, i) => sum + i.quantity, 0);
  },

  subtotal: () => {
    const cart = get().cart;
    if (!cart?.items) return 0;
    return cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  },
}));

export default useCartStore;
