# Mood Manager - Wear OS

**무드매니저(Mood Manager)** 프로젝트의 Wear OS 데이터 수집 앱입니다.

Health Services API와 AudioRecord를 통해 사용자의 생체 신호(심박수, HRV, 스트레스 지표)와 음성 이벤트(웃음/한숨)를 수집하여 **Firebase Firestore**로 전송합니다.

---

## 🛠️ 기술 스택

- **Language**: Kotlin
- **Platform**: Android / Wear OS SDK
- **Min SDK**: 30 (Android 11)
- **Target SDK**: 36 (Android 15)
- **Key APIs/SDKs**:
  - Firebase SDK (Firestore, Storage)
  - Health Services API
  - AudioRecord API
- **Background**: ForegroundService (1분 주기 데이터 수집)

---

## 📁 프로젝트 구조

```
apps/watch/
├── app/
│   ├── src/main/
│   │   ├── java/com/moodmanager/watch/presentation/
│   │   │   ├── MainActivity.kt          # 메인 액티비티
│   │   │   ├── PeriodicDataService.kt  # 주기적 생체 데이터 수집 서비스
│   │   │   ├── AudioEventService.kt     # 오디오 이벤트 수집 서비스
│   │   │   ├── FirebaseViewModel.kt    # Firestore 데이터 전송 로직
│   │   │   └── theme/Theme.kt          # UI 테마
│   │   ├── res/                        # 리소스 파일
│   │   └── AndroidManifest.xml        # 앱 매니페스트
│   ├── google-services.json           # Firebase 설정 파일 (Git 제외)
│   └── build.gradle.kts               # 앱 빌드 설정
├── build.gradle.kts                   # 프로젝트 빌드 설정
└── README.md                          # 이 파일
```

---

## 🔧 설정

### 1. Firebase 설정

1. [Firebase Console](https://console.firebase.google.com/)에서 프로젝트 생성 또는 기존 프로젝트 선택
2. Android 앱 추가:
   - 패키지 이름: `com.moodmanager.watch`
   - 앱 닉네임: `Mood Manager Watch`
3. `google-services.json` 파일 다운로드
4. `app/google-services.json.example` 파일을 참고하여 실제 `app/google-services.json` 파일 생성
   - 또는 다운로드한 파일을 `app/` 폴더에 직접 배치

> ⚠️ **주의**: `google-services.json` 파일은 민감한 정보(API 키)를 포함하므로 Git에 커밋하지 마세요.  
> `.gitignore`에 이미 제외되어 있으며, `google-services.json.example` 파일을 참고하세요.

### 2. 로컬 설정

`local.properties` 파일은 자동으로 생성되며, Android SDK 경로를 포함합니다.  
이 파일은 Git에 커밋되지 않습니다 (`.gitignore`에 제외됨).

### 3. 권한 설정

앱은 다음 권한을 요청합니다:
- **인터넷**: Firestore 데이터 전송
- **마이크**: 오디오 이벤트 수집 (`RECORD_AUDIO`)
- **생체 센서**: Health Services API 사용 (`BODY_SENSORS`)
- **Health Services**: 심박수, HRV, 호흡수, 수면 데이터 읽기
- **포그라운드 서비스**: 백그라운드 데이터 수집

권한은 런타임에 자동으로 요청됩니다.

---

## 🚀 빌드 및 실행

### 필수 요구사항

- **Android Studio**: Otter | 2025.2.1 이상 권장
- **JDK**: 17 이상
- **Wear OS 에뮬레이터** 또는 **실제 Wear OS 기기**

### 빌드 단계

1. **프로젝트 열기**
   ```bash
   # Android Studio에서 apps/watch 폴더 열기
   ```

2. **Gradle 동기화**
   - Android Studio에서 자동으로 동기화되거나
   - `File > Sync Project with Gradle Files` 클릭

3. **Firebase 설정 확인**
   - `app/google-services.json` 파일이 존재하는지 확인
   - 파일이 없으면 Firebase Console에서 다운로드

4. **빌드 및 실행**
   - Wear OS 에뮬레이터 또는 실제 기기 선택
   - `Run > Run 'app'` 또는 `Shift + F10`

---

## 📊 데이터 구조

### Firestore Collection 구조

```
users/
└── {userId}/
    ├── raw_periodic/    # 주기적 생체 데이터 (1분 간격)
    └── raw_events/      # 오디오 이벤트 (웃음/한숨)
```

### 1. raw_periodic (주기적 생체 데이터)

**수집 주기**: 1분  
**수집 서비스**: `PeriodicDataService`  
**문서 ID**: 타임스탬프(ms) 문자열

#### 데이터 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `timestamp` | number | Unix 타임스탬프 (ms) |
| `heart_rate_avg` | number | 평균 심박수 (bpm) |
| `heart_rate_min` | number | 최소 심박수 (bpm) |
| `heart_rate_max` | number | 최대 심박수 (bpm) |
| `hrv_sdnn` | number | 심박 변이도 (SDNN) |
| `respiratory_rate_avg` | number | 평균 호흡수 (회/분) |
| `movement_count` | number | 움직임 감지 횟수 |
| `is_fallback` | boolean | 센서 실측 여부 플래그 |

#### 예시 경로
```
users/testUser/raw_periodic/1763532000123
```

### 2. raw_events (오디오 이벤트)

**수집 주기**: 1분마다 2초 녹음  
**수집 서비스**: `AudioEventService`  
**저장 조건**: 유효한 이벤트만 저장 (무음/unknown 제외)  
**자동 생성**: 1시간 동안 이벤트가 없으면 더미 데이터 1개 자동 생성

#### 데이터 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `timestamp` | number | 이벤트 발생 시간 (Unix ms) |
| `event_type_guess` | string | `"laughter"` / `"sigh"` / `"unknown"` |
| `event_dbfs` | number | 상대 음량 (0-100) |
| `event_duration_ms` | number | 이벤트 지속 시간 (보통 2000ms) |
| `audio_base64` | string? | Base64 인코딩된 WAV 오디오 (무음 시 null) |
| `is_fallback` | boolean | 휴리스틱 기반 추정 여부 |

#### 예시 경로
```
users/testUser/raw_events/autoDocId12345
```

---

## 🎵 오디오 포맷

### WAV (Base64) 포맷

WearOS는 다음 설정으로 오디오를 녹음합니다:

- **포맷**: PCM 16bit
- **채널**: Mono (단일 채널)
- **샘플 레이트**: 8000 Hz
- **인코딩**: WAV 헤더 + PCM body를 Base64로 인코딩

### Python 디코딩 예시

```python
import base64
import io
import soundfile as sf

def decode_base64_wav(base64_str):
    """Base64 WAV 문자열을 numpy 배열로 디코딩"""
    wav_bytes = base64.b64decode(base64_str)
    audio, samplerate = sf.read(io.BytesIO(wav_bytes))
    return audio, samplerate

# 사용 예시
doc = firestore_doc  # Firestore 문서
if doc.get("audio_base64"):
    audio, sr = decode_base64_wav(doc["audio_base64"])
    # ML 모델에 바로 사용 가능
    prediction = model(audio, sr)
```

---

## 🔄 데이터 수집 프로세스

### 1. 주기적 생체 데이터 (PeriodicDataService)

```
1분 주기 루프
  ↓
Health Services API에서 데이터 수집
  ↓
Firestore에 raw_periodic 컬렉션에 추가 (add)
  ↓
다음 주기 대기
```

### 2. 오디오 이벤트 (AudioEventService)

```
1분 주기 루프
  ↓
AudioRecord로 2초 녹음
  ↓
RMS/dBFS 계산하여 무음 필터링
  ↓
유효한 이벤트만 Firestore에 저장
  ↓
1시간 이벤트 없으면 더미 데이터 1개 생성
  ↓
다음 주기 대기
```

---

## 📝 주요 컴포넌트

### MainActivity.kt
- 앱의 메인 액티비티
- 앱 시작 시 포그라운드 서비스 시작

### PeriodicDataService.kt
- **역할**: 주기적 생체 데이터 수집
- **주기**: 1분
- **데이터**: 심박수, HRV, 호흡수, 움직임
- **전송**: `users/{userId}/raw_periodic` 컬렉션

### AudioEventService.kt
- **역할**: 오디오 이벤트 수집 (웃음/한숨)
- **주기**: 1분마다 2초 녹음
- **필터링**: 무음/unknown 제외
- **전송**: `users/{userId}/raw_events` 컬렉션

### FirebaseViewModel.kt
- **역할**: Firestore 데이터 전송 로직
- **기능**: 
  - `sendDummyPeriodicData()`: 더미 생체 데이터 전송
  - `sendDummyAudioEvent()`: 더미 오디오 이벤트 전송
  - 실제 서비스에서는 Health Services API와 AudioRecord에서 수집한 데이터를 전송

---

## 🔗 연동 정보

### Next.js 웹앱 연동

WearOS 앱이 전송한 데이터는 Next.js 웹앱에서 다음과 같이 처리됩니다:

1. **raw_periodic 데이터**:
   - 스트레스 지수 계산
   - 수면 패턴 분석
   - 심박수 변화 추적

2. **raw_events 데이터**:
   - ML 서버로 전송하여 웃음/한숨 분류
   - 감정 타임라인 구성
   - 무드 추론에 활용

### ML 서버 연동

- ML 서버는 `raw_events` 컬렉션의 `audio_base64` 데이터를 가져와 분류
- 분류 결과를 Next.js 웹앱으로 전송

---

## ⚠️ 주의사항

### 데이터 저장 규칙

| 항목 | 규칙 |
|------|------|
| 오디오 unknown | 저장하지 않음 |
| 무음 | 저장하지 않음 |
| 실제 이벤트 발생 | 저장 |
| 1시간 이벤트 없음 | 랜덤 더미 1개 생성 |
| Base64 WAV | ML에서 다시 WAV로 디코딩 가능 |
| Firestore 경로 | 반드시 `users/{userId}/raw_events` |

### 보안

- `google-services.json` 파일은 Git에 커밋하지 마세요
- `local.properties` 파일은 Git에 커밋하지 마세요
- Firebase API 키가 노출되지 않도록 주의하세요

---

## 📚 참고 자료

- [메인 프로젝트 README](../README.md)
- [프로젝트 구조 문서](../../docs/PROJECT_STRUCTURE.md)
- [API 명세서](../../docs/API_SPEC.md)
- [Firebase 문서](https://firebase.google.com/docs)
- [Health Services API](https://developer.android.com/guide/health-and-fitness/health-services)

---

## 🐛 문제 해결

### 빌드 오류

1. **Gradle 동기화 실패**
   - `File > Invalidate Caches / Restart` 실행
   - `./gradlew clean` 실행 후 다시 빌드

2. **google-services.json 누락**
   - Firebase Console에서 파일 다운로드
   - `app/` 폴더에 배치

### 런타임 오류

1. **권한 거부**
   - 앱 설정에서 권한 수동 허용
   - 또는 앱 재설치 후 권한 재요청

2. **Firestore 연결 실패**
   - 인터넷 연결 확인
   - Firebase 프로젝트 설정 확인
   - `google-services.json` 파일 확인

---

## 📄 라이선스

본 프로젝트는 메인 프로젝트의 라이선스를 따릅니다.
