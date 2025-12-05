# 플로우 상태 점검

## ✅ 완료된 부분

### 1. DB 데이터 구조
- ✅ `Sound` 모델에 `albumImageUrl` 필드 추가됨
- ✅ `import-music-data.ts`가 실제 파일명 기준으로 수정됨
- ⚠️ **필요**: `npx tsx scripts/import-music-data.ts` 실행하여 DB에 데이터 입력 필요

### 2. LLM 프롬프트
- ✅ `getAvailableMusicForLLM()`: DB에서 실제 노래 목록 조회
- ✅ `formatMusicListForLLM()`: 프롬프트에 포함
- ✅ `optimizePromptForPython.ts`에서 실제 노래 목록을 LLM에 전달

### 3. 음악 매핑
- ✅ `mapMusicSelectionToTracks()`: LLM의 `musicSelection`을 DB Sound로 매핑
- ✅ 유연한 매칭 (대소문자 무시, 공백 정규화)
- ✅ `streamHandler.ts`에서 각 세그먼트의 `musicSelection`을 `musicTracks`로 변환

### 4. 프론트엔드 재생
- ✅ `useMusicTrackPlayer`: 세그먼트의 `musicTracks`를 순차 재생
- ✅ `MusicPlayer`: HTMLAudioElement로 실제 오디오 재생
- ✅ `MoodDashboard`: `useMusicTrackPlayer` 사용하여 재생 제어

## ⚠️ 확인 필요 사항

### 1. DB 데이터 입력
```bash
cd Web
npx tsx scripts/import-music-data.ts
```
- 실행 후 60개 음악 데이터가 DB에 입력되어야 함
- `fileUrl`과 `albumImageUrl`이 올바르게 저장되어야 함

### 2. 파일 경로 확인
- MP3 파일: `public/musics/{Genre}/{Title(Artist).mp3}`
- 이미지 파일: `public/musics_img/{Genre}/{Title}.png`
- DB의 `fileUrl`과 실제 파일 경로가 일치해야 함

### 3. LLM 응답 확인
- LLM이 실제 노래 목록에서만 선택하는지 확인
- `musicSelection`이 DB에 있는 제목과 일치하는지 확인

### 4. 실제 재생 확인
- 브라우저 콘솔에서 `[MusicPlayer] Playing:` 로그 확인
- 오디오 파일이 실제로 로드되는지 확인
- 페이드인/아웃이 작동하는지 확인

## 🔄 전체 플로우

```
1. DB 데이터 입력
   └─> npx tsx scripts/import-music-data.ts
   └─> 60개 음악 데이터가 Sound 테이블에 저장

2. 무드스트림 생성 요청
   └─> /api/moods/current 또는 /api/ai/background-params
   └─> streamHandler.ts 실행

3. LLM 프롬프트 생성
   └─> getAvailableMusicForLLM() → DB에서 실제 노래 목록 조회
   └─> formatMusicListForLLM() → 프롬프트에 포함
   └─> LLM이 실제 노래 목록 중에서 선택

4. LLM 응답 처리
   └─> validateAndNormalizeResponse() → 응답 검증
   └─> mapMusicSelectionToTracks() → musicSelection을 musicTracks로 변환
   └─> 각 세그먼트에 musicTracks 배열 추가

5. 프론트엔드 전달
   └─> moodStream.segments[].musicTracks
   └─> MoodDashboard에서 useMoodStreamContext()로 접근

6. 음악 재생
   └─> useMusicTrackPlayer({ segment: currentSegment, playing })
   └─> MusicPlayer.play(track.fileUrl)
   └─> HTMLAudioElement로 실제 재생
```

## 🧪 테스트 체크리스트

### 1단계: DB 확인
- [ ] `npx tsx scripts/import-music-data.ts` 실행
- [ ] DB에 60개 Sound 레코드가 있는지 확인
- [ ] `fileUrl`과 `albumImageUrl`이 올바른지 확인

### 2단계: API 확인
- [ ] `/api/moods/current` 호출 시 `moodStream`에 `musicTracks`가 포함되는지
- [ ] 각 `musicTrack`에 `fileUrl`이 있는지
- [ ] `fileUrl`이 실제 파일 경로와 일치하는지

### 3단계: 프론트엔드 확인
- [ ] `/home` 페이지 접속
- [ ] 브라우저 콘솔에서 `[MusicPlayer] Playing:` 로그 확인
- [ ] 실제로 음악이 재생되는지 확인
- [ ] 앨범 이미지가 표시되는지 확인

## 🐛 예상 문제점

1. **DB 데이터 없음**
   - 해결: `npx tsx scripts/import-music-data.ts` 실행

2. **파일 경로 불일치**
   - DB: `/musics/Classic/River flows in you(Yiruma).mp3`
   - 실제: `public/musics/Classic/River flows in you(Yiruma).mp3`
   - Next.js는 `public/`을 루트로 제공하므로 일치해야 함

3. **LLM이 잘못된 제목 선택**
   - `getAvailableMusicForLLM()`이 제대로 작동하는지 확인
   - 프롬프트에 실제 노래 목록이 포함되는지 확인

4. **오디오 재생 실패**
   - 브라우저 콘솔에서 에러 확인
   - CORS 문제일 수 있음 (로컬에서는 문제 없어야 함)
   - 파일이 실제로 존재하는지 확인

## 📝 다음 단계

1. **DB 데이터 입력**: `npx tsx scripts/import-music-data.ts` 실행
2. **로컬 테스트**: `/home` 페이지에서 음악 재생 확인
3. **문제 발견 시**: 콘솔 로그와 함께 알려주시면 수정하겠습니다

