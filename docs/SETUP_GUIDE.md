# Setup Guide

Complete guide for setting up and running the Mood Manager project.

---

## Requirements

### 1. Node.js Version

- **Recommended**: Node.js 18.x or higher (current: v22.21.0)
- **Minimum**: Node.js 18.0.0

**Check Node.js version**:
```bash
node --version
```

**Install Node.js**:
- Official site: https://nodejs.org/
- Or use nvm (recommended): https://github.com/nvm-sh/nvm

**Using nvm**:
```bash
# Auto-switch if .nvmrc file exists in project root
cd Web
nvm use

# Or specify version directly
nvm install 22.21.0
nvm use 22.21.0
```

### 2. npm Version

- **Recommended**: npm 10.x or higher (current: 10.9.4)
- **Minimum**: npm 8.0.0

**Check npm version**:
```bash
npm --version
```

**Update npm**:
```bash
npm install -g npm@latest
```

### 3. Git

Git must be installed for cloning the repository.

### 4. PostgreSQL (for Production)

- **Version**: PostgreSQL 14.x or higher
- Required for V2 (database integration)

---

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd mood-manager
```

### 2. Install Dependencies

```bash
cd Web
npm install
```

**Important**: All commands must be run from the `Web/` directory.

### 3. Configure Environment Variables

Create a `Web/.env.local` file and set the following environment variables:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Database Connection (PostgreSQL)
DATABASE_URL=postgresql://user:password@localhost:5432/moodmanager

# OpenAI API (Optional, for LLM features)
OPENAI_API_KEY=your-openai-api-key

# Firebase Configuration (Optional, for Firestore integration)
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-firebase-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-firebase-project-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-firebase-app-id
FIREBASE_ADMIN_CREDENTIALS=your-firebase-admin-credentials-json

# Python ML Server (Optional, for ML prediction)
PYTHON_SERVER_URL=http://localhost:5000
PYTHON_SERVER_TIMEOUT=30000
PYTHON_SERVER_RETRY_MAX=3

# ML API Authentication (Optional)
ML_API_KEY=your-ml-api-key
```

**Important Notes**:
- `NEXTAUTH_SECRET` must be set to a strong random string in production
- `DATABASE_URL` is the PostgreSQL connection string
- If OpenAI API key is not provided, LLM features will use mock data

---

## Database Setup

### Local Development (PostgreSQL)

1. **Install PostgreSQL**

   ```bash
   # macOS (using Homebrew)
   brew install postgresql@14
   brew services start postgresql@14

   # Ubuntu/Debian
   sudo apt-get install postgresql-14

   # Windows
   # Download from https://www.postgresql.org/download/windows/
   ```

2. **Create Database**

   ```bash
   # Connect to PostgreSQL
   psql -U postgres

   # Create database
   CREATE DATABASE moodmanager;

   # Exit
   \q
   ```

3. **Update Environment Variable**

   ```env
   DATABASE_URL=postgresql://postgres:password@localhost:5432/moodmanager
   ```

### Production (AWS RDS)

1. **Get Connection Details**

   - Host: `mood-manager-db.cd4iisicagg0.ap-northeast-2.rds.amazonaws.com`
   - Port: `5432`
   - User: `postgres`
   - Password: `moodmanagerrds`

2. **Set Environment Variable**

   ```env
   DATABASE_URL=postgresql://postgres:moodmanagerrds@mood-manager-db.cd4iisicagg0.ap-northeast-2.rds.amazonaws.com:5432/postgres?sslmode=require
   ```

   **Note**: Replace `postgres` with the actual database name if different.

---

## Database Migration

### 1. Generate Prisma Client

```bash
cd Web
npx prisma generate
```

### 2. Run Migrations

**Development**:
```bash
npx prisma migrate dev
```

**Production**:
```bash
npx prisma migrate deploy
```

### 3. Verify Migration

```bash
# Open Prisma Studio
npx prisma studio
```

### Migration Notes

- **V1 (Mock Mode)**: Database migration is optional. You can test the full flow with mock data using the admin account (`admin@moodmanager.com` / `admin1234`).
- **V2 (Production)**: Database migration is required for user data persistence.

---

## Running the Application

### Development Mode

```bash
cd Web
npm run dev
```

Access the application at `http://localhost:3000` in your browser.

### Production Build

```bash
cd Web
npm run build
npm start
```

---

## Admin Mode (Mock Mode)

In V1, you can test the full flow without a real database:

- **Email**: `admin@moodmanager.com`
- **Password**: `admin1234`

In Admin Mode:
- Create/delete devices with mock data
- Manage mood sets based on localStorage
- Make actual LLM calls (if API key is provided)

---

## Troubleshooting

### Common Issues

1. **Port 3000 already in use**
   ```bash
   # Kill process on port 3000
   lsof -ti:3000 | xargs kill -9
   ```

2. **Prisma Client not generated**
   ```bash
   npx prisma generate
   ```

3. **Database connection failed**
   - Check `DATABASE_URL` environment variable
   - Verify PostgreSQL is running
   - Check firewall settings

4. **Module not found errors**
   ```bash
   # Clear node_modules and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

---

## Additional Resources

- **Project Structure**: See `PROJECT_STRUCTURE.md`
- **API Specification**: See `API_SPECIFICATION.md`
- **Firestore Structure**: See `FIRESTORE_STRUCTURE.md`
- **V2 Development Plan**: See `V2_DEVELOPMENT_PLAN.md`
