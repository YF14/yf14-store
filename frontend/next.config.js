/** @type {import('next').NextConfig} */
const remotePatterns = [
  { protocol: 'https', hostname: 'ik.imagekit.io' },
  { protocol: 'https', hostname: 'images.unsplash.com' },
  { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
  { protocol: 'https', hostname: 'imagedelivery.net', pathname: '/**' },
  { protocol: 'https', hostname: 'videodelivery.net', pathname: '/**' },
];

// Stream thumbnails / playback often use customer-*.cloudflarestream.com (wildcard when supported)
remotePatterns.push({
  protocol: 'https',
  hostname: '**.cloudflarestream.com',
  pathname: '/**',
});

const streamImgHost = process.env.NEXT_PUBLIC_CF_STREAM_CUSTOMER_HOST;
if (streamImgHost) {
  remotePatterns.push({
    protocol: 'https',
    hostname: streamImgHost.replace(/^https?:\/\//, '').split('/')[0],
    pathname: '/**',
  });
}

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns,
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    optimizeCss: true,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
