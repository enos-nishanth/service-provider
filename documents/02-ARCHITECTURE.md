# HandyHive - System Architecture

**Last Updated**: March 2, 2026

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Frontend Architecture](#frontend-architecture)
3. [Backend Architecture](#backend-architecture)
4. [Data Flow](#data-flow)
5. [Security Architecture](#security-architecture)
6. [Performance Optimization](#performance-optimization)
7. [Scalability Considerations](#scalability-considerations)

---

## 🏗️ Architecture Overview

HandyHive follows a modern **JAMstack architecture** with a React frontend and Supabase backend.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  React App (Vite)                                     │   │
│  │  - TypeScript                                         │   │
│  │  - React Router                                       │   │
│  │  - TanStack Query (State Management)                 │   │
│  │  - Tailwind CSS + shadcn/ui                          │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS/WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      SUPABASE LAYER                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Auth       │  │  PostgreSQL  │  │   Storage    │      │
│  │   Service    │  │   Database   │  │   (Files)    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Realtime    │  │ Edge         │  │   RLS        │      │
│  │  Subscript.  │  │ Functions    │  │   Policies   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              │
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   EXTERNAL SERVICES                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Razorpay    │  │   Email      │  │    SMS       │      │
│  │  (Payments)  │  │   Service    │  │   Service    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Architecture Principles

1. **Separation of Concerns**: Clear boundaries between UI, business logic, and data
2. **Component-Based**: Reusable, composable React components
3. **Type Safety**: TypeScript throughout the stack
4. **Real-time First**: Live updates using Supabase Realtime
5. **Security by Default**: RLS policies, input validation, rate limiting
6. **Performance Optimized**: Code splitting, lazy loading, caching

---

## 🎨 Frontend Architecture

### Component Hierarchy

```
App.tsx
├── ErrorBoundary
│   ├── BrowserRouter
│   │   ├── Routes
│   │   │   ├── Public Routes
│   │   │   │   ├── Index (Landing Page)
│   │   │   │   │   ├── Hero
│   │   │   │   │   ├── Services
│   │   │   │   │   ├── HowItWorks
│   │   │   │   │   ├── Testimonials
│   │   │   │   │   └── CTASection
│   │   │   │   ├── Auth (Login/Signup)
│   │   │   │   ├── Services (Browse)
│   │   │   │   └── Info Pages
│   │   │   │
│   │   │   ├── Authenticated Routes
│   │   │   │   ├── Dashboard
│   │   │   │   │   └── DashboardLayout
│   │   │   │   │       ├── Sidebar
│   │   │   │   │       ├── Header
│   │   │   │   │       └── Content Area
│   │   │   │   │           ├── CustomerDashboard
│   │   │   │   │           └── ProviderDashboard
│   │   │   │   │
│   │   │   │   ├── Customer Routes
│   │   │   │   │   ├── BrowseServices
│   │   │   │   │   ├── BookingPage
│   │   │   │   │   ├── PaymentPage
│   │   │   │   │   ├── BookingsHistory
│   │   │   │   │   ├── BookingDetail
│   │   │   │   │   ├── ReviewPage
│   │   │   │   │   └── CustomerProfile
│   │   │   │   │
│   │   │   │   ├── Provider Routes
│   │   │   │   │   ├── KYCVerification
│   │   │   │   │   ├── SkillAvailabilitySetup
│   │   │   │   │   ├── JobRequests
│   │   │   │   │   └── EarningsDashboard
│   │   │   │   │
│   │   │   │   └── Admin Routes
│   │   │   │       ├── AdminDashboard
│   │   │   │       ├── UserManagement
│   │   │   │       ├── BookingsRevenue
│   │   │   │       └── FraudMonitoring
│   │   │   │
│   │   │   └── NotFound (404)
│   │   │
│   │   └── Toaster (Notifications)
│   │
│   └── QueryClientProvider (React Query)
```

### State Management Strategy

#### 1. Server State (React Query)
- **Purpose**: Manage data from Supabase
- **Features**: Caching, automatic refetching, optimistic updates
- **Usage**: All API calls, database queries

```typescript
// Example: useBookings hook
const { data: bookings, isLoading, error } = useQuery({
  queryKey: ['bookings', userId, role],
  queryFn: () => fetchBookings(userId, role),
  staleTime: 5 * 60 * 1000, // 5 minutes
});
```

#### 2. Local State (useState, useReducer)
- **Purpose**: Component-specific state
- **Usage**: Form inputs, UI toggles, temporary data

```typescript
const [selectedDate, setSelectedDate] = useState<Date>();
const [isModalOpen, setIsModalOpen] = useState(false);
```

#### 3. URL State (React Router)
- **Purpose**: Shareable, bookmarkable state
- **Usage**: Filters, pagination, selected items

```typescript
const [searchParams, setSearchParams] = useSearchParams();
const page = searchParams.get('page') || '1';
```

#### 4. Global State (Context API)
- **Purpose**: App-wide state (auth, theme)
- **Usage**: User session, theme preferences

```typescript
const { user, session } = useAuth();
```

### Custom Hooks Architecture

```typescript
// hooks/useAuth.ts
export const useAuth = () => {
  // Authentication logic
  // Returns: user, session, signIn, signOut, etc.
};

// hooks/useBookings.ts
export const useBookings = ({ role, page, pageSize }) => {
  // Booking data fetching with pagination
  // Returns: bookings, totalCount, isLoading, error
};

// hooks/useProviders.ts
export const useProviders = ({ category, location }) => {
  // Provider data fetching with filters
  // Returns: providers, isLoading, error
};

// hooks/useNotifications.ts
export const useNotifications = () => {
  // Real-time notifications
  // Returns: notifications, markAsRead, deleteNotification
};
```

### Routing Strategy

#### Route Types

1. **Public Routes**: Accessible without authentication
   - Landing page, Auth, Services, Info pages

2. **Protected Routes**: Require authentication
   - Dashboard, Bookings, Profile

3. **Role-Based Routes**: Require specific role
   - Provider routes (require `is_provider = true`)
   - Admin routes (require `role = 'admin'`)

#### Route Guards

```typescript
// Example: Protected route
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <LoadingState />;
  if (!user) return <Navigate to="/auth" />;
  
  return children;
};

// Example: Role-based route
const ProviderRoute = ({ children }) => {
  const { user, profile } = useAuth();
  
  if (!profile?.is_provider) {
    return <Navigate to="/become-provider" />;
  }
  
  return children;
};
```

---

## 🔧 Backend Architecture

### Supabase Services

#### 1. PostgreSQL Database
- **Purpose**: Primary data store
- **Features**: ACID compliance, relations, triggers, functions
- **Tables**: users, bookings, reviews, notifications, etc.

#### 2. Authentication Service
- **Purpose**: User authentication and authorization
- **Features**: Email/password, OAuth, JWT tokens
- **Security**: Password hashing, session management

#### 3. Row Level Security (RLS)
- **Purpose**: Database-level access control
- **Features**: Policy-based permissions
- **Example**:
```sql
-- Users can only view their own bookings
CREATE POLICY "Users can view own bookings"
  ON bookings FOR SELECT
  USING (auth.uid() = customer_id OR auth.uid() = provider_id);
```

#### 4. Realtime Subscriptions
- **Purpose**: Live data updates
- **Features**: WebSocket connections, automatic updates
- **Usage**: Booking status, notifications

```typescript
// Example: Subscribe to booking updates
const subscription = supabase
  .channel('bookings')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'bookings',
    filter: `customer_id=eq.${userId}`
  }, (payload) => {
    // Handle update
  })
  .subscribe();
```

#### 5. Storage
- **Purpose**: File storage (KYC documents, avatars)
- **Features**: Bucket-based storage, access policies
- **Buckets**: `kyc-documents`, `avatars`, `service-images`

#### 6. Edge Functions (Planned)
- **Purpose**: Server-side logic
- **Use Cases**: Payment processing, email sending, webhooks
- **Example**: `create-razorpay-order`, `verify-payment`

### Database Design Patterns

#### 1. Unified User Model
- Single `users` table for all user types
- `is_provider` flag for provider capability
- `role` field for admin access
- Supports dual-role (user can be both customer and provider)

#### 2. Soft Deletes
- `deleted_at` timestamp instead of hard deletes
- Preserves data integrity
- Allows data recovery

#### 3. Audit Trails
- `created_at` and `updated_at` timestamps
- Automatic updates via triggers
- Track data changes

#### 4. Denormalization for Performance
- Store calculated fields (e.g., `average_rating`)
- Update via triggers
- Trade-off: Storage vs. Query speed

---

## 🔄 Data Flow

### Booking Creation Flow

```
1. Customer selects provider
   │
   ├─> Frontend: Navigate to /book/:providerId
   │
2. Customer selects date/time
   │
   ├─> Frontend: Validate availability
   ├─> API: Check provider schedule
   │
3. Customer reviews booking
   │
   ├─> Frontend: Calculate pricing
   ├─> Display: Total amount with breakdown
   │
4. Customer proceeds to payment
   │
   ├─> Frontend: Navigate to /payment
   ├─> API: Create Razorpay order
   │
5. Customer completes payment
   │
   ├─> Razorpay: Process payment
   ├─> Webhook: Payment confirmation
   ├─> API: Verify payment signature
   │
6. Create booking record
   │
   ├─> Database: Insert booking
   ├─> Database: Insert payment record
   ├─> Trigger: Create notification for provider
   │
7. Real-time update
   │
   ├─> Realtime: Broadcast to provider
   ├─> Frontend: Update provider dashboard
   │
8. Provider receives notification
   │
   └─> Frontend: Show new booking request
```

### Authentication Flow

```
1. User submits login form
   │
   ├─> Frontend: Validate input (Zod)
   ├─> Check: Rate limit
   │
2. Call Supabase Auth
   │
   ├─> API: signInWithPassword()
   ├─> Supabase: Verify credentials
   │
3. Check email verification
   │
   ├─> If not verified: Redirect to /verify-email
   ├─> If verified: Continue
   │
4. Fetch user profile
   │
   ├─> Database: Query users table
   ├─> Get: role, is_provider, kyc_status
   │
5. Set session
   │
   ├─> LocalStorage: Store session
   ├─> Context: Update auth state
   │
6. Redirect to dashboard
   │
   └─> Navigate: /dashboard
```

### Real-time Notification Flow

```
1. Event occurs (e.g., booking accepted)
   │
   ├─> Database: Update booking status
   ├─> Trigger: Create notification record
   │
2. Realtime broadcast
   │
   ├─> Supabase: Broadcast via WebSocket
   ├─> Channel: 'notifications:user_id'
   │
3. Frontend receives update
   │
   ├─> useNotifications hook: Handle payload
   ├─> State: Update notifications array
   │
4. UI updates
   │
   ├─> NotificationBell: Show badge
   ├─> Toast: Display notification
   │
5. User clicks notification
   │
   ├─> Mark as read
   ├─> Navigate to relevant page
   │
   └─> Database: Update notification.read_at
```

---

## 🔒 Security Architecture

### Defense in Depth

```
┌─────────────────────────────────────────────────────────┐
│  Layer 1: Client-Side Validation                        │
│  - Input validation (Zod schemas)                       │
│  - Rate limiting (client-side)                          │
│  - XSS prevention (React escaping)                      │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│  Layer 2: Network Security                              │
│  - HTTPS only                                           │
│  - CORS policies                                        │
│  - API key protection                                   │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│  Layer 3: Authentication & Authorization                │
│  - JWT tokens                                           │
│  - Session management                                   │
│  - Role-based access control                            │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│  Layer 4: Database Security                             │
│  - Row Level Security (RLS)                             │
│  - Prepared statements (SQL injection prevention)       │
│  - Encrypted connections                                │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│  Layer 5: Data Security                                 │
│  - Password hashing (bcrypt)                            │
│  - Sensitive data encryption                            │
│  - Secure file storage                                  │
└─────────────────────────────────────────────────────────┘
```

### Security Features

#### 1. Input Validation
```typescript
// Zod schema for signup
const signupSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string()
    .min(8, "Min 8 characters")
    .regex(/[A-Z]/, "Must contain uppercase")
    .regex(/[0-9]/, "Must contain number"),
  name: z.string().min(2, "Name too short"),
  mobile: z.string().regex(/^[6-9]\d{9}$/, "Invalid mobile")
});
```

#### 2. Rate Limiting
```typescript
// Rate limiter configuration
const rateLimits = {
  login: { maxAttempts: 5, windowMs: 15 * 60 * 1000 },
  signup: { maxAttempts: 3, windowMs: 60 * 60 * 1000 },
  passwordReset: { maxAttempts: 3, windowMs: 60 * 60 * 1000 }
};
```

#### 3. Row Level Security
```sql
-- Example RLS policy
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

#### 4. Error Boundaries
```typescript
// Catch and handle component errors
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

---

## ⚡ Performance Optimization

### Frontend Optimizations

#### 1. Code Splitting
```typescript
// Lazy load routes
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
```

#### 2. React Query Caching
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});
```

#### 3. Optimistic Updates
```typescript
// Update UI before server response
const mutation = useMutation({
  mutationFn: updateBooking,
  onMutate: async (newData) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries(['bookings']);
    
    // Snapshot previous value
    const previous = queryClient.getQueryData(['bookings']);
    
    // Optimistically update
    queryClient.setQueryData(['bookings'], (old) => [...old, newData]);
    
    return { previous };
  },
});
```

### Backend Optimizations

#### 1. Database Indexes
```sql
-- Performance indexes
CREATE INDEX idx_bookings_customer_id ON bookings(customer_id);
CREATE INDEX idx_bookings_provider_id ON bookings(provider_id);
CREATE INDEX idx_bookings_status ON bookings(status);
```

#### 2. Query Optimization
```typescript
// Use JOIN instead of separate queries
const { data } = await supabase
  .from('bookings')
  .select(`
    *,
    provider:users!provider_id(full_name, avatar_url, average_rating),
    customer:users!customer_id(full_name, email)
  `);
```

#### 3. Pagination
```typescript
// Limit results with pagination
const { data, count } = await supabase
  .from('bookings')
  .select('*', { count: 'exact' })
  .range(page * pageSize, (page + 1) * pageSize - 1);
```

---

## 📈 Scalability Considerations

### Current Capacity
- **Users**: Up to 10,000 concurrent users
- **Database**: Supabase Pro plan (8GB RAM, 2 CPU)
- **Storage**: 100GB included
- **Bandwidth**: Unlimited

### Scaling Strategy

#### Horizontal Scaling
1. **Database**: Read replicas for read-heavy operations
2. **CDN**: Cloudflare for static assets
3. **Edge Functions**: Distributed compute

#### Vertical Scaling
1. **Database**: Upgrade to larger instance
2. **Caching**: Redis for session storage
3. **Search**: Elasticsearch for advanced search

### Monitoring & Observability
- **Error Tracking**: Sentry (planned)
- **Analytics**: Google Analytics
- **Performance**: Lighthouse CI
- **Uptime**: UptimeRobot (planned)

---

## 🔮 Future Architecture Enhancements

1. **Microservices**: Split into smaller services
2. **Message Queue**: RabbitMQ for async tasks
3. **Caching Layer**: Redis for frequently accessed data
4. **Search Engine**: Elasticsearch for advanced search
5. **CDN**: CloudFront for global distribution
6. **Mobile Apps**: React Native for iOS/Android
7. **GraphQL**: Alternative to REST API
8. **WebSockets**: Custom real-time server

---

**Next**: Read [03-DATABASE-SCHEMA.md](./03-DATABASE-SCHEMA.md) for database structure details.
