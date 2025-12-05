# 음악 메타데이터 마크다운 템플릿

이 문서는 음악 파일 및 이미지 파일 리네이밍 후 마크다운 데이터를 작성할 때 사용하는 템플릿입니다.

## 파일명 규칙

### MP3 파일
- **형식**: `{Genre}_{Number}.mp3`
- **예시**: `Balad_1.mp3`, `Pop_2.mp3`, `Carol_1.mp3`
- **위치**: `public/musics/{Genre}/`

### 이미지 파일
- **형식**: `{Title}.png` (공백 포함, 원본 제목 그대로)
- **예시**: `A glass of soju.png`, `All I want for christmas.png`
- **위치**: `public/musics_img/{Genre}/`
- **주의사항**: 하이픈(-)이나 언더스코어(_) 사용 금지, 공백 사용

## 마크다운 JSON 형식

각 노래마다 다음과 같은 JSON 블록을 작성하세요:

```json
{
  "title": "실제 노래 제목 (공백 포함, 원본 그대로)",
  "mp3": "장르/장르_번호.mp3",
  "png": "장르/이미지파일명.png",
  "artist": "아티스트 이름",
  "description": "노래에 대한 설명 (영문)",
  "duration": 실제_길이_초
}
```

## 예시

### Balad Songs

```json
{
  "title": "A glass of soju",
  "mp3": "Balad/Balad_1.mp3",
  "png": "Balad/A glass of soju.png",
  "artist": "Lim Changjung",
  "description": "A heartfelt ballad capturing the pain of love poured out like a glass of soju.",
  "duration": 291
}
```

```json
{
  "title": "Because I Don't Love You",
  "mp3": "Balad/Balad_2.mp3",
  "png": "Balad/Because I Don't Love You.png",
  "artist": "Onestar",
  "description": "A sorrowful confession of drifting feelings and the heartbreak of letting go.",
  "duration": 224
}
```

### Carol Songs

```json
{
  "title": "All I want for christmas",
  "mp3": "Carol/Carol_1.mp3",
  "png": "Carol/All I want for christmas.png",
  "artist": "Mariah Carey",
  "description": "A joyful classic celebrating the simple wish to be with the one you love for Christmas.",
  "duration": 242
}
```

```json
{
  "title": "Santa Claus Is Comin' to Town",
  "mp3": "Carol/Carol_7.mp3",
  "png": "Carol/Santa Claus Is Comin' to Town.png",
  "artist": "Mariah Carey",
  "description": "A festive, energetic rendition reminding everyone that Santa is on his way.",
  "duration": 205
}
```

## 필드 설명

### title
- **타입**: string
- **설명**: 실제 노래 제목 (공백 포함, 원본 그대로)
- **중요**: 이미지 파일명과 정확히 일치해야 함 (확장자 제외)
- **예시**: `"A glass of soju"`, `"Santa Claus Is Comin' to Town"`

### mp3
- **타입**: string
- **설명**: MP3 파일 경로
- **형식**: `{Genre}/{Genre}_{Number}.mp3`
- **예시**: `"Balad/Balad_1.mp3"`, `"Carol/Carol_7.mp3"`

### png
- **타입**: string
- **설명**: 이미지 파일 경로
- **형식**: `{Genre}/{Title}.png`
- **중요**: title 필드와 정확히 일치해야 함
- **예시**: `"Balad/A glass of soju.png"`, `"Carol/Santa Claus Is Comin' to Town.png"`

### artist
- **타입**: string
- **설명**: 아티스트 이름
- **예시**: `"Lim Changjung"`, `"Mariah Carey"`

### description
- **타입**: string
- **설명**: 노래에 대한 설명 (영문)
- **예시**: `"A heartfelt ballad capturing the pain of love poured out like a glass of soju."`

### duration
- **타입**: number
- **설명**: 노래 길이 (초 단위)
- **중요**: 실제 MP3 파일의 길이와 일치해야 함
- **예시**: `291`, `224`, `242`

## 체크리스트

마크다운 데이터 작성 전 확인사항:

- [ ] 모든 MP3 파일이 `{Genre}_{Number}.mp3` 형식인지 확인
- [ ] 모든 이미지 파일이 `{Title}.png` 형식인지 확인 (공백 포함)
- [ ] 이미지 파일명에 하이픈(-)이나 언더스코어(_)가 없는지 확인
- [ ] `title` 필드가 이미지 파일명과 정확히 일치하는지 확인 (확장자 제외)
- [ ] `mp3` 필드가 `{Genre}/{Genre}_{Number}.mp3` 형식인지 확인
- [ ] `png` 필드가 `{Genre}/{Title}.png` 형식인지 확인 (`title`과 일치)
- [ ] `duration`이 실제 MP3 길이와 일치하는지 확인

## 장르 목록

- **Balad**: 10-19 (musicID)
- **Pop**: 20-29 (musicID)
- **Classic**: 30-39 (musicID)
- **Jazz**: 40-49 (musicID)
- **Hiphop**: 50-59 (musicID)
- **Carol**: 60-69 (musicID)

각 장르당 최대 10곡까지 가능합니다.

