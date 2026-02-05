# 🛠️ HandyHive – Hyperlocal Services Marketplace

HandyHive is a hyperlocal services marketplace that connects customers with **verified local service providers** such as painters, plumbers, electricians, and AC technicians.

The platform is designed to build **trust, accessibility, and efficiency** in local service discovery and booking.

---

## 🚀 Key Features

### 👤 Multi-Role System
- **Customer**
  - Browse services
  - Book providers
  - Track bookings
  - Give ratings & feedback

- **Service Provider**
  - Dual role (can also act as a customer)
  - Skill & availability management
  - KYC-based job acceptance
  - Earnings dashboard

- **Admin**
  - User & provider management
  - KYC approval
  - Booking & revenue monitoring

---

### 🔐 Trust & Safety
- KYC verification for service providers
- Role-based access control
- Secure authentication using Supabase

---

### 📅 Booking Workflow
1. Customer selects a service
2. Chooses provider, date & time
3. Booking request created
4. Provider accepts (KYC required)
5. Job completion
6. Rating & feedback

---

### 🔄 Real-World Logic
- **One account per user**
- Service providers can also book services
- Mirrors real platforms like Urban Company / Airbnb

---

## 🧰 Tech Stack

### Frontend
- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui

### Backend & Database
- Supabase (PostgreSQL)
- Supabase Auth
- Supabase Row Level Security (RLS)

### Deployment
- Vercel (CI/CD via GitHub)

---

## 🔑 Environment Variables

Environment variables are **not committed** to the repository.

They are managed securely via:
- Local `.env` (for development)
- Vercel Environment Variables (for production)

Example:
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key


---

## 🗄️ Database Design (High Level)

- `users`
- `service_provider_profile`
- `bookings`
- `payments`
- `reviews`

> A unified user model is used to support dual-role behavior.

---

## 🧪 Testing
- Unit tests configured using Vitest
- Manual end-to-end testing for booking flows
- Role & permission validation

---

## 📦 Installation & Setup

```bash
# Install dependencies
npm install

# Run development server
npm run dev
