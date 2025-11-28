// src/lib/firebase/admin.ts
/**
 * [파일 역할]
 * - Firebase Admin SDK를 초기화하여
 *   서버 환경에서 Firestore에 관리자 권한으로 접근할 수 있도록 하는 파일입니다.
 *
 * [사용되는 위치]
 * - 서버 전용 배치 작업 / DB 마이그레이션 / 백엔드에서 강력한 Firestore 조작 필요 시
 *
 * [주의사항]
 * - 브라우저에서는 절대 import 불가
 * - 서비스 계정 키(Firebase Admin)은 민감한 정보이므로 환경변수로 제공해야 함
 *
 * [현재 프로젝트에서는?]
 * - 실시간 스트림(onSnapshot)은 Firebase Client SDK로 처리하므로
 *   Admin SDK는 지금은 거의 사용되지 않음
 */

import * as admin from "firebase-admin";

if (!admin.apps.length) {
  const credentialsEnv = process.env.FIREBASE_ADMIN_CREDENTIALS;
  if (!credentialsEnv) {
    throw new Error(
      "Missing required environment variable: FIREBASE_ADMIN_CREDENTIALS"
    );
  }

  let credentials;
  try {
    credentials = JSON.parse(credentialsEnv);
  } catch (error) {
    throw new Error(
      `Invalid FIREBASE_ADMIN_CREDENTIALS format: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }

  admin.initializeApp({
    credential: admin.credential.cert(credentials),
  });
}

export const adminDB = admin.firestore();
