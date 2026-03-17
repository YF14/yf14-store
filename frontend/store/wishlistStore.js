import { create } from 'zustand';
import api from '../lib/api';
import toast from 'react-hot-toast';

const useWishlistStore = create((set, get) => ({
  wishlist: [],

  fetchWishlist: async () => {
    try {
      const { data } = await api.get('/wishlist');
      set({ wishlist: data.wishlist });
    } catch {}
  },

  toggle: async (productId) => {
    try {
      const { data } = await api.post(`/wishlist/${productId}`);
      set({ wishlist: data.wishlist });
      const isNowWishlisted = data.wishlist.some(
        (item) => (item._id || item) === productId
      );
      toast.success(isNowWishlisted ? 'Added to wishlist' : 'Removed from wishlist');
    } catch {
      toast.error('Please log in to use wishlist');
    }
  },

  isWishlisted: (productId) => {
    return get().wishlist.some(
      (item) => (item._id || item)?.toString() === productId?.toString()
    );
  },
}));

export default useWishlistStore;
