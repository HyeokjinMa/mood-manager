# Documentation

This directory contains essential documentation for the Mood Manager project.

---

## Document List

### Essential Documents

1. **[API_SPECIFICATION.md](./API_SPECIFICATION.md)**: Complete API specification and Firestore data structure
2. **[DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)**: Setup guide and development guidelines
3. **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)**: Deployment checklist and guide
4. **[PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)**: Project structure and organization

---

## Quick Reference

### Frontend Developers
1. **API Usage**: `API_SPECIFICATION.md` - API endpoint specifications
2. **Setup**: `DEVELOPMENT_GUIDE.md` - Installation and configuration
3. **Project Structure**: `PROJECT_STRUCTURE.md` - Overall structure

### Backend Developers
1. **API Specification**: `API_SPECIFICATION.md` - All API endpoints and Firestore structure
2. **Database**: `DEVELOPMENT_GUIDE.md` - Database setup and migration
3. **Deployment**: `DEPLOYMENT_GUIDE.md` - Deployment procedures

### Project Managers
1. **Project Structure**: `PROJECT_STRUCTURE.md` - Overall project structure
2. **Deployment**: `DEPLOYMENT_GUIDE.md` - Deployment checklist

---

## Current Project Status

### Frontend
- ✅ All pages implemented (9 pages)
- ✅ API Routes implemented (21 endpoints, mock mode)
- ✅ Toast Notification, Error Boundary applied
- ✅ Loading skeleton UI added
- ✅ Code separation completed
- ✅ TypeScript type safety improved
- ✅ Admin mode fully implemented (localStorage-based mood set management)
- ⚠️ Database integration pending (Prisma schema ready, actual data save/retrieve not implemented)
- ⚠️ Time-series + Markov chain model implementation pending (currently using LLM 2-stage processing)

### WearOS App
- ✅ Completed v4 version
- ✅ Firebase integration complete
- ✅ Firestore data transmission working
- ✅ Health Services integration
- ✅ Audio Event collection

### Development Environment
- ✅ Next.js 15.5.6
- ✅ React 19.1.0
- ✅ TypeScript 5.9.3
- ✅ Prisma 6.19.0
- ✅ OpenAI API integration (gpt-4o-mini)

---

## Document Summary

### API_SPECIFICATION.md
Complete API specification and Firestore data structure
- All API endpoints
- Request/response formats
- Authentication requirements
- Firestore collection structure
- ML processing flow

### DEVELOPMENT_GUIDE.md
Complete installation and development guide
- Requirements (Node.js, npm, PostgreSQL)
- Installation steps
- Environment variable configuration
- Database setup (local and production)
- Database migration guide
- Code style guide
- Troubleshooting

### DEPLOYMENT_GUIDE.md
Deployment checklist and guide
- Pre-deployment code review
- Deployment steps
- Post-deployment verification
- Known issues and limitations
- Rollback plan
- Monitoring

### PROJECT_STRUCTURE.md
Project structure and organization
- Web app structure (Next.js)
- WearOS app details
- Directory organization
