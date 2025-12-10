# 전구 연결 가이드

**작성일**: 2025.12.10

## 개요

Mood Manager의 무드 스트림 데이터를 실제 전구 디바이스에 전달하여 조명을 제어하는 기능 구현 가이드입니다.

---

## 1. LLM 출력 구조

### 1.1 조명 정보

LLM이 생성하는 조명 정보:

```typescript
lighting: {
  rgb: [number, number, number];      // RGB 값 [0-255, 0-255, 0-255]
  brightness: number;                 // 밝기 (0-100)
  temperature: number;                // 색온도 (2000-6500K)
}
```

**현재 상태**: LLM은 RGB와 temperature를 모두 생성합니다.

### 1.2 데이터 흐름

```
home/page.tsx (currentSegmentData)
  ↓
  - segment.mood.lighting.rgb
  - backgroundParams.lighting.brightness
  - backgroundParams.lighting.temperature
  ↓
POST /api/light/control
  ↓ (메모리 저장)
GET /api/light/control (라즈베리파이 polling)
  ↓
라즈베리파이 API
  ↓
실제 전구 디바이스
```

---

## 2. RGB vs Color Temperature 처리

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

**현재 구현**: RGB 우선 전략 사용. 모든 값을 함께 전달하며, 라즈베리파이가 RGB/colortemp 판단을 수행합니다.

---

## 3. API 엔드포인트

### 3.1 POST /api/light/control

조명 제어 상태를 저장합니다.

**요청**:
```json
{
  "r": 255,
  "g": 200,
  "b": 150,
  "colortemp": 4000,
  "brightness": 128
}
```

**응답**:
```json
{
  "success": true,
  "state": {
    "r": 255,
    "g": 200,
    "b": 150,
    "colortemp": 4000,
    "brightness": 128,
    "lastUpdated": 1234567890
  },
  "message": "Light control state updated. Raspberry Pi can fetch via GET /api/light/control"
}
```

### 3.2 GET /api/light/control

라즈베리파이가 주기적으로 조회하는 엔드포인트입니다.

**응답**:
```json
{
  "r": 255,
  "g": 200,
  "b": 150,
  "colortemp": 4000,
  "brightness": 128
}
```

**인증**: 개발 환경에서는 인증을 우회하며, 프로덕션에서는 API Key 또는 IP Whitelisting을 사용합니다.

---

## 4. 네트워크 통신 방법

### 4.1 로컬 개발 환경 (같은 핫스팟)

#### 방법 1: IP 주소 사용
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
- IP 변경에 영향 없음
- 설정 간단

**단점**:
- mDNS 지원 필요
- 일부 네트워크에서 작동하지 않을 수 있음

### 4.2 통신 구조

```
┌─────────────────┐         POST          ┌─────────────────┐
│  home/page.tsx │ ───────────────────> │  route.ts       │
│  (클라이언트)   │                       │  (Next.js 서버) │
└─────────────────┘                       └────────┬──────────┘
                                                  │
                                                  │ 메모리 저장
                                                  │ (lightControlState)
                                                  │
                                                  │ GET
┌─────────────────┐                       ┌───────▼──────────┐
│  라즈베리파이   │ <─────────────────────│  route.ts       │
│  (로컬 네트워크)│   주기적 polling      │  (Next.js 서버) │
└─────────────────┘                       └─────────────────┘
```

**통신 방식**:
- Next.js 서버: `http://localhost:3000` (로컬 개발)
- 라즈베리파이: `http://10.58.32.146` (같은 핫스팟 내 IP)
- 라즈베리파이 → Next.js: `GET http://[로컬IP]:3000/api/light/control`

---

## 5. AWS EC2 배포

### 5.1 네트워크 구조

```
┌─────────────────┐         HTTPS POST      ┌─────────────────┐
│  home/page.tsx  │ ───────────────────> │  EC2 서버       │
│  (브라우저)     │                       │  (Next.js 서버)  │
└─────────────────┘                       │  IP: 3.34.xxx.xxx│
                                          │  Port: 3000/443  │
                                          └────────┬─────────┘
                                                   │
                                                   │ 메모리 저장
                                                   │ (lightControlState)
                                                   │ ✅ 상태 유지 가능
                                                   │
                                                   │ HTTPS GET
┌─────────────────┐         공인 IP       ┌───────▼──────────┐
│  라즈베리파이   │ <─────────────────────│  EC2 서버        │
│  (로컬 네트워크)│   ✅ 통신 가능        │  (고정 IP)       │
│  또는 공인 IP   │                       │  Port: 3000/443  │
└─────────────────┘                       └─────────────────┘
```

### 5.2 EC2의 장점

1. **메모리 상태 유지**: 서버리스가 아니므로 `lightControlState`가 유지됨
2. **고정 IP**: Elastic IP로 고정 공인 IP 할당 가능
3. **완전한 제어**: 서버 환경 완전 제어 가능
4. **직접 통신**: 라즈베리파이가 EC2 공인 IP로 직접 접근 가능

### 5.3 EC2 설정

#### 1. Elastic IP 할당
- EC2 인스턴스에 Elastic IP 할당
- 고정 공인 IP 보장

#### 2. Security Groups 설정
- Inbound: HTTPS (443) 또는 HTTP (3000) 허용
- 라즈베리파이 IP Whitelisting (선택사항)

#### 3. Nginx Reverse Proxy (선택사항)
- SSL/TLS 인증서 설정 (Let's Encrypt)
- 포트 443으로 HTTPS 제공

### 5.4 라즈베리파이 인증

프로덕션 환경에서는 라즈베리파이 인증이 필요합니다:

**방법 1: API Key**
```typescript
// route.ts
const RASPBERRY_PI_API_KEY = process.env.RASPBERRY_PI_API_KEY;

export async function GET(request: NextRequest) {
  const apiKey = request.headers.get('X-API-Key');
  if (apiKey !== RASPBERRY_PI_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // ...
}
```

**방법 2: IP Whitelisting**
- Security Groups에서 라즈베리파이 IP만 허용
- 추가 인증 불필요

---

## 6. 구현 상태

### 6.1 완료된 기능

- ✅ POST `/api/light/control`: 조명 상태 저장
- ✅ GET `/api/light/control`: 조명 상태 조회 (라즈베리파이 polling)
- ✅ RGB 우선 전략 구현
- ✅ `home/page.tsx`에서 자동 전송

### 6.2 라즈베리파이 측 구현 필요

- 라즈베리파이에서 `GET /api/light/control` 주기적 호출 (0.5초 간격 권장)
- RGB/colortemp 판단 로직
- 실제 전구 디바이스 제어

---

## 7. 참고사항

- **Polling 간격**: 0.5초 권장 (너무 짧으면 서버 부하 증가)
- **상태 유지**: EC2 배포 시 메모리 상태가 유지되므로 서버리스보다 유리
- **보안**: 프로덕션에서는 반드시 인증 메커니즘 구현 필요

