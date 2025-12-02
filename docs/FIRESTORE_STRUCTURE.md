# Firestore 데이터 구조 명세

## Overview

Firestore는 WearOS 디바이스와 ML 서버, Web 앱 간의 실시간 데이터 브리지 역할을 합니다.

## 컬렉션 구조

### 1. `users/{userId}/raw_periodic/{docId}`

생체 신호 데이터 (주기적 수집)

**필드:**
- `timestamp`: UNIX timestamp 또는 ISO 8601
- `heartRate`: 심박수 (bpm)
- `hrv`: HRV 지표
- `stress`: 스트레스 지수
- 기타 생체 신호 필드...

### 2. `users/{userId}/raw_events/{docId}`

오디오 이벤트 데이터 (이벤트 기반 수집)

**필드:**

#### 필수 필드
- `audio_base64`: Base64로 인코딩된 WAV 오디오 데이터 (문자열)
- `timestamp`: UNIX timestamp 또는 ISO 8601 (문자열 또는 숫자)
- `ml_processed`: ML 처리 상태 (문자열)
  - `"pending"`: ML 처리가 필요한 상태
  - `"processing"`: 현재 ML 처리 중
  - `"completed"`: ML 처리 완료
  - `"failed"`: ML 처리 실패

#### 삭제된 필드 (ML에서 사용하지 않으므로 WearOS에서 전송하지 않음)
다음 필드들은 **ML 서버에서 사용하지 않으므로 WearOS에서 전송하지 않습니다**:
- ~~`event_dbfs`~~ (삭제됨)
- ~~`event_duration_ms`~~ (삭제됨)
- ~~`event_type_guess`~~ (삭제됨)

**참고:** `is_fallback` 필드는 필요시 유지 가능하나, ML 처리에는 사용되지 않습니다.

## ML 서버 데이터 처리 플로우

### 1. 데이터 수집 (Python ML 서버)

```python
# 처리되지 않은 이벤트만 조회
docs = db.collection("users").document("testUser").collection("raw_events").where('ml_processed', '==', 'pending').stream()
```

### 2. ML 처리

1. `audio_base64` 디코딩
2. 오디오 분류 (Laughter, Sigh, Negative 등)
3. 결과 생성

### 3. 결과 업데이트

처리 완료 후 Firestore 문서 업데이트:

```python
doc.reference.update({
    'ml_processed': 'completed',
    'ml_result': 'Laughter',  # 또는 'Sigh', 'Negative' 등
    'ml_confidence': 0.92,  # 신뢰도 (0.0 ~ 1.0)
    'ml_processed_at': firestore.SERVER_TIMESTAMP
})
```

처리 실패 시:

```python
doc.reference.update({
    'ml_processed': 'failed',
    'ml_error': 'Error message',
    'ml_processed_at': firestore.SERVER_TIMESTAMP
})
```

## Web 앱 데이터 수신

Web 앱은 ML 처리 완료된 결과를 다른 경로로 수신합니다:

- `/api/ml/emotion-counts`: ML 서버에서 Web 앱으로 감정 카운트 전송
- 또는 Firestore에서 직접 읽기 (선택적)

## 마이그레이션 가이드

기존 `raw_events` 문서에 `ml_processed` 필드가 없는 경우:

```javascript
// Firestore 콘솔 또는 Cloud Functions에서 실행
const batch = firestore().batch();
const snapshot = await db.collection('users').doc('testUser').collection('raw_events').get();

snapshot.docs.forEach(doc => {
  if (!doc.data().ml_processed) {
    batch.update(doc.ref, { ml_processed: 'pending' });
  }
});

await batch.commit();
```

## 참고사항

- **미사용 필드 삭제**: `event_dbfs`, `event_duration_ms`, `event_type_guess` 필드는 ML 서버에서 사용하지 않으므로 WearOS에서 전송하지 않습니다.
- `ml_processed` 필드는 ML 서버의 처리 상태를 추적하는 데 필수적입니다.
- WearOS 앱 업데이트 시 해당 필드들을 제거해야 합니다.

## Firestore 연결 상태

- **Watch 앱 (WearOS)**: ✅ Firestore 연결됨 (`google-services.json` 설정 완료)
- **Web 앱 (Next.js)**: ❌ Firestore 연결 안 됨 (현재 TODO 상태, V1 Mock 모드 사용 중)
- **ML Python 서버**: ✅ Firestore 연결됨 (서비스 계정 키로 접근)

