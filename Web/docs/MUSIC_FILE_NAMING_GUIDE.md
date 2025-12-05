# 음악/이미지 파일 네이밍 가이드

## 📋 현재 문제

터미널 로그에서 확인된 문제:
- `[mapMusicIDToTrack] musicID를 찾을 수 없음` - JSON에 데이터 부족
- `GET /musics/Carol/Last%20Christmas(Wham!).mp3 404` - 파일명 불일치

## ✅ 올바른 파일 네이밍 규칙

### MP3 파일 (이미 올바름)
```
public/musics/{Genre}/{Genre}_{Number}.mp3
```

**예시:**
- `public/musics/Balad/Balad_1.mp3`
- `public/musics/Balad/Balad_2.mp3`
- `public/musics/Pop/Pop_1.mp3`
- `public/musics/Carol/Carol_1.mp3`

### 이미지 파일 (리네이밍 필요)
```
public/musics_img/{Genre}/{Genre}_{Number}.png
```

**예시:**
- `public/musics_img/Balad/Balad_1.png`
- `public/musics_img/Balad/Balad_2.png`
- `public/musics_img/Pop/Pop_1.png`
- `public/musics_img/Carol/Carol_1.png`

## 🎯 musicID 할당 규칙

| 장르 | musicID 범위 | 파일명 예시 |
|------|-------------|------------|
| Balad | 10-19 | `Balad_1.mp3` (musicID: 10), `Balad_2.mp3` (musicID: 11) |
| Pop | 20-29 | `Pop_1.mp3` (musicID: 20), `Pop_2.mp3` (musicID: 21) |
| Classic | 30-39 | `Classic_1.mp3` (musicID: 30), `Classic_2.mp3` (musicID: 31) |
| Jazz | 40-49 | `Jazz_1.mp3` (musicID: 40), `Jazz_2.mp3` (musicID: 41) |
| Hiphop | 50-59 | `Hiphop_1.mp3` (musicID: 50), `Hiphop_2.mp3` (musicID: 51) |
| Carol | 60-69 | `Carol_1.mp3` (musicID: 60), `Carol_2.mp3` (musicID: 61) |

## 📝 리네이밍 예시

### 현재 (잘못됨)
```
public/musics_img/Carol/
  - Last Christmas.png
  - Jingle bell rock.png
  - Santa Claus Is Comin' to Town.png
```

### 변경 후 (올바름)
```
public/musics_img/Carol/
  - Carol_1.png  (Last Christmas)
  - Carol_2.png  (Jingle bell rock)
  - Carol_3.png  (Santa Claus Is Comin' to Town)
```

## 🔧 리네이밍 방법

### 수동 리네이밍
각 장르 폴더에서:
1. 첫 번째 이미지 → `{Genre}_1.png`
2. 두 번째 이미지 → `{Genre}_2.png`
3. ... (최대 10개)

### 자동 리네이밍 스크립트 (준비 중)
```bash
npx tsx scripts/rename-image-files.ts
```

## ⚠️ 주의사항

1. **순서 중요**: MP3와 이미지의 순서가 일치해야 함
   - `Carol_1.mp3` ↔ `Carol_1.png` (같은 곡)
   - `Carol_2.mp3` ↔ `Carol_2.png` (같은 곡)

2. **파일명 형식**: 
   - 공백 없이 `Genre_Number` 형식
   - 대문자로 시작 (예: `Balad`, `Pop`, `Carol`)

3. **최대 개수**: 각 장르당 최대 10개

## 🚀 리네이밍 후 작업

리네이밍 완료 후:
```bash
# JSON 재생성
npx tsx scripts/generate-music-tracks-json.ts

# title, artist, description 수동 업데이트 (선택)
# src/lib/music/musicTracks.json 파일 편집
```

