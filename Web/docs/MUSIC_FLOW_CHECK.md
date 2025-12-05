# 음악 플로우 점검 문서

## 현재 파일명 구조

### MP3 파일
- **위치**: `public/musics/{Genre}/`
- **형식**: `Title(Artist).mp3`
- **예시**: 
  - `public/musics/Classic/River flows in you(Yiruma).mp3`
  - `public/musics/Pop/Die with a Smile(Lady Gaga, Bruno Mars).mp3`

### 앨범 이미지
- **위치**: `public/musics_img/{Genre}/`
- **형식**: `Title.png`
- **예시**:
  - `public/musics_img/Classic/River flows in you.png`
  - `public/musics_img/Pop/Die with a smile.png`

## 전체 플로우

### 1. DB 데이터 입력 (`import-music-data.ts`)
```typescript
// musicData 배열에서:
{
  title: "River flows in you",
  artist: "Yiruma",
  genre: "Classic",
  fileName: "River flows in you(Yiruma).mp3"
}

// DB에 저장되는 값:
{
  name: "River flows in you - Yiruma",
  fileUrl: "/musics/Classic/River flows in you(Yiruma).mp3",
  albumImageUrl: "/musics_img/Classic/River flows in you.png"
}
```

### 2. LLM 프롬프트 (`optimizePromptForPython.ts`)
- `getAvailableMusicForLLM()`로 DB에서 실제 노래 목록 조회
- `formatMusicListForLLM()`로 프롬프트에 포함
- LLM이 정확한 제목 선택 (예: "River flows in you")

### 3. LLM 응답 매핑 (`mapMusicSelectionToTracks.ts`)
```typescript
// LLM 응답: musicSelection = "River flows in you"
// 1. 장르 추출 (세그먼트의 genre 사용)
// 2. DB에서 Sound 조회:
//    - genreId로 필터링
//    - name에 "River flows in you" 포함하는 레코드 찾기
// 3. 3개 노래 선택 (다양성 고려)
// 4. MusicTrack[] 생성:
{
  title: "River flows in you",
  artist: "Yiruma",
  fileUrl: "/musics/Classic/River flows in you(Yiruma).mp3",
  albumImageUrl: "/musics_img/Classic/River flows in you.png",
  duration: 180000, // 3분
  startOffset: 0,
  fadeIn: 750,
  fadeOut: 750
}
```

### 4. 프론트엔드 재생 (`useMusicTrackPlayer.ts`)
```typescript
// MusicTrack.fileUrl 사용
const trackUrl = track.fileUrl; // "/musics/Classic/River flows in you(Yiruma).mp3"
await musicPlayer.play(trackUrl);
```

### 5. 앨범 이미지 표시 (`AlbumSection.tsx`)
```typescript
// MusicTrack.albumImageUrl 사용
<Image src={albumImageUrl} /> // "/musics_img/Classic/River flows in you.png"
```

## 확인 사항

### ✅ 완료된 작업
1. **파일명 정리**: 모든 언더바 제거, 장르 태그 제거
2. **musicData 업데이트**: 실제 파일명 기준으로 자동 생성
3. **DB 스키마**: `albumImageUrl` 필드 추가
4. **import-music-data.ts**: 현재 파일명 구조에 맞게 수정

### ⚠️ 확인 필요
1. **파일 경로 일치**: 
   - DB `fileUrl`: `/musics/Classic/River flows in you(Yiruma).mp3`
   - 실제 파일: `public/musics/Classic/River flows in you(Yiruma).mp3`
   - ✅ Next.js에서 `public/` 폴더는 루트로 제공되므로 일치

2. **이미지 파일명 매칭**:
   - DB `albumImageUrl`: `/musics_img/Classic/River flows in you.png`
   - 실제 파일: `public/musics_img/Classic/River flows in you.png`
   - ⚠️ 대소문자 차이 가능성: "River flows in you" vs "River Flows In You"
   - → 대소문자 무시 매칭 필요할 수 있음

3. **LLM 매칭 정확도**:
   - LLM이 "River flows in you" 선택
   - DB에서 `name LIKE '%River flows in you%'` 검색
   - ✅ 정확한 매칭 가능

## 잠재적 문제점

### 1. 대소문자 불일치
- **문제**: 이미지 파일명이 "River Flows In You.png"일 수 있음
- **해결**: `mapMusicSelectionToTracks.ts`에서 대소문자 무시 매칭

### 2. 파일명 공백 차이
- **문제**: "River flows in you" vs "River  flows  in  you" (여러 공백)
- **해결**: 정규화 로직으로 해결됨

### 3. 아티스트 이름 차이
- **문제**: "Yiruma" vs "YIRUMA" vs "이루마"
- **현재**: DB에 저장된 정확한 이름 사용

## 테스트 체크리스트

### 로컬 테스트 시 확인:
1. ✅ DB에 `fileUrl`이 올바르게 저장되었는지
2. ✅ LLM이 실제 노래 목록에서 선택하는지
3. ✅ `mapMusicSelectionToTracks`가 정확한 Sound 레코드를 찾는지
4. ✅ `MusicTrack.fileUrl`이 실제 파일 경로와 일치하는지
5. ✅ 브라우저에서 `/musics/Classic/River flows in you(Yiruma).mp3` 접근 가능한지
6. ✅ 앨범 이미지가 올바르게 표시되는지
7. ✅ 음악이 실제로 재생되는지
8. ✅ 세그먼트 전환 시 페이드 효과가 작동하는지

## 다음 단계

1. **DB 재임포트**: `npx tsx scripts/import-music-data.ts` 실행
2. **로컬 테스트**: 전체 플로우 확인
3. **문제 발견 시**: 이 문서를 참고하여 수정

