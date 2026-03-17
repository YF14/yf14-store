import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-brand-black text-white mt-20">
      {/* Newsletter */}
      <div className="border-b border-white/10 py-16">
        <div className="container-luxury text-center">
          <p className="section-subtitle text-white/40 mb-3">Stay Connected</p>
          <h2 className="font-display text-3xl text-white font-light mb-6">Join the Inner Circle</h2>
          <p className="text-white/60 text-sm mb-8 max-w-md mx-auto font-body">
            Be the first to discover new arrivals, exclusive events, and private sales.
          </p>
          <form
            onSubmit={(e) => e.preventDefault()}
            className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
          >
            <input
              type="email"
              placeholder="Your email address"
              className="flex-1 px-5 py-3 bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm font-body focus:outline-none focus:border-brand-gold transition-colors"
            />
            <button type="submit" className="px-8 py-3 bg-brand-gold text-white text-xs tracking-widest uppercase hover:bg-brand-gold/90 transition-colors">
              Subscribe
            </button>
          </form>
        </div>
      </div>

      {/* Links */}
      <div className="py-16">
        <div className="container-luxury grid grid-cols-1 md:grid-cols-4 gap-12">
          <div>
            <h3 className="font-display text-2xl text-brand-gold font-light tracking-[0.2em] mb-6">YF14 Store</h3>
            <p className="text-white/50 text-sm font-body leading-relaxed">
              The art of feminine elegance. Crafted for the modern woman who celebrates her individuality.
            </p>
            <div className="flex gap-4 mt-6">
              {['instagram', 'pinterest', 'facebook'].map((social) => (
                <a
                  key={social}
                  href={`https://${social}.com`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 border border-white/20 flex items-center justify-center text-white/40 hover:border-brand-gold hover:text-brand-gold transition-colors text-xs capitalize"
                >
                  {social[0].toUpperCase()}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs tracking-widest uppercase text-white/40 mb-5">Collections</h4>
            <ul className="space-y-3">
              {['Evening Dresses', 'Cocktail Dresses', 'Maxi Dresses', 'Mini Dresses', 'Summer Dresses', 'New Arrivals'].map((item) => (
                <li key={item}>
                  <Link href={`/products?category=${item.toLowerCase().replace(/ /g, '-')}`} className="text-sm text-white/60 hover:text-brand-gold transition-colors font-body">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs tracking-widest uppercase text-white/40 mb-5">Customer Care</h4>
            <ul className="space-y-3">
              {[
                { label: 'Size Guide', href: '/size-guide' },
                { label: 'Shipping & Returns', href: '/shipping' },
                { label: 'FAQ', href: '/faq' },
                { label: 'Contact Us', href: '/contact' },
                { label: 'Track Order', href: '/account/orders' },
              ].map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-sm text-white/60 hover:text-brand-gold transition-colors font-body">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs tracking-widest uppercase text-white/40 mb-5">Our Promise</h4>
            <ul className="space-y-4">
              {[
                { icon: '✦', label: 'Free shipping over $100' },
                { icon: '✦', label: '30-day easy returns' },
                { icon: '✦', label: 'Secure checkout' },
                { icon: '✦', label: 'Authentic luxury fabrics' },
              ].map((item) => (
                <li key={item.label} className="flex items-center gap-3">
                  <span className="text-brand-gold text-xs">{item.icon}</span>
                  <span className="text-sm text-white/60 font-body">{item.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10 py-6">
        <div className="container-luxury flex flex-col sm:flex-row items-center justify-between gap-4 text-white/30 text-xs font-body tracking-wide">
          <p>© {new Date().getFullYear()} YF14 Store. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-white/60 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white/60 transition-colors">Terms of Service</Link>
          </div>
          <div className="flex gap-2 items-center">
            <span>Payments:</span>
            {['Visa', 'MC', 'AmEx', 'Stripe'].map((p) => (
              <span key={p} className="px-2 py-0.5 border border-white/20 text-white/40 rounded text-[10px]">{p}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
