# 데이터베이스 마이그레이션 가이드

## PostgreSQL 전환 및 어드민 설정

### 1. Prisma 스키마 변경 완료

- ✅ `provider = "mysql"` → `provider = "postgresql"` 변경
- ✅ User 모델에 `isAdmin Boolean @default(false)` 필드 추가
- ✅ PostgreSQL 타입에 맞게 스키마 수정

### 2. 환경 변수 설정

`.env.local` 또는 배포 환경에 다음 환경 변수 추가:

**⚠️ 주의: 데이터베이스 이름 확인 필요**

제공된 정보에는 데이터베이스 이름이 없었습니다. 다음 중 하나를 확인하세요:

1. **기본 데이터베이스 사용** (일반적으로 `postgres`):
```env
DATABASE_URL="postgresql://postgres:moodmanagerrds@mood-manager-db.cd4iisicagg0.ap-northeast-2.rds.amazonaws.com:5432/postgres?sslmode=require"
```

2. **실제 데이터베이스 이름 확인**:
```bash
psql -U postgres -h mood-manager-db.cd4iisicagg0.ap-northeast-2.rds.amazonaws.com -p 5432
# 비밀번호: moodmanagerrds

# 연결 후 데이터베이스 목록 확인
\l
# 또는
SELECT datname FROM pg_database;
```

확인한 데이터베이스 이름으로 `DATABASE_URL`의 마지막 부분을 변경하세요:
```env
DATABASE_URL="postgresql://postgres:moodmanagerrds@mood-manager-db.cd4iisicagg0.ap-northeast-2.rds.amazonaws.com:5432/[실제DB이름]?sslmode=require"
```

### 3. 마이그레이션 실행

```bash
cd Web
npx prisma migrate dev --name init_postgresql
```

프로덕션 환경의 경우:
```bash
npx prisma migrate deploy
```

### 4. Prisma Client 재생성

```bash
npx prisma generate
```

### 5. 어드민 계정 설정

DB에 어드민 계정이 있는 경우:

```sql
UPDATE "User" SET "isAdmin" = true WHERE email = 'admin@moodmanager.com';
```

또는 새 어드민 계정 생성:

```sql
UPDATE "User" SET "isAdmin" = true WHERE id = 'user-id-here';
```

### 6. checkMockMode 함수 변경

`checkMockMode` 함수가 이제 `async` 함수로 변경되었습니다. 모든 사용처에 `await`를 추가해야 합니다.

**변경이 필요한 파일:**
- `Web/src/app/api/ai/background-params/route.ts`
- `Web/src/app/api/moods/current/generate/route.ts`
- `Web/src/app/api/preferences/route.ts`
- `Web/src/app/api/moods/saved/route.ts`
- `Web/src/app/api/moods/saved/[savedMoodId]/route.ts`
- `Web/src/app/api/moods/current/route.ts`
- `Web/src/app/api/moods/current/refresh/route.ts`
- `Web/src/app/api/devices/route.ts`
- `Web/src/app/api/devices/[deviceId]/route.ts`
- `Web/src/app/api/auth/survey-status/route.ts`
- `Web/src/app/api/auth/survey-skip/route.ts`
- `Web/src/app/api/auth/profile/route.ts`

**변경 예시:**
```typescript
// 변경 전
if (checkMockMode(session)) {
  // ...
}

// 변경 후
if (await checkMockMode(session)) {
  // ...
}
```

### 7. DB 연결 테스트 및 데이터베이스 이름 확인

```bash
psql -U postgres -h mood-manager-db.cd4iisicagg0.ap-northeast-2.rds.amazonaws.com -p 5432
# 비밀번호: moodmanagerrds
```

연결 후 데이터베이스 목록 확인:
```sql
\l
-- 또는
SELECT datname FROM pg_database;
```

확인한 데이터베이스 이름으로 `DATABASE_URL`을 업데이트한 후, 해당 데이터베이스에 연결:
```sql
\c [데이터베이스이름]
```

연결 후 테이블 확인:
```sql
\dt
SELECT * FROM "User" LIMIT 5;
```

