// src/lib/firebase/client.ts
/**
 * [파일 역할]
 * - Next.js 클라이언트 환경(브라우저) 또는 Route Handler에서
 *   Firebase Client SDK를 초기화하는 파일입니다.
 *
 * [사용되는 위치]
 * - Firestore 실시간 구독(onSnapshot) 사용 시
 *   backend/listener/periodicListener.ts 에서 import
 *
 * [주의사항]
 * - Firebase Client SDK는 브라우저 전용 API를 포함하므로
 *   반드시 서버에서 쓰지 않아야 하는 경우 주의 필요
 */

import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Firebase 앱 인스턴스 (지연 초기화)
let appInstance: ReturnType<typeof initializeApp> | null = null;
let dbInstance: ReturnType<typeof getFirestore> | null = null;

// Firebase 초기화 함수 (지연 초기화)
function initializeFirebase() {
  if (appInstance) {
    return { app: appInstance, db: dbInstance! };
  }

  // 환경 변수 확인 (없으면 기본값 사용)
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "placeholder-api-key";
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "placeholder-auth-domain";
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "placeholder-project-id";
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "placeholder-app-id";

  // 환경 변수 기반 Firebase 설정
  const firebaseConfig = {
    apiKey,
    authDomain,
    projectId,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };

  // firebase 앱 중복 실행 방지
  appInstance = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  dbInstance = getFirestore(appInstance);

  return { app: appInstance, db: dbInstance };
}

// 지연 초기화된 Firebase 인스턴스 export
// 실제 사용 시점에 초기화됨
export const app = initializeFirebase().app;
export const db = initializeFirebase().db;
