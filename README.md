# Production-Ready Ecommerce SaaS (Frontend + Backend)

This repository now contains a complete full-stack ecommerce SaaS with a separated React frontend and Node/Express backend.

## Folder Structure

```bash
.
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── services/
│   ├── Dockerfile
│   └── .env.example
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── config/
│   │   └── utils/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.js
│   ├── Dockerfile
│   └── .env.example
├── docker-compose.yml
└── .env.example
```

## Features Implemented

### Customer Side
- Auth: Register, login, JWT auth, protected routes.
- Products: list, category filter, search, detail page.
- Cart: add/remove/update quantity, persisted in DB.
- Checkout: Stripe Checkout session creation, redirect, order creation.
- Orders: list user orders + order detail page.

### Admin Dashboard
- Dashboard metrics: total sales, orders, users, products.
- Products CRUD (including image URL field).
- Categories CRUD.
- Orders management and status updates.
- Users list + role updates.

## Tech Stack

- Frontend: React (Vite), Tailwind CSS, Axios, React Router, Stripe.js
- Backend: Node.js, Express.js, Prisma, JWT, bcrypt, Stripe API
- DB: PostgreSQL
- DevOps: Docker + Docker Compose (frontend, backend, postgres)

## Environment Setup

### 1) Create env files

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
cp .env.example .env
```

> Update all Stripe and JWT values before production.

### 2) Run with Docker Compose

```bash
docker compose up --build
```

Services:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`
- Postgres: `localhost:5432`

## Local Non-Docker Setup

### Backend
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run prisma:seed
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Stripe Setup Instructions

1. Create Stripe account and retrieve API keys.
2. Put keys in env files:
   - `backend/.env`
     - `STRIPE_SECRET_KEY`
     - `STRIPE_WEBHOOK_SECRET`
   - `frontend/.env`
     - `VITE_STRIPE_PUBLISHABLE_KEY`
3. Start Stripe webhook forwarding:
   ```bash
   stripe listen --forward-to localhost:5000/api/checkout/webhook
   ```
4. Copy generated webhook signing secret into `STRIPE_WEBHOOK_SECRET`.

## Production Notes

- Use strong `JWT_SECRET` and secure secret management (vault/CI secrets).
- Restrict CORS `FRONTEND_URL` to real frontend domain.
- Use HTTPS behind reverse proxy/load balancer.
- Add file storage integration (S3/R2/GCS) for real image upload implementation.
- Add monitoring, structured logs, and CI/CD checks.
