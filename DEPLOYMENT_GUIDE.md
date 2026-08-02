# 📖 LEV Coworking Beauty - Deployment Guide

## Overview

LEV Coworking Beauty is a React + Vite frontend application with Node.js/Express backend APIs, deployed on **Vercel**. The database uses **Supabase (PostgreSQL)**, with integrations for **WhatsApp Business API** and **Google Calendar**.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Vercel (Frontend + Serverless API)     │
│  ┌──────────────┐              ┌──────────────────────┐  │
│  │  Next.js /   │              │  API Routes (Edge)   │  │
│  │  React App   │─────────────→│  - WhatsApp webhook  │  │
│  │              │              │  - Appointments CRUD │  │
│  └──────────────┘              │  - Calendar sync     │  │
└─────────────────────────────────────────────────────────┘
           │
           ├──→ Supabase (Database)
           │    - PostgreSQL
           │    - Real-time subscriptions
           │    - Row-level security
           │
           ├──→ Google Calendar API
           │    - Service account auth
           │    - Event sync
           │
           └──→ WhatsApp Business API
                - Message webhooks
                - Template messages
```

## Environment Variables

### Frontend (VITE_* prefix - available in browser)
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGc...
```

### Backend (Server-side only)
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... # Full permissions

GEMINI_API_KEY=AIzaSyD... # Google Gemini API

# WhatsApp Business API
WHATSAPP_ACCESS_TOKEN=EAAG...
WHATSAPP_PHONE_NUMBER_ID=1234567890
WHATSAPP_APP_SECRET=abc123def456
WHATSAPP_VERIFY_TOKEN=verify_token_123
WHATSAPP_AUTOMATION_SECRET=auto_secret_123

# Google Calendar (Service Account)
GOOGLE_CALENDAR_ID=your-calendar@group.calendar.google.com
GOOGLE_SERVICE_ACCOUNT_EMAIL=service-account@project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
```

## Pre-Deployment Setup

### 1. Supabase Setup

```bash
# Create new Supabase project
# 1. Go to https://supabase.com
# 2. Create organization and project
# 3. Wait for project to initialize

# Run migrations
# Option A: Use SQL Editor in Dashboard
#   - Copy migrations from supabase/ folder
#   - Execute in SQL Editor

# Option B: Use Supabase CLI
supabase link --project-ref your_project_ref
supabase db push
```

### 2. Google Calendar Setup

```bash
# 1. Create service account in Google Cloud Console
# 2. Download private key JSON
# 3. Enable Google Calendar API
# 4. Share calendar with service account email
# 5. Add credentials to Vercel environment variables
```

### 3. WhatsApp Business Setup

```bash
# 1. Create WhatsApp Business account
# 2. Create app and get credentials
# 3. Configure webhook:
#    - URL: https://your-app.vercel.app/api/whatsapp/webhook
#    - Verify Token: your_verify_token
# 4. Create approval message templates:
#    - confirmacao_agendamento_lev
# 5. Add credentials to Vercel environment variables
```

## Deployment Process

### 1. Prepare Local Build

```bash
# Install dependencies
npm install

# Run type check
npm run lint

# Run unit tests
npm test

# Run E2E tests (optional)
npm run e2e

# Build production bundle
npm run build
```

### 2. Deploy to Vercel

```bash
# Option A: Git-based deployment (automatic)
git push origin main  # Triggers Vercel deploy automatically

# Option B: Manual via CLI
npm i -g vercel
vercel --prod

# Option C: Via Vercel Dashboard
# 1. Go to https://vercel.com
# 2. Click "Deploy" → "New Project"
# 3. Select repository
# 4. Configure environment variables
# 5. Click "Deploy"
```

### 3. Set Environment Variables in Vercel

```bash
# 1. Go to Vercel Project Settings
# 2. Navigate to "Environment Variables"
# 3. Add all variables from .env.example
# 4. Select which environments (Preview/Production)
# 5. Redeploy after adding variables
```

## Post-Deployment Verification

### Immediate Checks (5 minutes)

```bash
# 1. Visit production URL
curl https://lev-coworking-beauty.vercel.app

# 2. Check status page
https://your-app.vercel.app/api/health (if implemented)

# 3. Verify environment
# - Check browser console for errors
# - Test basic navigation
# - Verify API calls work
```

### Functional Tests (30 minutes)

- [ ] Landing page loads
- [ ] Navigation works
- [ ] Booking modal opens
- [ ] Images load (check DevTools > Network)
- [ ] WhatsApp link works
- [ ] Professional profiles display correctly
- [ ] Mobile responsive (test on mobile device)

### Integration Tests (1 hour)

- [ ] WhatsApp webhook receives messages
- [ ] Google Calendar integration syncs events
- [ ] Supabase real-time subscriptions work
- [ ] Database queries return correct data

### Performance Tests

```bash
# Run Lighthouse audit
npx lighthouse https://lev-coworking-beauty.vercel.app --view

# Targets:
# - Performance: 90+
# - Accessibility: 90+
# - Best Practices: 90+
# - SEO: 80+
```

## Monitoring & Observability

### Real-time Monitoring

1. **Vercel Analytics**
   - https://vercel.com → Project → Analytics
   - Monitor page performance, Core Web Vitals
   - View edge function execution metrics

2. **Supabase Console**
   - https://supabase.com → Project
   - Monitor database performance
   - Check real-time subscriptions
   - Review RLS policies

3. **Error Tracking** (Sentry recommended)
   ```bash
   npm install @sentry/react @sentry/tracing
   # Add to main.tsx
   ```

4. **Logs**
   - Vercel: Functions tab → Logs
   - Supabase: Database → Query Performance
   - WhatsApp: Meta Business Suite → Logs

## Troubleshooting

### App Not Loading

```bash
# 1. Check Vercel build logs
# 2. Check edge function errors
# 3. Verify environment variables set
# 4. Check browser console (F12)
```

### Database Connection Issues

```bash
# 1. Verify SUPABASE_URL is correct
# 2. Check SERVICE_ROLE_KEY has admin access
# 3. Test connection:
SELECT now();  -- Run in SQL Editor
```

### WhatsApp Integration Not Working

```bash
# 1. Verify webhook URL is correct
# 2. Check WHATSAPP_ACCESS_TOKEN is valid
# 3. Verify phone number format (country code + 10 digits)
# 4. Check webhook logs in Meta Business Suite
```

### Performance Issues

```bash
# 1. Check Lighthouse scores
# 2. Review DevTools Network tab
# 3. Check for large bundle sizes
# 4. Monitor Core Web Vitals in Vercel Analytics
# 5. Profile in Chrome DevTools
```

## Rollback Procedure

If critical issue occurs:

```bash
# Option 1: Via Vercel Dashboard
# 1. Go to Deployments tab
# 2. Find previous stable version
# 3. Click "Redeploy"

# Option 2: Via Git
git revert HEAD  # Create new commit that reverts changes
git push origin main
```

## Health Check Endpoints

Add these to your API for monitoring:

```typescript
// api/health.ts
export default async function handler(req: Request) {
  return new Response(JSON.stringify({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version,
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
```

## Maintenance

### Weekly Tasks
- [ ] Check error rates
- [ ] Review Supabase query performance
- [ ] Monitor storage usage
- [ ] Check backup status

### Monthly Tasks
- [ ] Update dependencies
- [ ] Review and rotate API keys
- [ ] Audit access logs
- [ ] Performance review

### Quarterly Tasks
- [ ] Major version upgrades (React, Vite)
- [ ] Security audit
- [ ] Database optimization
- [ ] Capacity planning

## Contact & Escalation

- **Deployment Issues**: Check Vercel logs, contact Vercel support
- **Database Issues**: Check Supabase status page, contact support
- **WhatsApp Issues**: Check Meta Business Suite, contact Meta support
- **General**: Team lead contact information

---

**Last Updated**: 2026-08-01  
**Maintained By**: Engineering Team  
**Document Version**: 1.0
