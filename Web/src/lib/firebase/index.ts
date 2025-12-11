/**
 * Firebase 관련 모듈
 * 
 * Phase 3 리팩토링: firebase.ts를 firebase/index.ts로 변경
 * 
 * Firebase Client SDK와 Admin SDK를 분리하여 관리
 */

// Firebase Client SDK (브라우저/Route Handler용)
export { app, db } from "./client";

// Firebase Admin SDK (서버 전용)
export { adminDB } from "./admin";

