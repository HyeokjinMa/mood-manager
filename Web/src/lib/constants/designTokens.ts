/**
 * 디자인 시스템 토큰 상수
 * 디자이너 가이드에 따른 일관된 디자인 시스템 적용
 */

// ============================================
// 간격 시스템 (Spacing)
// ============================================

export const SPACING = {
  // 패딩
  padding: {
    xs: { px: 'px-3', py: 'py-2' },
    sm: { px: 'px-3', py: 'py-3' },
    md: { px: 'px-4', py: 'py-4' },
    lg: { px: 'px-4', py: 'py-6' },
    xl: { px: 'px-6', py: 'py-6' },
  },
  // 간격 (Gap)
  gap: {
    xs: 'gap-2',
    sm: 'gap-3',
    md: 'gap-4',
    lg: 'gap-5',
  },
  // 수직 간격 (Space Y)
  spaceY: {
    xs: 'space-y-2',
    sm: 'space-y-3',
    md: 'space-y-4',
    lg: 'space-y-5',
  },
} as const;

// ============================================
// 타이포그래피 (Typography)
// ============================================

export const TYPOGRAPHY = {
  // 폰트 크기
  size: {
    xs: 'text-xs',    // 12px
    sm: 'text-sm',    // 14px
    base: 'text-base', // 16px
    lg: 'text-lg',    // 18px
  },
  // 폰트 굵기
  weight: {
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
  },
} as const;

// ============================================
// 색상 시스템 (Colors)
// ============================================

export const COLORS = {
  // 배경색
  background: {
    white: 'bg-white',
    white80: 'bg-white/80',
    white40: 'bg-white/40',
    white50: 'bg-white/50',
    gray200: 'bg-gray-200',
    gray800: 'bg-gray-800',
    black: 'bg-black',
  },
  // 텍스트 색상
  text: {
    primary: 'text-gray-800',
    secondary: 'text-gray-600',
    tertiary: 'text-gray-500',
    disabled: 'text-gray-400',
    white: 'text-white',
  },
  // 테두리 색상
  border: {
    default: 'border-gray-200',
    input: 'border-gray-300',
  },
} as const;

// ============================================
// 그림자 (Shadow)
// ============================================

export const SHADOW = {
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
} as const;

// ============================================
// 둥근 모서리 (Border Radius)
// ============================================

export const RADIUS = {
  sm: 'rounded',      // 기본값: 0.625rem
  md: 'rounded-lg',
  lg: 'rounded-xl',
  full: 'rounded-full',
} as const;

// ============================================
// 애니메이션 및 전환 (Animation & Transition)
// ============================================

export const TRANSITION = {
  base: 'transition',
  all: 'transition-all',
  colors: 'transition-colors',
} as const;

export const HOVER = {
  scale: 'hover:scale-105',
  bgWhite60: 'hover:bg-white/60',
  bgGray300: 'hover:bg-gray-300',
  textGray800: 'hover:text-gray-800',
} as const;

export const BLUR = {
  sm: 'backdrop-blur-sm',
} as const;

// ============================================
// 모달 크기 (Modal Sizes)
// ============================================

export const MODAL = {
  sm: 'w-[300px]',
  md: 'w-[330px]',
  lg: 'w-[350px]',
} as const;

// ============================================
// 그리드 레이아웃 (Grid Layout)
// ============================================

export const GRID = {
  cols2: 'grid grid-cols-2 gap-3',
} as const;

// ============================================
// 버튼 스타일 (Button Styles)
// ============================================

export const BUTTON = {
  // 검정 버튼
  black: 'px-3 py-1 text-sm bg-black text-white rounded-md hover:bg-gray-800 transition',
  // 회색 버튼
  gray: 'px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition',
  // 아이콘 버튼
  icon: 'p-1.5 rounded-full bg-white/40 backdrop-blur hover:bg-white/60 transition',
} as const;

// ============================================
// 카드 스타일 (Card Styles)
// ============================================

export const CARD = {
  // 기본 카드
  default: 'p-3 rounded-xl shadow-sm border bg-white',
  // 반투명 카드
  translucent: 'p-3 rounded-xl bg-white/80 backdrop-blur-sm border border-gray-200',
} as const;

