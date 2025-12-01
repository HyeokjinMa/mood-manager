# 디자인 시스템 통합 분석 및 계획

작성일: 2025년

## 1. 현재 상태 분석

### 1.1 레이아웃
- ✅ **이미 적용됨**: `Web/src/app/layout.tsx`에 `max-w-[375px]`, `flex justify-center`, `min-h-screen` 적용 완료
- ✅ **이미 적용됨**: `bg-white` 배경 적용 완료

### 1.2 CSS 변수 (Design Tokens)
- ✅ **이미 적용됨**: `Web/src/app/globals.css`에 CSS 변수 정의 완료
  - `--background`, `--foreground`, `--primary`, `--secondary`, `--muted`, `--border`, `--destructive` 등
  - `--radius`, `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl` 등
- ⚠️ **개선 필요**: 디자이너 가이드의 색상 시스템과 일치하도록 검토 필요

### 1.3 간격 시스템
- ⚠️ **부분 적용**: 일부 컴포넌트에서 사용 중이지만 일관성 부족
- 📝 **적용 필요**: 디자이너 가이드의 간격 시스템 전면 적용

### 1.4 타이포그래피
- ⚠️ **부분 적용**: 일부 적용되어 있으나 가이드와 일치하지 않음
- 📝 **적용 필요**: `text-xs`, `text-sm`, `text-base`, `text-lg` 및 `font-medium`, `font-semibold`, `font-bold` 체계화

### 1.5 그림자 및 애니메이션
- ⚠️ **부분 적용**: 일부 컴포넌트에서 사용 중
- 📝 **적용 필요**: `shadow-sm`, `shadow-md`, `shadow-lg` 및 `transition` 체계화

## 2. 향 아이콘 분석

### 2.1 현재 사용 중인 향 아이콘
현재 프로젝트에서 사용 중인 향 아이콘을 확인 필요 (ScentControl.tsx 확인)

### 2.2 신규 향 아이콘 목록 (28개)

#### 카테고리 1: 향료 계열 (Scent Category) - 12개
1. **Musk** - `CiCloudOn` - #FFBF00 (몽글한 구름)
2. **Aromatic** - `GiHerbsBundle` - #93A188 (허브)
3. **Woody** - `GiWoodenHelmet` - #733700 (나무)
4. **Citrus** - `PiOrangeDuotone` - #FF6600 (오렌지)
5. **Honey** - `GiDrippingHoney` - #FFE881 (벌집)
6. **Green** - `LuSprout` - #15E638 (새싹)
7. **Dry** - `LuWaves` - #CC7722 (건조 웨이브)
8. **Leathery** - `GiLeatherBoot` - #3C2905 (가죽)
9. **Marine** - `IoWaterOutline` - #0C66E4 (물방울)
10. **Spicy** - `FaPepperHot` - #FE1C31 (고추)
11. **Floral** - `GiRose` - #E627DA (장미)
12. **Powdery** - `GiBabyBottle` - #FFFFF0 (아기젖병)

#### 카테고리 2: 자연/날씨 계열 (Nature/Weather Category) - 6개
13. **Moon** - `CiDark` - #F3F300 (달)
14. **Rain** - `CiUmbrella` - #098FE2 (우산)
15. **Snow** - `RiSnowflakeFill` - #ACF1FF (눈)
16. **Sun** - `WiDaySunny` - #D71D1D (해)
17. **Star** - `VscSparkleFilled` - #FFF172 (별 2개)
18. **Rainbow** - `CiRainbow` - #6F52FF (무지개)

#### 카테고리 3: 감정/상태 계열 (Emotion/State Category) - 4개
19. **Heart** - `CiHeart` - #F300F3 (하트)
20. **Sleep** - `RiZzzFill` - #000000 (잠ZZ)
21. **Flash** - `RiFlashlightFill` - #FFF600 (번개)
22. **Coffee** - `FaCoffee` - #843700 (커피)

#### 카테고리 4: 활동/이벤트 계열 (Activity/Event Category) - 6개
23. **Bird** - `VscTwitter` - #4BFFF9 (트위터 새)
24. **Butterfly** - `RiBlueskyLine` - #FBFF24 (나비)
25. **Birthday** - `RiCake2Line` - #DA62AC (생일케이크)
26. **Mickey** - `RiMickeyFill` - #000000 (미키마우스)
27. **Trip** - `RiPlaneFill` - #00FFF6 (비행기)
28. **Pencil** - `PiPencilFill` - #098FE2 (연필)

### 2.3 아이콘 사용 패턴 분석
- **크기**: `size={32}` 또는 `className="w-8 h-8"` (32px)
- **색상**: 각 아이콘별 고유 색상 지정
- **라이브러리**: react-icons (Ci, Gi, Pi, Lu, Io, Fa, Ri, Wi, Vsc 등)

## 3. 적용 계획

### 3.1 단계 1: 디자인 토큰 정리 및 확장
- [ ] `globals.css`에 디자이너 가이드의 색상 시스템 반영
- [ ] 간격 시스템 상수 정의
- [ ] 타이포그래피 시스템 상수 정의
- [ ] 그림자 시스템 상수 정의

### 3.2 단계 2: 향 아이콘 시스템 구축
- [ ] `Web/src/lib/constants/scents.ts` 생성
- [ ] 향 아이콘 타입 정의
- [ ] 카테고리별 아이콘 매핑
- [ ] 아이콘 컴포넌트 생성

### 3.3 단계 3: 공통 컴포넌트 업데이트
- [ ] 버튼 컴포넌트 디자인 시스템 적용
- [ ] 카드 컴포넌트 디자인 시스템 적용
- [ ] 모달 컴포넌트 디자인 시스템 적용
- [ ] 입력 필드 디자인 시스템 적용

### 3.4 단계 4: 기존 컴포넌트 마이그레이션
- [ ] ScentControl 컴포넌트 업데이트
- [ ] Device 관련 컴포넌트 업데이트
- [ ] Navigation 컴포넌트 업데이트
- [ ] 기타 페이지 컴포넌트 업데이트

## 4. 상세 작업 항목

### 4.1 디자인 토큰 파일 생성
**파일**: `Web/src/lib/constants/designTokens.ts`
- 간격 상수 (spacing)
- 색상 상수 (colors)
- 타이포그래피 상수 (typography)
- 그림자 상수 (shadows)
- 반경 상수 (radius)

### 4.2 향 아이콘 상수 파일 생성
**파일**: `Web/src/lib/constants/scents.ts`
- 향 카테고리별 타입 정의
- 아이콘 컴포넌트 매핑
- 색상 매핑
- 카테고리별 그룹화

### 4.3 향 아이콘 컴포넌트 생성
**파일**: `Web/src/components/icons/ScentIcon.tsx`
- 재사용 가능한 향 아이콘 컴포넌트
- 크기 및 색상 props 지원
- 타입 안정성 보장

### 4.4 공통 스타일 유틸리티
**파일**: `Web/src/lib/utils/styles.ts`
- 간격 유틸리티 함수
- 색상 유틸리티 함수
- 타이포그래피 유틸리티 함수

## 5. 비교 분석

### 5.1 기존 vs 신규 디자인 시스템

| 항목 | 기존 | 신규 | 상태 |
|------|------|------|------|
| 최대 너비 | ✅ 375px | ✅ 375px | 일치 |
| 배경색 | ✅ bg-white | ✅ bg-white | 일치 |
| CSS 변수 | ✅ 정의됨 | ✅ 정의됨 | 일치 |
| 간격 시스템 | ⚠️ 부분 적용 | 📝 체계화 필요 | 개선 필요 |
| 타이포그래피 | ⚠️ 부분 적용 | 📝 체계화 필요 | 개선 필요 |
| 그림자 | ⚠️ 부분 적용 | 📝 체계화 필요 | 개선 필요 |
| 애니메이션 | ⚠️ 부분 적용 | 📝 체계화 필요 | 개선 필요 |

### 5.2 향 아이콘 비교
- 현재 사용 중인 향 아이콘 확인 필요
- 신규 28개 아이콘 중 기존과 중복되는 항목 확인
- 카테고리 체계화 필요

## 6. 다음 단계

1. **현재 향 아이콘 사용 현황 상세 분석**
2. **디자인 토큰 파일 생성**
3. **향 아이콘 상수 파일 생성**
4. **향 아이콘 컴포넌트 생성**
5. **공통 컴포넌트 업데이트**
6. **기존 컴포넌트 마이그레이션**

