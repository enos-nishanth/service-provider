# Payment Gateway Integration Guide

This guide provides step-by-step instructions for integrating Razorpay payment gateway into HandyHive MVP.

## Overview

HandyHive currently creates bookings without payment verification. This guide will help you integrate Razorpay to:
- Accept real payments from customers
- Verify payment signatures for security
- Store payment transaction records
- Handle payment failures gracefully

## Prerequisites

1. Razorpay account (sign up at https://razorpay.com)
2. Test API keys from Razorpay dashboard
3. Node.js and npm installed
4. Supabase project with admin access

## Step 1: Install Razorpay SDK

```bash
npm install razorpay
```

## Step 2: Add Environment Variables

Add these to your `.env` file:

```env
# Razorpay Configuration
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
RAZORPAY_KEY_SECRET=your_secret_key_here
```

**Important**: 
- `VITE_RAZORPAY_KEY_ID` is public and can be exposed to frontend
- `RAZORPAY_KEY_SECRET` must NEVER be exposed to frontend - use only in backend/Edge Functions

## Step 3: Create Payments Table

Create a new migration file: `supabase/migrations/20260220000001_create_payments_table.sql`

```sql
-- Create payments table for transaction records
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id TEXT UNIQUE NOT NULL,
  order_id TEXT NOT NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
  amount INTEGER NOT NULL, -- Amount in paise (smallest currency unit)
  currency TEXT DEFAULT 'INR',
  status TEXT NOT NULL CHECK (status IN ('created', 'authorized', 'captured', 'failed', 'refunded')),
  method TEXT, -- card, netbanking, wallet, upi
  razorpay_signature TEXT,
  error_code TEXT,
  error_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_payments_booking_id ON payments(booking_id);
CREATE INDEX idx_payments_customer_id ON payments(customer_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_order_id ON payments(order_id);

-- RLS Policies
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Customers can view their own payments
CREATE POLICY "Users can view own payments"
  ON payments FOR SELECT
  USING (auth.uid() = customer_id);

-- Only authenticated users can insert payments (will be created by Edge Function)
CREATE POLICY "Authenticated users can create payments"
  ON payments FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

-- Trigger for updated_at
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

Run the migration:
```bash
npx supabase db push
```

## Step 4: Create Supabase Edge Function for Payment

Create `supabase/functions/create-razorpay-order/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Razorpay from "https://esm.sh/razorpay@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { amount, currency = "INR", bookingId } = await req.json();

    // Validate input
    if (!amount || !bookingId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Razorpay
    const razorpay = new Razorpay({
      key_id: Deno.env.get("RAZORPAY_KEY_ID"),
      key_secret: Deno.env.get("RAZORPAY_KEY_SECRET"),
    });

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: amount * 100, // Convert to paise
      currency,
      receipt: `booking_${bookingId}`,
      notes: {
        booking_id: bookingId,
      },
    });

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Get user from auth header
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Store payment record
    const { error: paymentError } = await supabaseClient.from("payments").insert({
      order_id: order.id,
      booking_id: bookingId,
      customer_id: user.id,
      amount: order.amount,
      currency: order.currency,
      status: "created",
    });

    if (paymentError) {
      console.error("Error storing payment:", paymentError);
    }

    return new Response(
      JSON.stringify({ order }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error creating order:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
```

Create `supabase/functions/verify-razorpay-payment/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = await req.json();

    // Verify signature
    const secret = Deno.env.get("RAZORPAY_KEY_SECRET");
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = createHmac("sha256", secret)
      .update(body)
      .digest("hex");

    const isValid = expectedSignature === razorpay_signature;

    if (!isValid) {
      return new Response(
        JSON.stringify({ error: "Invalid payment signature" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Update payment record
    const { error: paymentError } = await supabaseClient
      .from("payments")
      .update({
        payment_id: razorpay_payment_id,
        razorpay_signature,
        status: "captured",
        updated_at: new Date().toISOString(),
      })
      .eq("order_id", razorpay_order_id);

    if (paymentError) {
      console.error("Error updating payment:", paymentError);
    }

    // Update booking payment status
    const { error: bookingError } = await supabaseClient
      .from("bookings")
      .update({
        payment_status: "paid",
        updated_at: new Date().toISOString(),
      })
      .eq("id", bookingId);

    if (bookingError) {
      console.error("Error updating booking:", bookingError);
    }

    return new Response(
      JSON.stringify({ success: true, verified: isValid }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error verifying payment:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
```

Deploy Edge Functions:
```bash
npx supabase functions deploy create-razorpay-order
npx supabase functions deploy verify-razorpay-payment
```

## Step 5: Update PaymentPage Component

Update `src/pages/customer/PaymentPage.tsx`:

```typescript
// Add to imports
import { supabase } from "@/integrations/supabase/client";

// Add Razorpay script to index.html
// <script src="https://checkout.razorpay.com/v1/checkout.js"></script>

const handlePayment = async () => {
  if (!selectedMethod) {
    toast({
      title: "Select Payment Method",
      description: "Please choose a payment method to continue",
      variant: "destructive",
    });
    return;
  }

  setIsProcessing(true);

  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Create Razorpay order via Edge Function
    const { data: orderData, error: orderError } = await supabase.functions.invoke(
      "create-razorpay-order",
      {
        body: {
          amount: bookingDetails.total_amount,
          currency: "INR",
          bookingId: bookingDetails.id,
        },
      }
    );

    if (orderError) throw orderError;

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: orderData.order.amount,
      currency: orderData.order.currency,
      name: "HandyHive",
      description: `Payment for ${bookingDetails.service_category} service`,
      order_id: orderData.order.id,
      handler: async function (response: any) {
        // Verify payment via Edge Function
        const { data: verifyData, error: verifyError } = await supabase.functions.invoke(
          "verify-razorpay-payment",
          {
            body: {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              bookingId: bookingDetails.id,
            },
          }
        );

        if (verifyError || !verifyData.verified) {
          toast({
            title: "Payment Verification Failed",
            description: "Please contact support",
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Payment Successful!",
          description: "Your booking has been confirmed",
        });

        navigate(`/customer/bookings/${bookingDetails.booking_id}`);
      },
      prefill: {
        name: user.user_metadata.full_name,
        email: user.email,
      },
      theme: {
        color: "#F59E0B",
      },
    };

    const rzp = new (window as any).Razorpay(options);
    
    rzp.on("payment.failed", function (response: any) {
      toast({
        title: "Payment Failed",
        description: response.error.description,
        variant: "destructive",
      });
    });

    rzp.open();
  } catch (error: any) {
    console.error("Payment error:", error);
    toast({
      title: "Payment Error",
      description: error.message || "Failed to process payment",
      variant: "destructive",
    });
  } finally {
    setIsProcessing(false);
  }
};
```

## Step 6: Add Razorpay Script to index.html

Add this script tag to `index.html` before closing `</body>`:

```html
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

## Step 7: Testing

### Test Mode
1. Use test API keys from Razorpay dashboard
2. Test card numbers: https://razorpay.com/docs/payments/payments/test-card-details/
3. Test UPI: `success@razorpay`

### Production Mode
1. Complete KYC verification on Razorpay
2. Switch to live API keys
3. Update environment variables
4. Test with small real transactions

## Security Checklist

- [ ] Never expose `RAZORPAY_KEY_SECRET` to frontend
- [ ] Always verify payment signature on backend
- [ ] Use HTTPS in production
- [ ] Implement rate limiting on payment endpoints
- [ ] Log all payment transactions
- [ ] Handle payment failures gracefully
- [ ] Implement refund mechanism
- [ ] Add webhook for payment status updates

## Webhook Setup (Optional but Recommended)

Create `supabase/functions/razorpay-webhook/index.ts` to handle payment status updates from Razorpay.

## Troubleshooting

### Payment not creating
- Check Razorpay API keys
- Verify Edge Function logs
- Check network tab for errors

### Signature verification failing
- Ensure correct secret key
- Check order_id and payment_id format
- Verify HMAC implementation

### Booking not updating
- Check RLS policies on bookings table
- Verify user authentication
- Check Edge Function logs

## Next Steps

1. Implement refund mechanism
2. Add payment history page
3. Set up Razorpay webhooks
4. Add payment analytics
5. Implement subscription payments (if needed)

## Resources

- [Razorpay Documentation](https://razorpay.com/docs/)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Payment Gateway Best Practices](https://razorpay.com/docs/payments/payments/best-practices/)
