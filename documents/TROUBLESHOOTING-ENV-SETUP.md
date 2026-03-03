# Environment Setup Troubleshooting

**Error**: `ERR_NAME_NOT_RESOLVED` when trying to authenticate

---

## Problem

You're seeing this error:
```
ivqffvzwzvkbzklkcwpt.supabase.co/auth/v1/token?grant_type=password:1
Failed to load resource: net::ERR_NAME_NOT_RESOLVED
```

This means your Supabase URL is either:
1. Missing the `https://` protocol
2. Not configured in your `.env` file
3. Using the wrong environment variable name

---

## Solution

### Step 1: Check Your `.env` File

Your `.env` file should look like this:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://ivqffvzwzvkbzklkcwpt.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key_here

# Razorpay Configuration (for payment integration)
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
RAZORPAY_KEY_SECRET=your_secret_key_here
```

**IMPORTANT**: 
- The URL MUST start with `https://`
- Use `VITE_SUPABASE_PUBLISHABLE_KEY` (not `VITE_SUPABASE_ANON_KEY`)
- Your project ID is: `ivqffvzwzvkbzklkcwpt`

### Step 2: Get Your Supabase Credentials

1. Go to [supabase.com](https://supabase.com)
2. Open your project: `ivqffvzwzvkbzklkcwpt`
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL**: `https://ivqffvzwzvkbzklkcwpt.supabase.co`
   - **anon/public key**: (long string starting with `eyJ...`)

### Step 3: Create/Update Your `.env` File

```bash
# In your project root, create .env file
# Copy the template
cp .env.example .env

# Then edit .env with your actual values
```

Your `.env` should look like:

```env
VITE_SUPABASE_URL=https://ivqffvzwzvkbzklkcwpt.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2cWZmdnp3enZrYnprbGtjd3B0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDcxMzQ0MDYsImV4cCI6MjAyMjcxMDQwNn0.YOUR_ACTUAL_KEY_HERE
```

### Step 4: Restart Development Server

After updating `.env`:

```bash
# Stop the dev server (Ctrl+C)
# Then restart it
npm run dev
```

**CRITICAL**: You MUST restart the dev server after changing `.env` files!

---

## Verification

### Check if Environment Variables are Loaded

Add this temporarily to `src/App.tsx` (remove after testing):

```typescript
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Has Publishable Key:', !!import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);
```

You should see:
```
Supabase URL: https://ivqffvzwzvkbzklkcwpt.supabase.co
Has Publishable Key: true
```

If you see `undefined`, your `.env` file is not being loaded.

---

## Common Issues

### Issue 1: `.env` File Not Found

**Symptom**: Environment variables are `undefined`

**Solution**:
```bash
# Make sure .env is in the project root (same level as package.json)
ls -la .env

# If not found, create it
cp .env.example .env
```

### Issue 2: Wrong Variable Name

**Symptom**: Still getting `ERR_NAME_NOT_RESOLVED`

**Solution**: The client code uses `VITE_SUPABASE_PUBLISHABLE_KEY`, not `VITE_SUPABASE_ANON_KEY`

Update your `.env`:
```env
# ❌ Wrong
VITE_SUPABASE_ANON_KEY=your_key

# ✅ Correct
VITE_SUPABASE_PUBLISHABLE_KEY=your_key
```

### Issue 3: Missing `https://`

**Symptom**: URL shows as `ivqffvzwzvkbzklkcwpt.supabase.co` without protocol

**Solution**: Always include `https://`:
```env
# ❌ Wrong
VITE_SUPABASE_URL=ivqffvzwzvkbzklkcwpt.supabase.co

# ✅ Correct
VITE_SUPABASE_URL=https://ivqffvzwzvkbzklkcwpt.supabase.co
```

### Issue 4: Server Not Restarted

**Symptom**: Changes to `.env` not taking effect

**Solution**: 
```bash
# Stop dev server (Ctrl+C)
npm run dev
```

Vite only reads `.env` files on startup!

---

## Quick Fix Script

Create this file to quickly set up your environment:

```bash
#!/bin/bash
# setup-env.sh

echo "Setting up environment..."

# Create .env from template
cp .env.example .env

# Update with your project ID
sed -i 's|your_supabase_project_url|https://ivqffvzwzvkbzklkcwpt.supabase.co|g' .env

echo "✅ .env file created!"
echo "⚠️  Please edit .env and add your VITE_SUPABASE_PUBLISHABLE_KEY"
echo "⚠️  Get it from: https://supabase.com/dashboard/project/ivqffvzwzvkbzklkcwpt/settings/api"
```

Run it:
```bash
chmod +x setup-env.sh
./setup-env.sh
```

---

## Still Not Working?

### Debug Checklist

- [ ] `.env` file exists in project root
- [ ] `.env` contains `VITE_SUPABASE_URL=https://ivqffvzwzvkbzklkcwpt.supabase.co`
- [ ] `.env` contains `VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...` (your actual key)
- [ ] Dev server was restarted after creating/editing `.env`
- [ ] No typos in variable names
- [ ] URL includes `https://`
- [ ] Browser console shows correct URL (not `undefined`)

### Get Your Supabase Key

If you don't have your Supabase key:

1. Go to: https://supabase.com/dashboard/project/ivqffvzwzvkbzklkcwpt/settings/api
2. Copy the **anon/public** key (under "Project API keys")
3. Paste it in your `.env` file as `VITE_SUPABASE_PUBLISHABLE_KEY`

---

## Alternative: Use Supabase CLI

If you have Supabase CLI installed:

```bash
# Link to your project
supabase link --project-ref ivqffvzwzvkbzklkcwpt

# Generate .env file automatically
supabase status

# This will show your URL and keys
```

---

## Next Steps

Once your environment is set up correctly:

1. ✅ Restart dev server
2. ✅ Try logging in again
3. ✅ Check browser console for errors
4. ✅ If still issues, check Supabase dashboard for project status

---

**Need more help?** Check the main documentation in `/documents` folder.
