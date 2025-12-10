# Mood Manager

**AI-Based Personalized Mood Management System for Smart Homes**
---

## Overview

Mood Manager is a multimodal AI service that analyzes users' psychological and physical states based on biometric information (heart rate, HRV, stress indicators) and audio events (laughter, sighs, anger, sadness detection) collected from WearOS devices. The system recommends personalized lighting, scent, and sound environments accordingly.

The system operates based on the following pipeline: **WearOS → Firebase → ML Analysis Server → Next.js Web App → Emotion Prediction (Discrete Markov Chain for Statistical Analysis) → Mood Expansion (LLM) → Output Device Control**.

---

## System Architecture Diagram

![System Architecture](./Web/public/system-architecture.png)

---

## Members

| Name | Department | Email |
| :--- | :--- | :--- |
| Hyeokjin Ma | Information Systems | tema0311@hanyang.ac.kr |
| Saeyeon Park | Information Systems | saeyeon0317@hanyang.ac.kr |
| Junseong Ahn | Information Systems | lljs1113@hanyang.ac.kr |
| Heejoo Chae | Information Systems | heeju0203@hanyang.ac.kr |
| Hyeonwoo Choi | Information Systems | hhyyrr0713@hanyang.ac.kr |

---

### Key Features

- **Real-time Biometric Data Collection**: Collects heart rate, HRV, and respiratory rate from WearOS devices at 5 minutes intervals
- **Audio Event Classification**: Detects laughter, sighs, anger, and sadness using fine-tuned audio ML model
- **Personalized Mood Generation**: Generates 10-segment (30-minute) mood streams by combining current user states, user preferences, and external factors (weather, etc.)
- **Smart Home Control**: Manages a home device for integrated control of lighting, scents, and music
- **User Authentication & Profile Management**: NextAuth-based authentication, social login (Google, Kakao, Naver), and profile management
- **Mood Save & Management**: Save, delete, and replace generated mood segments

---

## System Architecture

### 1. WearOS Layer

- **Kotlin-based Native App**: Application optimized for wearable devices
- **Health Services API**: Collects heart rate, HRV, respiratory rate, and movement data in real-time
- **Audio Processing**: Captures 2-second audio using AudioRecord, calculates RMS/dBFS to filter silent segments, and converts PCM data to WAV/Base64
- **Foreground Service**: Maintains a stable 5 minutes loop to collect data continuously in the background
- **Data Upload**: Uploads collected biometric and audio data to user-specific collections in Firestore

### 2. Firebase Layer

- **Real-time Data Bridge**: Relays data flow between wearable devices, ML server, and web application
- **Data Structure**:
  - `users/{userId}/raw_periodic/{docId}`: Biometric data (heartRate, HRV, stress, etc.)
  - `users/{userId}/raw_events/{docId}`: Audio events (Base64 WAV, `ml_processed` status)
    - **ML Processing Flow**: ML server queries documents with `ml_processed == 'pending'`, processes them, and updates to `'done'`
    - **Required Fields**: `audio_base64`, `timestamp`, `ml_processed`

### 3. ML Python Microservice

- **Audio Classification**: Collects and preprocesses Base64 WAV data stored in Firestore
- **Analysis**: Classifies laughter, sighs, and noise events with high accuracy using a fine-tuned Wav2Vec2-based audio model
- **Result Delivery**: Sends analyzed event timestamps and classification results to the web application
- **Deployment Strategy**: Optimizes the model using ONNX and quantization, packages it into a Docker image, and deploys to AWS Lambda in a serverless architecture

### 4. Web Application Layer (Next.js)

- **Data Collection**: Receives biometric data and ML-classified audio events from Firestore
- **Preprocessing**: Preprocesses biometric/audio data into valid numerical features and combines with user preferences and external data (weather, etc.)
- **Mood Generation**: Two-stage processing for mood generation
  - **Stage 1 (Emotion Prediction)**: Discrete Markov Chain for statistical analysis (traditional method, not state-of-the-art)
  - **Stage 2 (Mood Expansion)**: Expands emotion segments into detailed mood outputs with colors, music, scents, and lighting (uses LLM, temperature: 0.7, creativity required)
- **Dashboard**: Visualizes the final inferred mood and simulates home environment control
- **Database**: User data management through PostgreSQL (Prisma ORM)
- **Authentication**: Email/password and social login support via NextAuth.js

### 5. Database Layer (PostgreSQL)

- **User Management**: Stores user profiles, preferences, and mood sets
- **Device Management**: Stores connected device information
- **Session Management**: NextAuth session and JWT token management

---

## Getting Started

### Requirements

- **Node.js**: 18.x or higher (recommended: 22.21.0)
- **npm**: 8.x or higher (recommended: 10.9.4)
- **PostgreSQL**: 14.x or higher (for production environment)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd mood-manager
   ```

2. **Install dependencies**

   ```bash
   cd Web
   npm install
   ```

3. **Configure environment variables**

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
   - `NEXTAUTH_SECRET` must be set to a strong random string in production environments
   - `DATABASE_URL` is the PostgreSQL connection string
   - If OpenAI API key is not provided, LLM features will not work and will be replaced with mock data

4. **Database Migration** (Optional)

   ```bash
   cd Web
   npx prisma generate
   npx prisma migrate dev
   ```

   **Note**: Database migration is not required for V1 (Mock Mode). You can test the full flow with mock data by logging in with the admin account (`admin@moodmanager.com` / `admin1234`).

5. **Run the development server**

   ```bash
   cd Web
   npm run dev
   ```

   Access the application at `http://localhost:3000` in your browser.

6. **Production Build** (Before deployment)

   ```bash
   cd Web
   npm run build
   npm start
   ```

### Admin Mode (Mock Mode)

In V1, you can test the full flow without a real database by logging in with the admin account:

- **Email**: `admin@moodmanager.com`
- **Password**: `admin1234`

In Admin Mode:
- Create/delete devices with mock data
- Manage mood sets based on localStorage
- Make actual LLM calls (if API key is provided)

### Production Deployment

For production environments, ensure the following:

1. **Environment Variables**: All required environment variables are set
2. **Database**: PostgreSQL connection and migration completed
3. **Security**: `NEXTAUTH_SECRET` is set to a strong random string
4. **HTTPS**: Production environments must use HTTPS (set `NEXTAUTH_URL` to HTTPS as well)

## Additional Resources

- **Deployed Demo**: [moodmanager](https://moodmanager.me)
