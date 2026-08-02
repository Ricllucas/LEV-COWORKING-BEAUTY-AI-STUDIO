# 🚀 LEV Coworking Beauty - Deployment Checklist

## Pre-Deployment (Week 5)

### Code Quality
- [ ] All TypeScript errors resolved (`npm run lint`)
- [ ] All unit tests passing (`npm test`)
- [ ] All E2E tests passing (`npm run e2e`)
- [ ] No console errors or warnings in dev build
- [ ] No memory leaks detected (DevTools profiling)
- [ ] Code reviewed by team lead

### Build & Performance
- [ ] Production build succeeds (`npm run build`)
- [ ] Bundle size analyzed and optimized
- [ ] No unused dependencies
- [ ] Lighthouse audit run (target scores: Performance 90+, Accessibility 90+, Best Practices 90+)
- [ ] Performance metrics baselined
- [ ] Lazy loading working correctly
- [ ] Error handling functional

### Environment Configuration
- [ ] All required .env variables documented in .env.example
- [ ] Vercel environment variables set:
  - [ ] GEMINI_API_KEY
  - [ ] VITE_SUPABASE_URL
  - [ ] VITE_SUPABASE_PUBLISHABLE_KEY
  - [ ] SUPABASE_URL (server-side)
  - [ ] SUPABASE_SERVICE_ROLE_KEY (server-side)
  - [ ] WHATSAPP_ACCESS_TOKEN
  - [ ] WHATSAPP_PHONE_NUMBER_ID
  - [ ] WHATSAPP_APP_SECRET
  - [ ] WHATSAPP_VERIFY_TOKEN
  - [ ] WHATSAPP_AUTOMATION_SECRET
  - [ ] GOOGLE_CALENDAR_ID
  - [ ] GOOGLE_SERVICE_ACCOUNT_EMAIL
  - [ ] GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY

### Database & Services
- [ ] Supabase project configured
- [ ] Database schema migrated
- [ ] Row-level security (RLS) policies tested
- [ ] Google Calendar API enabled and shared
- [ ] Google service account created and authorized
- [ ] WhatsApp Business account setup complete
- [ ] WhatsApp webhook configured and verified

### Documentation
- [ ] README updated with setup instructions
- [ ] API documentation complete
- [ ] Deployment guide written
- [ ] Troubleshooting guide created
- [ ] Team trained on deployment process

## Deployment Day

### Pre-Deployment Checks
- [ ] All team members notified
- [ ] Rollback plan reviewed
- [ ] Monitoring dashboard open
- [ ] Incident response contact list updated
- [ ] Backup created

### Deploy to Vercel
```bash
# Push to main branch (automatically triggers Vercel deploy)
git push origin main

# Or manually trigger via Vercel Dashboard
# Monitor deployment in Vercel UI
```

- [ ] Deployment started
- [ ] Build logs checked (no errors)
- [ ] Deployment preview working
- [ ] Production deployment triggered
- [ ] DNS propagated (check after 5 minutes)

### Post-Deployment Validation
- [ ] Production URL accessible
- [ ] Landing page loads without errors
- [ ] Navigation working
- [ ] Booking flow functional
- [ ] WhatsApp integration tested (send test message)
- [ ] Google Calendar sync verified
- [ ] Error monitoring active (Sentry/similar)
- [ ] Performance metrics normal
- [ ] No 404 or 5xx errors in logs

### Smoke Tests
```bash
# Test key flows manually:
- Visit landing page
- Test booking modal
- Check mobile responsiveness
- Test WhatsApp link
- Verify professional profiles load
- Test image lazy loading
```

- [ ] All smoke tests pass

### Monitoring Setup
- [ ] Error tracking configured (Sentry/Rollbar)
- [ ] Performance monitoring active (Vercel Analytics)
- [ ] Uptime monitoring enabled (Pingdom/UptimeRobot)
- [ ] Log aggregation setup (Datadog/CloudWatch)
- [ ] Alerts configured for critical errors
- [ ] Team notified of monitoring URL

## Post-Deployment (Hours 1-24)

### Monitoring
- [ ] Check error rates (should be near 0%)
- [ ] Monitor performance metrics
- [ ] Watch for unusual traffic patterns
- [ ] Review user feedback/support tickets
- [ ] Check resource usage (CPU, memory, database connections)

### Quick Wins
- [ ] User feedback collected
- [ ] Common issues logged
- [ ] Performance hotspots identified
- [ ] Deploy patch if critical issues found

## Post-Deployment (Day 2-7)

### Verification
- [ ] All features working as expected
- [ ] No regressions reported
- [ ] Performance stable
- [ ] User adoption healthy
- [ ] Support tickets reviewed

### Documentation
- [ ] Update deployment guide based on learnings
- [ ] Document any issues encountered
- [ ] Update runbook with new findings

## Rollback Plan

If critical issues occur:

1. **Identify issue** - Check error logs and performance metrics
2. **Decide rollback** - If blocking, rollback immediately
3. **Execute rollback**:
   ```bash
   # Via Vercel Dashboard:
   # 1. Go to Deployments
   # 2. Find previous stable deployment
   # 3. Click "Redeploy"
   ```

4. **Communicate** - Notify team and users
5. **Investigate** - Find root cause
6. **Fix & Redeploy** - Once fixed, deploy again

## Success Criteria

✅ Production is live  
✅ No critical errors  
✅ Performance metrics healthy  
✅ Users can book appointments  
✅ WhatsApp integration working  
✅ All integrations functional  
✅ Team confident in system  

---

**Deployment Date**: ________________  
**Deployed By**: ________________  
**Approved By**: ________________  
**Notes**: ____________________________
