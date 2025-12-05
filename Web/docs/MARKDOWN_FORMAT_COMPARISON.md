# 마크다운 데이터 형식 비교

## 아까 제공하신 형식 (하이픈 사용)

```json
{
  "title": "A glass of soju",
  "mp3": "Balad/A-glass-of-soju.mp3",  // ❌ 하이픈 사용
  "png": "Balad/A-glass-of-soju.png",  // ❌ 하이픈 사용
  "artist": "Lim Changjung",
  "description": "A heartfelt ballad capturing the pain of love poured out like a glass of soju.",
  "duration": 291
}
```

## 제안한 형식 (실제 파일명에 맞춤)

```json
{
  "title": "A glass of soju",
  "mp3": "Balad/Balad_1.mp3",           // ✅ 숫자 형식 (실제 파일명)
  "png": "Balad/A glass of soju.png",   // ✅ 공백 사용 (실제 파일명)
  "artist": "Lim Changjung",
  "description": "A heartfelt ballad capturing the pain of love poured out like a glass of soju.",
  "duration": 291
}
```

## 차이점

### 1. MP3 파일명
- **아까 형식**: `A-glass-of-soju.mp3` (하이픈)
- **제안 형식**: `Balad_1.mp3` (숫자)
- **실제 파일**: `Balad_1.mp3` (숫자 형식)

**→ MP3는 숫자 형식으로 작성해야 함**

### 2. 이미지 파일명
- **아까 형식**: `A-glass-of-soju.png` (하이픈)
- **제안 형식**: `A glass of soju.png` (공백)
- **실제 파일**: `A glass of soju.png` (공백 사용)

**→ 이미지는 공백 형식으로 작성해야 함**

## 최종 작성 가이드

### MP3 파일명 규칙
- 형식: `{Genre}_{Number}.mp3`
- 예시: `Balad_1.mp3`, `Pop_2.mp3`, `Carol_1.mp3`
- **하이픈(-) 사용 금지, 언더스코어(_)와 숫자 사용**

### 이미지 파일명 규칙
- 형식: `{Title}.png` (공백 포함)
- 예시: `A glass of soju.png`, `All I want for christmas.png`
- **하이픈(-) 사용 금지, 공백 사용**

### 마크다운 JSON 작성 예시

```json
{
  "title": "A glass of soju",
  "mp3": "Balad/Balad_1.mp3",           // 실제 MP3 파일명
  "png": "Balad/A glass of soju.png",   // 실제 이미지 파일명 (공백)
  "artist": "Lim Changjung",
  "description": "A heartfelt ballad capturing the pain of love poured out like a glass of soju.",
  "duration": 291
}
```

## 요약

**아까 형식과의 차이**:
1. `mp3` 필드: 하이픈 → 숫자 형식 (`Balad_1.mp3`)
2. `png` 필드: 하이픈 → 공백 형식 (`A glass of soju.png`)

**파일 리네이밍이 필요한 경우**:
- MP3 파일은 이미 `Balad_1.mp3` 형식이므로 변경 불필요
- 이미지 파일은 이미 `A glass of soju.png` 형식이므로 변경 불필요
- **마크다운 데이터만 실제 파일명에 맞게 작성하면 됨**

