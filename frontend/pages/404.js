import Link from 'next/link';
import Layout from '../components/layout/Layout';

export default function NotFound() {
  return (
    <Layout>
      <div className="container-luxury py-32 text-center">
        <p className="font-display text-[120px] font-light text-brand-black/10 leading-none mb-0">404</p>
        <h1 className="font-display text-5xl font-light -mt-6 mb-4">Page Not Found</h1>
        <p className="text-brand-warm-gray mb-10 max-w-md mx-auto">
          The page you're looking for has moved or doesn't exist. Let us guide you back to our collection.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/" className="btn-primary">Return Home</Link>
          <Link href="/products" className="btn-outline">Shop Collection</Link>
        </div>
      </div>
    </Layout>
  );
}
