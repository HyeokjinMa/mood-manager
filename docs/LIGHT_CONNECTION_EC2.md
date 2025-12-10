# 전구 연결 EC2 배포 가이드

## 개요

EC2 서버에 Next.js 애플리케이션을 배포하고 라즈베리파이와 통신하는 구조를 정리합니다.

---

## 1. EC2 배포 시 구조

### 1.1 네트워크 구조

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

### 1.2 EC2의 장점

1. **메모리 상태 유지**: 서버리스가 아니므로 `lightControlState`가 유지됨
2. **고정 IP**: Elastic IP로 고정 공인 IP 할당 가능
3. **완전한 제어**: 서버 환경 완전 제어 가능
4. **직접 통신**: 라즈베리파이가 EC2 공인 IP로 직접 접근 가능

---

## 2. 현재 코드 구조 분석

### 2.1 현재 구현 상태

**route.ts**:
- ✅ 메모리 기반 상태 저장 (`let lightControlState`)
- ✅ POST: 상태 저장
- ✅ GET: 상태 조회
- ✅ EC2에서 작동 가능 (서버리스가 아니므로)

**home/page.tsx**:
- ✅ currentSegmentData 변경 시 POST 요청
- ✅ EC2에서 작동 가능

### 2.2 EC2 배포 시 필요한 변경사항

**필요한 변경사항**:
1. ✅ **코드 변경 불필요**: 현재 구조가 EC2에서 작동함
2. ⚠️ **환경 변수 설정**: EC2 인스턴스에 환경 변수 설정
3. ⚠️ **보안 그룹 설정**: 라즈베리파이 IP 허용
4. ⚠️ **Elastic IP 할당**: 고정 IP 설정
5. ⚠️ **HTTPS 설정**: SSL 인증서 설정 (선택적)

---

## 3. EC2 배포 단계별 가이드

### 3.1 EC2 인스턴스 생성

**인스턴스 설정**:
- **AMI**: Ubuntu 22.04 LTS (또는 Amazon Linux 2023)
- **인스턴스 타입**: t3.micro (테스트) 또는 t3.small (프로덕션)
- **보안 그룹**: 
  - 인바운드 규칙:
    - HTTP (80) - 모든 IP 또는 특정 IP
    - HTTPS (443) - 모든 IP 또는 특정 IP
    - SSH (22) - 본인 IP만
    - Custom TCP (3000) - 라즈베리파이 IP만 (선택적)

### 3.2 Elastic IP 할당

**Elastic IP 설정**:
1. EC2 콘솔 → Elastic IPs → Allocate Elastic IP address
2. 생성된 Elastic IP를 EC2 인스턴스에 연결
3. **고정 IP 획득**: 예) `3.34.123.45`

**라즈베리파이에서 접근**:
```python
# 라즈베리파이 코드
EC2_SERVER_URL = "http://3.34.123.45:3000"  # 또는 HTTPS
# 또는
EC2_SERVER_URL = "https://your-domain.com"  # 도메인 사용 시
```

### 3.3 Next.js 애플리케이션 배포

**서버 설정**:
```bash
# EC2 인스턴스에 접속
ssh -i your-key.pem ubuntu@3.34.123.45

# Node.js 설치
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 애플리케이션 클론
git clone <your-repo-url>
cd mood-manager/Web

# 의존성 설치
npm install

# 환경 변수 설정
nano .env.production
```

**.env.production**:
```env
# 데이터베이스
DATABASE_URL=postgresql://user:password@rds-endpoint:5432/moodmanager

# NextAuth
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-secret-key

# 라즈베리파이 (선택적, 현재는 사용하지 않음)
# RASPBERRY_PI_URL=http://10.58.32.146:8000
```

**PM2로 실행**:
```bash
# PM2 설치
sudo npm install -g pm2

# Next.js 빌드
npm run build

# PM2로 실행 (모든 인터페이스에 바인딩)
pm2 start npm --name "mood-manager" -- start
pm2 save
pm2 startup
```

**또는 systemd 서비스로 실행**:
```bash
# /etc/systemd/system/mood-manager.service
[Unit]
Description=Mood Manager Next.js App
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/mood-manager/Web
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=/usr/bin/npm start
Restart=always

[Install]
WantedBy=multi-user.target
```

### 3.4 Nginx 리버스 프록시 설정 (권장)

**Nginx 설치 및 설정**:
```bash
sudo apt update
sudo apt install nginx

# Nginx 설정
sudo nano /etc/nginx/sites-available/mood-manager
```

**/etc/nginx/sites-available/mood-manager**:
```nginx
server {
    listen 80;
    server_name your-domain.com;  # 또는 EC2 IP

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**활성화**:
```bash
sudo ln -s /etc/nginx/sites-available/mood-manager /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 3.5 SSL 인증서 설정 (Let's Encrypt)

**HTTPS 설정** (선택적이지만 권장):
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## 4. 라즈베리파이 설정

### 4.1 라즈베리파이에서 EC2 접근

**Python 예시**:
```python
import requests
import time

# EC2 서버 URL
EC2_SERVER_URL = "http://3.34.123.45"  # 또는 HTTPS
# 또는
EC2_SERVER_URL = "https://your-domain.com"

def get_light_control():
    """EC2 서버에서 조명 제어 정보 가져오기"""
    try:
        response = requests.get(
            f"{EC2_SERVER_URL}/api/light/control",
            timeout=5
        )
        if response.status_code == 200:
            data = response.json()
            return data
        else:
            print(f"Error: {response.status_code}")
            return None
    except Exception as e:
        print(f"Connection error: {e}")
        return None

def control_light(data):
    """전구 제어 로직"""
    if data and 'brightness' in data:
        # RGB 모드
        if 'r' in data and 'g' in data and 'b' in data:
            print(f"RGB: ({data['r']}, {data['g']}, {data['b']}), Brightness: {data['brightness']}")
            # 실제 전구 제어 코드
        # Color Temperature 모드
        elif 'colortemp' in data:
            print(f"ColorTemp: {data['colortemp']}, Brightness: {data['brightness']}")
            # 실제 전구 제어 코드

# 메인 루프
while True:
    data = get_light_control()
    if data:
        control_light(data)
    time.sleep(0.5)  # 0.5초마다 polling
```

### 4.2 인증 처리

**현재 코드의 인증**:
- `requireAuth()`를 사용하여 세션 확인
- 개발 환경에서는 인증 실패 시에도 허용
- 프로덕션에서는 인증 필요

**라즈베리파이 인증 옵션**:

#### 옵션 1: API 키 사용 (권장)
```typescript
// route.ts 수정
export async function GET(request: NextRequest) {
  // API 키 확인
  const apiKey = request.headers.get('X-API-Key');
  if (apiKey !== process.env.RASPBERRY_PI_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // ... 기존 로직
}
```

```python
# 라즈베리파이 코드
headers = {
    'X-API-Key': 'your-api-key-here'
}
response = requests.get(f"{EC2_SERVER_URL}/api/light/control", headers=headers)
```

#### 옵션 2: IP 화이트리스트
```typescript
// route.ts 수정
export async function GET(request: NextRequest) {
  const clientIP = request.headers.get('x-forwarded-for') || request.ip;
  const allowedIPs = process.env.RASPBERRY_PI_IPS?.split(',') || [];
  
  if (!allowedIPs.includes(clientIP)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  // ... 기존 로직
}
```

---

## 5. 보안 그룹 설정

### 5.1 EC2 보안 그룹 규칙

**인바운드 규칙**:

| 타입 | 프로토콜 | 포트 범위 | 소스 | 설명 |
|------|---------|----------|------|------|
| HTTP | TCP | 80 | 0.0.0.0/0 | 웹 브라우저 접근 |
| HTTPS | TCP | 443 | 0.0.0.0/0 | HTTPS 접근 |
| Custom TCP | TCP | 3000 | 라즈베리파이 IP/32 | 라즈베리파이 직접 접근 (선택적) |
| SSH | TCP | 22 | 본인 IP/32 | SSH 접근 |

**라즈베리파이 IP 확인**:
```bash
# 라즈베리파이에서 실행
curl ifconfig.me
# 또는
curl ipinfo.io/ip
```

**보안 그룹 설정**:
1. EC2 콘솔 → Security Groups → 인바운드 규칙 편집
2. Custom TCP 3000 추가 (라즈베리파이 IP만 허용)
3. 또는 Nginx를 통해 80/443 포트만 열고 라즈베리파이도 같은 포트 사용

---

## 6. 현재 코드 구조 검증

### 6.1 EC2에서 작동하는지 확인

**현재 구조**:
```typescript
// route.ts
let lightControlState: LightControlState | null = null;  // ✅ 메모리 유지

export async function POST(request: NextRequest) {
  // ... 인증 확인
  lightControlState = newState;  // ✅ 상태 저장
  return NextResponse.json({ success: true });
}

export async function GET() {
  // ... 인증 확인
  return NextResponse.json(lightControlState);  // ✅ 상태 반환
}
```

**EC2에서 작동 여부**:
- ✅ **메모리 상태 유지**: EC2는 서버리스가 아니므로 상태 유지됨
- ✅ **POST 요청 처리**: home/page.tsx에서 POST 요청 정상 작동
- ✅ **GET 요청 처리**: 라즈베리파이가 GET 요청으로 값 가져감
- ⚠️ **인증 처리**: 라즈베리파이 인증 방식 추가 필요

### 6.2 필요한 수정사항

**최소 수정사항**:
1. **라즈베리파이 인증 추가** (API 키 또는 IP 화이트리스트)
2. **환경 변수 설정** (EC2 인스턴스에 설정)
3. **보안 그룹 설정** (라즈베리파이 IP 허용)

**선택적 수정사항**:
1. **HTTPS 설정** (SSL 인증서)
2. **도메인 연결** (Elastic IP 대신 도메인 사용)
3. **로깅 추가** (라즈베리파이 요청 로깅)

---

## 7. 배포 체크리스트

### 7.1 EC2 인스턴스 설정
- [ ] EC2 인스턴스 생성
- [ ] Elastic IP 할당 및 연결
- [ ] 보안 그룹 설정 (HTTP, HTTPS, SSH, Custom TCP 3000)
- [ ] SSH 키 페어 생성 및 다운로드

### 7.2 애플리케이션 배포
- [ ] Node.js 설치
- [ ] 애플리케이션 클론
- [ ] 환경 변수 설정 (.env.production)
- [ ] 의존성 설치 (npm install)
- [ ] 빌드 (npm run build)
- [ ] PM2 또는 systemd로 실행

### 7.3 네트워크 설정
- [ ] Nginx 설치 및 설정 (선택적)
- [ ] SSL 인증서 설정 (Let's Encrypt, 선택적)
- [ ] 도메인 연결 (선택적)

### 7.4 라즈베리파이 설정
- [ ] 라즈베리파이 공인 IP 확인
- [ ] EC2 보안 그룹에 라즈베리파이 IP 추가
- [ ] 라즈베리파이 코드에서 EC2 URL 설정
- [ ] API 키 설정 (인증 사용 시)

### 7.5 테스트
- [ ] 브라우저에서 EC2 서버 접근 확인
- [ ] home/page.tsx에서 POST 요청 확인
- [ ] 라즈베리파이에서 GET 요청 확인
- [ ] 전구 제어 동작 확인

---

## 8. 트러블슈팅

### 8.1 라즈베리파이에서 EC2 접근 불가

**원인**:
- 보안 그룹에서 라즈베리파이 IP 허용 안됨
- 방화벽 설정
- EC2 서버가 실행되지 않음

**해결**:
```bash
# EC2 서버 상태 확인
pm2 status
# 또는
sudo systemctl status mood-manager

# 포트 확인
sudo netstat -tlnp | grep 3000

# 보안 그룹 확인
# EC2 콘솔에서 인바운드 규칙 확인
```

### 8.2 메모리 상태가 유지되지 않음

**원인**:
- PM2 재시작으로 인한 상태 초기화
- 서버 재부팅

**해결**:
- 데이터베이스 기반 상태 저장으로 변경 (장기적 해결책)
- 또는 PM2 클러스터 모드 사용 시 주의

### 8.3 인증 오류

**원인**:
- 라즈베리파이에서 인증 정보 미제공
- API 키 불일치

**해결**:
- 개발 환경에서는 인증 우회 (현재 코드)
- 프로덕션에서는 API 키 또는 IP 화이트리스트 설정

---

## 9. 요약

### EC2 배포 시 현재 구조
- ✅ **코드 변경 최소화**: 현재 구조가 EC2에서 작동함
- ✅ **메모리 상태 유지**: 서버리스가 아니므로 상태 유지됨
- ⚠️ **인증 추가 필요**: 라즈베리파이 인증 방식 추가
- ⚠️ **보안 그룹 설정**: 라즈베리파이 IP 허용
- ⚠️ **Elastic IP 할당**: 고정 IP 설정

### 권장 사항
1. **단기**: 현재 구조 유지, 인증 추가, 보안 그룹 설정
2. **장기**: 데이터베이스 기반 상태 저장으로 변경 (서버 재시작 시에도 상태 유지)

### 다음 단계
1. EC2 인스턴스 생성 및 Elastic IP 할당
2. 애플리케이션 배포
3. 라즈베리파이 인증 추가
4. 테스트 및 검증

