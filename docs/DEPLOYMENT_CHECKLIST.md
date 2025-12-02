# Deployment Checklist

Complete checklist for deploying Mood Manager to production.

---

## Pre-Deployment Code Review

### 1. Code Quality
- [ ] All TypeScript errors resolved
- [ ] All ESLint warnings addressed
- [ ] No console.log statements in production code (use console.debug or remove)
- [ ] All TODO/FIXME comments reviewed
- [ ] Code comments follow 음슴체 style (Korean) or English (for UI elements)

### 2. Environment Variables
- [ ] `NEXTAUTH_SECRET` set to strong random string
- [ ] `NEXTAUTH_URL` set to production URL (HTTPS)
- [ ] `DATABASE_URL` configured for production PostgreSQL
- [ ] `OPENAI_API_KEY` configured (if using LLM features)
- [ ] Firebase credentials configured (if using Firestore)
- [ ] All optional environment variables documented

### 3. Security
- [ ] `.env.local` and `.env` files not committed to Git
- [ ] API keys and secrets not hardcoded
- [ ] CORS settings configured for production
- [ ] Rate limiting enabled for authentication endpoints
- [ ] CSRF protection enabled in NextAuth
- [ ] HTTPS enforced in production

### 4. Database
- [ ] PostgreSQL migration completed
- [ ] Database connection tested
- [ ] Admin account created (if needed)
- [ ] Database backup strategy in place

### 5. Build & Test
- [ ] `npm run build` succeeds without errors
- [ ] `npm start` runs successfully
- [ ] All critical user flows tested:
  - [ ] Login/Register
  - [ ] Admin mode (mock mode)
  - [ ] Mood stream generation
  - [ ] Mood save/replace
  - [ ] Device management
  - [ ] Profile management

### 6. Performance
- [ ] No memory leaks detected
- [ ] API response times acceptable
- [ ] Large bundle sizes optimized
- [ ] Images optimized
- [ ] Lazy loading implemented where appropriate

### 7. Error Handling
- [ ] All API routes have error handling
- [ ] User-friendly error messages (English)
- [ ] Error boundaries implemented
- [ ] Logging configured for production

### 8. Documentation
- [ ] README.md updated (English only)
- [ ] API documentation updated
- [ ] Deployment guide updated
- [ ] Environment variable documentation complete

---

## Deployment Steps

### 1. Build Preparation
```bash
cd Web
npm install
npm run build
```

### 2. Environment Setup
- Set all required environment variables in deployment platform
- Verify `NEXTAUTH_SECRET` is set
- Verify `DATABASE_URL` points to production database

### 3. Database Migration
```bash
cd Web
npx prisma migrate deploy
npx prisma generate
```

### 4. Deploy Application
- Deploy to AWS EC2 or chosen platform
- Verify application starts successfully
- Check logs for errors

### 5. Post-Deployment Verification
- [ ] Application accessible via HTTPS
- [ ] Login/Register flow works
- [ ] Admin mode works (if applicable)
- [ ] Mood stream generation works
- [ ] Database connections successful
- [ ] API endpoints responding correctly
- [ ] No console errors in browser

---

## Known Issues & Limitations

### V1 (Mock Mode)
- Admin mode uses localStorage (no database persistence)
- Mock data used when API keys not configured
- Device control is simulated (no actual hardware)

### V2 (Future)
- Real database integration
- Firestore real-time data
- Python ML server integration
- Actual device control

---

## Rollback Plan

If deployment fails:
1. Revert to previous version
2. Check deployment logs
3. Verify environment variables
4. Test database connection
5. Re-run migration if needed

---

## Monitoring

After deployment, monitor:
- Application logs
- Database connection status
- API response times
- Error rates
- User authentication success rate

---

## Support

For issues or questions:
- Check logs: `/var/log/` (if on EC2)
- Check application logs in deployment platform
- Review error messages in browser console
- Contact team members

