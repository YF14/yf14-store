# Maison Élara — Luxury Women's Fashion E-Commerce

A production-ready, full-stack e-commerce platform for a premium women's dress brand.

## 🏗️ Architecture

```
maison-elara/
├── backend/          # Node.js + Express + MongoDB API
│   └── src/
│       ├── config/   # DB, Cloudinary, Logger
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
- Cloudinary account
- Stripe account

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

### Backend (.env)
| Variable | Description |
|----------|-------------|
| MONGODB_URI | MongoDB Atlas connection string |
| JWT_SECRET | Strong random string (32+ chars) |
| CLOUDINARY_* | Cloudinary credentials |
| STRIPE_SECRET_KEY | Stripe secret key |
| STRIPE_WEBHOOK_SECRET | Stripe webhook secret |
| EMAIL_* | SMTP credentials |
| TELEGRAM_BOT_TOKEN | Optional Telegram bot |

### Frontend (.env.local)
| Variable | Description |
|----------|-------------|
| NEXT_PUBLIC_API_URL | Backend API URL |
| NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY | Stripe publishable key |

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
2. Connect repo
3. Set environment variables
4. Deploy

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

## 🧪 Test Data

After seeding (`npm run seed`):
- **Admin:** admin@maisonelara.com / Admin@123456
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
