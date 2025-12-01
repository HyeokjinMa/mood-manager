# 디자인 시스템 사용 가이드

작성일: 2025년

## 📋 목차
1. [디자인 토큰 사용법](#1-디자인-토큰-사용법)
2. [향 아이콘 사용법](#2-향-아이콘-사용법)
3. [특수 아이콘 사용법](#3-특수-아이콘-사용법)
4. [컴포넌트 마이그레이션 가이드](#4-컴포넌트-마이그레이션-가이드)

---

## 1. 디자인 토큰 사용법

### 1.1 간격 시스템

```typescript
import { SPACING } from "@/lib/constants/designTokens";

// 패딩 사용
<div className={`${SPACING.padding.md.px} ${SPACING.padding.md.py}`}>
  {/* 중간 패딩: px-4 py-4 */}
</div>

// 간격 사용
<div className={SPACING.gap.md}>
  {/* gap-4 */}
</div>

// 수직 간격 사용
<div className={SPACING.spaceY.md}>
  {/* space-y-4 */}
</div>
```

### 1.2 타이포그래피

```typescript
import { TYPOGRAPHY } from "@/lib/constants/designTokens";

<h2 className={`${TYPOGRAPHY.size.lg} ${TYPOGRAPHY.weight.semibold}`}>
  {/* text-lg font-semibold */}
</h2>

<p className={`${TYPOGRAPHY.size.sm} text-gray-600`}>
  {/* text-sm text-gray-600 */}
</p>
```

### 1.3 색상 시스템

```typescript
import { COLORS } from "@/lib/constants/designTokens";

<div className={COLORS.background.white}>
  {/* bg-white */}
</div>

<span className={COLORS.text.secondary}>
  {/* text-gray-600 */}
</span>
```

### 1.4 그림자 및 반경

```typescript
import { SHADOW, RADIUS } from "@/lib/constants/designTokens";

<div className={`${RADIUS.lg} ${SHADOW.md}`}>
  {/* rounded-xl shadow-md */}
</div>
```

### 1.5 애니메이션

```typescript
import { TRANSITION, HOVER } from "@/lib/constants/designTokens";

<button className={`${TRANSITION.base} ${HOVER.scale}`}>
  {/* transition hover:scale-105 */}
</button>
```

---

## 2. 향 아이콘 사용법

### 2.1 기본 사용

```typescript
import ScentIcon from "@/components/icons/ScentIcon";
import type { ScentType } from "@/types/mood";

// PascalCase 사용 (기존 타입)
<ScentIcon scentType="Musk" />

// snake_case 사용 (카테고리 타입)
<ScentIcon scentType="musk" />
```

### 2.2 크기 및 색상 커스터마이징

```typescript
// 크기 변경
<ScentIcon scentType="Floral" size={24} />
<ScentIcon scentType="Floral" className="w-6 h-6" />

// 색상 오버라이드
<ScentIcon scentType="Citrus" color="#FF0000" />
```

### 2.3 실제 사용 예시

```typescript
// ScentControl 컴포넌트에서 사용
import ScentIcon from "@/components/icons/ScentIcon";
import type { Mood } from "@/types/mood";

function ScentControl({ mood }: { mood: Mood }) {
  return (
    <div className="flex items-center gap-2">
      <span>{mood.scent.name}</span>
      <ScentIcon 
        scentType={mood.scent.type} 
        size={16}
        color="#ffffff"
      />
    </div>
  );
}
```

### 2.4 향 카테고리 목록

```typescript
import { SCENT_CATEGORY_ICONS } from "@/lib/constants/scents";

// 사용 가능한 향 카테고리
SCENT_CATEGORY_ICONS.forEach(category => {
  // musk, aromatic, woody, citrus, honey, green, 
  // dry, leathery, marine, spicy, floral, powdery
});
```

---

## 3. 특수 아이콘 사용법

### 3.1 기본 사용

```typescript
import SpecialIcon from "@/components/icons/SpecialIcon";

// 자연/날씨 계열
<SpecialIcon type="moon" />
<SpecialIcon type="rain" />
<SpecialIcon type="snow" />
<SpecialIcon type="sun" />
<SpecialIcon type="star" />
<SpecialIcon type="rainbow" />

// 감정/상태 계열
<SpecialIcon type="heart" />
<SpecialIcon type="sleep" />
<SpecialIcon type="flash" />
<SpecialIcon type="coffee" />

// 활동/이벤트 계열
<SpecialIcon type="bird" />
<SpecialIcon type="butterfly" />
<SpecialIcon type="birthday" />
<SpecialIcon type="mickey" />
<SpecialIcon type="trip" />
<SpecialIcon type="pencil" />
```

### 3.2 카테고리별 그룹화

```typescript
import { NATURE_ICONS, EMOTION_ICONS, ACTIVITY_ICONS } from "@/lib/constants/scents";

// 자연/날씨 아이콘
NATURE_ICONS.forEach(type => {
  // moon, rain, snow, sun, star, rainbow
});

// 감정/상태 아이콘
EMOTION_ICONS.forEach(type => {
  // heart, sleep, flash, coffee
});

// 활동/이벤트 아이콘
ACTIVITY_ICONS.forEach(type => {
  // bird, butterfly, birthday, mickey, trip, pencil
});
```

---

## 4. 컴포넌트 마이그레이션 가이드

### 4.1 ScentControl 컴포넌트 (✅ 완료)

**변경 전:**
```typescript
import { TbSpray } from "react-icons/tb";

<TbSpray size={16} style={{ color: "#ffffff" }} />
```

**변경 후:**
```typescript
import ScentIcon from "@/components/icons/ScentIcon";

<ScentIcon 
  scentType={mood.scent.type} 
  size={16}
  color="#ffffff"
/>
```

### 4.2 디자인 토큰 적용 예시

**변경 전:**
```typescript
<button className="w-7 h-7 rounded-full shadow flex items-center justify-center hover:scale-105 transition cursor-pointer">
```

**변경 후:**
```typescript
import { RADIUS, SHADOW, TRANSITION, HOVER } from "@/lib/constants/designTokens";

<button className={`w-7 h-7 ${RADIUS.full} ${SHADOW.sm} flex items-center justify-center ${TRANSITION.base} ${HOVER.scale} cursor-pointer`}>
```

### 4.3 간격 시스템 적용 예시

**변경 전:**
```typescript
<div className="px-4 py-6">
<div className="gap-3">
```

**변경 후:**
```typescript
import { SPACING } from "@/lib/constants/designTokens";

<div className={`${SPACING.padding.lg.px} ${SPACING.padding.lg.py}`}>
<div className={SPACING.gap.sm}>
```

---

## 5. 향 아이콘 전체 목록

### 5.1 향료 계열 (12개)

| 향 이름 | 아이콘 컴포넌트 | 색상 | 사용 예시 |
|---------|----------------|------|----------|
| musk | `CiCloudOn` | #FFBF00 | `<ScentIcon scentType="musk" />` |
| aromatic | `GiHerbsBundle` | #93A188 | `<ScentIcon scentType="aromatic" />` |
| woody | `GiWoodenHelmet` | #733700 | `<ScentIcon scentType="woody" />` |
| citrus | `PiOrangeDuotone` | #FF6600 | `<ScentIcon scentType="citrus" />` |
| honey | `GiDrippingHoney` | #FFE881 | `<ScentIcon scentType="honey" />` |
| green | `LuSprout` | #15E638 | `<ScentIcon scentType="green" />` |
| dry | `LuWaves` | #CC7722 | `<ScentIcon scentType="dry" />` |
| leathery | `GiLeatherBoot` | #3C2905 | `<ScentIcon scentType="leathery" />` |
| marine | `IoWaterOutline` | #0C66E4 | `<ScentIcon scentType="marine" />` |
| spicy | `FaPepperHot` | #FE1C31 | `<ScentIcon scentType="spicy" />` |
| floral | `GiRose` | #E627DA | `<ScentIcon scentType="floral" />` |
| powdery | `GiBabyBottle` | #FFFFF0 | `<ScentIcon scentType="powdery" />` |

### 5.2 특수 아이콘 (16개)

#### 자연/날씨 계열 (6개)
- moon, rain, snow, sun, star, rainbow

#### 감정/상태 계열 (4개)
- heart, sleep, flash, coffee

#### 활동/이벤트 계열 (6개)
- bird, butterfly, birthday, mickey, trip, pencil

---

## 6. 체크리스트

### 6.1 디자인 시스템 적용
- [x] 디자인 토큰 파일 생성
- [x] 향 아이콘 상수 파일 생성
- [x] 향 아이콘 컴포넌트 생성
- [x] 특수 아이콘 컴포넌트 생성
- [x] ScentControl 컴포넌트 업데이트
- [ ] Device 관련 컴포넌트 업데이트
- [ ] Navigation 컴포넌트 업데이트
- [ ] 기타 페이지 컴포넌트 업데이트

### 6.2 디자인 가이드 준수
- [x] 레이아웃 (375px, 중앙 정렬)
- [ ] 간격 시스템 일관성
- [ ] 타이포그래피 일관성
- [ ] 색상 시스템 일관성
- [ ] 그림자 시스템 일관성
- [ ] 애니메이션 일관성

