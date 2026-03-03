# HandyHive - Database Schema

**Last Updated**: March 2, 2026

---

## 📋 Table of Contents

1. [Schema Overview](#schema-overview)
2. [Core Tables](#core-tables)
3. [Relationships](#relationships)
4. [Indexes](#indexes)
5. [Row Level Security](#row-level-security)
6. [Triggers & Functions](#triggers--functions)

---

## 🗄️ Schema Overview

HandyHive uses PostgreSQL (via Supabase) with a well-structured relational database design.

### Database Statistics
- **Tables**: 8 core tables
- **Indexes**: 20+ performance indexes
- **RLS Policies**: 30+ security policies
- **Triggers**: 5 automated triggers
- **Functions**: 4 custom functions

### Design Principles
1. **Unified User Model**: Single users table for all roles
2. **Referential Integrity**: Foreign keys with cascade rules
3. **Audit Trail**: created_at and updated_at timestamps
4. **Soft Deletes**: deleted_at for data preservation
5. **Denormalization**: Calculated fields for performance

---

## 📊 Core Tables

### 1. users (Main User Table)

Stores all user information with support for multiple roles.

```sql
CREATE TABLE users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  mobile TEXT,
  avatar_url TEXT,
  
  -- Role & Provider Info
  role TEXT DEFAULT 'customer', -- 'customer', 'provider', 'admin'
  is_provider BOOLEAN DEFAULT false,
  
  -- Provider-specific fields
  primary_skill TEXT,
  service_location TEXT,
  service_description TEXT,
  average_rating DECIMAL(3,2) DEFAULT 0.00,
  total_reviews INTEGER DEFAULT 0,
  
  -- KYC Information
  kyc_status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  kyc_document_url TEXT,
  kyc_document_type TEXT,
  kyc_submitted_at TIMESTAMPTZ,
  kyc_reviewed_at TIMESTAMPTZ,
  kyc_reviewed_by UUID REFERENCES users(user_id),
  kyc_rejection_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
```

**Key Features**:
- Unified model: One user can be both customer and provider
- KYC workflow support for providers
- Denormalized rating fields for performance
- Soft delete support

**Indexes**:
```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_is_provider ON users(is_provider) WHERE is_provider = true;
CREATE INDEX idx_users_service_location ON users(service_location);
CREATE INDEX idx_users_primary_skill ON users(primary_skill);
CREATE INDEX idx_users_kyc_status ON users(kyc_status) WHERE is_provider = true;
```

---

### 2. bookings

Stores all service booking information.

```sql
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id TEXT UNIQUE NOT NULL, -- Auto-generated: HH260302-abc123
  
  -- Parties
  customer_id UUID NOT NULL REFERENCES users(user_id),
  provider_id UUID NOT NULL REFERENCES users(user_id),
  
  -- Service Details
  service_category TEXT NOT NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time TEXT NOT NULL,
  customer_address TEXT,
  notes TEXT,
  
  -- Status
  status TEXT DEFAULT 'requested', -- 'requested', 'accepted', 'in_progress', 'completed', 'cancelled'
  
  -- Payment
  payment_method TEXT NOT NULL,
  payment_status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'refunded'
  subtotal INTEGER NOT NULL,
  visit_charge INTEGER DEFAULT 0,
  tax INTEGER DEFAULT 0,
  total_amount INTEGER NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Key Features**:
- Auto-generated booking ID (HH + date + random)
- Comprehensive status tracking
- Detailed pricing breakdown
- Supports multiple payment methods

**Indexes**:
```sql
CREATE INDEX idx_bookings_customer_id ON bookings(customer_id);
CREATE INDEX idx_bookings_provider_id ON bookings(provider_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_scheduled_date ON bookings(scheduled_date);
CREATE INDEX idx_bookings_provider_status ON bookings(provider_id, status);
CREATE INDEX idx_bookings_customer_status ON bookings(customer_id, status);
CREATE INDEX idx_bookings_created_at ON bookings(created_at DESC);
```

---

### 3. reviews

Stores customer reviews and ratings for providers.

```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID UNIQUE NOT NULL REFERENCES bookings(id),
  provider_id UUID NOT NULL REFERENCES users(user_id),
  customer_id UUID NOT NULL REFERENCES users(user_id),
  
  -- Review Content
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Key Features**:
- One review per booking
- Rating validation (1-5 stars)
- Linked to specific booking

**Indexes**:
```sql
CREATE INDEX idx_reviews_provider_id ON reviews(provider_id);
CREATE INDEX idx_reviews_customer_id ON reviews(customer_id);
CREATE INDEX idx_reviews_booking_id ON reviews(booking_id);
```

**Trigger**: Updates provider's average_rating and total_reviews automatically

---

### 4. notifications

Stores user notifications for real-time updates.

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id),
  
  -- Notification Content
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL, -- 'booking', 'payment', 'review', 'kyc', 'system'
  
  -- Related Entity
  related_id UUID, -- booking_id, review_id, etc.
  related_type TEXT, -- 'booking', 'review', etc.
  
  -- Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Key Features**:
- Real-time notification support
- Linked to related entities
- Read/unread tracking

**Indexes**:
```sql
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
```

---

### 5. provider_schedules

Stores provider availability schedules.

```sql
CREATE TABLE provider_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES users(user_id),
  
  -- Schedule
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(provider_id, day_of_week)
);
```

**Key Features**:
- Weekly schedule management
- Time slot availability
- One schedule per day per provider

**Indexes**:
```sql
CREATE INDEX idx_provider_schedules_provider_id ON provider_schedules(provider_id);
CREATE INDEX idx_provider_schedules_day_of_week ON provider_schedules(day_of_week);
```

---

### 6. payments (Planned)

Will store payment transaction records.

```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id TEXT UNIQUE NOT NULL, -- Razorpay payment ID
  order_id TEXT NOT NULL, -- Razorpay order ID
  booking_id UUID REFERENCES bookings(id),
  customer_id UUID REFERENCES users(user_id),
  
  -- Payment Details
  amount INTEGER NOT NULL, -- Amount in paise
  currency TEXT DEFAULT 'INR',
  status TEXT NOT NULL, -- 'created', 'authorized', 'captured', 'failed', 'refunded'
  method TEXT, -- 'card', 'netbanking', 'wallet', 'upi'
  
  -- Razorpay Data
  razorpay_signature TEXT,
  error_code TEXT,
  error_description TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 7. admin_logs (Planned)

Will store admin action audit trail.

```sql
CREATE TABLE admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES users(user_id),
  
  -- Action Details
  action TEXT NOT NULL, -- 'approve_kyc', 'reject_kyc', 'ban_user', etc.
  entity_type TEXT NOT NULL, -- 'user', 'booking', 'review'
  entity_id UUID NOT NULL,
  
  -- Details
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 8. service_categories (Reference Table)

Stores available service categories.

```sql
CREATE TABLE service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  base_price INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🔗 Relationships

### Entity Relationship Diagram

```
┌─────────────┐
│    users    │
│ (user_id)   │
└──────┬──────┘
       │
       ├─────────────────────────────────┐
       │                                 │
       │ customer_id              provider_id
       │                                 │
       ▼                                 ▼
┌─────────────┐                   ┌─────────────┐
│  bookings   │◄──────────────────│  reviews    │
│ (id)        │   booking_id      │ (id)        │
└─────────────┘                   └─────────────┘
       │
       │ booking_id
       ▼
┌─────────────┐
│  payments   │
│ (id)        │
└─────────────┘

┌─────────────┐
│    users    │
│ (user_id)   │
└──────┬──────┘
       │
       │ user_id
       ▼
┌─────────────────────┐
│  notifications      │
│  (id)               │
└─────────────────────┘

┌─────────────┐
│    users    │
│ (user_id)   │
└──────┬──────┘
       │
       │ provider_id
       ▼
┌─────────────────────┐
│ provider_schedules  │
│ (id)                │
└─────────────────────┘
```

### Key Relationships

1. **users → bookings**: One-to-many (as customer and as provider)
2. **bookings → reviews**: One-to-one
3. **bookings → payments**: One-to-one
4. **users → notifications**: One-to-many
5. **users → provider_schedules**: One-to-many

---

## 🔒 Row Level Security (RLS)

### users Table Policies

```sql
-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = user_id);

-- Provider profiles are publicly viewable
CREATE POLICY "Provider profiles are public"
  ON users FOR SELECT
  USING (is_provider = true);

-- Admins can view all users
CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
```

### bookings Table Policies

```sql
-- Customers can view their own bookings
CREATE POLICY "Customers can view own bookings"
  ON bookings FOR SELECT
  USING (auth.uid() = customer_id);

-- Providers can view their assigned bookings
CREATE POLICY "Providers can view assigned bookings"
  ON bookings FOR SELECT
  USING (auth.uid() = provider_id);

-- Customers can create bookings
CREATE POLICY "Customers can create bookings"
  ON bookings FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

-- Providers can update their bookings
CREATE POLICY "Providers can update bookings"
  ON bookings FOR UPDATE
  USING (auth.uid() = provider_id);
```

### reviews Table Policies

```sql
-- Anyone can view reviews
CREATE POLICY "Reviews are publicly viewable"
  ON reviews FOR SELECT
  USING (true);

-- Customers can create reviews for their bookings
CREATE POLICY "Customers can create reviews"
  ON reviews FOR INSERT
  WITH CHECK (
    auth.uid() = customer_id AND
    EXISTS (
      SELECT 1 FROM bookings
      WHERE id = booking_id
      AND customer_id = auth.uid()
      AND status = 'completed'
    )
  );
```

### notifications Table Policies

```sql
-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);
```

---

## ⚙️ Triggers & Functions

### 1. Auto-generate Booking ID

```sql
CREATE OR REPLACE FUNCTION generate_booking_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.booking_id := 'HH' || TO_CHAR(NOW(), 'YYMMDD') || '-' || SUBSTRING(NEW.id::TEXT FROM 1 FOR 6);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_booking_id
  BEFORE INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION generate_booking_id();
```

### 2. Update Timestamps

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 3. Update Provider Rating

```sql
CREATE OR REPLACE FUNCTION update_provider_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users
  SET 
    average_rating = (
      SELECT AVG(rating)::DECIMAL(3,2)
      FROM reviews
      WHERE provider_id = NEW.provider_id
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM reviews
      WHERE provider_id = NEW.provider_id
    )
  WHERE user_id = NEW.provider_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rating_on_review
  AFTER INSERT OR UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_provider_rating();
```

### 4. Create Notification on Booking

```sql
CREATE OR REPLACE FUNCTION create_booking_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify provider of new booking
  INSERT INTO notifications (user_id, title, message, type, related_id, related_type)
  VALUES (
    NEW.provider_id,
    'New Booking Request',
    'You have a new booking request for ' || NEW.service_category,
    'booking',
    NEW.id,
    'booking'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notify_on_booking
  AFTER INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION create_booking_notification();
```

### 5. Handle New User Signup

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (user_id, full_name, email, role, is_provider)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer'),
    COALESCE((NEW.raw_user_meta_data->>'is_provider')::BOOLEAN, false)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
```

---

## 📈 Performance Considerations

### Query Optimization Tips

1. **Use Indexes**: All foreign keys and frequently queried columns are indexed
2. **Avoid N+1 Queries**: Use JOINs to fetch related data
3. **Pagination**: Always use LIMIT and OFFSET for large datasets
4. **Selective Columns**: Use SELECT specific columns instead of SELECT *
5. **Composite Indexes**: Use for common multi-column queries

### Example Optimized Query

```sql
-- ❌ Bad: N+1 query problem
SELECT * FROM bookings WHERE customer_id = $1;
-- Then fetch user data separately

-- ✅ Good: Single query with JOIN
SELECT 
  b.*,
  p.full_name as provider_name,
  p.avatar_url as provider_avatar,
  p.average_rating as provider_rating
FROM bookings b
JOIN users p ON b.provider_id = p.user_id
WHERE b.customer_id = $1
ORDER BY b.created_at DESC
LIMIT 10;
```

---

## 🔮 Future Schema Enhancements

1. **Payments Table**: Add when Razorpay integration is complete
2. **Admin Logs**: Add for audit trail
3. **Service Categories**: Move from hardcoded to database
4. **Provider Earnings**: Track earnings and withdrawals
5. **Booking History**: Archive old bookings
6. **User Preferences**: Store user settings
7. **Chat Messages**: Add for customer-provider communication
8. **Dispute Resolution**: Track disputes and resolutions

---

**Next**: Read [04-API-REFERENCE.md](./04-API-REFERENCE.md) for API documentation.
