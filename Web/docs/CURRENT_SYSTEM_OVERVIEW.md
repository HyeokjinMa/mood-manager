## Mood Manager – Next Steps Only (V2 기준, 구현 완료 내용 제거 버전)

> 이 문서는 **“이미 구현된 설계/설명”을 모두 제거하고**,  
> **지금부터 해야 할 일만** 순서대로 정리한 로드맵입니다.  
> 각 번호를 기준으로 “이거부터 진행해줘”라고 지시하시면 됩니다.

---

### 1. 바로 다음에 할 핵심 Value-up 작업 (순서대로)

#### 1-1. 하트 더블클릭 선호도 → LLM/추천에 실제 반영

1. **DB 쿼리 확인 (you)**
   - `GenrePreference`, `ScentPreference` 테이블에 현재까지 쌓인 `weight` 값이 제대로 증가하고 있는지 쿼리로 확인.
   - admin 계정으로 여러 번 더블클릭 후, 장르/향별 weight 변화 확인.
2. **LLM 입력에 선호도 가중치 반영 (ai)**
   - `src/lib/llm/prepareLLMInput.ts`:
     - 현재 event/weather/emotion 등을 모으는 로직에,
     - `genrePreferences`, `scentPreferences` 형태로 **정규화된 가중치 배열**을 추가.
   - `optimizePrompt.ts`:
     - “선호도가 높은 장르/향을 우선적으로 포함하되, 100% 고정은 하지 않는다”는 문구와 예시를 prompt에 명시.
3. **추천/스트림 로직에서 실제 사용 (ai)**
   - `streamHandler` 혹은 LLM 결과 후처리 단계에서:
     - 후보 음악/향 리스트를 생성할 때,  
       `weight` 기반으로 **샘플링 확률을 조정** (예: softmax or 단순 비례) 하는 로직 추가.

> 이 단계가 끝나면 “하트 더블클릭 → DB 가중치 증가 → LLM/추천에서 실제로 더 자주 선택” 흐름이 완성됩니다.

---

#### 1-2. `/api/moods/current` – “실데이터 우선 + 목업은 실패 시에만” 구조로 정리

1. **현재 구현 상태 점검 (ai)**
   - `/api/moods/current`가 지금은 `getMockMoodStream()` 중심인 구조인지 확인. (현재 상태)
2. **1차 목표: 일반 유저에 대해 “실데이터 시도 → 실패 시 mock” 구조 추가 (ai)**
   - 조건: DB에 사용자의 Preset/선호도 등이 존재하면:
     - 해당 정보를 기반으로 **간단한 실데이터 스트림(예: Preset 기반 10세그먼트)** 를 우선 생성 시도.
   - 실패 조건 (DB 없음, 쿼리 에러, 데이터 부족 등)에서만 `getMockMoodStream()`으로 fallback.
3. **관리자(mock) 계정은 그대로 목업 스트림 유지 (ai)**
   - `checkMockMode(session)` 가 true 인 경우:
     - 지금처럼 `getMockMoodStream()` 을 그대로 사용 (데모/완성 플로우 유지).
4. **로그/테스트 포인트 (ai + you)**
   - `/api/moods/current`에서:
     - “실데이터 경로를 탔는지 / mock fallback을 탔는지”를 한 줄 로그로 남겨,  
       EC2에서 어떤 비율로 어떤 경로를 타는지 바로 알 수 있게 한다. (ai: 로그 포인트 코드 추가, you: EC2에서 실제 로그 확인)

---

### 2. 리소스/콘텐츠 – 내가 직접 준비해야 할 것

#### 2-1. 태그별 더미 음악 파일 준비 (특히 admin용 크리스마스 콜드스타트)

1. **폴더 구조 (you)**
   - `Web/public/music/{tag}/{index}.mp3` 형태 권장:
     - 예:  
       - `public/music/newage/newage_01.mp3` ~ `newage_10.mp3`  
       - `public/music/christmas_carol/carol_01.mp3` ~ `carol_10.mp3`
   - 앨범 이미지는:
     - `public/images/music/{tag}/{basename}.jpg` 형식 권장  
       - 예: `public/images/music/christmas_carol/carol_01.jpg`
2. **우선순위 태그 (you)**
   - **일반 무드용**: `newage`, `classical`, `jazz`, `focus`, `sleep`, `relax` 등.
   - **이벤트용(특히 admin 크리스마스 콜드스타트)**: `christmas_carol` (최소 10곡), 이후 `newyear_celebration`, `halloween`, `valentine`.
3. **메타데이터 수집 형식 (you)**
   - 하나의 JSON 파일로 관리 권장:
     - 예: `Web/config/tracks.christmas_carol.json`
   - 구조 예시:
     ```json
     [
       {
         "id": "carol_01",
         "file": "/music/christmas_carol/carol_01.mp3",
         "title": "Song Title",
         "artist": "Artist Name",
         "tags": ["christmas_carol", "k-pop", "ballad"],
         "albumImage": "/images/music/christmas_carol/carol_01.jpg"
       }
     ]
     ```
   - 실제로는 **mp3, 제목, 아티스트명, 장르/이벤트 태그, 앨범이미지 경로**만 있으면 충분하며,  
     BPM이나 세부 mood 태그는 선택 사항.
4. **매핑 규칙 정의 (ai)**
   - 코드 쪽 (예: `musicMapping.ts` 또는 LLM 결과 해석 단계)에서:
     - `music.genre === "christmas_carol"` 또는 크리스마스 이벤트 + admin 초기 3세그먼트인 경우:
       - 위 JSON에서 3곡씩 선택해 **첫 3세그먼트를 크리스마스 스트림으로 고정**.
     - 실제 스트리밍(Spotify/YouTube Music)은 V2-M2 이후로 미룸.

---

#### 2-2. 디바이스/라즈베리파이 연동을 위한 “출력 스펙” 정의

1. **라즈베리파이로 보낼 공통 JSON 포맷 (ai)**
   - 예시(1 세그먼트 단위):
   ```json
   {
     "segmentId": "string",
     "moodName": "string",
     "color": "#RRGGBB",
     "brightness": 0-100,
     "scent": {
       "type": "Floral|Marine|...",
       "level": 1-10,
       "durationSec": 0-600
     },
     "music": {
       "fileUrl": "/music/...",
       "volume": 0-100
     }
   }
   ```
2. **라즈베리파이 측 역할 (you)**
   - 위 JSON을 받아:
     - Wiz 조명 API 호출 (색/밝기 적용),
     - 로컬 스피커에 `fileUrl` 재생,
     - 향 디바이스(릴레이/시리얼) 제어.
3. **Web → RaspberryPi 브리지 (ai)**
   - Web 서버에서:
     - `POST /api/devices/execute-preset` 같은 엔드포인트를 정의하고,
     - 내부에서 라즈베리파이 HTTP 엔드포인트(예: `http://raspi.local:5001/apply-mood`)에 위 JSON을 그대로 전달.
   - 이 부분은 **V2 후반~V3**에서 실제 구현, 지금은 **스펙만 확정**해 두면 됨.

---

### 3. LLM Output – Web UI vs 출력 디바이스용으로 어떻게 써야 하는지

#### 3-1. Web UI에서 실제로 필요한 필드

1. **MoodDashboard / /home (ai)**
   - `moodAlias` (표시용 이름)
   - `moodColor` (배경/카드 색)
   - `backgroundIcons` (ScentBackground용 아이콘 키 목록)
   - `musicTracks` (장르/태그 + 표시용 제목)
   - `scentProfile` (향 타입 + 레벨)
   - `lightProfile` (색/밝기/온도)
   - `eventContext` (있다면, 어떤 이벤트인지 정도만)
2. **/mood (프리셋 그리드) (ai)**
   - 위의 조합에서 “저장 가능한 최소 단위”로  
     `name + fragranceId + lightId + soundId + cluster` 정도만 사용.

#### 3-2. 출력 디바이스용으로 필요한 최소 필드

1. **조명 (Wiz 등) (ai)**
   - `colorHex` (또는 RGB), `brightness`, `temperature`
2. **향 디바이스 (ai)**
   - `scentType`, `scentLevel`, `sprayDurationSec`, `intervalSec`
3. **음악 (ai + you)**
   - `fileUrl` 또는 외부 스트리밍 service용 `trackId`
4. **매핑 전략 (ai)**
   - LLM은 “추상적인 무드/컬러/태그” 수준까지만 책임지고,
   - Web/백엔드에서:
     - “이 컬러 태그 → Wiz 색상 값”,
     - “이 scentType → 실제 디바이스 카트리지/슬롯 번호”  
     등을 **명시적인 매핑 테이블**로 관리.

---

### 4. Web을 “앱처럼” 만들기 – 배포 단계별 정리

#### 4-1. PWA(Progressive Web App)로 만들기

1. **필수 파일 추가 (you)**
   - `public/manifest.json`:
     - `name`, `short_name`, `start_url`, `icons[]`, `display: "standalone"` 등 설정.
   - `public/icons/*`:
     - 192×192, 512×512 등 PWA 아이콘 세트 준비.
2. **Next.js 설정 (ai)**
   - `_document` 또는 `layout.tsx`에:
     - `<link rel="manifest" href="/manifest.json" />`
     - `<meta name="theme-color" content="#000000" />` 등 추가.
3. **서비스 워커 (ai)**
   - V2 단계에서는 **오프라인 전체 캐시까지는 가지 않고**,  
     “기본 PWA 설치 + 아이콘/스플래시만” 먼저 목표로 잡는다.

#### 4-2. 스토어에 올릴 네이티브 “앱 쉘”

1. **선택지 A – Capacitor (you)**
   - Capacitor 프로젝트를 만들고, WebView 시작 URL을 `https://moodmanager.me` 로 설정.
   - iOS/Android에서:
     - 앱 이름/아이콘/스플래시를 정의하고,
     - 푸시/로컬 파일 재생 등이 필요하면 플러그인으로 확장.
2. **선택지 B – Expo + WebView (you)**
   - React Native + Expo로 최소한의 `WebView` 앱을 만든 후, 같은 URL을 로드.
3. **언제 이걸 할지 (you)**
   - V2 웹 경험이 충분히 안정화된 후,
   - “데모/테스트용 앱”이 필요해질 때 위 두 방법 중 하나를 선택.

---

### 5. 요약 – 지금부터 진행 순서 제안

1. **(1-1)** 하트 선호도 → LLM/추천 가중치 연동 마무리.
2. **(1-2)** `/api/moods/current` 를 “실데이터 우선 + mock fallback” 구조로 일반 유저까지 확장.
3. **(2-1)** 태그별 더미 음악 파일(특히 admin용 크리스마스 콜드스타트용) 준비 및 매핑 코드 정리.
4. **(2-2, 3-2)** 라즈베리파이/디바이스 출력 스펙을 이 문서 기준으로 고정.
5. **(4-1)** PWA 설정으로 “홈 화면에 추가 → 앱처럼 실행”까지 열어두고,
6. 필요 시 **(4-2)** Capacitor/Expo 기반 앱 쉘을 별도 리포지토리에서 준비.

> 위 순서 중 **어떤 번호부터 실제 구현을 시작할지** 알려주시면,  
> 해당 단계의 코드 변경 + 추가 문서 보완을 바로 진행하겠습니다.


