# 전구 연결 구현 계획

## 개요

Mood Manager의 무드 스트림 데이터를 실제 전구 디바이스에 전달하여 조명을 제어하는 기능을 구현합니다.

---

## 1. 현재 LLM 출력 구조 분석

### 1.1 LLM이 생성하는 조명 정보

현재 LLM (`CompleteSegmentOutput`)은 다음 조명 정보를 생성합니다:

```typescript
lighting: {
  rgb: [number, number, number];      // RGB 값 [0-255, 0-255, 0-255]
  brightness: number;                  // 밝기 (0-100)
  temperature: number;                  // 색온도 (2000-6500K)
}
```

**현재 상태**: LLM은 RGB와 temperature를 **모두 생성**하고 있습니다.

### 1.2 데이터 흐름

```
home/page.tsx (currentSegmentData)
  ↓ (0.5초마다 polling)
  - segment.mood.lighting.rgb
  - backgroundParams.lighting.brightness
  - backgroundParams.lighting.temperature
  ↓
POST /api/light/control
  ↓ (route.ts에서 상태 저장 및 즉시 전송)
라즈베리파이 API
  ↓
실제 전구 디바이스
```

---

## 2. RGB vs Color Temperature 처리 전략

### 2.1 제약사항

- **RGB와 Color Temperature는 양립 불가능**: 전구 API에서 둘 중 하나만 선택 가능
- **우선순위**: RGB가 존재하면 RGB 우선, 없으면 Color Temperature 사용

### 2.2 처리 로직

```typescript
// 의사코드
if (lighting.rgb && lighting.rgb[0] !== null && lighting.rgb[1] !== null && lighting.rgb[2] !== null) {
  // RGB 모드 사용
  sendToRaspberryPi({
    r: lighting.rgb[0],
    g: lighting.rgb[1],
    b: lighting.rgb[2],
    brightness: lighting.brightness
  });
} else if (lighting.temperature) {
  // Color Temperature 모드 사용
  sendToRaspberryPi({
    colortemp: lighting.temperature,
    brightness: lighting.brightness
  });
}
```

### 2.3 LLM 출력 개선 방안

#### 옵션 1: RGB 우선 전략 (권장) ✅
- LLM이 항상 RGB를 생성하도록 보장
- Color Temperature는 RGB가 부적절할 때만 사용
- **장점**: 구현 단순, 일관성 유지
- **단점**: LLM이 항상 RGB를 생성해야 함

**현재 구현**: 옵션 1 사용

---

## 3. 네트워크 통신 방법

### 3.1 같은 핫스팟/로컬 네트워크 내 통신

#### 방법 1: IP 주소 사용 (가장 일반적)
```env
RASPBERRY_PI_URL=http://192.168.0.100:8000
```

**장점**:
- 가장 확실하고 빠름
- 모든 네트워크에서 작동

**단점**:
- IP 주소가 변경될 수 있음 (DHCP)
- 고정 IP 설정 필요

#### 방법 2: mDNS 호스트명 사용 (권장)
```env
RASPBERRY_PI_URL=http://raspberrypi.local:8000
```

**장점**:
- IP 주소 변경에 영향 없음
- 기억하기 쉬운 이름 사용

**단점**:
- 라즈베리파이에서 mDNS 서비스 활성화 필요 (Avahi)
- 일부 네트워크에서 작동하지 않을 수 있음

#### 방법 3: 환경 변수 없이 자동 탐지 (향후 구현 가능)
- 네트워크 스캔을 통한 자동 탐지
- 복잡도가 높아 현재는 제외

**현재 구현**: 방법 2 (mDNS)를 기본값으로 사용, 환경 변수로 오버라이드 가능

### 3.2 왜 Next.js API Route를 통해야 하는가?

**클라이언트에서 직접 라즈베리파이로 요청하는 것은 권장하지 않습니다:**

1. **CORS 문제**: 라즈베리파이에서 CORS 헤더 설정 필요
2. **보안 문제**: 라즈베리파이 IP가 클라이언트 코드에 노출
3. **네트워크 제한**: 브라우저 보안 정책으로 인한 제한 가능
4. **인증 관리**: 서버 사이드에서 인증/권한 관리 가능

**권장 구조**:
```
home/page.tsx (클라이언트)
  ↓ POST /api/light/control (같은 도메인)
Next.js API Route (서버)
  ↓ HTTP 요청
라즈베리파이 (로컬 네트워크)
```

---

## 4. 구현 구조

### 4.1 데이터 흐름

```
┌─────────────────┐
│  home/page.tsx  │
│                 │
│ currentSegment  │
│   - lighting    │
│   - brightness  │
│   (0.5초마다)   │
└────────┬────────┘
         │
         │ POST /api/light/control (0.5초마다)
         ▼
┌─────────────────┐
│  route.ts       │
│                 │
│ - 상태 저장     │
│ - 즉시 전송     │
└────────┬────────┘
         │
         │ HTTP GET
         ▼
┌─────────────────┐
│ 라즈베리파이    │
│                 │
│ - 전구 제어     │
│ - 상태 반환     │
└─────────────────┘
```

### 4.2 API 엔드포인트 설계

#### 4.2.1 POST /api/light/control
**목적**: 현재 세그먼트의 조명 정보를 전구 제어 시스템에 전달

**Request Body**:
```typescript
{
  r?: number;           // 0-255 (RGB 모드)
  g?: number;           // 0-255 (RGB 모드)
  b?: number;           // 0-255 (RGB 모드)
  colortemp?: number;   // 2000-7000 (Color Temperature 모드)
  brightness: number;   // 0-255 (필수)
  mode: "rgb" | "colortemp"; // 모드 명시
}
```

**Response**:
```typescript
{
  success: boolean;
  message: string;
  state: LightControlState;
}
```

#### 4.2.2 GET /api/light/control
**목적**: 현재 전구 제어 상태 조회

**Response**:
```typescript
{
  state: LightControlState | null;
  pendingState: PendingLightState | null;
  pollingActive: boolean;
}
```

### 4.3 라즈베리파이 API 연동

#### 4.3.1 전구 검색 API
**GET /api/search_light**

**Response**:
```typescript
{
  status: "search" | "wait";
  light_off: boolean; // 전구 전원 끄기 여부
}
```

**동작**:
- 평소: `status: "wait"` (대기 상태)
- UI에서 전구 연결 버튼 클릭: `status: "search"` (검색 시작)
- 디바이스 해제: `status: "wait"` (대기 상태로 복귀)

#### 4.3.2 전구 전원 제어 API
**GET /api/light_power**

**Response**:
```typescript
{
  power: "on" | "off";
}
```

#### 4.3.3 전구 정보 설정 API
**GET /api/light_info**

**RGB 모드**:
```typescript
{
  r: number;        // 0-255
  g: number;        // 0-255
  b: number;        // 0-255
  brightness: number; // 0-255
}
```

**Color Temperature 모드**:
```typescript
{
  colortemp: number;  // 2000-7000
  brightness: number; // 0-255
}
```

**주의**: RGB와 colortemp는 동시에 사용 불가

---

## 5. 구현 단계

### Phase 1: API Route 생성 ✅
1. `Web/src/app/api/light/control/route.ts` 생성
   - 현재 세그먼트 조명 정보 수신
   - RGB/Color Temperature 모드 판단
   - 라즈베리파이로 전송

2. `Web/src/app/api/light/status/route.ts` 생성
   - 현재 전구 상태 조회
   - 라즈베리파이에서 상태 가져오기

### Phase 2: Polling 메커니즘 구현 ✅
1. `home/page.tsx`에서 0.5초마다 API 호출
   - `currentSegmentData` 변경 감지
   - 조명 정보 추출 및 API 호출
   - 에러 처리 및 재시도 로직

2. `route.ts`에서 상태 저장 및 즉시 전송
   - 메모리 기반 상태 저장
   - 변경 감지 시 라즈베리파이로 전송

### Phase 3: 라즈베리파이 통신
1. HTTP 클라이언트 설정
2. 라즈베리파이 API 엔드포인트 호출
3. 에러 처리 및 타임아웃 설정

### Phase 4: 전구 검색 기능 (향후)
1. `Web/src/app/api/light/search/route.ts` 생성
2. UI에서 전구 검색 버튼 연동
3. 검색 상태 관리

---

## 6. 코드 구조

### 6.1 home/page.tsx Polling

```typescript
// home/page.tsx
useEffect(() => {
  if (!currentSegmentData?.segment?.mood?.lighting) {
    return;
  }
  
  const sendLightControl = () => {
    // 조명 정보 추출
    const lighting = currentSegmentData.segment.mood.lighting;
    const rgb = lighting.rgb;
    const brightness = currentSegmentData.backgroundParams?.lighting?.brightness || 50;
    const temperature = currentSegmentData.backgroundParams?.lighting?.temperature;
    
    // RGB 우선 전략
    const requestBody = {
      brightness: Math.round((brightness / 100) * 255),
      // ... RGB 또는 colortemp
    };
    
    // API 호출
    fetch("/api/light/control", {
      method: "POST",
      body: JSON.stringify(requestBody),
    });
  };
  
  // 즉시 한 번 전송
  sendLightControl();
  
  // 0.5초마다 polling
  const interval = setInterval(sendLightControl, 500);
  return () => clearInterval(interval);
}, [currentSegmentData]);
```

### 6.2 route.ts 처리

```typescript
// route.ts
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { r, g, b, colortemp, brightness } = body;
  
  // RGB 우선 전략
  let newState: LightControlState;
  if (r !== undefined && g !== undefined && b !== undefined) {
    newState = { r, g, b, brightness, mode: "rgb", ... };
  } else if (colortemp !== undefined) {
    newState = { colortemp, brightness, mode: "colortemp", ... };
  }
  
  // 상태 저장
  lightControlState = newState;
  
  // 라즈베리파이로 즉시 전송
  await sendToRaspberryPi(newState);
  
  return NextResponse.json({ success: true, state: newState });
}
```

---

## 7. 환경 변수 설정

### 7.1 라즈베리파이 URL 설정

```env
# .env.local

# 방법 1: IP 주소 사용
RASPBERRY_PI_URL=http://192.168.0.100:8000

# 방법 2: mDNS 호스트명 사용 (권장)
RASPBERRY_PI_URL=http://raspberrypi.local:8000
```

### 7.2 라즈베리파이 mDNS 설정 (선택사항)

라즈베리파이에서 mDNS를 활성화하면 `raspberrypi.local`로 접근 가능:

```bash
# 라즈베리파이에서 실행
sudo apt-get update
sudo apt-get install avahi-daemon
sudo systemctl enable avahi-daemon
sudo systemctl start avahi-daemon
```

호스트명 변경 (선택):
```bash
sudo nano /etc/hostname
# 원하는 이름으로 변경 (예: mood-light)
sudo reboot
```

---

## 8. 에러 처리 및 재시도

1. **네트워크 에러**: 3회 재시도, 지수 백오프
2. **타임아웃**: 5초 타임아웃 설정
3. **라즈베리파이 연결 실패**: 로그 기록, 사용자 알림

---

## 9. 테스트 계획

1. **단위 테스트**: RGB/Color Temperature 모드 판단 로직
2. **통합 테스트**: home/page.tsx → API Route → 라즈베리파이
3. **E2E 테스트**: 세그먼트 변경 시 전구 제어 확인

---

## 10. FAQ

### Q: IP 주소 없이 통신할 수 있나요?
**A**: mDNS를 사용하면 `raspberrypi.local` 같은 호스트명으로 접근 가능합니다. 하지만 라즈베리파이에서 mDNS 서비스를 활성화해야 합니다.

### Q: 클라이언트에서 직접 라즈베리파이로 요청할 수 있나요?
**A**: 기술적으로는 가능하지만 보안상 권장하지 않습니다:
- CORS 설정 필요
- 라즈베리파이 IP 노출
- 브라우저 보안 정책 제한

**권장**: Next.js API Route를 프록시로 사용 (현재 구현)

### Q: Polling 간격을 조정할 수 있나요?
**A**: `home/page.tsx`의 `setInterval` 간격을 변경하면 됩니다. 현재는 500ms (0.5초)로 설정되어 있습니다.

---

## 참고사항

- RGB와 Color Temperature는 전구 API에서 동시 사용 불가
- 현재 LLM은 RGB와 temperature를 모두 생성하므로, RGB 우선 전략 사용
- Polling은 home/page.tsx에서 0.5초마다 실행
- 라즈베리파이 API는 GET 방식이므로 쿼리 파라미터로 전달
- mDNS를 사용하면 IP 주소 변경에 영향 없이 통신 가능
