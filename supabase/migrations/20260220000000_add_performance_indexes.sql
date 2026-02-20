-- Add performance indexes for HandyHive MVP
-- These indexes optimize common query patterns

-- Bookings table indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_provider_id ON bookings(provider_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_scheduled_date ON bookings(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_status);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_bookings_provider_status ON bookings(provider_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_status ON bookings(customer_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at DESC);

-- Users table indexes for search and filtering
CREATE INDEX IF NOT EXISTS idx_users_service_location ON users(service_location);
CREATE INDEX IF NOT EXISTS idx_users_primary_skill ON users(primary_skill);
CREATE INDEX IF NOT EXISTS idx_users_is_provider ON users(is_provider) WHERE is_provider = true;
CREATE INDEX IF NOT EXISTS idx_users_kyc_status ON users(kyc_status) WHERE is_provider = true;

-- Reviews table indexes
CREATE INDEX IF NOT EXISTS idx_reviews_provider_id ON reviews(provider_id);
CREATE INDEX IF NOT EXISTS idx_reviews_customer_id ON reviews(customer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_booking_id ON reviews(booking_id);

-- Notifications table indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Provider schedules indexes
CREATE INDEX IF NOT EXISTS idx_provider_schedules_provider_id ON provider_schedules(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_schedules_day_of_week ON provider_schedules(day_of_week);

-- Comments for documentation
COMMENT ON INDEX idx_bookings_provider_status IS 'Optimizes provider dashboard queries filtering by status';
COMMENT ON INDEX idx_bookings_customer_status IS 'Optimizes customer booking history queries';
COMMENT ON INDEX idx_bookings_created_at IS 'Optimizes recent bookings queries with DESC order';
COMMENT ON INDEX idx_users_is_provider IS 'Partial index for provider-only queries';
COMMENT ON INDEX idx_users_kyc_status IS 'Partial index for KYC verification queries';
