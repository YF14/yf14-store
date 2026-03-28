# Maison Élara — Luxury Women's Fashion E-Commerce

A production-ready, full-stack e-commerce platform for a premium women's dress brand.

## 🏗️ Architecture

```
maison-elara/
├── backend/          # Node.js + Express + MongoDB API
│   └── src/
│       ├── config/   # DB, Cloudflare media, Logger
│       ├── controllers/
│       ├── middleware/
│       ├── models/   # Mongoose schemas
│       ├── routes/
│       ├── scripts/  # DB seed
│       └── services/ # Email, Telegram
├── frontend/         # Next.js 14 + Tailwind CSS
│   ├── components/
│   │   ├── admin/
│   │   ├── layout/
│   │   └── product/
│   ├── pages/
│   │   ├── account/
│   │   ├── admin/
│   │   └── products/
│   ├── store/        # Zustand state management
│   ├── lib/          # API client
│   └── styles/
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Cloudflare Images + Stream (uploads)
- Stripe account (optional for cash-on-delivery flows)

### Backend Setup

```bash
cd backend
cp .env.example .env
# Fill in your .env values
npm install
npm run seed    # Seed database with sample data
npm run dev     # Start dev server on :5000
```

### Frontend Setup

```bash
cd frontend
cp .env.example .env.local
# Fill in your .env.local values
npm install
npm run dev     # Start on :3000
```

## 🔑 Environment Variables

Copy `backend/.env.example` → `backend/.env` and `frontend/.env.example` → `frontend/.env.local`.

### Backend (.env) — also set these on **Railway**
| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB Atlas connection string (**required**) |
| `BACKEND_URL` | Public API URL, no trailing slash (e.g. `https://xxx.up.railway.app`) — used for Telegram webhook + OAuth |
| `JWT_SECRET` | Strong random string (32+ chars) |
| `JWT_REFRESH_SECRET` | Refresh token secret |
| `CLOUDFLARE_*` | Cloudflare Images + Stream (see `backend/.env.example`) |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `EMAIL_*` | SMTP credentials |
| `TELEGRAM_BOT_TOKEN` | From @BotFather |
| `TELEGRAM_CHAT_ID` | Group/channel ID for order alerts |
| `TELEGRAM_WEBHOOK_SECRET` | Random string; protects `GET /api/telegram/set-webhook` |
| `FRONTEND_URL` | Your Next.js URL (CORS + email links) |

**Telegram:** After deploy, call once (replace secret and host):  
`https://YOUR-BACKEND/api/telegram/set-webhook?secret=YOUR_TELEGRAM_WEBHOOK_SECRET`

### Frontend (.env.local)
| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API URL ending in `/api` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `NEXT_PUBLIC_SITE_URL` | Canonical frontend URL |
| `NEXT_PUBLIC_CF_STREAM_CUSTOMER_HOST` | Optional; Stream thumbnail host if `next/image` needs it (see `frontend/.env.example`) |

## 📦 Features

### Customer Features
- 🔐 Email + Google OAuth authentication
- 🛍️ Product browsing with filters & search
- 🎨 Dynamic variant selection (size + color)
- 🛒 Persistent shopping cart
- ❤️ Wishlist
- 💳 Stripe checkout
- 📦 Order tracking
- ⭐ Product reviews (verified purchases)
- 🏷️ Promo code system
- 📧 Email notifications

### Admin Features
- 📊 Analytics dashboard with revenue charts
- 📦 Order management with status updates
- 👗 Product management with variant control
- ⚠️ Low stock alerts
- 🏷️ Promo code management
- 👤 Customer management

## 🚢 Deployment

### Frontend → Vercel
1. Push to GitHub
2. Import to Vercel
3. Set environment variables
4. Deploy

### Backend → Railway / Render
1. Push to GitHub
2. Connect repo (set **root directory** to `backend` if the repo is the monorepo)
3. Copy every variable from `backend/.env.example` into the platform’s env UI (**including** `BACKEND_URL`, `TELEGRAM_*`, `FRONTEND_URL`)
4. Deploy
5. Register Telegram webhook (see table above)

### Stripe Webhook
After deploying backend, register the webhook:
```
https://your-backend.railway.app/api/stripe/webhook
```
Events: `payment_intent.succeeded`, `payment_intent.payment_failed`

## 🔒 Security Features
- JWT authentication with refresh tokens
- Rate limiting (100 req/15min, 20 for auth)
- Input sanitization (mongo-sanitize)
- Helmet security headers
- Admin route protection
- Stock consistency enforcement

## 👤 Admin user

- **Role:** Users with `role: "admin"` in MongoDB can access `/admin` (JWT `protect` + `adminOnly` on the API).
- **After full seed** (`cd backend && npm run seed`): log in with **`ADMIN_EMAIL` / `ADMIN_PASSWORD`** from `.env`, or defaults **`admin@maisonelara.com` / `Admin@123456`** if those env vars are unset.  
  ⚠️ Seeding **deletes all users** — use only on dev/test DBs.
- **Promote an existing account** (keeps other data): from `backend/` run  
  `npm run create-admin -- you@email.com YourPassword`  
  or set `ADMIN_EMAIL` + `ADMIN_PASSWORD` in `.env` and run `npm run create-admin`.

## 🧪 Test Data

After seeding (`npm run seed`):
- **Admin:** same as [Admin user](#-admin-user) above
- **Promo Code:** WELCOME15 (15% off, min $50)
- **Stripe Test Card:** 4242 4242 4242 4242

## 📁 Key Files

| File | Purpose |
|------|---------|
| `backend/src/models/Product.js` | Product + variant schema |
| `backend/src/models/Order.js` | Order with status history |
| `backend/src/controllers/orderController.js` | Order creation + stock deduction |
| `frontend/store/cartStore.js` | Cart state management |
| `frontend/pages/checkout.js` | Stripe checkout flow |
| `frontend/pages/admin/index.js` | Admin dashboard |
