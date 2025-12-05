# 음악 데이터 임포트 가이드

## 📋 개요

60개의 음악 파일을 DB에 임포트하는 방법입니다.

## 📁 MP3 파일 배치 위치

MP3 파일을 다음 폴더 구조로 배치하세요:

```
Web/public/music/
├── classic/
│   ├── River_flows_in_you_Yiruma_Classic.mp3
│   ├── Kiss_the_rain_Yiruma_Classic.mp3
│   └── ...
├── pop/
│   ├── Die_with_a_Smile_Lady_Gaga_Bruno_Mars_Pop.mp3
│   ├── Peaches_Justin_Bieber_Pop.mp3
│   └── ...
├── balad/
│   ├── Because_I_Don't_Love_You_Onestar_Balad.mp3
│   ├── Memories_of_the_Wind_Naul_Balad.mp3
│   └── ...
├── hiphop/
│   ├── Not_like_us_Kendrick_Lamar_Hiphop.mp3
│   ├── FE!N_Travis_Scott_Hiphop.mp3
│   └── ...
├── jazz/
│   ├── Fly_me_to_the_moon_Frank_Sinatra_Jazz.mp3
│   ├── Don't_worry_be_happy_Bobby_McFerrin_Jazz.mp3
│   └── ...
└── carol/
    ├── Santa_Claus_Is_Comin'_to_Town_Mariah_Carey_Carol.mp3
    ├── All_I_want_for_christmas_Mariah_Carey_Carol.mp3
    └── ...
```

## 📝 파일명 규칙

파일명 형식: `{Title}_{Artist}_{Genre}.mp3`

- 공백은 언더스코어(`_`)로 변환
- 특수문자는 가능한 한 제거하거나 언더스코어로 변환
- 예시:
  - `River flows in you` → `River_flows_in_you`
  - `Don't worry be happy` → `Don't_worry_be_happy` (아포스트로피는 유지 가능)

## 🚀 임포트 실행

### 1. 폴더 생성

```bash
cd Web
mkdir -p public/music/{classic,pop,balad,hiphop,jazz,carol}
```

### 2. MP3 파일 복사

각 장르 폴더에 해당하는 MP3 파일을 복사하세요.

**현재 Balad 폴더에 있는 파일들:**
- `title.mp3` 형식으로 되어 있다면, 스크립트의 `fileName`에 맞게 이름을 변경하거나
- 스크립트를 수정하여 실제 파일명에 맞춰야 합니다.

### 3. 스크립트 실행

```bash
cd Web
npx tsx scripts/import-music-data.ts
```

또는:

```bash
cd Web
npm install -D tsx
npx tsx scripts/import-music-data.ts
```

## 📊 데이터 구조

### Genre 테이블
- `Classic`, `Pop`, `Balad`, `Hiphop`, `Jazz`, `Carol` 6개 장르 자동 생성

### Sound 테이블
각 음악은 다음 정보로 저장됩니다:
- `name`: "{Title} - {Artist}" 형식
- `fileUrl`: "/music/{genre}/{fileName}.mp3"
- `genreId`: Genre 테이블 참조
- `componentsJson`: 
  ```json
  {
    "genre": "classic",
    "artist": "Yiruma",
    "mood": "calm"
  }
  ```

### Mood 자동 추출
설명(description)에서 자동으로 무드를 추출합니다:
- `calm`: "calm", "peaceful", "gentle"
- `energetic`: "energetic", "high-energy", "celebration"
- `sad`: "sad", "pain", "heartbreak", "regret"
- `romantic`: "love", "romantic", "affection"
- `confident`: "confident", "triumphant", "strong"
- `neutral`: 위에 해당하지 않는 경우

## ⚠️ 주의사항

1. **파일명 일치**: 스크립트의 `fileName`과 실제 MP3 파일명이 정확히 일치해야 합니다.
2. **중복 체크**: 같은 이름의 Sound가 이미 있으면 `upsert`로 업데이트됩니다.
3. **파일 경로**: `fileUrl`은 `/music/{genre}/{fileName}` 형식입니다. Next.js의 `public` 폴더 기준입니다.

## 🔧 파일명이 다른 경우

현재 Balad 폴더에 `title.mp3` 형식으로 되어 있다면:

1. **옵션 1**: 파일명을 스크립트에 맞게 변경
2. **옵션 2**: 스크립트의 `fileName`을 실제 파일명에 맞게 수정

예를 들어, Balad 폴더에 `Because_I_Don't_Love_You_(Onestar)_Balad.mp3`가 있다면:
- 스크립트의 `fileName`을 `"Because_I_Don't_Love_You_(Onestar)_Balad.mp3"`로 수정

## 📋 체크리스트

- [ ] `Web/public/music/` 폴더 구조 생성
- [ ] 각 장르별 MP3 파일 복사 (60개)
- [ ] 파일명이 스크립트의 `fileName`과 일치하는지 확인
- [ ] `npx tsx scripts/import-music-data.ts` 실행
- [ ] DB에 데이터가 정상적으로 들어갔는지 확인 (Prisma Studio 또는 직접 쿼리)

## 🎵 음악 목록 요약

- **Classic**: 10개
- **Pop**: 10개
- **Balad**: 10개
- **Hiphop**: 10개
- **Jazz**: 10개
- **Carol**: 10개

**총 60개**

