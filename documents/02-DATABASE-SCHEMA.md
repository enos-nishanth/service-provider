# HandyHive - Database Schema Documentation

## 📊 Database Overview

HandyHive uses PostgreSQL via Supabase with comprehensive Row Level Security (RLS) policies. The schema is designed to support a unified user model where providers can also act as customers.

## 🗄️ Core Tables

### 1. users (Unified User Profile)

**Purpose:** Central table for all user information, supporting both customers and providers.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  mobile TEXT,
  phone TEXT,
  role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  is_provider BOOLEAN DEFAULT false,
  avatar_url TEXT,
  
  -- Provider-specific fields
  primary_skill TEXT,
  service_location TEXT,
  service_description TEXT,
  certification_url TEXT,
  is_verified BOOLEAN DEFAULT false,
  kyc_status TEXT DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'approved', 'rejected')),
  
  -- Ratings
  average_rating DECIMAL(3,2),
  total_reviews INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Key Concepts:**
- `user_id` links to Supabase Auth users
- `is_provider` flag enables provider capabilities
- Providers can have `kyc_status