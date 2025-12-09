# 전구 연결 네트워크 구조 및 AWS 배포 가이드

## 개요

라즈베리파이와 Next.js 서버 간 통신 구조 및 AWS 배포 시 고려사항을 정리합니다.

---

## 1. 현재 구조 분석

### 1.1 로컬 개발 환경 (같은 핫스팟)

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

**문제점**:
1. **같은 핫스팟이라도 통신이 안될 수 있는 경우**:
   - 방화벽 설정 (포트 차단)
   - 네트워크 격리 (AP Isolation)
   - 라우터 설정 (클라이언트 간 통신 차단)
   - Next.js 서버가 외부에서 접근 불가능한 경우 (localhost만 바인딩)

2. **IP 기반 연결의 한계**:
   - 로컬 IP는 DHCP로 변경될 수 있음
   - 라우터 재시작 시 IP 변경 가능
   - 같은 네트워크에 있어야만 통신 가능

---

## 2. AWS 배포 시 문제점

### 2.1 현재 구조의 문제

```
┌─────────────────┐         POST          ┌─────────────────┐
│  home/page.tsx  │ ───────────────────> │  AWS Amplify     │
│  (브라우저)     │                       │  (Next.js 서버)  │
└─────────────────┘                       └────────┬────────┘
                                                     │
                                                     │ 메모리 저장
                                                     │ (lightControlState)
                                                     │
                                                     │ GET
┌─────────────────┐                       ┌─────────▼────────┐
│  라즈베리파이   │ <─────────────────────│  AWS Amplify     │
│  (로컬 네트워크)│   ❌ 통신 불가        │  (Next.js 서버)  │
└─────────────────┘                       └─────────────────┘
```

**핵심 문제**:
- AWS Amplify는 **서버리스 환경** (각 요청마다 새로운 인스턴스)
- **메모리 상태가 유지되지 않음** (`lightControlState`가 요청마다 초기화)
- 라즈베리파이는 **로컬 네트워크**에 있어서 AWS 서버에서 직접 접근 불가
- 라즈베리파이에 **공인 IP가 없으면** 외부에서 접근 불가

---

## 3. 해결 방안

### 3.1 옵션 1: 데이터베이스 기반 상태 저장 (권장) ✅

**구조**:
```
┌─────────────────┐         POST          ┌─────────────────┐
│  home/page.tsx  │ ───────────────────> │  AWS Amplify    │
│  (브라우저)     │                       │  (Next.js 서버) │
└─────────────────┘                       └────────┬────────┘
                                                     │
                                                     │ DB 저장
                                                     │ (PostgreSQL)
                                                     │
                                                     │ GET
┌─────────────────┐                       ┌─────────▼────────┐
│  라즈베리파이   │ <─────────────────────│  AWS Amplify     │
│  (로컬 네트워크)│   ✅ 통신 가능        │  (Next.js 서버)  │
└─────────────────┘                       └─────────────────┘
```

**구현 방법**:
1. `lightControlState`를 PostgreSQL에 저장
2. 라즈베리파이가 GET 요청 시 DB에서 최신 상태 조회
3. 라즈베리파이가 외부에서 접근 가능하도록 설정

**장점**:
- 서버리스 환경에서도 상태 유지
- 여러 라즈베리파이에서 동시 접근 가능
- 상태 이력 관리 가능

**단점**:
- DB 쿼리 오버헤드 (하지만 크게 문제되지 않음)

---

### 3.2 옵션 2: 터널링 서비스 사용 (ngrok, Cloudflare Tunnel)

**구조**:
```
┌─────────────────┐         POST          ┌─────────────────┐
│  home/page.tsx  │ ───────────────────> │  AWS Amplify    │
│  (브라우저)     │                       │  (Next.js 서버) │
└─────────────────┘                       └────────┬────────┘
                                                     │
                                                     │ 메모리/DB 저장
                                                     │
                                                     │ GET
┌─────────────────┐         터널          ┌─────────▼────────┐
│  라즈베리파이   │ <─────────────────────│  ngrok/Cloudflare│
│  (로컬 네트워크)│   ✅ 통신 가능        │  (터널 서버)     │
└─────────────────┘                       └─────────────────┘
```

**구현 방법**:
1. 라즈베리파이에서 ngrok 또는 Cloudflare Tunnel 실행
2. 터널을 통해 AWS 서버에 접근
3. AWS 서버는 터널 URL로 라즈베리파이에 접근

**장점**:
- 로컬 네트워크 설정 불필요
- 빠른 프로토타이핑 가능

**단점**:
- 무료 터널은 URL이 변경될 수 있음
- 보안 고려 필요
- 추가 서비스 의존성

---

### 3.3 옵션 3: EC2 서버 사용 (전통적인 방식)

**구조**:
```
┌─────────────────┐         POST          ┌─────────────────┐
│  home/page.tsx  │ ───────────────────> │  EC2 서버      │
│  (브라우저)     │                       │  (Next.js 서버) │
└─────────────────┘                       └────────┬────────┘
                                                     │
                                                     │ 메모리/DB 저장
                                                     │
                                                     │ GET
┌─────────────────┐         공인 IP       ┌─────────▼────────┐
│  라즈베리파이   │ <─────────────────────│  EC2 서버        │
│  (공인 IP 필요) │   ✅ 통신 가능        │  (고정 IP)       │
└─────────────────┘                       └─────────────────┘
```

**구현 방법**:
1. EC2 인스턴스에 Next.js 서버 배포
2. EC2 보안 그룹에서 라즈베리파이 IP 허용
3. 라즈베리파이가 EC2 공인 IP로 접근

**장점**:
- 안정적인 통신
- 메모리 상태 유지 가능
- 완전한 제어

**단점**:
- EC2 비용 발생
- 서버 관리 필요
- 라즈베리파이에 공인 IP 필요 (또는 포트 포워딩)

---

### 3.4 옵션 4: WebSocket 또는 MQTT (실시간 통신)

**구조**:
```
┌─────────────────┐         WebSocket     ┌─────────────────┐
│  home/page.tsx  │ <──────────────────> │  AWS 서버       │
│  (브라우저)     │                       │  (WebSocket)    │
└─────────────────┘                       └────────┬────────┘
                                                     │
                                                     │ MQTT/WebSocket
┌─────────────────┐                       ┌─────────▼────────┐
│  라즈베리파이   │ <─────────────────────│  AWS 서버        │
│  (MQTT 클라이언트)│   ✅ 실시간 통신     │  (MQTT Broker)   │
└─────────────────┘                       └─────────────────┘
```

**구현 방법**:
1. AWS IoT Core 또는 MQTT Broker 사용
2. 라즈베리파이를 MQTT 클라이언트로 설정
3. Next.js 서버에서 MQTT로 메시지 발행

**장점**:
- 실시간 양방향 통신
- 서버리스 환경에 적합
- 확장성 좋음

**단점**:
- 추가 인프라 필요
- 구현 복잡도 증가

---

## 4. 권장 해결 방안

### 4.1 단기 해결책: 데이터베이스 기반 상태 저장

**이유**:
- 현재 PostgreSQL 인프라 활용 가능
- 서버리스 환경(AWS Amplify)에서도 작동
- 구현이 간단함

**구현 단계**:
1. `LightControlState`를 Prisma 모델로 추가
2. POST 요청 시 DB에 저장
3. GET 요청 시 DB에서 최신 상태 조회
4. 라즈베리파이가 외부 접근 가능하도록 설정 (공인 IP 또는 터널링)

### 4.2 장기 해결책: EC2 또는 MQTT

**EC2 선택 시**:
- 안정적인 서버 환경
- 메모리 상태 유지 가능
- 완전한 제어

**MQTT 선택 시**:
- 실시간 통신
- 확장성
- 서버리스 친화적

---

## 5. 로컬 개발 환경 통신 문제 해결

### 5.1 같은 핫스팟에서도 통신이 안되는 경우

**원인**:
1. **AP Isolation (클라이언트 격리)**: 라우터가 클라이언트 간 통신을 차단
2. **방화벽**: Next.js 서버 포트(3000)가 차단됨
3. **바인딩 문제**: Next.js가 `localhost`만 바인딩하여 외부 접근 불가

**해결 방법**:

#### 방법 1: Next.js 서버를 모든 인터페이스에 바인딩
```bash
# package.json
"scripts": {
  "dev": "next dev -H 0.0.0.0"  # 모든 네트워크 인터페이스에 바인딩
}
```

#### 방법 2: 방화벽 설정 확인
```bash
# macOS
sudo pfctl -d  # 방화벽 비활성화 (테스트용)

# Linux
sudo ufw allow 3000/tcp
```

#### 방법 3: 라우터 AP Isolation 해제
- 라우터 관리 페이지에서 "AP Isolation" 또는 "Client Isolation" 해제

#### 방법 4: 로컬 IP 확인
```bash
# 개발 서버 IP 확인
ifconfig | grep "inet " | grep -v 127.0.0.1

# 라즈베리파이에서 접근
curl http://[개발서버IP]:3000/api/light/control
```

---

## 6. AWS 배포 시 구현 가이드

### 6.1 데이터베이스 기반 상태 저장 구현

**Prisma Schema 추가**:
```prisma
model LightControlState {
  id          String   @id @default(uuid())
  userId      String
  r           Int?
  g           Int?
  b           Int?
  colortemp   Int?
  brightness  Int
  lastUpdated DateTime @default(now())
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([userId])
  @@index([userId, lastUpdated])
}
```

**route.ts 수정**:
```typescript
// POST: DB에 저장
export async function POST(request: NextRequest) {
  const session = await requireAuth();
  const body = await request.json();
  
  await prisma.lightControlState.upsert({
    where: { userId: session.user.id },
    update: {
      r: body.r,
      g: body.g,
      b: body.b,
      colortemp: body.colortemp,
      brightness: body.brightness,
      lastUpdated: new Date(),
    },
    create: {
      userId: session.user.id,
      r: body.r,
      g: body.g,
      b: body.b,
      colortemp: body.colortemp,
      brightness: body.brightness,
    },
  });
  
  return NextResponse.json({ success: true });
}

// GET: DB에서 조회
export async function GET() {
  const session = await requireAuth();
  
  const state = await prisma.lightControlState.findUnique({
    where: { userId: session.user.id },
  });
  
  if (!state) {
    return NextResponse.json({ state: null });
  }
  
  return NextResponse.json({
    r: state.r,
    g: state.g,
    b: state.b,
    colortemp: state.colortemp,
    brightness: state.brightness,
  });
}
```

---

## 7. 라즈베리파이 외부 접근 설정

### 7.1 공인 IP 사용 (라즈베리파이가 공인 IP를 가진 경우)

**라즈베리파이 설정**:
```python
# 라즈베리파이에서 주기적으로 GET 요청
import requests
import time

AWS_SERVER_URL = "https://your-app.amplify.app"  # AWS Amplify URL

while True:
    try:
        response = requests.get(f"{AWS_SERVER_URL}/api/light/control")
        data = response.json()
        # 전구 제어 로직
        control_light(data)
    except Exception as e:
        print(f"Error: {e}")
    time.sleep(0.5)  # 0.5초마다 polling
```

### 7.2 터널링 사용 (ngrok 예시)

**라즈베리파이에서 ngrok 실행**:
```bash
# ngrok 설치
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc
echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
sudo apt update && sudo apt install ngrok

# 터널 시작
ngrok http 3000  # 또는 라즈베리파이 서버 포트
```

**AWS 서버에서 터널 URL로 접근**:
```typescript
// route.ts에서 라즈베리파이로 직접 전송 (선택적)
const RASPBERRY_PI_TUNNEL_URL = process.env.RASPBERRY_PI_TUNNEL_URL;
if (RASPBERRY_PI_TUNNEL_URL) {
  await fetch(`${RASPBERRY_PI_TUNNEL_URL}/api/light_info`, {
    method: "POST",
    body: JSON.stringify(state),
  });
}
```

---

## 8. 요약

### 로컬 개발 환경
- ✅ 같은 핫스팟 내에서 IP 기반 통신 가능
- ⚠️ AP Isolation, 방화벽 설정 확인 필요
- ⚠️ Next.js 서버를 `0.0.0.0`에 바인딩 필요

### AWS 배포 환경
- ❌ 현재 메모리 기반 구조는 서버리스에서 작동하지 않음
- ✅ **데이터베이스 기반 상태 저장**으로 변경 필요
- ✅ 라즈베리파이가 외부에서 접근 가능하도록 설정 필요
- ✅ 공인 IP 또는 터널링 서비스 사용

### 권장 사항
1. **단기**: 데이터베이스 기반 상태 저장 구현
2. **장기**: EC2 또는 MQTT 기반 실시간 통신 고려

