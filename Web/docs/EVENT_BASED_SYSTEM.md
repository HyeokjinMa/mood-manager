# 이벤트 기반 아이콘/음악 시스템

## 개요

날짜 기반 특별 이벤트(크리스마스, 신년 등)를 감지하여, 해당 이벤트에 맞는 **다양한 아이콘 세트**를 배경에 흩날리게 하고, **이벤트별 음악 카테고리**를 LLM에 주입하여 맞춤형 음악을 추천받는 시스템.

---

## 1. 이벤트 감지 시스템

### 1.1 지원 이벤트

| 이벤트 | 기간 | 아이콘 세트 | 음악 카테고리 |
|--------|------|------------|--------------|
| **크리스마스** | 12월 1일 ~ 12월 31일 | 🎄 ❄️ ⭐ 🎁 🔔 🕯️ ⛄ 🎅 | `christmas_carol` |
| **신년** | 1월 1일 ~ 1월 7일 | 🎆 🎇 ✨ 🎊 🎉 🌟 💫 🎈 | `newyear_celebration` |
| **발렌타인** | 2월 14일 | 💕 💖 💗 🌹 💐 💝 🎀 💌 | `romantic` |
| **할로윈** | 10월 31일 | 🎃 👻 🦇 🕷️ 🕸️ 🧙 ⚰️ 🌙 | `mysterious` |
| **봄** | 3월 ~ 5월 | 🌸 🌺 🌷 🌼 🦋 🐝 🌿 🍃 | `spring` |
| **여름** | 6월 ~ 8월 | ☀️ 🌊 🏖️ 🌴 🍉 🍦 🌻 🦋 | `summer` |
| **가을** | 9월 ~ 11월 | 🍂 🍁 🌾 🍎 🌰 🦔 🍇 🌙 | `autumn` |
| **겨울** | 12월, 1월, 2월 | ❄️ ⛄ 🌨️ 🧊 🔥 ☕ 🧣 🎄 | `winter` |

### 1.2 구현 위치

- **파일**: `src/lib/events/detectEvents.ts`
- **함수**: `detectCurrentEvent(date?: Date): EventInfo | null`
- **LLM 입력 통합**: `src/lib/llm/prepareLLMInput.ts`에서 자동 감지 후 `event` 필드에 추가

---

## 2. 아이콘 다양화 구현

### 2.1 현재 상태

- **현재**: 향 타입별로 **단일 아이콘 모양**만 사용 (예: Floral → 꽃잎, Marine → 물방울)
- **목표**: 이벤트 감지 시 **여러 아이콘을 조화롭게 혼합**하여 흩날리기

### 2.2 구현 방안

#### Phase 1: 이벤트 아이콘 세트 정의
```typescript
// src/lib/events/detectEvents.ts
export interface EventInfo {
  iconSet: string[]; // ["🎄", "❄️", "⭐", "🎁", ...]
  // ...
}
```

#### Phase 2: ScentBackground 컴포넌트 확장
- **현재**: `scentType`에 따라 단일 모양만 그리기
- **변경**: `event?.iconSet`이 있으면 **랜덤으로 여러 아이콘 혼합**
- **구현 위치**: `src/components/ui/ScentBackground/index.tsx`

```typescript
// 파티클 생성 시
const iconSet = event?.iconSet || [getDefaultIconForScent(scentType)];
const randomIcon = iconSet[Math.floor(Math.random() * iconSet.length)];

// 이모지를 Canvas에 렌더링하거나, 아이콘 SVG로 변환
drawEventIcon(ctx, randomIcon, particle.size, particleColor);
```

#### Phase 3: 이모지 → Canvas 렌더링
- **옵션 1**: 이모지 텍스트를 Canvas에 직접 그리기 (`ctx.fillText()`)
- **옵션 2**: 이모지를 SVG 아이콘으로 매핑 (예: 🎄 → `FaTree`, ❄️ → `FaSnowflake`)
- **권장**: **옵션 2** (일관된 스타일, 크기 조절 용이)

---

## 3. 음악 카테고리 확장

### 3.1 현재 음악 장르

기존 장르: `classical`, `jazz`, `pop`, `rock`, `electronic_dance`, `hiphop_rap`, `rnb_soul`, `folk`, `reggae`, `newage`, `else`

### 3.2 이벤트 음악 카테고리 추가

| 카테고리 | 설명 | 예시 |
|---------|------|------|
| `christmas_carol` | 크리스마스 캐롤 (한국/외국) | "고요한 밤", "Jingle Bells", "All I Want for Christmas" |
| `newyear_celebration` | 신년 축하 음악 | "Auld Lang Syne", "새해 복 많이 받으세요" |
| `romantic` | 로맨틱 음악 | 발렌타인 데이용 |
| `mysterious` | 신비로운 음악 | 할로윈용 |
| `spring` / `summer` / `autumn` / `winter` | 계절별 음악 | 계절감 있는 음악 |

### 3.3 LLM 프롬프트 주입

```typescript
// src/lib/llm/prepareLLMInput.ts
const llmInput: LLMInput = {
  // ... 기존 필드
  event: {
    type: "christmas",
    name: "Christmas Season",
    description: "크리스마스 시즌 - 캐롤과 겨울 분위기",
    musicCategory: "christmas_carol", // ← LLM에 전달
    iconSet: ["🎄", "❄️", ...],
  },
};
```

**LLM 프롬프트 예시**:
```
현재 이벤트: Christmas Season - 크리스마스 시즌 - 캐롤과 겨울 분위기
음악 카테고리: christmas_carol
아이콘: 🎄, ❄️, ⭐, 🎁, 🔔, 🕯️, ⛄, 🎅

이 이벤트에 맞는 크리스마스 캐롤이나 겨울 분위기의 음악을 추천해주세요.
한국 캐롤과 외국 유명 캐롤을 모두 고려해주세요.
```

---

## 4. Spotify / YouTube Music API 통합 방안

### 4.1 Spotify Web API

#### 장점
- ✅ **풍부한 메타데이터**: 아티스트, 앨범, 장르, 태그, 인기도 등
- ✅ **검색 API**: 키워드/장르/태그로 검색 가능
- ✅ **재생 목록 API**: 이벤트별 플레이리스트 생성 가능
- ✅ **Web Playback SDK**: 웹에서 직접 재생 가능 (유료 플랜 필요)

#### 제약사항
- ❌ **Web Playback SDK 제한**: Premium 사용자만 재생 가능
- ❌ **API Rate Limit**: 분당 50~100 요청
- ❌ **인증 복잡도**: OAuth 2.0, Refresh Token 관리 필요

#### 구현 방안

**Phase 1: 검색 및 메타데이터만 사용 (V2-M1)**
```typescript
// 1. LLM이 추천한 음악 제목/아티스트를 Spotify API로 검색
const searchResult = await spotifyApi.searchTracks(
  `track:"${llmRecommendedTitle}" artist:"${llmRecommendedArtist}"`,
  { limit: 1 }
);

// 2. 트랙 ID, 프리뷰 URL, 앨범 아트 등 메타데이터 저장
const trackInfo = {
  spotifyId: searchResult.tracks.items[0].id,
  previewUrl: searchResult.tracks.items[0].preview_url, // 30초 미리듣기
  albumArt: searchResult.tracks.items[0].album.images[0].url,
  externalUrl: searchResult.tracks.items[0].external_urls.spotify,
};

// 3. UI에 표시 (앨범 아트, 제목, 아티스트)
// 4. 실제 재생은 로컬 MP3 파일 또는 YouTube Music으로 대체
```

**Phase 2: Web Playback SDK 통합 (V2-M2, Premium 사용자 대상)**
```typescript
// Spotify Web Playback SDK 초기화
const player = new Spotify.Player({
  name: "Mood Manager",
  getOAuthToken: (cb) => {
    cb(accessToken);
  },
});

// 트랙 재생
await player.addListener("ready", ({ device_id }) => {
  fetch(`https://api.spotify.com/v1/me/player/play?device_id=${device_id}`, {
    method: "PUT",
    body: JSON.stringify({ uris: [`spotify:track:${trackId}`] }),
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
});
```

---

### 4.2 YouTube Music API

#### 현황
- ⚠️ **공식 API 없음**: YouTube Data API v3만 존재 (Music 전용 API 없음)
- ⚠️ **재생 제한**: 웹에서 직접 재생하려면 YouTube IFrame Player API 사용 (광고 포함)

#### 대안: YouTube Data API v3

**장점**:
- ✅ **무료**: API 키만 있으면 사용 가능
- ✅ **검색 가능**: "크리스마스 캐롤", "Jingle Bells" 등으로 검색
- ✅ **메타데이터**: 제목, 채널, 썸네일, 재생 시간 등

**제약사항**:
- ❌ **재생 제한**: 웹에서 재생하려면 YouTube IFrame Player API 사용 (광고 포함)
- ❌ **Music 전용 필터 없음**: 일반 YouTube 동영상도 검색됨

#### 구현 방안

**Phase 1: 검색 및 메타데이터만 사용 (V2-M1)**
```typescript
// YouTube Data API v3로 검색
const searchResult = await youtube.search.list({
  part: ["snippet"],
  q: `${llmRecommendedTitle} ${llmRecommendedArtist} music`,
  type: "video",
  maxResults: 1,
});

const videoInfo = {
  videoId: searchResult.data.items[0].id.videoId,
  title: searchResult.data.items[0].snippet.title,
  thumbnail: searchResult.data.items[0].snippet.thumbnails.medium.url,
  channelTitle: searchResult.data.items[0].snippet.channelTitle,
  youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
};

// UI에 표시 (썸네일, 제목)
// 실제 재생은 로컬 MP3 파일로 대체 (V2-M1)
```

**Phase 2: IFrame Player API 통합 (V2-M2)**
```typescript
// YouTube IFrame Player API 로드
const player = new YT.Player("youtube-player", {
  height: "0",
  width: "0",
  videoId: videoId,
  playerVars: {
    autoplay: 1,
    controls: 0,
    modestbranding: 1,
  },
  events: {
    onReady: (event) => {
      event.target.playVideo();
    },
  },
});
```

---

## 5. 음악 파트 벨류업 로드맵

### V2-M1: 로컬 MP3 파일 매핑 (우선순위 높음)

**목표**: LLM 추천 음악 제목을 로컬 MP3 파일과 매핑하여 재생

**구현**:
1. **태그별 10개씩 더미 MP3 파일 준비** (현재 요청사항)
   - 예: `music/christmas_carol/01_jingle_bells.mp3`, `music/christmas_carol/02_silent_night.mp3`
2. **LLM 추천 제목 → 파일명 매핑 테이블**
   ```typescript
   const musicMapping: Record<string, string> = {
     "Jingle Bells": "/music/christmas_carol/01_jingle_bells.mp3",
     "고요한 밤": "/music/christmas_carol/02_silent_night.mp3",
     // ...
   };
   ```
3. **Audio API로 재생**
   ```typescript
   const audio = new Audio(musicMapping[llmRecommendedTitle] || fallbackFile);
   audio.play();
   ```

**장점**:
- ✅ **즉시 구현 가능**: 외부 API 의존성 없음
- ✅ **광고 없음**: 깨끗한 재생 경험
- ✅ **오프라인 가능**: 파일만 있으면 동작

**단점**:
- ❌ **제한적**: 로컬에 있는 파일만 재생 가능
- ❌ **저장 공간**: 많은 음악 파일 필요

---

### V2-M2: Spotify / YouTube Music API 통합 (우선순위 중간)

**목표**: 외부 API로 음악 검색 및 재생

**구현 순서**:
1. **Spotify Web API 통합** (메타데이터 + 프리뷰)
   - 검색 API로 트랙 찾기
   - 앨범 아트, 프리뷰 URL 표시
   - Premium 사용자는 Web Playback SDK로 재생
2. **YouTube Music 대안** (YouTube Data API v3)
   - 검색 API로 동영상 찾기
   - IFrame Player API로 재생 (광고 포함)

**장점**:
- ✅ **무한한 음악 라이브러리**: API에서 검색 가능
- ✅ **최신 음악**: 실시간 업데이트

**단점**:
- ❌ **API 의존성**: 네트워크 필수
- ❌ **인증 복잡도**: OAuth, 토큰 관리 필요
- ❌ **비용**: Spotify Premium 또는 YouTube Premium 필요 (재생 시)

---

### V2-M3: 하이브리드 방식 (우선순위 낮음)

**목표**: 로컬 파일 우선, 없으면 API 검색

**구현**:
```typescript
async function playMusic(llmRecommendedTitle: string) {
  // 1. 로컬 파일 먼저 확인
  const localFile = musicMapping[llmRecommendedTitle];
  if (localFile && await fileExists(localFile)) {
    return playLocalFile(localFile);
  }
  
  // 2. 없으면 Spotify API 검색
  const spotifyTrack = await searchSpotify(llmRecommendedTitle);
  if (spotifyTrack?.preview_url) {
    return playPreview(spotifyTrack.preview_url); // 30초 미리듣기
  }
  
  // 3. 그래도 없으면 YouTube 검색
  const youtubeVideo = await searchYouTube(llmRecommendedTitle);
  if (youtubeVideo) {
    return playYouTubeVideo(youtubeVideo.videoId);
  }
  
  // 4. 모두 실패 시 기본 음악 재생
  return playDefaultMusic();
}
```

---

## 6. 구현 체크리스트

### Phase 1: 이벤트 감지 및 LLM 통합 ✅
- [x] `detectEvents.ts` 생성
- [x] `prepareLLMInput.ts`에 `event` 필드 추가
- [ ] LLM 프롬프트에 이벤트 정보 주입 확인

### Phase 2: 아이콘 다양화
- [ ] `ScentBackground` 컴포넌트에 `event?.iconSet` 지원 추가
- [ ] 이모지 → Canvas 렌더링 또는 SVG 아이콘 매핑
- [ ] 여러 아이콘 랜덤 혼합 로직

### Phase 3: 음악 카테고리 확장
- [ ] LLM 프롬프트에 `event.musicCategory` 주입
- [ ] LLM 응답에서 이벤트 음악 추천 확인

### Phase 4: 로컬 MP3 매핑 (V2-M1)
- [ ] 태그별 10개씩 더미 MP3 파일 준비
- [ ] 제목 → 파일명 매핑 테이블 생성
- [ ] Audio API 재생 로직

### Phase 5: 외부 API 통합 (V2-M2)
- [ ] Spotify Web API 인증 설정
- [ ] 검색 API 통합
- [ ] Web Playback SDK 통합 (선택)
- [ ] YouTube Data API v3 통합 (대안)

---

## 7. 참고 자료

- [Spotify Web API Documentation](https://developer.spotify.com/documentation/web-api)
- [Spotify Web Playback SDK](https://developer.spotify.com/documentation/web-playback-sdk)
- [YouTube Data API v3](https://developers.google.com/youtube/v3)
- [YouTube IFrame Player API](https://developers.google.com/youtube/iframe_api_reference)

