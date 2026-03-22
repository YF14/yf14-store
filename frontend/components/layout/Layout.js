import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Navbar from './Navbar';
import Footer from './Footer';
import CartDrawer from './CartDrawer';

export default function Layout({ children }) {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const isHome = router.pathname === '/';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen flex flex-col w-full max-w-[100%]">
      {/* Announcement bar: homepage only (in-page under hero strip). */}
      <div className="fixed top-0 left-0 right-0 z-50 flex flex-col w-full overflow-x-clip">
        <Navbar scrolled={scrolled} />
      </div>
      <main
        className={`flex flex-1 flex-col min-h-0 min-w-0 w-full bg-page-lavender ${
          isHome ? 'pt-0' : 'pt-[118px] lg:pt-[124px]'
        }`}
      >
        {children}
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
}
