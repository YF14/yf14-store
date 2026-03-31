import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from 'react-query';
import useAuthStore from '../../store/authStore';
import useCartStore from '../../store/cartStore';
import { canAccessAdmin, getDefaultAdminPath } from '../../lib/adminAccess';
import { useLang } from '../../contexts/LanguageContext';
import { catName } from '../../lib/currency';
import api from '../../lib/api';
import StoreLogoImage from './StoreLogoImage';

export default function Navbar({ scrolled }) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [portalReady, setPortalReady] = useState(false);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const itemCount = useCartStore((s) => s.itemCount());
  const setCartOpen = useCartStore((s) => s.setOpen);
  const { t, locale, setLocale, isRTL } = useLang();

  const { data: catData } = useQuery(
    'categories',
    () => api.get('/categories').then((r) => r.data),
    { staleTime: 2 * 60 * 1000 }
  );
  const categories = catData?.categories || [];

  const navLinks = useMemo(() => [
    { label: t.nav.newArrivals, href: '/new-arrivals' },
    { label: t.nav.featured, href: '/featured' },
    { label: t.nav.bestSellers, href: '/best-sellers' },
    {
      label: t.nav.collections,
      href: '/products',
      children: categories.map((cat) => ({
        label: catName(cat, isRTL),
        href: `/products?category=${cat.slug}`,
      })),
    },
    { label: t.nav.sale, href: '/sale' },
  ], [t, isRTL, categories]);

  useEffect(() => {
    setMobileOpen(false);
  }, [router.pathname]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  return (
    <>
      <header
        className={`relative w-full bg-nav-navy pt-[env(safe-area-inset-top,0px)] transition-shadow duration-300 touch-manipulation ${
          scrolled ? 'shadow-[0_8px_28px_rgba(0,0,0,0.35)]' : 'border-b border-white/10'
        }`}
      >
        {/* ── Row 1: Logo + Icons ────────────────── */}
        <div className="container-luxury">
          <div className="relative flex items-center justify-between min-h-16 md:min-h-20 py-1.5 md:py-2">

            {/* Left: mobile hamburger (balances logo row on desktop) */}
            <div className="flex items-center gap-2 min-w-0 lg:min-w-[4.5rem]">
              <button
                type="button"
                className="lg:hidden flex flex-col gap-1.5 justify-center items-center min-h-[44px] min-w-[44px] -ms-1 rounded-md border border-transparent hover:border-white/15 active:bg-white/5"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-expanded={mobileOpen}
                aria-label="Menu"
              >
                <span className={`h-px bg-white transition-all duration-300 ${mobileOpen ? 'w-6 rotate-45 translate-y-[8px]' : 'w-6'}`} />
                <span className={`h-px bg-white transition-all duration-300 ${mobileOpen ? 'opacity-0 w-0' : 'w-4'}`} />
                <span className={`h-px bg-white transition-all duration-300 ${mobileOpen ? 'w-6 -rotate-45 -translate-y-[8px]' : 'w-6'}`} />
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
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4 shrink-0">
              {user ? (
                <div className="relative group hidden sm:block">
                  <Link href="/account" className="text-white/85 hover:text-brand-gold-light transition-colors text-xs tracking-wide hidden md:block">
                    {isRTL ? 'حسابي' : 'Account'}
                  </Link>
                  <div className={`absolute ${isRTL ? 'left-0' : 'right-0'} top-full hidden group-hover:block bg-white border border-gray-100 shadow-lg py-2 min-w-[160px] z-50`}>
                    <Link href="/account"        className="block px-5 py-2 text-xs tracking-wider hover:text-brand-gold">{t.nav.myAccount}</Link>
                    <Link href="/account/orders"  className="block px-5 py-2 text-xs tracking-wider hover:text-brand-gold">{t.nav.orders}</Link>
                    <Link href="/account/wishlist" className="block px-5 py-2 text-xs tracking-wider hover:text-brand-gold">{t.nav.wishlist}</Link>
                    {canAccessAdmin(user) && (
                      <Link href={getDefaultAdminPath(user)} className="block px-5 py-2 text-xs tracking-wider text-brand-gold">{t.nav.adminPanel}</Link>
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
                type="button"
                onClick={() => setLocale(locale === 'ar' ? 'en' : 'ar')}
                className="text-white/90 hover:text-white transition-colors text-xs font-medium border border-white/25 hover:border-brand-gold-light min-h-[40px] min-w-[40px] sm:min-h-0 sm:min-w-0 px-2.5 py-1.5 sm:py-0.5 rounded touch-manipulation"
                aria-label="Switch language"
              >
                {locale === 'ar' ? 'EN' : 'ع'}
              </button>

              <button
                type="button"
                onClick={() => setCartOpen(true)}
                className="relative text-white/85 hover:text-brand-gold-light transition-colors flex items-center gap-1.5 text-xs tracking-wide min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 justify-center sm:justify-start px-1 -me-1 sm:me-0 touch-manipulation"
                aria-label="Cart"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <span className="hidden sm:inline">{isRTL ? 'السلة' : 'Cart'}</span>
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
      </header>

      {/* ── Mobile full-screen menu ─────────────── */}
      {portalReady &&
        typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {mobileOpen && (
              <>
                <motion.button
                  type="button"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="fixed inset-0 z-[200] bg-black/50 lg:hidden touch-manipulation"
                  aria-label="Close menu"
                  onClick={() => setMobileOpen(false)}
                />
                <motion.div
                  initial={{ x: isRTL ? '100%' : '-100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: isRTL ? '100%' : '-100%' }}
                  transition={{ type: 'tween', duration: 0.28 }}
                  className={`fixed inset-y-0 z-[210] w-[min(100%,20rem)] max-w-[85vw] bg-nav-navy overflow-y-auto overscroll-contain lg:hidden shadow-2xl ${
                    isRTL ? 'right-0' : 'left-0'
                  } pt-[calc(1rem+env(safe-area-inset-top,0px))] px-5 sm:px-8 pb-[max(2rem,env(safe-area-inset-bottom,0px))]`}
                  role="dialog"
                  aria-modal="true"
                >
                  <div className={`flex items-center justify-between mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <span className="text-[10px] tracking-[0.2em] uppercase text-white/50">{t.siteName}</span>
                    <button
                      type="button"
                      onClick={() => setMobileOpen(false)}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md border border-white/20 text-white/90 hover:bg-white/10 touch-manipulation"
                      aria-label="Close menu"
                    >
                      ✕
                    </button>
                  </div>
            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <div key={link.label}>
                  <Link
                    href={link.href}
                    className="block py-3.5 min-h-[44px] flex items-center text-xs tracking-widest uppercase text-white/85 border-b border-white/10 hover:text-brand-gold-light transition-colors touch-manipulation"
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
                    <button type="button" onClick={logout} className="btn-ghost text-center min-h-[44px] touch-manipulation">{t.nav.signOut}</button>
                  </>
                ) : (
                  <>
                    <Link href="/login"    className="btn-primary text-center">{t.nav.signIn}</Link>
                    <Link href="/register" className="btn-outline text-center">{t.nav.createAccount}</Link>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setLocale(locale === 'ar' ? 'en' : 'ar')}
                  className="btn-ghost text-center text-sm min-h-[44px] touch-manipulation"
                >
                  {locale === 'ar' ? '🌐 English' : '🌐 العربية'}
                </button>
              </div>
            </nav>
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}
