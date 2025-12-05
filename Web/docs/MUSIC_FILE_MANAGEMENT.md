# 음악 파일 관리 전략

## 📋 개요

MP3 파일과 앨범 이미지를 효율적으로 관리하는 방법입니다.

## 🎯 권장 전략

### 옵션 1: 외부 스토리지 사용 (권장)

**GitHub에 올리지 않고, AWS S3 / Cloudinary / Firebase Storage 등 사용**

#### 장점
- ✅ GitHub 용량 부담 없음
- ✅ CDN으로 빠른 전송
- ✅ 버전 관리와 파일 관리 분리
- ✅ 배포 시 자동으로 파일 포함

#### 구조
```
Sound 테이블:
- fileUrl: "https://your-cdn.com/music/classic/river_flows_in_you.mp3"
- albumImageUrl: "https://your-cdn.com/albums/river_flows_in_you.jpg"
```

#### 구현 방법
1. S3/Cloudinary에 파일 업로드
2. 스크립트의 `fileUrl`을 CDN URL로 변경
3. `.gitignore`에 `public/music/` 추가 (로컬 개발용만)

---

### 옵션 2: 서버 직접 배포 (간단)

**GitHub에는 올리지 않고, 서버에 직접 배포**

#### 구조
```
Web/public/
├── music/
│   ├── classic/
│   │   ├── River_flows_in_you_Yiruma_Classic.mp3
│   │   └── ...
│   ├── pop/
│   ├── balad/
│   ├── hiphop/
│   ├── jazz/
│   └── carol/
└── albums/  (앨범 이미지)
    ├── River_flows_in_you_Yiruma_Classic.jpg
    └── ...
```

#### .gitignore 추가 (이미 완료)
```gitignore
# 음악 파일 (용량이 크므로 GitHub 제외)
Web/public/music/
Web/public/albums/
```

#### 배포 방법
1. 로컬에서 파일 준비
2. 서버(EC2)에 직접 `scp` 또는 `rsync`로 업로드
3. GitHub에는 코드만 push

---

## 📁 파일명 관리 규칙

### MP3 파일명 형식
```
{Title}_{Artist}_{Genre}.mp3
```

**예시:**
- `River_flows_in_you_Yiruma_Classic.mp3`
- `Stronger_Kanye_West_Hiphop.mp3`
- `Because_I_Don't_Love_You_Onestar_Balad.mp3`

### 앨범 이미지 파일명 형식
```
{Title}_{Artist}_{Genre}.jpg
```
(또는 `.png`, `.webp`)

**예시:**
- `River_flows_in_you_Yiruma_Classic.jpg`
- `Stronger_Kanye_West_Hiphop.jpg`

### 파일명 규칙
1. **공백 → 언더스코어(`_`)**
2. **특수문자 제거 또는 언더스코어로 변환**
3. **대소문자 구분** (일관성 유지)
4. **확장자 소문자** (`.mp3`, `.jpg`)

---

## 🗄️ DB 스키마 확장 (앨범 이미지 추가)

현재 `Sound` 테이블에 `albumImageUrl` 필드가 없습니다.

### Prisma 스키마 수정 필요

```prisma
model Sound {
  id             Int    @id @default(autoincrement())
  name           String
  fileUrl        String
  albumImageUrl  String?  // ← 추가
  duration       Int?
  genreId        Int?
  componentsJson Json?
  // ...
}
```

마이그레이션:
```bash
cd Web
npx prisma migrate dev --name add_album_image_url
```

---

## 🔧 스크립트 실행의 의미

### 스크립트가 하는 일

1. **Genre 생성**: 6개 장르 (Classic, Pop, Balad, Hiphop, Jazz, Carol)
2. **Sound 메타데이터 저장**: 
   - 노래 이름, 아티스트
   - `fileUrl` (파일 경로)
   - `albumImageUrl` (앨범 이미지 경로, 추가 시)
   - 설명, 무드 등

### 스크립트가 하지 않는 일

- ❌ 실제 MP3 파일 복사/이동
- ❌ 앨범 이미지 복사/이동
- ❌ 파일명 변경

→ **스크립트는 DB에 "어디에 파일이 있는지"만 기록합니다.**

### 실행 순서

1. **파일 준비**
   ```bash
   # MP3 파일을 public/music/{genre}/ 에 배치
   # 앨범 이미지를 public/albums/ 에 배치
   ```

2. **파일명 확인**
   - 스크립트의 `fileName`과 실제 파일명이 일치하는지 확인

3. **스크립트 실행**
   ```bash
   npx tsx scripts/import-music-data.ts
   ```
   → DB에 메타데이터 저장

4. **파일 배포** (옵션 2인 경우)
   ```bash
   # 서버에 파일 업로드
   scp -r public/music/ user@server:/path/to/app/public/
   scp -r public/albums/ user@server:/path/to/app/public/
   ```

---

## 📝 권장 워크플로우

### 개발 환경 (로컬)

1. `Web/public/music/` 폴더에 MP3 파일 배치
2. `Web/public/albums/` 폴더에 앨범 이미지 배치
3. 스크립트 실행 → DB에 메타데이터 저장
4. `.gitignore`에 `public/music/`, `public/albums/` 추가 (이미 완료)

### 프로덕션 환경 (서버)

**옵션 A: 외부 스토리지**
- S3/Cloudinary에 파일 업로드
- 스크립트의 `fileUrl`을 CDN URL로 수정 후 재실행

**옵션 B: 서버 직접 배포**
- 서버에 파일 직접 업로드 (`scp`, `rsync` 등)
- GitHub에는 코드만 push

---

## ⚠️ 주의사항

1. **파일명 일치**: 스크립트의 `fileName`과 실제 파일명이 정확히 일치해야 함
2. **용량 관리**: GitHub에 올리지 않도록 `.gitignore` 확인 (이미 추가됨)
3. **경로 일관성**: `fileUrl`은 `/music/{genre}/{fileName}` 형식 유지
4. **앨범 이미지**: 현재 스키마에 필드 없음 → 추가 필요 시 마이그레이션 필요

---

## 🎵 현재 파일 구조 (예시)

```
Web/public/
├── music/
│   ├── classic/
│   │   ├── River_flows_in_you_Yiruma_Classic.mp3
│   │   └── ...
│   ├── pop/
│   ├── balad/
│   ├── hiphop/
│   ├── jazz/
│   └── carol/
└── albums/  (추가 예정)
    ├── River_flows_in_you_Yiruma_Classic.jpg
    └── ...
```

---

## 🔄 스크립트 수정 예시 (앨범 이미지 추가 시)

```typescript
const fileUrl = `/music/${music.genre.toLowerCase()}/${music.fileName}`;
const albumImageUrl = `/albums/${music.fileName.replace('.mp3', '.jpg')}`;

sound = await prisma.sound.create({
  data: {
    name: `${music.title} - ${music.artist}`,
    fileUrl,
    albumImageUrl,  // ← 추가
    genreId: genreId,
    componentsJson: componentsJson,
  },
});
```

---

## 📌 요약

### 질문 답변

1. **MP3 파일을 GitHub에 올려야 하나요?**
   - ❌ 아니요. `.gitignore`에 추가되어 있어서 GitHub에는 올라가지 않습니다.
   - 서버에 직접 배포하거나 외부 스토리지(S3 등) 사용을 권장합니다.

2. **앨범 이미지는 어떻게 관리하나요?**
   - MP3와 동일한 방식: `public/albums/` 폴더에 배치
   - 파일명: `{Title}_{Artist}_{Genre}.jpg`
   - DB에 `albumImageUrl` 필드 추가 필요 (마이그레이션)

3. **스크립트 실행은 무엇을 하나요?**
   - DB에 **메타데이터만 저장** (파일 경로, 이름, 설명 등)
   - 실제 파일은 **별도로 배치**해야 합니다.

4. **파일명은 어떻게 관리하나요?**
   - 형식: `{Title}_{Artist}_{Genre}.mp3`
   - 스크립트의 `fileName`과 실제 파일명이 **정확히 일치**해야 합니다.
