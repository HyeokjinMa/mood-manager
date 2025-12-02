# 발표용 실시간 데이터 생성 가이드

## 개요

발표 중 실시간 처리를 보여주기 위해 로컬에서 1분 간격으로 periodic과 events 데이터를 생성하여 Firestore에 전송하는 스크립트입니다.

## 전제 조건

1. **Firebase 서비스 계정 키**
   - Firebase Console → 프로젝트 설정 → 서비스 계정
   - "새 비공개 키 생성" 클릭하여 JSON 파일 다운로드
   - 환경 변수로 설정:
     ```bash
     export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"
     ```

2. **Python 환경**
   ```bash
   pip install firebase-admin
   ```

## 사용법

### 기본 사용 (1분 간격)

```bash
cd ML
python generate_demo_data.py
```

### 30초 간격 (더 빠른 데모)

```bash
python generate_demo_data.py --interval 30
```

### 10분간 실행

```bash
python generate_demo_data.py --duration 10
```

### Events만 생성

```bash
python generate_demo_data.py --events-only
```

### Periodic만 생성

```bash
python generate_demo_data.py --periodic-only
```

### 사용자 ID 지정

```bash
export FIRESTORE_USER_ID="demo-user-001"
python generate_demo_data.py
```

또는:

```bash
python generate_demo_data.py --user-id demo-user-001
```

## 생성되는 데이터

### Periodic 데이터 (`raw_periodic` 컬렉션)

- `timestamp`: 서버 타임스탬프
- `heartRate`: 60-100 bpm (랜덤)
- `hrv`: 20.0-80.0 (랜덤)
- `stress`: 0-100 (랜덤)
- `temperature`: 35.5-37.5°C (랜덤)
- `movement`: 0-10 (랜덤)

### Event 데이터 (`raw_events` 컬렉션)

- `audio_base64`: 더미 WAV 오디오 (Base64)
- `timestamp`: 서버 타임스탬프
- `ml_processed`: `"pending"` (ML 처리 대기)
- `event_dbfs`: -40.0 ~ -10.0 dBFS (ML 미사용)
- `event_duration_ms`: 1000-3000ms (ML 미사용)
- `event_type_guess`: "laughter", "sigh", "silence" 중 랜덤 (ML 미사용)
- `is_fallback`: `false`

## 발표 시나리오

### 시나리오 1: 정상 플로우

1. 스크립트 실행:
   ```bash
   python generate_demo_data.py --interval 60
   ```

2. Firestore 콘솔에서 데이터 확인:
   - `users/testUser/raw_periodic/` → 주기적 생체 신호 확인
   - `users/testUser/raw_events/` → `ml_processed: "pending"` 문서 확인

3. ML 서버가 처리 시작:
   - `ml_processed: "pending"` 문서 조회
   - 오디오 분류 수행
   - `ml_processed: "completed"` 로 업데이트

4. Web 앱에서 결과 확인:
   - `/api/preprocessing` 또는 `/api/ml/emotion-counts` 확인
   - 무드 대시보드에서 실시간 반영 확인

### 시나리오 2: 빠른 데모 (30초 간격)

```bash
python generate_demo_data.py --interval 30 --duration 5
```

5분간 30초마다 데이터 생성 → 총 10회 생성

### 시나리오 3: Events 중심 데모

```bash
python generate_demo_data.py --events-only --interval 60
```

Events만 생성하여 ML 처리 플로우에 집중

## 주의사항

1. **테스트 환경 사용 권장**
   - 프로덕션 Firestore에는 실행하지 마세요
   - 테스트 전용 Firebase 프로젝트 사용 권장

2. **데이터 중복**
   - 스크립트를 여러 번 실행하면 중복 데이터가 생성됩니다
   - 발표 전에 테스트 데이터 정리 권장:
     ```javascript
     // Firestore 콘솔에서 실행
     const batch = firestore().batch();
     const snapshot = await db.collection('users').doc('testUser').collection('raw_periodic').get();
     snapshot.docs.forEach(doc => batch.delete(doc.ref));
     await batch.commit();
     ```

3. **네트워크 연결**
   - 발표 중 인터넷 연결이 필수입니다
   - Firestore 접근 권한이 있는지 확인하세요

## 트러블슈팅

### "GOOGLE_APPLICATION_CREDENTIALS 환경 변수를 설정하세요" 오류

```bash
export GOOGLE_APPLICATION_CREDENTIALS="/absolute/path/to/service-account-key.json"
python generate_demo_data.py
```

### "firebase_admin 모듈이 설치되지 않았습니다" 오류

```bash
pip install firebase-admin
```

### 권한 오류

- Firebase 서비스 계정 키에 Firestore 읽기/쓰기 권한이 있는지 확인
- Firebase Console → IAM & Admin에서 권한 확인

## 참고

- 실제 오디오 파일을 사용하려면 `generate_dummy_audio_base64()` 함수를 수정하세요
- 더 현실적인 데이터를 생성하려면 각 필드의 랜덤 범위를 조정하세요

