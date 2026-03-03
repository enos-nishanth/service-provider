# 🚀 Quick Start Guide

**Get HandyHive running in 5 minutes!**

---

## ⚠️ IMPORTANT: Fix Environment Setup First

You're seeing authentication errors because your environment variables are not configured correctly.

### Step 1: Create `.env` File

```bash
# Copy the template
cp .env.example .env
```

### Step 2: Get Your Supabase Credentials

1. Go to: https://supabase.com/dashboard/project/ivqffvzwzvkbzklkcwpt/settings/api
2. Copy your **anon/public** key (the long string starting with `eyJ...`)

### Step 3: Edit `.env` File

Open `.env` and it should look like this:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://ivqffvzwzvkbzklkcwpt.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.YOUR_ACTUAL_KEY_HERE

# Razorpay Configuration (for payment integration - optional for now)
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
RAZORPAY_KEY_SECRET=your_secret_key_here
```

**Replace `YOUR_ACTUAL_KEY_HERE` with your actual Supabase anon key!**

### Step 4: Restart Dev Server

```bash
# Stop the server (Ctrl+C if running)
# Then start it again
npm run dev
```

**CRITICAL**: You MUST restart after changing `.env` files!

---

## ✅ Verify It's Working

1. Open http://localhost:5173
2. Try to sign up or log in
3. You should NOT see `ERR_NAME_NOT_RESOLVED` errors anymore

---

## 🎯 What You've Built

Your HandyHive platform includes:

- ✅ User authentication (signup/login)
- ✅ Multi-role system (Customer, Provider, Admin)
- ✅ Booking system
- ✅ Real-time notifications
- ✅ KYC verification for providers
- ✅ Admin dashboard

---

## 📚 Next Steps

1. **Read the documentation**: Start with `documents/00-START-HERE.md`
2. **Test the platform**: Create a test account and explore
3. **Payment integration**: Follow `PAYMENT_INTEGRATION_GUIDE.md` (critical for production)
4. **Smart Matching**: Read `documents/04-KEY-IMPROVEMENT-RECOMMENDATION.md` (game changer!)

---

## 🆘 Still Having Issues?

### Common Problems

**Problem**: Still seeing `ERR_NAME_NOT_RESOLVED`
- **Solution**: Make sure you restarted the dev server after editing `.env`

**Problem**: Environment variables are `undefined`
- **Solution**: Check that `.env` is in the project root (same folder as `package.json`)

**Problem**: "Invalid API key" error
- **Solution**: Double-check you copied the correct anon/public key from Supabase dashboard

### Get Detailed Help

Read: `documents/TROUBLESHOOTING-ENV-SETUP.md` for complete troubleshooting guide

---

## 🎉 You're Ready!

Once your environment is set up:
- Browse the platform
- Create test accounts
- Test the booking flow
- Explore the admin dashboard

**Happy coding! 🚀**
