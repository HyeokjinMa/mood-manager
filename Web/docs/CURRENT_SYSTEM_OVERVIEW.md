## Mood Manager - Current System Overview (V2 기준)

### 1. 사용자 유형 및 플로우

- **일반 사용자 계정**
  - 회원가입 시 DB에는 **User 레코드만 생성**되고, `Device / Preset / Preference` 는 비어 있는 상태로 시작한다.
  - `/home`:
    - 처음 진입 시 디바이스가 0개이면, **디바이스 카드 대신 “+ 카드(추가 버튼)”와 안내 텍스트만** 노출되는 것이 목표 상태다.
    - 사용자가 실제로 `manager / light / speaker / scent` 기기를 등록한 이후부터, 장치 타입과 우선순위(Manager > Light > Speaker > Scent)에 따라 UI와 로직이 작동한다.
  - `/mood`:
    - 저장된 `Preset`(별표/무드 저장)이 없으면, **완전히 빈 그리드 + “저장된 무드가 없습니다” 안내**만 보여준다.
    - 초기 무드는 LLM/ML 파이프라인에 의해 계산되어 대시보드/아이콘에 표시되지만, 이는 “출력 상태”이고, 디바이스 등록과는 분리된 개념으로 본다.

- **관리자 계정 (`admin@moodmanager.com`)**
  - 팀이 사전에 세팅한 **“한 명의 완성된 사용자 시나리오”** 역할을 한다.
  - 이 계정에는 DB에 다음이 미리 구성될 수 있다.
    - `Device`: manager / light / speaker / scent 구성 세트
    - `Preset`: 몇 가지 대표 무드, 즐겨찾기 무드
    - `ScentPreference / GenrePreference`: 적당한 예시 값
  - 실제 코드 경로는 일반 사용자와 동일하며, 단지 **데이터가 미리 채워져 있어서 완성된 경험을 보여주는 레퍼런스 유저**라는 점만 다르다.

### 2. 디바이스 구조와 우선순위

- **디바이스 타입**
  - `manager`: 가상의 통합 매니저(허브) 디바이스. 전체 무드 상태를 대표하는 출력 장치.
  - `light`: 스마트 조명 (예: Philips Wiz).
  - `speaker`: 블루투스/네트워크 스피커.
  - `scent`: 스마트 향 분사 장치.

- **핵심 규칙**
  - 디바이스는 **모두 사용자가 등록해야만 존재**하며, 자동 생성된 디바이스(특히 manager)는 사용하지 않는 방향으로 정리한다.
  - manager/light/speaker/scent 의 우선순위는 **“출력 레이어에서 상태를 어떻게 보여줄 것인가”**에만 의미가 있고,
    - DB 관점에서는 단순히 `Device.type` 값으로만 구분한다.
  - 매니저 디바이스는:
    - “무드/프리셋 계산의 전제 조건”이 아니라,
    - **“현재 무드 상태를 대표해서 보여주는 가상의 출력 장치”** 정도로만 의미를 둔다.
    - 무드/세그먼트/배경색/아이콘/LLM 결과는 **디바이스 유무와 상관없이 로직에 따라 생성되어 UI에 적용**된다.

### 3. 무드/프리셋과 대시보드

- **무드 생성**
  - `/api/moods/current` + `useMoodStream` + `streamHandler` 를 통해,
    - Firestore/ML/LLM/Python(마르코프) 입력을 기반으로 세그먼트(10개)를 생성한다.
  - 이 무드는:
    - 대시보드 카드 색상, ScentBackground, 음악/향/조명 아이콘 등 **UI 전반에 적용되는 “현재 상태”**이다.
    - 디바이스 존재 여부와는 분리된 개념이며, 디바이스는 이 상태를 어떻게 출력할지 결정하는 레이어다.

- **Preset / Mood 페이지**
  - `Preset` 은 “사용자가 저장한 무드 세트(향+조명+음악 조합)”를 의미한다.
  - `/mood` 페이지는:
    - DB의 `Preset` 중 사용자가 저장한 것(예: isStarred 등)을 **그리드(2x3) 형태로 보여주는 페이지**이다.
    - 새 계정은 기본적으로 Preset 0개 → 빈 상태가 정상이다.

### 4. ML / Emotion Counts 파이프라인

- **외부 ML (Lambda, Python)**
  - WearOS → Firestore(raw 데이터) → 외부 ML(Lambda) → Node Web 서버 순으로 흐른다.
  - ML 서버는 10분 단위(또는 배치 주기)마다:
    - 오디오 이벤트를 한숨/웃음/울음/오탐으로 판정하고,
    - `timestamp, result, confidence, userId?` 형식으로 여러 이벤트를 모아 보낼 수 있다.

- **우리 서버 엔드포인트**
  - `POST /api/ml/emotion-counts`
    - 헤더: `x-ml-api-key: ML_API_KEY` (환경변수 기반 검증)
    - 바디 형식:
      - 단일 이벤트:
        - `{ "timestamp": number, "result": "Laughter" | "Sigh" | "Crying" | "Negative", "confidence": number, "userId"?: string }`
      - 배치:
        - `{ "events": [ { ... }, { ... } ] }`
    - Node 측 로직:
      - `confidence < 70` 또는 잘못된 `result` 값은 무시.
      - 결과를 내부 카운트(`laughter / sigh / crying`) 로 매핑 후 `EmotionCountStore` 에 누적.

- **전처리 및 스트림 생성**
  - `/api/preprocessing`:
    - Firestore의 raw 데이터 + 수면 점수 + 날씨(KMA API) + `EmotionCountStore` 카운트들을 하나의 JSON 으로 조합.
  - `streamHandler`:
    - 이 JSON을 기반으로 Python 서버(PYTHON_SERVER_URL 설정 시)와 통신하거나,  
      Python이 없으면 LLM-only로 fallback 하여 세그먼트(10개)의 배경 파라미터를 생성.

### 5. 아이콘/디바이스 카드 UI 방침

- **디바이스 카드 아이콘 매핑 개선**
  - 목표:
    - 타입별 아이콘(전구/스피커/향기)과 상태/출력 아이콘이 겹치지 않도록 분리.
    - 가능한 한 **단순하고 일관된 outline 아이콘**을 사용하되,  
      너무 단조롭지 않게 약간의 다양성을 부여.
  - 방향:
    - 메인 타입 아이콘: `HiOutlineLightBulb`, `HiOutlineSpeakerWave`, `HiOutlineSparkles` 등.
    - 상태/보조 아이콘: 각 타입에 맞는 소형 아이콘 세트(예: 볼륨, 향 레벨, 조명 밝기 표시)를 별도로 매핑.
    - 색상:
      - 타입 아이콘은 기본적으로 중립 색상(회색)을 유지하되,
      - 활성 상태(전원 켜짐 + 현재 세그먼트와 연동)일 때만 **무드 컬러/파스텔**을 살짝 입히는 방식으로 정리.

- **향/음악/조명 태그 다양성**
  - 음악:
    - 장르/태그별 더미 트랙 10개를 만들어, LLM/세그먼트에서 내려오는 `music.genre` 에 매핑하는 구조를 V2에서 준비.
    - 실제 재생은 나중에(로컬 파일/Spotify/YouTube Music) 붙이고,  
      지금은 “장르별 다른 곡 이름/아이콘” 정도만으로도 데모 퀄리티를 끌어올린다.
  - 향:
    - `ScentBackground` + 디바이스 카드에서 향 타입별로 다른 아이콘/파티클 모양을 유지하고,  
      LvX/타이머 UI 를 통해 “향의 상태”를 더 명확히 표현.

### 6. 리팩토링 원칙 요약

1. **디바이스는 모두 사용자 등록 기반**  
   - 자동 생성된 manager/preset 로직 제거.
   - manager/light/speaker/scent 는 전부 사용자가 앱에서 추가했을 때만 DB에 생긴다.

2. **무드/세그먼트는 디바이스와 분리된 개념**  
   - ML/LLM/Python/Firestore/날씨/수면 데이터에 의해 생성되고,
   - 디바이스는 이 결과를 “어떻게 보여줄지/출력할지”만 담당한다.

3. **admin 계정은 하나의 완성된 사용자 시나리오**  
   - 실제 플로우와 같은 코드 경로를 타되, 데이터가 미리 채워져 있다.

4. **목업은 “실패/없음” 대비용만 유지**  
   - 요청 실패, 환경 변수 미설정, 데이터 없음 등의 상황에서만 `mockData` 사용.
   - 평상시에는 DB/ML/LLM/Firestore 실데이터를 우선 사용한다.

5. **문서는 이 파일 하나를 기준으로 최신 상태를 유지**  
   - 다른 계획/요약 문서(V2 계획, 벨류업 계획 등)는 이 개요와 충돌하지 않도록 유지하거나 정리한다.

---

### 7. 미구현 기능 및 페이즈별 구현 계획

#### 7.1 미구현 핵심 기능 요약

- **대시보드 하트 더블클릭(휘발성 선호도)**
  - 요구사항:
    - 무드 대시보드(현재 세그먼트 카드)를 **더블클릭**하면, 하트 애니메이션이 짧게 나타났다 사라진다.
    - 이 이벤트는 **해당 무드/세그먼트에 대한 “선호도 점수”를 증가**시키는 신호로 사용된다.
    - 선호도 점수는 향/장르 가중치(`ScentPreference / GenrePreference`) 또는 별도 테이블에 누적된다.
    - UI 상에서는 휘발성(하트는 바로 사라짐)이지만, 데이터는 축적되어 이후 추천/LLM/프리셋 제안에 반영된다.

- **무드 색상 전환 애니메이션(대각선 껍질 전환)**
  - 요구사항:
    - 세그먼트 전환 시, **우측 상단 → 좌측 하단** 방향으로 색상이 “껍질을 벗기듯” 서서히 바뀐다.
    - 특정 오브젝트가 지나가는 느낌이 아니라,
      - 예: 현재 배경이 노랑, 다음 배경이 주황이면
      - 노랑 표면 위로 주황이 대각선 방향으로 번져 나가면서 전체가 천천히 주황으로 물드는 느낌.
    - MoodDashboard / ScentBackground / DeviceCard 등 주요 컴포넌트가 이 전환에 동기화된다.

#### 7.2 Phase A – 하트 더블클릭(휘발성 선호도) 구현

- **Phase A1: 프론트엔드 제스처 & 애니메이션**
  - 무드 대시보드 카드에 더블클릭 핸들러 추가:
    - 단일 클릭(다른 액션)과 충돌하지 않도록 더블클릭 전용 처리.
  - 더블클릭 시:
    - 현재 세그먼트 중앙 또는 카드 상단에 **크게 하트 아이콘이 fade-in / scale-up 후 fade-out** 되도록 애니메이션 구현.
    - `useHeartAnimation` 훅 확장:
      - `triggerHeartBurst(segmentId: string)` → 하트 위치/투명도/스케일 상태 관리.
  - UI 특징:
    - 하트는 1~1.5초 이내에 사라져 “휘발성” 느낌.
    - 더블클릭 여러 번 시도해도 애니메이션이 자연스럽게 이어지도록 큐 또는 최소 쿨다운 적용.

- **Phase A2: 선호도 점수 데이터 모델링**
  - 옵션 1: 기존 `ScentPreference / GenrePreference` 에 누적:
    - 현재 세그먼트의 향 타입/장르를 바탕으로 해당 가중치(`weight`)에 +3 등 규칙을 추가.
    - 장점: 이미 존재하는 테이블 재사용, LLM/추천에 바로 연동 가능.
  - 옵션 2: 별도 `UserMoodPreference` 또는 `MoodLikeEvent` 테이블:
    - `userId`, `moodId(or presetId)`, `segmentId`, `timestamp`, `weight` 필드.
    - 정기 배치나 쿼리로 Scent/GenrePreference 로 통합 가능.
  - V2에서는 **Option 1(ScentPreference/GenrePreference에 직접 반영)** 을 우선 고려.

- **Phase A3: API 설계 및 구현**
  - 엔드포인트(예시):
    - `POST /api/moods/preference/like`
    - Body:
      - `{ moodId, musicGenre, scentType, segmentId, source: "double-tap" }`
  - 서버 로직:
    - `userId` 는 세션에서 추출.
    - 해당 장르/향에 대한 `GenrePreference / ScentPreference` 의 `weight` 를 +3 정도 증가.
    - 응답으로 현재 누적값/상태를 반환하거나, 단순 성공만 반환.
  - 에러/중복 처리:
    - 같은 세그먼트에 대해 너무 잦은 더블클릭은 rate limit(예: 10분당 N회) 정도로 제어.

- **Phase A4: LLM/추천과의 연동**
  - `prepareLLMInput` 또는 추천 로직에서:
    - 업데이트된 Scent/GenrePreference 를 참조해,
    - 다음 세그먼트/프리셋 제안 시 해당 장르/향을 더 자주 선택하도록 가중치 적용.

#### 7.3 Phase B – 색상 전환 애니메이션(대각선 껍질 효과) 개선

- **Phase B1: 색상 전환 추상화 레이어 정리**
  - 현재:
    - `SegmentTransition`, `useSegmentTransition`, `globals.css` 에서 대각선 애니메이션 일부 구현.
  - 목표:
    - “오브젝트가 지나가는 느낌”이 아니라,
      - **현재 배경색에서 다음 배경색으로의 그라데이션/블렌딩을 대각선 방향으로 진행**하는 추상화.
  - 구현 방향:
    - 상위 컨테이너(예: MoodDashboard 래퍼)에 두 개의 레이어를 겹친다.
      - 아래 레이어: 이전 색상.
      - 위 레이어: 다음 색상(clip-path/마스크로 영역이 점점 커짐).
    - 애니메이션:
      - `clip-path` 또는 `mask-image` 를 이용해 우측 상단→좌측 하단 방향으로 위 레이어의 노출 영역을 확장.
      - 전체가 다 덮이면 애니메이션 종료 후 레이어를 하나로 정리.

- **Phase B2: 공통 훅/컴포넌트로 통합**
  - `useDiagonalColorTransition(previousColor, nextColor)`:
    - `isTransitioning`, `currentColor`, `prevColor`, `nextColor` 상태 반환.
  - `DiagonalColorOverlay` 컴포넌트:
    - props: `{ prevColor, nextColor, isActive, direction: "top-right-to-bottom-left" }`
    - 내부에서 CSS 애니메이션과 레이어를 관리.
  - MoodDashboard / ScentBackground / DeviceCard 배경 등에서:
    - 동일 훅/컴포넌트를 사용해 **일관된 전환 경험** 제공.

- **Phase B3: 성능/UX 조정**
  - 애니메이션 시간:
    - 0.6~1.0초 정도로, 세그먼트 전환 속도와 어울리게 튜닝.
  - 저사양 환경:
    - `prefers-reduced-motion` 또는 설정 플래그를 읽어 애니메이션을 단순 fade로 대체.

#### 7.4 Phase C – 아이콘/디바이스 카드 리팩토링 정리

- **Phase C1: 타입별/상태별 아이콘 재정의**
  - Manager / Light / Speaker / Scent 용 메인 아이콘과,
    - 전원/활성 상태, 향 레벨, 볼륨 등 상태 아이콘을 분리.
  - React Icons 기반으로:
    - 타입: `HiOutlineLightBulb`, `HiOutlineSpeakerWave`, `HiOutlineSparkles` 등.
    - 상태: 레벨/볼륨/센서 상태를 표현하는 보조 아이콘 추가.

- **Phase C2: 우선순위와 시각적 계층 정리**
  - 그리드 정렬:
    - Manager > Light > Speaker > Scent 순이 직관적이면 그 순서를 정렬 기준에 반영.
    - 추가로, 전원 ON 상태 기기를 상단에 우선 배치하는 것도 옵션.
  - 시각:
    - 활성 기기는 레이저 글로우/파스텔 테두리 등으로 한 눈에 구분되도록 한다.

- **Phase C3: 코드/타입 안정화**
  - `Device` 타입에 `type` 별 유니온/디스크리미네이티드 유니온을 적용해,
    - 각 타입별로 어떤 출력 필드를 가질 수 있는지 명확히 한다.
  - 디바이스 핸들러 훅(`useDeviceHandlers`)에서 타입별 분기를 정리하고,  
    mock 모드/실제 API 모드와의 동작을 명확히 나눈다.



