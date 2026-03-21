import Link from 'next/link';
import { useRouter } from 'next/router';
import useAuthStore from '../../store/authStore';
import { useLang } from '../../contexts/LanguageContext';

export default function AdminLayout({ children }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { t, isRTL, locale, setLocale } = useLang();
  const a = t.admin;

  const navItems = [
    { href: '/admin', label: a.dashboard, icon: '📊' },
    { href: '/admin/products', label: a.products, icon: '👗' },
    { href: '/admin/orders', label: a.orders, icon: '📦' },
    { href: '/admin/users', label: a.customers, icon: '👤' },
    { href: '/admin/promos', label: a.promoCodes, icon: '🏷️' },
    { href: '/admin/analytics', label: a.analytics, icon: '📈' },
    { href: '/admin/settings', label: a.storeSettings, icon: '⚙️' },
  ];

  const toggleLang = () => setLocale(locale === 'ar' ? 'en' : 'ar');

  return (
    <div className="min-h-screen bg-gray-50 flex" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Sidebar */}
      <aside className="w-60 bg-brand-black flex-shrink-0 flex flex-col">
        <div className="p-6 border-b border-white/10">
          <Link href="/" className="font-display text-xl text-brand-gold tracking-[0.15em]">
            YF14 Store
          </Link>
          <p className="text-xs text-white/40 mt-1 tracking-widest uppercase">{a.panelTitle}</p>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = router.pathname === item.href
              || (item.href !== '/admin' && router.pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 text-sm transition-colors rounded-sm ${
                  isActive
                    ? 'bg-brand-gold text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10 space-y-3">
          {/* Language toggle */}
          <button
            onClick={toggleLang}
            className="w-full text-xs py-1.5 text-white/40 hover:text-white border border-white/10 hover:border-white/30 transition-colors"
          >
            {locale === 'ar' ? 'English' : 'العربية'}
          </button>

          <p className="text-xs text-white/40">{user?.firstName} {user?.lastName}</p>
          <div className="flex gap-2">
            <Link
              href="/"
              className="flex-1 text-center text-xs py-1.5 text-white/40 hover:text-white border border-white/10 hover:border-white/30 transition-colors"
            >
              {isRTL ? 'المتجر →' : '← ' + a.backToStore}
            </Link>
            <button
              onClick={logout}
              className="flex-1 text-xs py-1.5 text-white/40 hover:text-red-400 border border-white/10 hover:border-red-400/30 transition-colors"
            >
              {a.logout}
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-8 overflow-y-auto max-h-screen">
        {children}
      </main>
    </div>
  );
}
