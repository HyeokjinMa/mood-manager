#!/usr/bin/env python3
"""
발표용 실시간 데이터 생성 스크립트

로컬에서 1분 간격으로 periodic과 events 데이터를 생성하여 Firestore에 전송합니다.
발표 중 실시간 처리 데모를 위한 용도입니다.

사용법:
    python generate_demo_data.py --interval 60  # 60초(1분) 간격
    python generate_demo_data.py --interval 30  # 30초 간격 (더 빠른 데모)
    python generate_demo_data.py --duration 10  # 10분간 실행

환경 변수:
    GOOGLE_APPLICATION_CREDENTIALS: Firebase 서비스 계정 키 JSON 파일 경로
    FIRESTORE_USER_ID: 사용자 ID (기본값: "testUser")
"""

import os
import time
import argparse
import base64
import random
from datetime import datetime
from typing import Dict, Any

try:
    import firebase_admin
    from firebase_admin import credentials, firestore
except ImportError:
    print("ERROR: firebase_admin 모듈이 설치되지 않았습니다.")
    print("다음 명령어로 설치하세요: pip install firebase-admin")
    exit(1)


# Firebase 초기화
def init_firebase():
    """Firebase Admin SDK 초기화"""
    if not firebase_admin._apps:
        cred_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
        if not cred_path:
            print("ERROR: GOOGLE_APPLICATION_CREDENTIALS 환경 변수를 설정하세요.")
            print("예: export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json")
            exit(1)
        
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
    
    return firestore.client()


# 더미 오디오 데이터 생성 (Base64)
def generate_dummy_audio_base64() -> str:
    """더미 WAV 오디오를 Base64로 생성 (2초, 16kHz, 16bit)"""
    # 실제로는 실제 오디오 파일을 읽거나, 간단한 더미 바이트를 생성
    # 여기서는 더미 데이터를 생성합니다
    dummy_wav_bytes = b"RIFF" + b"\x00" * 44  # 간단한 더미 WAV 헤더
    return base64.b64encode(dummy_wav_bytes).decode('utf-8')


# Periodic 데이터 생성
def generate_periodic_data() -> Dict[str, Any]:
    """주기적 생체 신호 데이터 생성"""
    return {
        "timestamp": firestore.SERVER_TIMESTAMP,
        "heartRate": random.randint(60, 100),
        "hrv": round(random.uniform(20.0, 80.0), 2),
        "stress": random.randint(0, 100),
        "temperature": round(random.uniform(35.5, 37.5), 1),
        "movement": random.randint(0, 10),
    }


# Event 데이터 생성
def generate_event_data(event_type: str = None) -> Dict[str, Any]:
    """오디오 이벤트 데이터 생성
    
    ML 서버에서 사용하지 않는 필드(event_dbfs, event_duration_ms, event_type_guess)는 제외합니다.
    """
    return {
        "audio_base64": generate_dummy_audio_base64(),
        "timestamp": firestore.SERVER_TIMESTAMP,
        "ml_processed": "pending",  # ML 처리 대기 상태
    }


def send_periodic_data(db: firestore.Client, user_id: str):
    """Periodic 데이터를 Firestore에 전송"""
    data = generate_periodic_data()
    doc_ref = (
        db.collection("users")
        .document(user_id)
        .collection("raw_periodic")
        .document()
    )
    doc_ref.set(data)
    print(f"[{datetime.now().strftime('%H:%M:%S')}] Periodic 데이터 전송: HR={data['heartRate']}, Stress={data['stress']}")


def send_event_data(db: firestore.Client, user_id: str):
    """Event 데이터를 Firestore에 전송"""
    data = generate_event_data()
    doc_ref = (
        db.collection("users")
        .document(user_id)
        .collection("raw_events")
        .document()
    )
    doc_ref.set(data)
    print(f"[{datetime.now().strftime('%H:%M:%S')}] Event 데이터 전송: ml_processed={data['ml_processed']}")


def main():
    parser = argparse.ArgumentParser(description="발표용 실시간 데이터 생성 스크립트")
    parser.add_argument(
        "--interval",
        type=int,
        default=60,
        help="데이터 생성 간격 (초 단위, 기본값: 60초)",
    )
    parser.add_argument(
        "--duration",
        type=int,
        default=0,
        help="실행 시간 (분 단위, 0이면 무한 실행, 기본값: 0)",
    )
    parser.add_argument(
        "--user-id",
        type=str,
        default=None,
        help="Firestore 사용자 ID (기본값: testUser 또는 FIRESTORE_USER_ID 환경 변수)",
    )
    parser.add_argument(
        "--events-only",
        action="store_true",
        help="Events 데이터만 생성 (Periodic 제외)",
    )
    parser.add_argument(
        "--periodic-only",
        action="store_true",
        help="Periodic 데이터만 생성 (Events 제외)",
    )
    
    args = parser.parse_args()
    
    # 사용자 ID 설정
    user_id = args.user_id or os.getenv("FIRESTORE_USER_ID", "testUser")
    
    # Firebase 초기화
    print("Firebase 초기화 중...")
    db = init_firebase()
    print(f"✅ Firebase 연결 완료 (User ID: {user_id})")
    
    # 설정 출력
    interval_str = f"{args.interval}초" if args.interval < 60 else f"{args.interval // 60}분"
    duration_str = f"{args.duration}분" if args.duration > 0 else "무한"
    print(f"\n📊 설정:")
    print(f"  - 생성 간격: {interval_str}")
    print(f"  - 실행 시간: {duration_str}")
    print(f"  - Periodic: {'제외' if args.events_only else '포함'}")
    print(f"  - Events: {'제외' if args.periodic_only else '포함'}")
    print(f"\n🚀 데이터 생성 시작... (Ctrl+C로 중지)\n")
    
    start_time = time.time()
    duration_seconds = args.duration * 60 if args.duration > 0 else float('inf')
    count = 0
    
    try:
        while time.time() - start_time < duration_seconds:
            count += 1
            
            # Periodic 데이터 전송
            if not args.events_only:
                send_periodic_data(db, user_id)
            
            # Event 데이터 전송 (periodic과 동시에)
            if not args.periodic_only:
                # 랜덤하게 1~2개의 이벤트 생성
                event_count = random.randint(1, 2)
                for _ in range(event_count):
                    send_event_data(db, user_id)
            
            # 다음 생성까지 대기
            if count < duration_seconds / args.interval or duration_seconds == float('inf'):
                time.sleep(args.interval)
            
    except KeyboardInterrupt:
        print("\n\n⏹️  사용자에 의해 중지되었습니다.")
    
    elapsed = time.time() - start_time
    print(f"\n✅ 완료: 총 {count}회 데이터 생성 (실행 시간: {elapsed/60:.1f}분)")


if __name__ == "__main__":
    main()

