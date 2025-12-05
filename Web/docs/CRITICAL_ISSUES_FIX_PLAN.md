# 핵심 문제 해결 계획

## 발견된 문제들

1. **Calm Breeze 하드코딩** - 여러 파일에 하드코딩되어 있음
2. **초기 3세그먼트 캐롤 미적용** - useColdStart가 복잡하고 getInitialColdStartSegment를 사용
3. **pause/play 시 처음부터 시작** - 현재 위치에서 재생 안됨
4. **세그먼트 전환 시 노래 이어짐** - 세그먼트마다 다른 노래인데 이어짐
5. **더미데이터 계속 사용** - /api/moods/current에서 mock 반환
6. **1스트림=10세그먼트 구조 미준수** - 각 세그먼트마다 1개 노래, 실제 MP3 길이 반영 필요
7. **전처리 날씨 데이터 에러**

## 해결 순서

### 1단계: 초기 세그먼트 로직 단순화 (최우선)
- useColdStart 단순화: 항상 getInitialColdStartSegments()만 사용
- getInitialColdStartSegment() 완전히 제거
- API 호출 실패 시에도 캐롤 3개 세그먼트만 사용

### 2단계: Calm Breeze 하드코딩 제거
- mockData.ts에서 Calm Breeze 제거
- 모든 fallback에서 Calm Breeze 대신 실제 DB 데이터 사용

### 3단계: pause/play 문제 해결
- musicPlayer에서 현재 위치 저장/복원

### 4단계: 세그먼트 전환 시 노래 변경
- 세그먼트 변경 시 이전 노래 stop, 새 노래 재생

### 5단계: 실제 MP3 길이 반영
- DB에서 duration 가져와서 사용

