# 앨범 이미지 설정 가이드

## 파일 배치 위치

앨범 이미지를 다음 위치에 배치하세요:

```
Web/public/albums/
```

## 파일명 규칙

MP3 파일명과 동일한 형식으로 앨범 이미지 파일명을 지정하세요:

**형식**: `Title(Artist)_Genre.jpg` 또는 `Title(Artist)_Genre.png`

**예시**:
- MP3: `River flows in you(Yiruma)_Classic.mp3`
- 앨범 이미지: `River flows in you(Yiruma)_Classic.jpg`

## 지원 형식

- `.jpg` / `.jpeg`
- `.png`

## 작업 순서

1. **앨범 이미지 파일 준비**
   - 60개 노래에 대한 앨범 이미지 수집
   - 파일명을 `Title(Artist)_Genre.jpg` 형식으로 변경

2. **파일 배치**
   ```bash
   # Web/public/albums/ 폴더에 모든 앨범 이미지 복사
   cp *.jpg /path/to/mood-manager/Web/public/albums/
   ```

3. **DB 마이그레이션 실행**
   ```bash
   cd Web
   npx prisma migrate dev
   ```

4. **음악 데이터 임포트**
   ```bash
   npx tsx scripts/import-music-data.ts
   ```

5. **확인**
   - DB에 `albumImageUrl` 필드가 추가되었는지 확인
   - 스크립트 실행 후 각 Sound 레코드에 `albumImageUrl`이 설정되었는지 확인

## 주의사항

- 파일명은 정확히 MP3 파일명과 일치해야 합니다 (확장자만 다름)
- 대소문자 구분합니다
- 파일이 없으면 UI에서 기본 "Album Art" 텍스트가 표시됩니다

