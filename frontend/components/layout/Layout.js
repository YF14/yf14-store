import { useState, useEffect } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import CartDrawer from './CartDrawer';
import AnnouncementBar from './AnnouncementBar';

export default function Layout({ children }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <AnnouncementBar />
      <Navbar scrolled={scrolled} />
      <main className="flex-1 pt-[72px]">{children}</main>
      <Footer />
      <CartDrawer />
    </div>
  );
}
