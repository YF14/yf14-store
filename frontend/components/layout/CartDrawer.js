import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import useCartStore from '../../store/cartStore';

export default function CartDrawer() {
  const { cart, isOpen, setOpen, updateItem, removeItem } = useCartStore();
  const subtotal = useCartStore((s) => s.subtotal());
  const shipping = subtotal >= 100 ? 0 : 9.99;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.35 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-brand-black/10">
              <h2 className="font-display text-xl font-light tracking-wide">
                Shopping Bag
                {cart?.items?.length > 0 && (
                  <span className="ml-2 font-body text-sm text-brand-warm-gray">({cart.items.length})</span>
                )}
              </h2>
              <button onClick={() => setOpen(false)} className="text-brand-warm-gray hover:text-brand-black transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {!cart?.items?.length ? (
                <div className="flex flex-col items-center justify-center h-full text-center gap-6">
                  <div className="w-20 h-20 border border-brand-black/10 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-brand-warm-gray" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-display text-xl mb-2">Your bag is empty</p>
                    <p className="text-sm text-brand-warm-gray mb-6">Discover our collection of luxury dresses</p>
                    <Link href="/products" onClick={() => setOpen(false)} className="btn-primary">
                      Shop Now
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {cart.items.map((item) => (
                    <div key={item._id} className="flex gap-4">
                      <div className="w-20 h-28 bg-gray-50 flex-shrink-0 relative overflow-hidden">
                        {item.product?.images?.[0]?.url && (
                          <Image
                            src={item.product.images[0].url}
                            alt={item.name}
                            fill
                            className="object-cover"
                            sizes="80px"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/products/${item.product?.slug}`}
                          onClick={() => setOpen(false)}
                          className="font-body text-sm font-medium hover:text-brand-gold transition-colors line-clamp-2"
                        >
                          {item.name}
                        </Link>
                        <p className="text-xs text-brand-warm-gray mt-1">
                          {item.size} · {item.color}
                        </p>
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center border border-brand-black/20">
                            <button
                              onClick={() => updateItem(item._id, item.quantity - 1)}
                              className="w-7 h-7 flex items-center justify-center text-brand-warm-gray hover:text-brand-black transition-colors text-sm"
                            >
                              −
                            </button>
                            <span className="w-8 text-center text-xs font-medium">{item.quantity}</span>
                            <button
                              onClick={() => updateItem(item._id, item.quantity + 1)}
                              className="w-7 h-7 flex items-center justify-center text-brand-warm-gray hover:text-brand-black transition-colors text-sm"
                            >
                              +
                            </button>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                            <button
                              onClick={() => removeItem(item._id)}
                              className="text-brand-warm-gray hover:text-red-500 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {cart?.items?.length > 0 && (
              <div className="border-t border-brand-black/10 px-6 py-6 space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-brand-warm-gray">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-brand-warm-gray">
                    <span>Shipping</span>
                    <span>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
                  </div>
                  {cart.promoDiscount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount ({cart.promoCode})</span>
                      <span>−${cart.promoDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-medium text-brand-black pt-2 border-t border-brand-black/10">
                    <span className="text-xs tracking-widest uppercase">Estimated Total</span>
                    <span>${(subtotal + shipping - (cart.promoDiscount || 0)).toFixed(2)}</span>
                  </div>
                </div>
                {subtotal < 100 && (
                  <p className="text-xs text-brand-warm-gray text-center">
                    Add ${(100 - subtotal).toFixed(2)} more for free shipping
                  </p>
                )}
                <Link
                  href="/checkout"
                  onClick={() => setOpen(false)}
                  className="btn-primary w-full text-center"
                >
                  Proceed to Checkout
                </Link>
                <button
                  onClick={() => setOpen(false)}
                  className="btn-ghost w-full text-center text-brand-warm-gray"
                >
                  Continue Shopping
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
