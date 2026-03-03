# HandyHive - Deployment Guide

**Last Updated**: March 2, 2026

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Setup](#database-setup)
4. [Frontend Deployment](#frontend-deployment)
5. [Production Checklist](#production-checklist)
6. [Monitoring & Maintenance](#monitoring--maintenance)

---

## ✅ Prerequisites

### Required Accounts
- [ ] GitHub account (for code repository)
- [ ] Supabase account (for backend)
- [ ] Vercel account (for frontend hosting)
- [ ] Razorpay account (for payments)
- [ ] Domain registrar account (optional)

### Required Tools
- [ ] Node.js 18+ and npm
- [ ] Git
- [ ] Supabase CLI
- [ ] Vercel CLI (optional)

---

## 🔧 Environment Setup

### 1. Clone Repository

```bash
git clone <your-repository-url>
cd handyhive
npm install
```

### 2. Environment Variables

Create `.env` file in project root:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# Razorpay Configuration (Production)
VITE_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxx

# Optional: Analytics
VITE_GA_TRACKING_ID=G-XXXXXXXXXX
```

### 3. Supabase Project Setup

#### Create New Project
1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in details:
   - Name: HandyHive
   - Database Password: (save securely)
   - Region: Choose closest to your users
4. Wait for project to be created (~2 minutes)

#### Get API Keys
1. Go to Project Settings → API
2. Copy:
   - Project URL → `VITE_SUPABASE_URL`
   - anon/public key → `VITE_SUPABASE_ANON_KEY`

---

## 🗄️ Database Setup

### 1. Install Supabase CLI

```bash
npm install -g supabase
```

### 2. Link to Project

```bash
supabase link --project-ref your-project-ref
```

### 3. Run Migrations

```bash
# Push all migrations to Supabase
supabase db push

# Or run migrations individually
supabase db push --file supabase/migrations/20260205055906_*.sql
```

### 4. Verify Database

```bash
# Check if tables are created
supabase db diff

# Or login to Supabase dashboard
# Go to Table Editor and verify all tables exist
```

### 5. Configure Storage Buckets

#### Create Buckets
1. Go to Supabase Dashboard → Storage
2. Create buckets:
   - `kyc-documents` (private)
   - `avatars` (public)
   - `service-images` (public)

#### Set Bucket Policies

```sql
-- KYC Documents (Private)
CREATE POLICY "Users can upload own KYC"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'kyc-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view own KYC"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'kyc-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Avatars (Public)
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

### 6. Configure Authentication

#### Email Settings
1. Go to Authentication → Email Templates
2. Customize templates:
   - Confirm Signup
   - Reset Password
   - Magic Link

#### Email Provider (Production)
1. Go to Authentication → Settings
2. Configure SMTP:
   - Host: smtp.gmail.com (or your provider)
   - Port: 587
   - Username: your-email@gmail.com
   - Password: app-specific password

#### Auth Settings
1. Enable email confirmation
2. Set redirect URLs:
   - Site URL: `https://yourdomain.com`
   - Redirect URLs: `https://yourdomain.com/**`

---

## 🚀 Frontend Deployment

### Option 1: Vercel (Recommended)

#### Via Vercel Dashboard

1. **Connect Repository**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository

2. **Configure Build Settings**
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

3. **Add Environment Variables**
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key
   VITE_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxx
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (~2-3 minutes)
   - Your site is live at `https://your-project.vercel.app`

#### Via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
```

### Option 2: Netlify

1. **Connect Repository**
   - Go to [netlify.com](https://netlify.com)
   - Click "New site from Git"
   - Choose your repository

2. **Build Settings**
   - Build command: `npm run build`
   - Publish directory: `dist`

3. **Environment Variables**
   - Add same variables as Vercel

4. **Deploy**

### Option 3: Self-Hosted (VPS)

#### Requirements
- Ubuntu 20.04+ server
- Nginx
- Node.js 18+
- SSL certificate (Let's Encrypt)

#### Setup Steps

```bash
# 1. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Install Nginx
sudo apt-get install nginx

# 3. Clone repository
git clone <your-repo-url>
cd handyhive

# 4. Install dependencies
npm install

# 5. Build
npm run build

# 6. Configure Nginx
sudo nano /etc/nginx/sites-available/handyhive
```

Nginx configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    root /var/www/handyhive/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

```bash
# 7. Enable site
sudo ln -s /etc/nginx/sites-available/handyhive /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# 8. Install SSL (Let's Encrypt)
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## 🔐 Production Checklist

### Security

- [ ] Enable HTTPS (SSL certificate)
- [ ] Configure CORS properly
- [ ] Set secure environment variables
- [ ] Enable Supabase RLS policies
- [ ] Configure rate limiting
- [ ] Set up firewall rules (if self-hosted)
- [ ] Enable 2FA for admin accounts
- [ ] Regular security audits

### Performance

- [ ] Enable Gzip compression
- [ ] Configure CDN (Cloudflare)
- [ ] Optimize images
- [ ] Enable browser caching
- [ ] Minify CSS/JS (done by Vite)
- [ ] Lazy load components
- [ ] Database indexes created
- [ ] Query optimization

### Monitoring

- [ ] Set up error tracking (Sentry)
- [ ] Configure analytics (Google Analytics)
- [ ] Set up uptime monitoring (UptimeRobot)
- [ ] Database performance monitoring
- [ ] Set up alerts for errors
- [ ] Log aggregation (if self-hosted)

### Backup

- [ ] Enable Supabase automatic backups
- [ ] Set up database backup schedule
- [ ] Test restore procedure
- [ ] Document backup locations
- [ ] Set up off-site backups

### Testing

- [ ] Test all user flows
- [ ] Test payment integration
- [ ] Test email delivery
- [ ] Test on multiple devices
- [ ] Test on multiple browsers
- [ ] Load testing
- [ ] Security testing

---

## 📊 Monitoring & Maintenance

### Daily Checks

- [ ] Check error logs
- [ ] Monitor uptime
- [ ] Check payment transactions
- [ ] Review user signups
- [ ] Check booking completions

### Weekly Tasks

- [ ] Review analytics
- [ ] Check database performance
- [ ] Review user feedback
- [ ] Update content if needed
- [ ] Check for security updates

### Monthly Tasks

- [ ] Database optimization
- [ ] Review and update dependencies
- [ ] Security audit
- [ ] Performance optimization
- [ ] Backup verification
- [ ] Cost analysis

### Monitoring Tools

#### 1. Supabase Dashboard
- Database performance
- API usage
- Storage usage
- Auth metrics

#### 2. Vercel Analytics
- Page views
- Performance metrics
- Error rates
- Geographic distribution

#### 3. Google Analytics
- User behavior
- Conversion rates
- Traffic sources
- User demographics

#### 4. Sentry (Error Tracking)

```bash
# Install Sentry
npm install @sentry/react @sentry/tracing

# Configure in main.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: "production",
  tracesSampleRate: 1.0,
});
```

#### 5. UptimeRobot (Uptime Monitoring)
- Set up monitors for:
  - Homepage
  - API endpoints
  - Database connection
- Configure alerts via email/SMS

---

## 🔄 CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

## 🚨 Troubleshooting

### Common Issues

#### 1. Build Fails

**Error**: `Module not found`
```bash
# Solution: Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### 2. Environment Variables Not Working

**Error**: `undefined` for env variables
```bash
# Solution: Ensure variables start with VITE_
# Restart dev server after adding variables
```

#### 3. Database Connection Issues

**Error**: `Failed to connect to database`
```bash
# Solution: Check Supabase URL and keys
# Verify RLS policies are not blocking access
```

#### 4. CORS Errors

**Error**: `CORS policy blocked`
```bash
# Solution: Add your domain to Supabase allowed origins
# Go to Authentication → URL Configuration
```

#### 5. Payment Integration Issues

**Error**: `Razorpay script not loaded`
```bash
# Solution: Ensure script tag is in index.html
# Check if Razorpay keys are correct
```

---

## 📞 Support

### Resources
- [Supabase Documentation](https://supabase.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Vite Documentation](https://vitejs.dev)
- [React Documentation](https://react.dev)

### Getting Help
- GitHub Issues: For bug reports
- Email: support@handyhive.com
- Documentation: `/documents` folder

---

## 🎉 Post-Deployment

### Launch Checklist

- [ ] Announce launch on social media
- [ ] Send email to beta users
- [ ] Update Google Search Console
- [ ] Submit sitemap
- [ ] Set up Google My Business
- [ ] Create launch blog post
- [ ] Monitor metrics closely
- [ ] Gather user feedback
- [ ] Plan first update

### Success Metrics

Track these KPIs:
- User signups
- Booking completion rate
- Payment success rate
- Page load time
- Error rate
- Customer satisfaction

---

**Your HandyHive platform is now live! 🚀**

**Next**: Read [06-TESTING-GUIDE.md](./06-TESTING-GUIDE.md) for testing strategies.
