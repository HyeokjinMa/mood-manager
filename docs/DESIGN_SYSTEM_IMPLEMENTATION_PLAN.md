# 디자인 시스템 통합 구현 계획

작성일: 2025년

## 📋 목차
1. [현재 상태 vs 신규 가이드 비교](#1-현재-상태-vs-신규-가이드-비교)
2. [향 아이콘 매핑 및 카테고리화](#2-향-아이콘-매핑-및-카테고리화)
3. [단계별 구현 계획](#3-단계별-구현-계획)
4. [파일 구조](#4-파일-구조)

---

## 1. 현재 상태 vs 신규 가이드 비교

### 1.1 레이아웃 ✅
| 항목 | 현재 | 신규 | 상태 |
|------|------|------|------|
| 최대 너비 | `max-w-[375px]` | `max-w-[375px]` | ✅ 일치 |
| 중앙 정렬 | `flex justify-center` | `flex justify-center` | ✅ 일치 |
| 전체 화면 | `min-h-screen` | `min-h-screen` | ✅ 일치 |
| 배경색 | `bg-white` | `bg-white` | ✅ 일치 |

**결론**: 레이아웃은 이미 완벽하게 적용되어 있음. 추가 작업 불필요.

### 1.2 간격 시스템 ⚠️
| 항목 | 현재 | 신규 | 상태 |
|------|------|------|------|
| 작은 패딩 | 부분 사용 | `px-3, py-2, py-3` | 📝 체계화 필요 |
| 중간 패딩 | 부분 사용 | `px-4, py-4, py-6` | 📝 체계화 필요 |
| 큰 패딩 | 부분 사용 | `px-6` | 📝 체계화 필요 |
| 작은 간격 | 부분 사용 | `gap-2, space-y-2` | 📝 체계화 필요 |
| 중간 간격 | 부분 사용 | `gap-3, gap-4, space-y-3, space-y-4` | 📝 체계화 필요 |
| 큰 간격 | 부분 사용 | `space-y-5` | 📝 체계화 필요 |

**작업 필요**: 간격 상수 파일 생성 및 기존 컴포넌트 마이그레이션

### 1.3 둥근 모서리 ⚠️
| 항목 | 현재 | 신규 | 상태 |
|------|------|------|------|
| 작은 | `rounded` | `rounded` | ✅ 일치 |
| 중간 | `rounded-lg` | `rounded-lg` | ✅ 일치 |
| 큰 | `rounded-xl` | `rounded-xl` | ✅ 일치 |
| 원형 | `rounded-full` | `rounded-full` | ✅ 일치 |

**결론**: 이미 적용되어 있음. 일관성 확인만 필요.

### 1.4 색상 시스템 ⚠️
| 항목 | 현재 | 신규 | 상태 |
|------|------|------|------|
| 배경색 | CSS 변수 사용 | `bg-white`, `bg-white/80` 등 | ⚠️ 부분 일치 |
| 텍스트 색상 | CSS 변수 사용 | `text-gray-800`, `text-gray-600` 등 | ⚠️ 부분 일치 |
| 테두리 색상 | CSS 변수 사용 | `border-gray-200`, `border-gray-300` | ⚠️ 부분 일치 |

**작업 필요**: 
- CSS 변수와 Tailwind 클래스 매핑 확인
- gray 색상 스케일 통일

### 1.5 그림자 시스템 ⚠️
| 항목 | 현재 | 신규 | 상태 |
|------|------|------|------|
| 작은 | 부분 사용 | `shadow-sm` | 📝 체계화 필요 |
| 중간 | 부분 사용 | `shadow-md` | 📝 체계화 필요 |
| 큰 | 부분 사용 | `shadow-lg` | 📝 체계화 필요 |

**작업 필요**: 그림자 사용 패턴 통일

### 1.6 타이포그래피 ⚠️
| 항목 | 현재 | 신규 | 상태 |
|------|------|------|------|
| 작은 | 부분 사용 | `text-xs` (12px) | 📝 체계화 필요 |
| 기본 | 부분 사용 | `text-sm` (14px) | 📝 체계화 필요 |
| 중간 | 부분 사용 | `text-base` (16px) | 📝 체계화 필요 |
| 큰 | 부분 사용 | `text-lg` (18px) | 📝 체계화 필요 |
| 굵기 | 부분 사용 | `font-medium`, `font-semibold`, `font-bold` | 📝 체계화 필요 |

**작업 필요**: 타이포그래피 가이드라인 문서화 및 적용

### 1.7 애니메이션 및 전환 ✅
| 항목 | 현재 | 신규 | 상태 |
|------|------|------|------|
| Transition | 사용 중 | `transition`, `transition-all`, `transition-colors` | ✅ 일치 |
| 호버 효과 | 사용 중 | `hover:scale-105`, `hover:bg-white/60` | ✅ 일치 |
| 블러 효과 | 미사용 | `backdrop-blur-sm` | 📝 추가 필요 |

**작업 필요**: 블러 효과 적용 검토

---

## 2. 향 아이콘 매핑 및 카테고리화

### 2.1 기존 향 카테고리 (mood.ts)
현재 `Web/src/lib/constants/mood.ts`에 정의된 12개 향 카테고리:
1. musk
2. aromatic
3. woody
4. citrus
5. honey
6. green
7. dry
8. leathery
9. marine
10. spicy
11. floral
12. powdery

### 2.2 신규 향 아이콘 매핑

#### 카테고리 A: 향료 계열 (Scent Category) - 12개
기존 향 카테고리와 1:1 매칭 가능

| 향 이름 | 아이콘 | 라이브러리 | 색상 | 파일명 |
|---------|--------|-----------|------|--------|
| musk | `CiCloudOn` | react-icons/ci | #FFBF00 | CiCloudOn |
| aromatic | `GiHerbsBundle` | react-icons/gi | #93A188 | GiHerbsBundle |
| woody | `GiWoodenHelmet` | react-icons/gi | #733700 | GiWoodenHelmet |
| citrus | `PiOrangeDuotone` | react-icons/pi | #FF6600 | PiOrangeDuotone |
| honey | `GiDrippingHoney` | react-icons/gi | #FFE881 | GiDrippingHoney |
| green | `LuSprout` | react-icons/lu | #15E638 | LuSprout |
| dry | `LuWaves` | react-icons/lu | #CC7722 | LuWaves |
| leathery | `GiLeatherBoot` | react-icons/gi | #3C2905 | GiLeatherBoot |
| marine | `IoWaterOutline` | react-icons/io5 | #0C66E4 | IoWaterOutline |
| spicy | `FaPepperHot` | react-icons/fa | #FE1C31 | FaPepperHot |
| floral | `GiRose` | react-icons/gi | #E627DA | GiRose |
| powdery | `GiBabyBottle` | react-icons/gi | #FFFFF0 | GiBabyBottle |

#### 카테고리 B: 자연/날씨 계열 (Nature/Weather Category) - 6개
**신규 카테고리** - 무드 테마나 특수 상황용

| 이름 | 아이콘 | 라이브러리 | 색상 | 용도 |
|------|--------|-----------|------|------|
| moon | `CiDark` | react-icons/ci | #F3F300 | 밤/야간 무드 |
| rain | `CiUmbrella` | react-icons/ci | #098FE2 | 비 오는 날 무드 |
| snow | `RiSnowflakeFill` | react-icons/ri | #ACF1FF | 눈 오는 날 무드 |
| sun | `WiDaySunny` | react-icons/wi | #D71D1D | 맑은 날 무드 |
| star | `VscSparkleFilled` | react-icons/vsc | #FFF172 | 별빛 무드 |
| rainbow | `CiRainbow` | react-icons/ci | #6F52FF | 무지개 무드 |

#### 카테고리 C: 감정/상태 계열 (Emotion/State Category) - 4개
**신규 카테고리** - 특정 감정이나 상태 표현용

| 이름 | 아이콘 | 라이브러리 | 색상 | 용도 |
|------|--------|-----------|------|------|
| heart | `CiHeart` | react-icons/ci | #F300F3 | 사랑/로맨틱 무드 |
| sleep | `RiZzzFill` | react-icons/ri | #000000 | 수면/휴식 무드 |
| flash | `RiFlashlightFill` | react-icons/ri | #FFF600 | 에너지/활력 무드 |
| coffee | `FaCoffee` | react-icons/fa | #843700 | 아침/각성 무드 |

#### 카테고리 D: 활동/이벤트 계열 (Activity/Event Category) - 6개
**신규 카테고리** - 특정 활동이나 이벤트용

| 이름 | 아이콘 | 라이브러리 | 색상 | 용도 |
|------|--------|-----------|------|------|
| bird | `VscTwitter` | react-icons/vsc | #4BFFF9 | 자유로운 무드 |
| butterfly | `RiBlueskyLine` | react-icons/ri | #FBFF24 | 경쾌한 무드 |
| birthday | `RiCake2Line` | react-icons/ri | #DA62AC | 축하/기념일 무드 |
| mickey | `RiMickeyFill` | react-icons/ri | #000000 | 테마파크/재미 무드 |
| trip | `RiPlaneFill` | react-icons/ri | #00FFF6 | 여행/휴가 무드 |
| pencil | `PiPencilFill` | react-icons/pi | #098FE2 | 창작/학습 무드 |

### 2.3 아이콘 사용 현황 분석

#### 현재 사용 중인 아이콘
1. **ScentControl.tsx**: `TbSpray` (react-icons/tb) - 향 스프레이 아이콘
2. **DeviceUtils.tsx**: 
   - `FaPalette` - Manager 디바이스
   - `FaLightbulb` - Light 디바이스
   - `FaSprayCan` - Scent 디바이스
   - `FaVolumeUp` - Speaker 디바이스
   - `FaCog` - 기본 디바이스
3. **BottomNav.tsx**: `FaHome`, `FaPalette`, `FaUser`

#### 개선 사항
- 향 아이콘: 현재 `TbSpray`만 사용 → 향별 고유 아이콘으로 변경 필요
- 디바이스 아이콘: 현재 Fa 계열 사용 중 → 디자인 시스템과 일치 확인 필요

---

## 3. 단계별 구현 계획

### Phase 1: 디자인 토큰 및 상수 정의 (우선순위: High)

#### 1.1 디자인 토큰 파일 생성
**파일**: `Web/src/lib/constants/designTokens.ts`

```typescript
// 간격 시스템
export const SPACING = {
  xs: { px: 'px-3', py: 'py-2' },
  sm: { px: 'px-3', py: 'py-3' },
  md: { px: 'px-4', py: 'py-4' },
  lg: { px: 'px-4', py: 'py-6' },
  xl: { px: 'px-6', py: 'py-6' },
} as const;

export const GAP = {
  xs: 'gap-2',
  sm: 'gap-3',
  md: 'gap-4',
  lg: 'gap-5',
} as const;

export const SPACE_Y = {
  xs: 'space-y-2',
  sm: 'space-y-3',
  md: 'space-y-4',
  lg: 'space-y-5',
} as const;

// 타이포그래피
export const TYPOGRAPHY = {
  xs: 'text-xs',
  sm: 'text-sm',
  base: 'text-base',
  lg: 'text-lg',
} as const;

export const FONT_WEIGHT = {
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
} as const;

// 그림자
export const SHADOW = {
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
} as const;

// 반경
export const RADIUS = {
  sm: 'rounded',
  md: 'rounded-lg',
  lg: 'rounded-xl',
  full: 'rounded-full',
} as const;
```

#### 1.2 향 아이콘 상수 파일 생성
**파일**: `Web/src/lib/constants/scents.ts`

향 카테고리별 아이콘 매핑 및 타입 정의

#### 1.3 특수 아이콘 상수 파일 생성
**파일**: `Web/src/lib/constants/specialIcons.ts`

자연/날씨, 감정/상태, 활동/이벤트 카테고리 아이콘 정의

### Phase 2: 아이콘 컴포넌트 생성 (우선순위: High)

#### 2.1 향 아이콘 컴포넌트
**파일**: `Web/src/components/icons/ScentIcon.tsx`

재사용 가능한 향 아이콘 컴포넌트

#### 2.2 특수 아이콘 컴포넌트
**파일**: `Web/src/components/icons/SpecialIcon.tsx`

자연/날씨, 감정/상태, 활동/이벤트 아이콘 컴포넌트

### Phase 3: 공통 컴포넌트 업데이트 (우선순위: Medium)

#### 3.1 버튼 컴포넌트
**파일**: `Web/src/components/ui/Button.tsx` (신규 생성 또는 기존 업데이트)

디자인 시스템에 맞는 버튼 컴포넌트

#### 3.2 카드 컴포넌트
**파일**: `Web/src/components/ui/Card.tsx` (신규 생성 또는 기존 업데이트)

디자인 시스템에 맞는 카드 컴포넌트

#### 3.3 모달 컴포넌트
기존 모달 컴포넌트들 디자인 시스템 적용

### Phase 4: 기존 컴포넌트 마이그레이션 (우선순위: Medium)

#### 4.1 ScentControl 컴포넌트
- 향별 고유 아이콘 적용
- 디자인 시스템 간격/색상 적용

#### 4.2 Device 관련 컴포넌트
- 디자인 시스템 일관성 적용

#### 4.3 Navigation 컴포넌트
- 디자인 시스템 적용

---

## 4. 파일 구조

```
Web/src/
├── lib/
│   └── constants/
│       ├── designTokens.ts      (신규) - 디자인 토큰 상수
│       ├── scents.ts             (신규) - 향 아이콘 매핑
│       ├── specialIcons.ts       (신규) - 특수 아이콘 매핑
│       └── mood.ts               (기존) - 무드 상수 (유지)
│
├── components/
│   ├── icons/
│   │   ├── ScentIcon.tsx         (신규) - 향 아이콘 컴포넌트
│   │   └── SpecialIcon.tsx       (신규) - 특수 아이콘 컴포넌트
│   └── ui/
│       ├── Button.tsx            (신규/업데이트) - 버튼 컴포넌트
│       └── Card.tsx              (신규/업데이트) - 카드 컴포넌트
│
└── app/
    └── (main)/
        └── home/
            └── components/
                ├── MoodDashboard/
                │   └── components/
                │       └── ScentControl.tsx  (업데이트) - 향 아이콘 적용
                └── Device/
                    └── ... (업데이트) - 디자인 시스템 적용
```

---

## 5. 구현 진행 상황

### ✅ Phase 1: 디자인 토큰 및 상수 정의 (완료)
- [x] `Web/src/lib/constants/designTokens.ts` 생성
  - 간격 시스템 (SPACING)
  - 타이포그래피 (TYPOGRAPHY)
  - 색상 시스템 (COLORS)
  - 그림자 (SHADOW)
  - 둥근 모서리 (RADIUS)
  - 애니메이션 및 전환 (TRANSITION, HOVER, BLUR)
  - 모달 크기 (MODAL)
  - 그리드 레이아웃 (GRID)
  - 버튼 스타일 (BUTTON)
  - 카드 스타일 (CARD)

- [x] `Web/src/lib/constants/scents.ts` 생성
  - 향 카테고리 아이콘 매핑 (SCENT_ICONS) - 12개
  - 특수 아이콘 매핑 (SPECIAL_ICONS) - 16개
  - 카테고리별 그룹화 (NATURE_ICONS, EMOTION_ICONS, ACTIVITY_ICONS)

### ✅ Phase 2: 아이콘 컴포넌트 생성 (완료)
- [x] `Web/src/components/icons/ScentIcon.tsx` 생성
  - 향별 고유 아이콘 표시
  - 크기 및 색상 props 지원
  - 타입 안정성 보장

- [x] `Web/src/components/icons/SpecialIcon.tsx` 생성
  - 자연/날씨, 감정/상태, 활동/이벤트 아이콘 표시
  - 크기 및 색상 props 지원

### 📝 Phase 3: 공통 컴포넌트 업데이트 (진행 중)
- [ ] 버튼 컴포넌트 업데이트
- [ ] 카드 컴포넌트 업데이트
- [ ] 모달 컴포넌트 업데이트

### 📝 Phase 4: 기존 컴포넌트 마이그레이션 (대기 중)
- [ ] ScentControl 컴포넌트 업데이트 (향 아이콘 적용)
- [ ] Device 관련 컴포넌트 업데이트
- [ ] Navigation 컴포넌트 업데이트
- [ ] 기타 페이지 컴포넌트 업데이트

## 6. 다음 단계

1. ✅ **Phase 1 완료**: 디자인 토큰 및 상수 파일 생성
2. ✅ **Phase 2 완료**: 아이콘 컴포넌트 생성
3. 📝 **Phase 3 진행**: 공통 컴포넌트 업데이트
4. 📝 **Phase 4 대기**: 기존 컴포넌트 마이그레이션

