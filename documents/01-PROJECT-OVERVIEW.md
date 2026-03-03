# HandyHive - Project Overview

**Last Updated**: March 2, 2026  
**Version**: 2.0.0  
**Status**: MVP Complete - Payment Integration Pending

---

## 📋 Table of Contents

1. [Project Summary](#project-summary)
2. [Vision & Mission](#vision--mission)
3. [Key Features](#key-features)
4. [Tech Stack](#tech-stack)
5. [Project Structure](#project-structure)
6. [Current Status](#current-status)
7. [Quick Start](#quick-start)

---

## � Project Summary

**HandyHive** is a hyperlocal services marketplace platform that connects customers with verified local service providers (painters, plumbers, electricians, AC technicians, etc.). The platform is designed to build trust, accessibility, and efficiency in local service discovery and booking.

### Core Concept
- **For Customers**: Find and book trusted local service providers with transparent pricing
- **For Providers**: Get verified, manage bookings, and earn income through the platform
- **For Admins**: Manage users, verify providers, monitor bookings and revenue

### Business Model
- Commission-based revenue from completed bookings
- Platform fee on transactions
- Premium features for providers (future)

---

## 🚀 Vision & Mission

### Vision
To become India's most trusted hyperlocal services marketplace, making quality home services accessible to everyone.

### Mission
- **Trust**: Verify every service provider through KYC
- **Accessibility**: Make booking services as easy as ordering food
- **Efficiency**: Connect customers with nearby providers instantly
- **Quality**: Ensure high service standards through ratings and reviews
- **Fair Earnings**: Provide service providers with a reliable income source

---

## ✨ Key Features

### 1. Multi-Role System

#### Customer Role
- Browse services by category
- Search and filter providers
- View provider profiles with ratings
- Book services with date/time selection
- Track booking status in real-time
- Make secure payments
- Rate and review providers
- View booking history

#### Service Provider Role
- Dual role capability (can also book services as customer)
- Complete KYC verification
- Set skills and availability
- Receive and manage job requests
- Accept/reject bookings (KYC required)
- Track earnings
- View customer reviews
- Manage schedule

#### Admin Role
- User management
- Provider KYC approval/rejection
- Booking monitoring
- Revenue tracking
- Fraud detection
- Platform analytics
- System configuration

### 2. Trust & Safety Features
- **KYC Verification**: Mandatory for service providers
- **Email Verification**: Required for all users
- **Secure Authentication**: Supabase Auth with password requirements
- **Rate Limiting**: Protection against abuse
- **Input Validation**: Comprehensive form validation
- **Row Level Security**: Database-level access control

### 3. Booking Workflow
1. Customer browses services and selects provider
2. Chooses service date and time
3. Reviews booking details and pricing
4. Makes payment (Razorpay integration pending)
5. Provider receives booking request
6. Provider accepts (requires KYC approval)
7. Service completion
8. Customer rates and reviews

### 4. Real-Time Features
- Live booking status updates
- Real-time notifications
- Instant provider availability updates
- Live chat (future enhancement)

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18.3.1
- **Language**: TypeScript 5.8.3
- **Build Tool**: Vite 7.3.1
- **Routing**: React Router v6.30.1
- **Styling**: Tailwind CSS 3.4.17
- **UI Components**: shadcn/ui (Radix UI primitives)
- **State Management**: React Query (TanStack Query 5.83.0)
- **Form Handling**: React Hook Form 7.61.1
- **Validation**: Zod 3.25.76
- **Icons**: Lucide React 0.462.0

### Backend & Database
- **Backend**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime subscriptions
- **Storage**: Supabase Storage (for KYC documents, avatars)
- **Security**: Row Level Security (RLS) policies

### Development Tools
- **Testing**: Vitest 3.2.4
- **Linting**: ESLint 9.32.0
- **Type Checking**: TypeScript
- **Package Manager**: npm

### Deployment
- **Frontend Hosting**: Vercel (recommended)
- **Backend**: Supabase Cloud
- **CI/CD**: GitHub Actions + Vercel
- **Domain**: TBD

---

## 📁 Project Structure

```
handyhive/
├── public/                      # Static assets
│   ├── favicon.ico
│   ├── placeholder.svg
│   └── robots.txt
│
├── src/
│   ├── components/              # React components
│   │   ├── common/             # Shared components
│   │   │   ├── EmptyState.tsx
│   │   │   ├── ErrorState.tsx
│   │   │   └── LoadingState.tsx
│   │   ├── customer/           # Customer-specific components
│   │   ├── dashboard/          # Dashboard layout
│   │   ├── home/               # Landing page sections
│   │   ├── layout/             # Layout components
│   │   ├── notifications/      # Notification components
│   │   ├── ui/                 # shadcn/ui components
│   │   └── ErrorBoundary.tsx   # Error boundary
│   │
│   ├── hooks/                   # Custom React hooks
│   │   ├── useAuth.ts          # Authentication hook
│   │   ├── useBookings.ts      # Bookings data hook
│   │   ├── useNotifications.ts # Notifications hook
│   │   └── useProviders.ts     # Providers data hook
│   │
│   ├── integrations/            # Third-party integrations
│   │   └── supabase/
│   │       ├── client.ts       # Supabase client
│   │       └── types.ts        # Database types
│   │
│   ├── lib/                     # Utility libraries
│   │   ├── pricing.ts          # Pricing configuration
│   │   ├── rateLimiter.ts      # Rate limiting utility
│   │   ├── utils.ts            # General utilities
│   │   └── validation.ts       # Zod validation schemas
│   │
│   ├── pages/                   # Page components
│   │   ├── admin/              # Admin pages
│   │   ├── customer/           # Customer pages
│   │   ├── provider/           # Provider pages
│   │   ├── Auth.tsx            # Login/Signup
│   │   ├── Dashboard.tsx       # Unified dashboard
│   │   ├── Index.tsx           # Landing page
│   │   └── ...                 # Other pages
│   │
│   ├── test/                    # Test files
│   │   ├── setup.ts
│   │   └── example.test.ts
│   │
│   ├── App.tsx                  # Main app component
│   ├── main.tsx                 # Entry point
│   └── index.css                # Global styles
│
├── supabase/
│   ├── migrations/              # Database migrations
│   └── config.toml             # Supabase config
│
├── documents/                   # Project documentation
│   ├── 01-PROJECT-OVERVIEW.md  # This file
│   ├── 02-ARCHITECTURE.md      # System architecture
│   ├── 03-DATABASE-SCHEMA.md   # Database design
│   ├── 04-API-REFERENCE.md     # API documentation
│   └── ...                     # More docs
│
├── .env.example                 # Environment variables template
├── .gitignore
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 📊 Current Status

### ✅ Completed Features

#### Core Functionality
- [x] User authentication (signup, login, logout)
- [x] Email verification enforcement
- [x] Password reset flow
- [x] Multi-role system (Customer, Provider, Admin)
- [x] Provider KYC verification workflow
- [x] Service browsing and search
- [x] Provider profiles with ratings
- [x] Booking creation and management
- [x] Real-time booking updates
- [x] Notification system
- [x] Review and rating system
- [x] Admin dashboard with analytics
- [x] User management
- [x] Booking monitoring

#### Security & Performance
- [x] Input validation (Zod schemas)
- [x] Rate limiting
- [x] Error boundaries
- [x] Database indexes for performance
- [x] N+1 query optimization
- [x] Pagination support
- [x] Row Level Security (RLS)

#### UI/UX
- [x] Responsive design
- [x] Loading states
- [x] Error states
- [x] Empty states
- [x] Toast notifications
- [x] Info pages (Terms, Privacy, Contact, etc.)

### 🚧 In Progress
- [ ] Payment gateway integration (Razorpay)
- [ ] Pagination UI implementation
- [ ] Mobile optimization

### 📋 Planned Features
- [ ] Provider earnings withdrawal
- [ ] Advanced search filters
- [ ] Booking cancellation with refunds
- [ ] SMS notifications
- [ ] Push notifications
- [ ] Export functionality
- [ ] Two-factor authentication
- [ ] Social login
- [ ] Mobile app
- [ ] AI-powered features

---

## � Quick Start

### Prerequisites
- Node.js 18+ and npm
- Supabase account
- Git

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd handyhive
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```

Edit `.env` and add your Supabase credentials:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

4. **Run database migrations**
```bash
npx supabase db push
```

5. **Start development server**
```bash
npm run dev
```

6. **Open in browser**
```
http://localhost:5173
```

### Build for Production
```bash
npm run build
npm run preview
```

### Run Tests
```bash
npm run test
```

---

## 📚 Documentation Index

1. **[01-PROJECT-OVERVIEW.md](./01-PROJECT-OVERVIEW.md)** - This file
2. **[02-ARCHITECTURE.md](./02-ARCHITECTURE.md)** - System architecture and design patterns
3. **[03-DATABASE-SCHEMA.md](./03-DATABASE-SCHEMA.md)** - Database structure and relationships
4. **[04-API-REFERENCE.md](./04-API-REFERENCE.md)** - API endpoints and usage
5. **[05-AUTHENTICATION.md](./05-AUTHENTICATION.md)** - Auth flows and security
6. **[06-BOOKING-WORKFLOW.md](./06-BOOKING-WORKFLOW.md)** - Booking process details
7. **[07-DEPLOYMENT.md](./07-DEPLOYMENT.md)** - Deployment guide
8. **[08-TESTING.md](./08-TESTING.md)** - Testing strategy
9. **[09-TROUBLESHOOTING.md](./09-TROUBLESHOOTING.md)** - Common issues and solutions
10. **[10-ROADMAP.md](./10-ROADMAP.md)** - Future plans and features

---

## 🤝 Contributing

This is a private project. For questions or suggestions, contact the project owner.

---

## 📄 License

Proprietary - All rights reserved

---

## 📞 Support

For technical issues or questions:
- Email: support@handyhive.com (placeholder)
- Documentation: See `/documents` folder
- Issue Tracker: GitHub Issues (if applicable)

---

**Next Steps**: Read [02-ARCHITECTURE.md](./02-ARCHITECTURE.md) to understand the system architecture.
