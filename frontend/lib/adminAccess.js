/** Must match backend middleware ADMIN_PERMISSION_KEYS */
export const ADMIN_PERMISSION_KEYS = [
  'dashboard',
  'products',
  'categories',
  'sales',
  'featured',
  'newArrivals',
  'bestSellers',
  'stock',
  'orders',
  'users',
  'promos',
  'analytics',
  'activity',
  'settings',
];

/** Nav items: first matching permission wins for default redirect */
export const ADMIN_NAV_ITEMS = [
  { href: '/admin', permission: 'dashboard' },
  { href: '/admin/products', permission: 'products' },
  { href: '/admin/categories', permission: 'categories' },
  { href: '/admin/sales', permission: 'sales' },
  { href: '/admin/featured', permission: 'featured' },
  { href: '/admin/new-arrivals', permission: 'newArrivals' },
  { href: '/admin/best-sellers', permission: 'bestSellers' },
  { href: '/admin/stock', permission: 'stock' },
  { href: '/admin/orders', permission: 'orders' },
  { href: '/admin/users', permission: 'users' },
  { href: '/admin/promos', permission: 'promos' },
  { href: '/admin/analytics', permission: 'analytics' },
  { href: '/admin/activity', permission: 'activity' },
  { href: '/admin/settings', permission: 'settings' },
];

export function canAccessAdmin(user) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  return (
    user.role === 'staff' &&
    Array.isArray(user.adminPermissions) &&
    user.adminPermissions.length > 0
  );
}

export function hasAdminPermission(user, key) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  return user.role === 'staff' && (user.adminPermissions || []).includes(key);
}

export function getDefaultAdminPath(user) {
  if (!canAccessAdmin(user)) return '/login';
  const first = ADMIN_NAV_ITEMS.find((item) => hasAdminPermission(user, item.permission));
  return first?.href || '/admin';
}
