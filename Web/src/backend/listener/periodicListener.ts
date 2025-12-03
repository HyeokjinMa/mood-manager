// src/backend/listener/periodicListener.ts
/**
 * [파일 역할]
 * - Firestore의 users/{userId}/raw_periodic 컬렉션을
 *   onSnapshot 으로 실시간 구독하는 리스너를 설정하는 파일입니다.
 *
 * [전체 파이프라인 연결 흐름]
 * 1) Next.js 서버가 시작될 때, 어딘가에서 startPeriodicListener()를 한 번 호출
 *    - 예: src/app/layout.tsx 또는 src/app/api/ai/chat/route.ts 시작 부분 등
 *
 * 2) startPeriodicListener()
 *    - 이미 시작된 상태인지 확인(중복 구독 방지)
 *    - Firestore client(db) 가져오기
 *    - collection("users", TEST_USER_ID, "raw_periodic")에 대해 onSnapshot 등록
 *
 * 3) onSnapshot 콜백
 *    - docChanges()를 순회하면서 "added" 타입 문서에 대해
 *      backend/jobs/preprocessPeriodic.ts 의 handleNewPeriodicDocument() 호출
 *
 * 4) handleNewPeriodicDocument()
 *    - 전처리 실행 → 캐시 저장
 *
 * [주의사항]
 * - 이 리스너는 "서버 프로세스에서 한 번만" 실행되어야 함
 *   → isListenerStarted 플래그로 중복 실행 방지
 * - Serverless 환경(Vercel)에서는 프로세스가 자주 죽었다 살아나므로
 *   이 구조는 "항상 켜져 있는 Node 서버" 전제에서 사용해야 함.
 */

import {
  collection,
  onSnapshot,
  QuerySnapshot,
  DocumentData,
  Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { handleNewPeriodicDocument } from "@/backend/jobs/preprocessPeriodic";

const TEST_USER_ID = "testUser";

let isListenerStarted = false; // 중복 시작 방지용 플래그
let unsubscribe: Unsubscribe | null = null; // 리스너 정리 함수
let reconnectAttempts = 0; // 재연결 시도 횟수
const MAX_RECONNECT_ATTEMPTS = 5; // 최대 재연결 시도 횟수
const INITIAL_RECONNECT_DELAY = 1000; // 초기 재연결 지연 시간 (ms)

/**
 * 지수 백오프를 사용한 재연결 지연 시간 계산
 */
function getReconnectDelay(attempt: number): number {
  return Math.min(INITIAL_RECONNECT_DELAY * Math.pow(2, attempt), 30000); // 최대 30초
}

/**
 * 리스너를 정리합니다.
 */
function cleanupListener() {
  if (unsubscribe) {
    try {
      unsubscribe();
      unsubscribe = null;
    } catch (error) {
      console.error("[periodicListener] 리스너 정리 중 오류:", error);
    }
  }
  isListenerStarted = false;
}

/**
 * 리스너를 재연결 시도합니다.
 */
function attemptReconnect() {
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    console.error(
      `[periodicListener] 최대 재연결 시도 횟수(${MAX_RECONNECT_ATTEMPTS})에 도달했습니다. 재연결을 중단합니다.`
    );
    return;
  }

  reconnectAttempts++;
  const delay = getReconnectDelay(reconnectAttempts - 1);

  console.log(
    `[periodicListener] ${delay}ms 후 재연결 시도 (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`
  );

  setTimeout(() => {
    cleanupListener();
    startPeriodicListener();
  }, delay);
}

export function startPeriodicListener() {
  if (isListenerStarted) {
    console.log("[periodicListener] 이미 리스너가 시작되어 있습니다. (중복 방지)");
    return;
  }

  if (!db) {
    console.warn(
      "[periodicListener] Firestore db 가 초기화되지 않았습니다. (Firebase 비활성화 모드) 리스너를 시작하지 않습니다."
    );
    return;
  }

  // 기존 리스너가 있으면 정리
  cleanupListener();

  isListenerStarted = true;
  reconnectAttempts = 0; // 성공적으로 시작되면 재연결 시도 횟수 리셋

  const colRef = collection(db, "users", TEST_USER_ID, "raw_periodic");

  console.log("[periodicListener] raw_periodic 스트림 구독 시작...");

  try {
    unsubscribe = onSnapshot(
      colRef,
      (snapshot: QuerySnapshot<DocumentData>) => {
        // 성공적으로 데이터를 받으면 재연결 시도 횟수 리셋
        reconnectAttempts = 0;

        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            // 새로 추가된 raw_periodic 문서에 대해 전처리 Job 실행
            void handleNewPeriodicDocument(change.doc);
          }
        });
      },
      (error) => {
        console.error("[periodicListener] Firestore onSnapshot 에러:", {
          code: error.code,
          message: error.message,
          stack: error.stack,
        });

        // 특정 에러 코드에 따라 처리
        // INTERNAL (13): 서버 내부 오류, 재연결 시도
        // UNAVAILABLE (14): 서비스 사용 불가, 재연결 시도
        // DEADLINE_EXCEEDED (4): 타임아웃, 재연결 시도
        const shouldReconnect =
          error.code === "internal" ||
          error.code === "unavailable" ||
          error.code === "deadline-exceeded" ||
          error.message?.includes("RST_STREAM") ||
          error.message?.includes("INTERNAL");

        if (shouldReconnect) {
          cleanupListener();
          attemptReconnect();
        } else {
          // 재연결하지 않아야 하는 에러 (예: 권한 오류)
          cleanupListener();
          console.error(
            "[periodicListener] 재연결하지 않는 에러입니다. 리스너를 중단합니다."
          );
        }
      }
    );
  } catch (error) {
    console.error("[periodicListener] 리스너 시작 중 예외 발생:", error);
    cleanupListener();
    attemptReconnect();
  }
}

/**
 * 리스너를 중지합니다.
 */
export function stopPeriodicListener() {
  cleanupListener();
  reconnectAttempts = 0;
  console.log("[periodicListener] 리스너가 중지되었습니다.");
}
