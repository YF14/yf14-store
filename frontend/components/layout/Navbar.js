import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../../store/authStore';
import useCartStore from '../../store/cartStore';
import useWishlistStore from '../../store/wishlistStore';
import { useLang } from '../../contexts/LanguageContext';

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
    {
      label: t.nav.collections,
      href: '/products',
      children: [
        { label: t.nav.evening, href: '/products?category=evening-dresses' },
        { label: t.nav.cocktail, href: '/products?category=cocktail-dresses' },
        { label: t.nav.maxi, href: '/products?category=maxi-dresses' },
        { label: t.nav.mini, href: '/products?category=mini-dresses' },
        { label: t.nav.casual, href: '/products?category=casual-dresses' },
        { label: t.nav.summer, href: '/products?category=summer-dresses' },
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
        className={`fixed top-[36px] left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-white/95 backdrop-blur-sm shadow-sm' : 'bg-white'
        }`}
        style={{ top: mobileOpen ? 0 : undefined }}
      >
        <div className="container-luxury">
          <div className="flex items-center justify-between h-[72px]">
            {/* Mobile menu button */}
            <button
              className="lg:hidden flex flex-col gap-1.5 w-6"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menu"
            >
              <span className={`h-px bg-brand-black transition-all duration-300 ${mobileOpen ? 'w-6 rotate-45 translate-y-[8px]' : 'w-6'}`} />
              <span className={`h-px bg-brand-black transition-all duration-300 ${mobileOpen ? 'opacity-0 w-0' : 'w-4'}`} />
              <span className={`h-px bg-brand-black transition-all duration-300 ${mobileOpen ? 'w-6 -rotate-45 -translate-y-[8px]' : 'w-6'}`} />
            </button>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <div
                  key={link.label}
                  className="relative"
                  onMouseEnter={() => link.children && setActiveDropdown(link.label)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <Link
                    href={link.href}
                    className="text-xs tracking-widest uppercase font-medium text-brand-black hover:text-brand-gold transition-colors duration-200 py-2 flex items-center gap-1"
                  >
                    {link.label}
                    {link.children && (
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </Link>
                  <AnimatePresence>
                    {link.children && activeDropdown === link.label && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full left-0 bg-white border border-brand-black/10 shadow-xl py-4 min-w-[200px]"
                      >
                        {link.children.map((child) => (
                          <Link
                            key={child.label}
                            href={child.href}
                            className="block px-6 py-2.5 text-xs tracking-wider text-brand-black hover:text-brand-gold hover:bg-brand-cream transition-colors"
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

            {/* Logo */}
            <Link href="/" className="absolute left-1/2 -translate-x-1/2">
              <h1 className="font-display text-2xl md:text-3xl tracking-[0.2em] text-brand-black font-light uppercase">
                YF14 Store
              </h1>
            </Link>

            {/* Icons */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="text-brand-black hover:text-brand-gold transition-colors"
                aria-label="Search"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>

              {user ? (
                <div className="relative group hidden sm:block">
                  <Link href="/account" className="text-brand-black hover:text-brand-gold transition-colors" aria-label="Account">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </Link>
                  <div className={`absolute ${isRTL ? 'left-0' : 'right-0'} top-full hidden group-hover:block bg-white border border-brand-black/10 shadow-xl py-2 min-w-[160px] z-50`}>
                    <Link href="/account" className="block px-5 py-2 text-xs tracking-wider hover:text-brand-gold">{t.nav.myAccount}</Link>
                    <Link href="/account/orders" className="block px-5 py-2 text-xs tracking-wider hover:text-brand-gold">{t.nav.orders}</Link>
                    <Link href="/account/wishlist" className="block px-5 py-2 text-xs tracking-wider hover:text-brand-gold">{t.nav.wishlist}</Link>
                    {user.role === 'admin' && (
                      <Link href="/admin" className="block px-5 py-2 text-xs tracking-wider text-brand-gold">{t.nav.adminPanel}</Link>
                    )}
                    <hr className="my-1 border-brand-black/10" />
                    <button onClick={logout} className="block w-full text-left px-5 py-2 text-xs tracking-wider hover:text-brand-gold">
                      {t.nav.signOut}
                    </button>
                  </div>
                </div>
              ) : (
                <Link href="/login" className="hidden sm:block text-brand-black hover:text-brand-gold transition-colors" aria-label="Login">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </Link>
              )}

              {/* Language switcher */}
              <button
                onClick={() => setLocale(locale === 'ar' ? 'en' : 'ar')}
                className="text-brand-black hover:text-brand-gold transition-colors text-xs font-medium tracking-wide border border-brand-black/20 hover:border-brand-gold px-2 py-1 rounded"
                aria-label="Switch language"
                title={locale === 'ar' ? 'English' : 'العربية'}
              >
                {locale === 'ar' ? 'EN' : 'ع'}
              </button>

              <button
                onClick={() => setCartOpen(true)}
                className="relative text-brand-black hover:text-brand-gold transition-colors"
                aria-label="Cart"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 w-4 h-4 bg-brand-gold text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-brand-black/10 overflow-hidden"
            >
              <form onSubmit={handleSearch} className="container-luxury py-4">
                <div className="flex items-center gap-4">
                  <svg className="w-5 h-5 text-brand-warm-gray flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    ref={searchRef}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    type="text"
                    placeholder={t.common.searchPlaceholder}
                    className="flex-1 text-sm font-body tracking-wide bg-transparent border-none outline-none text-brand-black placeholder-brand-warm-gray"
                  />
                  <button
                    type="button"
                    onClick={() => setSearchOpen(false)}
                    className="text-brand-warm-gray hover:text-brand-black text-xs tracking-widest uppercase"
                  >
                    {t.common.close}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed inset-0 z-40 bg-white pt-20 px-8 pb-8 overflow-y-auto lg:hidden"
          >
            <nav className="flex flex-col gap-1 mt-8">
              {navLinks.map((link) => (
                <div key={link.label}>
                  <Link
                    href={link.href}
                    className="block py-3 text-sm tracking-widest uppercase font-medium border-b border-brand-black/10 hover:text-brand-gold transition-colors"
                  >
                    {link.label}
                  </Link>
                  {link.children && (
                    <div className="pl-4">
                      {link.children.map((child) => (
                        <Link
                          key={child.label}
                          href={child.href}
                          className="block py-2 text-xs tracking-wider text-brand-warm-gray hover:text-brand-gold transition-colors"
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
                    <Link href="/account" className="btn-outline text-center">{t.nav.myAccount}</Link>
                    <button onClick={logout} className="btn-ghost text-center">{t.nav.signOut}</button>
                  </>
                ) : (
                  <>
                    <Link href="/login" className="btn-primary text-center">{t.nav.signIn}</Link>
                    <Link href="/register" className="btn-outline text-center">{t.nav.createAccount}</Link>
                  </>
                )}
                {/* Language toggle in mobile menu */}
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
