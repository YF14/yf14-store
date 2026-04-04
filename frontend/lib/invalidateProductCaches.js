/**
 * After any product create/update/delete/reorder, invalidate React Query caches
 * that depend on product data. `invalidateQueries(['products'])` alone misses
 * keys like `admin-products`, `product` (PDP), and facet queries.
 */
export function invalidateProductCaches(queryClient) {
  queryClient.invalidateQueries({
    predicate: (query) => {
      const key = query.queryKey;
      const head = Array.isArray(key) ? key[0] : key;
      if (typeof head !== 'string') return false;

      if (head === 'products' || head === 'product') return true;
      if (head === 'related-products') return true;
      if (head === 'home-marquee-products') return true;
      if (head === 'productPriceRange' || head === 'productColors' || head === 'productSizes') return true;
      if (head === 'categories' || head === 'global-colors') return true;
      if (head === 'top-products' || head === 'inventory') return true;

      if (head === 'admin-products' || head === 'admin-product') return true;
      if (head === 'admin-stock-products' || head === 'admin-out-of-stock') return true;
      if (head === 'admin-category-products') return true;
      if (head === 'private-cat-products') return true;
      if (head === 'admin-all-products-for-private') return true;

      if (
        head === 'admin-featured-products' ||
        head === 'admin-new-arrival-products' ||
        head === 'admin-sale-products' ||
        head === 'admin-best-seller-products'
      ) {
        return true;
      }

      if (
        head === 'admin-best-seller-product-count' ||
        head === 'admin-featured-product-count' ||
        head === 'admin-new-arrival-product-count' ||
        head === 'admin-sale-product-count'
      ) {
        return true;
      }

      return false;
    },
  });
}
