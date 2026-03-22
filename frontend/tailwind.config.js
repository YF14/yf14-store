/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        nav: {
          navy: '#1a1a2e',
        },
        page: {
          lavender: '#fdf4ff',
        },
        hero: {
          purple: '#2d1b69',
        },
        brand: {
          black:          '#16001e',
          gold:           '#8b2be2',
          'gold-deep':    '#6d1eb8',
          'gold-light':   '#ead5ff',
          cream:          '#fdf4ff',
          'warm-gray':    '#8b6aaa',
          pink:           '#d63384',
          'pink-light':   '#fce4f2',
          purple:         '#8b2be2',
          'purple-dark':  '#3b0764',
          'purple-mid':   '#6d1eb8',
          'purple-light': '#f3e8ff',
          'purple-glow':  'rgba(139,43,226,0.18)',
        },
      },
      fontFamily: {
        display: ['Cormorant Garamond', 'Georgia', 'serif'],
        body: ['Jost', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'fade-up': 'fadeUp 0.6s ease forwards',
        'fade-in': 'fadeIn 0.4s ease forwards',
        'slide-in': 'slideIn 0.5s ease forwards',
        shimmer: 'shimmer 1.5s infinite',
        marquee: 'marquee 55s linear infinite',
        // Home product strip — longer duration = slower scroll (was 28s)
        'marquee-home': 'marquee 72s linear infinite',
        shake: 'productShake 0.4s ease',
      },
      keyframes: {
        productShake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-6px)' },
          '40%': { transform: 'translateX(6px)' },
          '60%': { transform: 'translateX(-4px)' },
          '80%': { transform: 'translateX(4px)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        fadeUp: {
          from: { opacity: 0, transform: 'translateY(30px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        slideIn: {
          from: { transform: 'translateX(-100%)' },
          to: { transform: 'translateX(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      transitionTimingFunction: {
        luxury: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
      },
    },
  },
  plugins: [],
};
