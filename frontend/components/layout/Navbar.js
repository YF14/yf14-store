import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../../store/authStore';
import useCartStore from '../../store/cartStore';
import { useLang } from '../../contexts/LanguageContext';
import StoreLogoImage from './StoreLogoImage';

export default function Navbar({ scrolled }) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef(null);

  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const itemCount = useCartStore((s) => s.itemCount());
  const setCartOpen = useCartStore((s) => s.setOpen);
  const { t, locale, setLocale, isRTL } = useLang();

  const navLinks = [
    { label: t.nav.newArrivals, href: '/products?filter=new' },
    { label: t.nav.featured, href: '/products?filter=featured' },
    {
      label: t.nav.collections,
      href: '/products',
      children: [
        { label: t.nav.evening,  href: '/products?category=evening-dresses' },
        { label: t.nav.cocktail, href: '/products?category=cocktail-dresses' },
        { label: t.nav.maxi,     href: '/products?category=maxi-dresses' },
        { label: t.nav.mini,     href: '/products?category=mini-dresses' },
        { label: t.nav.casual,   href: '/products?category=casual-dresses' },
        { label: t.nav.summer,   href: '/products?category=summer-dresses' },
      ],
    },
    { label: t.nav.sale, href: '/products?filter=sale' },
  ];

  useEffect(() => {
    setMobileOpen(false);
    setSearchOpen(false);
  }, [router.pathname]);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <>
      <header
        className={`relative w-full bg-nav-navy transition-shadow duration-300 ${
          scrolled ? 'shadow-[0_8px_28px_rgba(0,0,0,0.35)]' : 'border-b border-white/10'
        }`}
      >
        {/* ── Row 1: Logo + Icons ────────────────── */}
        <div className="container-luxury">
          <div className="relative flex items-center justify-between min-h-16 md:min-h-20 py-1.5 md:py-2">

            {/* Left: Search icon + mobile hamburger */}
            <div className="flex items-center gap-4">
              <button
                className="lg:hidden flex flex-col gap-1.5 w-6"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Menu"
              >
                <span className={`h-px bg-white transition-all duration-300 ${mobileOpen ? 'w-6 rotate-45 translate-y-[8px]' : 'w-6'}`} />
                <span className={`h-px bg-white transition-all duration-300 ${mobileOpen ? 'opacity-0 w-0' : 'w-4'}`} />
                <span className={`h-px bg-white transition-all duration-300 ${mobileOpen ? 'w-6 -rotate-45 -translate-y-[8px]' : 'w-6'}`} />
              </button>
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="hidden lg:block text-white/85 hover:text-brand-gold-light transition-colors"
                aria-label="Search"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>

            {/* Center: Logo — vertically centered in navy row so it doesn’t sit in the announcement bar */}
            <Link
              href="/"
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1"
            >
              <span className="relative block w-11 h-11 md:w-12 md:h-12 shrink-0 rounded-full overflow-hidden bg-nav-navy shadow-[0_2px_12px_rgba(0,0,0,0.35)]">
                <StoreLogoImage
                  fill
                  className="object-contain object-center p-[3px] rounded-full"
                  sizes="(max-width: 768px) 44px, 48px"
                  priority
                />
              </span>
              <h1 className="font-display text-xl md:text-2xl tracking-[0.18em] font-light text-white">
                {t.siteName}
              </h1>
            </Link>

            {/* Right: Account / Lang / Cart */}
            <div className="flex items-center gap-3 md:gap-4">
              {user ? (
                <div className="relative group hidden sm:block">
                  <Link href="/account" className="text-white/85 hover:text-brand-gold-light transition-colors text-xs tracking-wide hidden md:block">
                    {isRTL ? 'حسابي' : 'Account'}
                  </Link>
                  <div className={`absolute ${isRTL ? 'left-0' : 'right-0'} top-full hidden group-hover:block bg-white border border-gray-100 shadow-lg py-2 min-w-[160px] z-50`}>
                    <Link href="/account"        className="block px-5 py-2 text-xs tracking-wider hover:text-brand-gold">{t.nav.myAccount}</Link>
                    <Link href="/account/orders"  className="block px-5 py-2 text-xs tracking-wider hover:text-brand-gold">{t.nav.orders}</Link>
                    <Link href="/account/wishlist" className="block px-5 py-2 text-xs tracking-wider hover:text-brand-gold">{t.nav.wishlist}</Link>
                    {user.role === 'admin' && (
                      <Link href="/admin" className="block px-5 py-2 text-xs tracking-wider text-brand-gold">{t.nav.adminPanel}</Link>
                    )}
                    <hr className="my-1 border-gray-100" />
                    <button onClick={logout} className="block w-full text-left px-5 py-2 text-xs tracking-wider hover:text-brand-gold">
                      {t.nav.signOut}
                    </button>
                  </div>
                </div>
              ) : (
                <Link href="/login" className="hidden sm:block text-xs tracking-wide text-white/85 hover:text-brand-gold-light transition-colors">
                  {isRTL ? 'تسجيل الدخول' : 'Login'}
                </Link>
              )}

              <button
                onClick={() => setLocale(locale === 'ar' ? 'en' : 'ar')}
                className="text-white/90 hover:text-white transition-colors text-xs font-medium border border-white/25 hover:border-brand-gold-light px-2 py-0.5 rounded"
                aria-label="Switch language"
              >
                {locale === 'ar' ? 'EN' : 'ع'}
              </button>

              <button
                onClick={() => setCartOpen(true)}
                className="relative text-white/85 hover:text-brand-gold-light transition-colors flex items-center gap-1.5 text-xs tracking-wide"
                aria-label="Cart"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <span>{isRTL ? 'السلة' : 'Cart'}</span>
                {itemCount > 0 && (
                  <span className="w-4 h-4 bg-brand-gold text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ── Row 2: Desktop Nav Categories ──────── */}
        <div className="hidden lg:block border-t border-white/10">
          <div className="container-luxury">
            <nav className="flex items-center justify-center h-10 gap-8">
              {navLinks.map((link) => (
                <div
                  key={link.label}
                  className="relative h-full flex items-center"
                  onMouseEnter={() => link.children && setActiveDropdown(link.label)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <Link
                    href={link.href}
                    className="text-[11px] tracking-widest uppercase text-white/70 hover:text-brand-gold-light transition-colors flex items-center gap-1"
                  >
                    {link.label}
                    {link.children && (
                      <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </Link>

                  <AnimatePresence>
                    {link.children && activeDropdown === link.label && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full left-0 bg-white border border-gray-100 shadow-lg py-3 min-w-[190px] z-50"
                      >
                        {link.children.map((child) => (
                          <Link
                            key={child.label}
                            href={child.href}
                            className="block px-5 py-2 text-[11px] tracking-wider text-gray-600 hover:text-brand-gold hover:bg-brand-purple-light/30 transition-colors"
                          >
                            {child.label}
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </nav>
          </div>
        </div>

        {/* ── Row 3: Search bar (desktop, toggleable) ── */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-white/10 overflow-hidden"
            >
              <form onSubmit={handleSearch} className="container-luxury py-3">
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4 text-white/45 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    ref={searchRef}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    type="text"
                    placeholder={t.common.searchPlaceholder}
                    className="flex-1 text-sm font-body bg-transparent border-none outline-none text-white placeholder-white/35"
                  />
                  <button
                    type="button"
                    onClick={() => setSearchOpen(false)}
                    className="text-white/45 hover:text-white text-[11px] tracking-widest uppercase"
                  >
                    {t.common.close}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── Mobile full-screen menu ─────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.28 }}
            className="fixed inset-0 z-40 bg-nav-navy pt-20 px-8 pb-8 overflow-y-auto lg:hidden"
          >
            {/* Mobile search */}
            <form onSubmit={handleSearch} className="flex items-center gap-3 border-b border-white/15 pb-4 mb-6">
              <svg className="w-4 h-4 text-white/45" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                type="text"
                placeholder={t.common.searchPlaceholder}
                className="flex-1 text-sm bg-transparent outline-none text-white placeholder-white/35"
              />
            </form>

            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <div key={link.label}>
                  <Link
                    href={link.href}
                    className="block py-3 text-xs tracking-widest uppercase text-white/85 border-b border-white/10 hover:text-brand-gold-light transition-colors"
                  >
                    {link.label}
                  </Link>
                  {link.children && (
                    <div className="pl-4 py-1">
                      {link.children.map((child) => (
                        <Link
                          key={child.label}
                          href={child.href}
                          className="block py-2 text-xs tracking-wider text-white/55 hover:text-brand-gold-light transition-colors"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              <div className="mt-6 flex flex-col gap-3">
                {user ? (
                  <>
                    <Link href="/account"  className="btn-outline text-center">{t.nav.myAccount}</Link>
                    <button onClick={logout} className="btn-ghost text-center">{t.nav.signOut}</button>
                  </>
                ) : (
                  <>
                    <Link href="/login"    className="btn-primary text-center">{t.nav.signIn}</Link>
                    <Link href="/register" className="btn-outline text-center">{t.nav.createAccount}</Link>
                  </>
                )}
                <button
                  onClick={() => setLocale(locale === 'ar' ? 'en' : 'ar')}
                  className="btn-ghost text-center text-sm"
                >
                  {locale === 'ar' ? '🌐 English' : '🌐 العربية'}
                </button>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
