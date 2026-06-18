import { create } from 'zustand';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { tToast } from '../lib/uiToast';

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
      toast.success(isNowWishlisted ? tToast('addedToWishlist') : tToast('removedFromWishlist'));
    } catch {
      toast.error(tToast('loginToWishlist'));
    }
  },

  isWishlisted: (productId) => {
    return get().wishlist.some(
      (item) => (item._id || item)?.toString() === productId?.toString()
    );
  },
}));

export default useWishlistStore;
