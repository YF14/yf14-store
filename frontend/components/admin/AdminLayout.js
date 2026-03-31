import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import useAuthStore from '../../store/authStore';
import { useLang } from '../../contexts/LanguageContext';
import { hasAdminPermission } from '../../lib/adminAccess';

export default function AdminLayout({ children }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isAuthReady = useAuthStore((s) => s.isAuthReady);
  const logout = useAuthStore((s) => s.logout);
  const { t, isRTL, locale, setLocale } = useLang();
  const a = t.admin;
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navDefs = [
    { href: '/admin', label: a.dashboard, icon: '📊', permission: 'dashboard' },
    { href: '/admin/products', label: a.products, icon: '👗', permission: 'products' },
    { href: '/admin/categories', label: a.categoriesMenu, icon: '📂', permission: 'categories' },
    { href: '/admin/sales', label: a.salesAssortmentMenu, icon: '🏷️', permission: 'sales' },
    { href: '/admin/featured', label: a.featuredAssortmentMenu, icon: '✦', permission: 'featured' },
    { href: '/admin/new-arrivals', label: a.newArrivalsAssortmentMenu, icon: '✨', permission: 'newArrivals' },
    { href: '/admin/best-sellers', label: a.bestSellersAssortmentMenu, icon: '⭐', permission: 'bestSellers' },
    { href: '/admin/stock', label: a.stockMenu, icon: '📋', permission: 'stock' },
    { href: '/admin/out-of-stock', label: a.outOfStockMenu || 'Out of Stock', icon: '🚫', permission: 'stock' },
    { href: '/admin/orders', label: a.orders, icon: '📦', permission: 'orders' },
    { href: '/admin/users', label: a.customers, icon: '👤', permission: 'users' },
    { href: '/admin/promos', label: a.promoCodes, icon: '🏷️', permission: 'promos' },
    { href: '/admin/analytics', label: a.analytics, icon: '📈', permission: 'analytics' },
    { href: '/admin/activity', label: a.activityLogMenu, icon: '📜', permission: 'activity' },
    { href: '/admin/settings', label: a.storeSettings, icon: '⚙️', permission: 'settings' },
  ];

  const navItems = navDefs.filter((item) => hasAdminPermission(user, item.permission));

  const toggleLang = () => setLocale(locale === 'ar' ? 'en' : 'ar');

  useEffect(() => {
    setSidebarOpen(false);
  }, [router.pathname]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.style.overflow = sidebarOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  const asideInner = (
    <>
      <div className="p-5 sm:p-6 border-b border-white/10 pt-[max(1.25rem,env(safe-area-inset-top,0px))] lg:pt-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link href="/" className="font-display text-xl text-brand-gold tracking-[0.15em]">
              YF14 Store
            </Link>
            <p className="text-xs text-white/40 mt-1 tracking-widest uppercase">{a.panelTitle}</p>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center text-white/70 hover:text-white border border-white/20 rounded touch-manipulation"
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>
      </div>

      <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto overscroll-contain min-h-0">
        {navItems.map((item) => {
          const isActive =
            router.pathname === item.href || (item.href !== '/admin' && router.pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 text-sm transition-colors rounded-sm touch-manipulation min-h-[44px] ${
                isActive ? 'bg-brand-gold text-white' : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <span aria-hidden>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10 space-y-3 shrink-0 pb-[max(1rem,env(safe-area-inset-bottom,0px))]">
        <button
          type="button"
          onClick={toggleLang}
          className="w-full text-xs py-2.5 text-white/40 hover:text-white border border-white/10 hover:border-white/30 transition-colors touch-manipulation min-h-[44px]"
        >
          {locale === 'ar' ? 'English' : 'العربية'}
        </button>

        <p className="text-xs text-white/40">
          {user?.firstName} {user?.lastName}
        </p>
        <div className="flex gap-2">
          <Link
            href="/"
            className="flex-1 text-center text-xs py-2.5 text-white/40 hover:text-white border border-white/10 hover:border-white/30 transition-colors touch-manipulation min-h-[44px] flex items-center justify-center"
          >
            {isRTL ? 'المتجر →' : '← ' + a.backToStore}
          </Link>
          <button
            type="button"
            onClick={logout}
            className="flex-1 text-xs py-2.5 text-white/40 hover:text-red-400 border border-white/10 hover:border-red-400/30 transition-colors touch-manipulation min-h-[44px]"
          >
            {a.logout}
          </button>
        </div>
      </div>
    </>
  );

  // Hold rendering until fetchMe() has settled so page-level useEffect guards
  // never see a momentary user:null and redirect to /login on hard reload.
  if (!isAuthReady) {
    return (
      <div className="min-h-screen min-h-[100dvh] bg-brand-black flex items-center justify-center">
        <span className="w-6 h-6 rounded-full border-2 border-brand-gold border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-[100dvh] bg-gray-50 flex flex-col lg:flex-row" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-[80] bg-black/50 lg:hidden touch-manipulation"
          aria-label="Close menu"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — drawer on small screens */}
      <aside
        className={`fixed lg:static inset-y-0 z-[90] w-[min(17.5rem,88vw)] max-w-[280px] bg-brand-black flex flex-col lg:w-60 flex-shrink-0 transition-transform duration-200 ease-out ${
          isRTL ? 'right-0' : 'left-0'
        } ${
          sidebarOpen
            ? 'translate-x-0'
            : isRTL
              ? 'translate-x-full lg:translate-x-0'
              : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col flex-1 min-h-0">{asideInner}</div>
      </aside>

      {/* Main column */}
      <div className="flex flex-col flex-1 min-w-0 min-h-0 lg:min-h-screen">
        <header className="lg:hidden sticky top-0 z-[70] flex items-center gap-3 px-3 py-2.5 bg-brand-black text-white border-b border-white/10 pt-[max(0.5rem,env(safe-area-inset-top,0px))] touch-manipulation">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="min-h-[44px] min-w-[44px] flex flex-col justify-center gap-1.5 items-center rounded border border-white/20"
            aria-label="Open menu"
          >
            <span className="h-px w-5 bg-white" />
            <span className="h-px w-5 bg-white" />
            <span className="h-px w-5 bg-white" />
          </button>
          <span className="font-display text-brand-gold tracking-[0.12em] text-sm">{a.panelTitle}</span>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto overflow-x-hidden min-h-0 max-w-[100vw]">
          {children}
        </main>
      </div>
    </div>
  );
}
