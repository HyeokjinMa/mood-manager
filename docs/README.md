# Documentation

This directory contains essential documentation for the Mood Manager project.

---

## Document List

### Setup & Installation
- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)**: Complete setup guide including installation, database configuration, and migration

### Project Structure
- **[PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)**: Project structure and WearOS app information

### API & Data
- **[API_SPECIFICATION.md](./API_SPECIFICATION.md)**: Complete API specification
- **[FIRESTORE_STRUCTURE.md](./FIRESTORE_STRUCTURE.md)**: Firestore data structure specification

### Development Plans
- **[V2_DEVELOPMENT_PLAN.md](./V2_DEVELOPMENT_PLAN.md)**: V2 development plan (DB integration and device control)

---

## Quick Reference

### Frontend Developers
1. **Project Structure**: `PROJECT_STRUCTURE.md` - Overall structure and WearOS app info
2. **API Usage**: `API_SPECIFICATION.md` - API endpoint specifications
3. **Setup**: `SETUP_GUIDE.md` - Installation and configuration

### Backend Developers
1. **API Specification**: `API_SPECIFICATION.md` - All API endpoints
2. **Database**: `SETUP_GUIDE.md` - Database setup and migration
3. **Firestore**: `FIRESTORE_STRUCTURE.md` - Firestore data structure

### Project Managers
1. **Development Plan**: `V2_DEVELOPMENT_PLAN.md` - V2 implementation roadmap
2. **Project Structure**: `PROJECT_STRUCTURE.md` - Overall project structure

---

## Current Project Status

### Frontend
- ✅ All pages implemented (9 pages)
- ✅ API Routes implemented (21 endpoints, mock mode)
- ✅ Toast Notification, Error Boundary applied
- ✅ Loading skeleton UI added
- ✅ Code separation completed (all pages under 300 lines)
- ✅ TypeScript type safety improved (no `any` types)
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

### SETUP_GUIDE.md
Complete installation and setup guide
- Requirements (Node.js, npm, PostgreSQL)
- Installation steps
- Environment variable configuration
- Database setup (local and production)
- Database migration guide
- Troubleshooting

### PROJECT_STRUCTURE.md
Project structure and organization
- Web app structure (Next.js)
- WearOS app details
- Directory organization

### API_SPECIFICATION.md
Complete API specification
- All API endpoints
- Request/response formats
- Authentication requirements

### FIRESTORE_STRUCTURE.md
Firestore data structure
- Collection structure
- Data fields
- ML processing flow

### V2_DEVELOPMENT_PLAN.md
V2 development roadmap
- Current status analysis
- Phase-by-phase implementation plan
- Database integration
- Device control integration
