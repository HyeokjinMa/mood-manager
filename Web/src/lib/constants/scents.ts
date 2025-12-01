/**
 * 향 아이콘 상수 정의
 * 디자이너 가이드에 따른 향별 아이콘 매핑
 */

import { 
  CiCloudOn,
  CiDark,
  CiHeart,
  CiRainbow,
  CiUmbrella,
} from "react-icons/ci";
import { 
  GiHerbsBundle,
  GiWoodenHelmet,
  GiDrippingHoney,
  GiLeatherBoot,
  GiRose,
  GiBabyBottle,
} from "react-icons/gi";
import { 
  PiOrangeDuotone,
  PiPencilFill,
} from "react-icons/pi";
import { 
  LuSprout,
  LuWaves,
} from "react-icons/lu";
import { 
  IoWaterOutline,
} from "react-icons/io5";
import { 
  FaPepperHot,
  FaCoffee,
} from "react-icons/fa";
import { 
  RiSnowflakeFill,
  RiZzzFill,
  RiFlashlightFill,
  RiBlueskyLine,
  RiCake2Line,
  RiMickeyFill,
  RiPlaneFill,
} from "react-icons/ri";
import { 
  WiDaySunny,
} from "react-icons/wi";
import { 
  VscSparkleFilled,
  VscTwitter,
} from "react-icons/vsc";
import type { FragranceCategory } from "./mood";

// ============================================
// 향 카테고리 아이콘 매핑 (Scent Category Icons)
// ============================================

export interface ScentIconConfig {
  component: React.ComponentType<{ size?: number | string; className?: string; color?: string }>;
  color: string;
  name: string;
  category: 'scent';
}

export const SCENT_ICONS: Record<FragranceCategory, ScentIconConfig> = {
  musk: {
    component: CiCloudOn,
    color: '#FFBF00',
    name: 'Musk',
    category: 'scent',
  },
  aromatic: {
    component: GiHerbsBundle,
    color: '#93A188',
    name: 'Aromatic',
    category: 'scent',
  },
  woody: {
    component: GiWoodenHelmet,
    color: '#733700',
    name: 'Woody',
    category: 'scent',
  },
  citrus: {
    component: PiOrangeDuotone,
    color: '#FF6600',
    name: 'Citrus',
    category: 'scent',
  },
  honey: {
    component: GiDrippingHoney,
    color: '#FFE881',
    name: 'Honey',
    category: 'scent',
  },
  green: {
    component: LuSprout,
    color: '#15E638',
    name: 'Green',
    category: 'scent',
  },
  dry: {
    component: LuWaves,
    color: '#CC7722',
    name: 'Dry',
    category: 'scent',
  },
  leathery: {
    component: GiLeatherBoot,
    color: '#3C2905',
    name: 'Leathery',
    category: 'scent',
  },
  marine: {
    component: IoWaterOutline,
    color: '#0C66E4',
    name: 'Marine',
    category: 'scent',
  },
  spicy: {
    component: FaPepperHot,
    color: '#FE1C31',
    name: 'Spicy',
    category: 'scent',
  },
  floral: {
    component: GiRose,
    color: '#E627DA',
    name: 'Floral',
    category: 'scent',
  },
  powdery: {
    component: GiBabyBottle,
    color: '#FFFFF0',
    name: 'Powdery',
    category: 'scent',
  },
} as const;

// ============================================
// 특수 아이콘 카테고리 (Special Icon Categories)
// ============================================

export type SpecialIconType = 
  // 자연/날씨 계열
  | 'moon' | 'rain' | 'snow' | 'sun' | 'star' | 'rainbow'
  // 감정/상태 계열
  | 'heart' | 'sleep' | 'flash' | 'coffee'
  // 활동/이벤트 계열
  | 'bird' | 'butterfly' | 'birthday' | 'mickey' | 'trip' | 'pencil';

export interface SpecialIconConfig {
  component: React.ComponentType<{ size?: number | string; className?: string; color?: string }>;
  color: string;
  name: string;
  category: 'nature' | 'emotion' | 'activity';
}

export const SPECIAL_ICONS: Record<SpecialIconType, SpecialIconConfig> = {
  // 자연/날씨 계열
  moon: {
    component: CiDark,
    color: '#F3F300',
    name: 'Moon',
    category: 'nature',
  },
  rain: {
    component: CiUmbrella,
    color: '#098FE2',
    name: 'Rain',
    category: 'nature',
  },
  snow: {
    component: RiSnowflakeFill,
    color: '#ACF1FF',
    name: 'Snow',
    category: 'nature',
  },
  sun: {
    component: WiDaySunny,
    color: '#D71D1D',
    name: 'Sun',
    category: 'nature',
  },
  star: {
    component: VscSparkleFilled,
    color: '#FFF172',
    name: 'Star',
    category: 'nature',
  },
  rainbow: {
    component: CiRainbow,
    color: '#6F52FF',
    name: 'Rainbow',
    category: 'nature',
  },
  // 감정/상태 계열
  heart: {
    component: CiHeart,
    color: '#F300F3',
    name: 'Heart',
    category: 'emotion',
  },
  sleep: {
    component: RiZzzFill,
    color: '#000000',
    name: 'Sleep',
    category: 'emotion',
  },
  flash: {
    component: RiFlashlightFill,
    color: '#FFF600',
    name: 'Flash',
    category: 'emotion',
  },
  coffee: {
    component: FaCoffee,
    color: '#843700',
    name: 'Coffee',
    category: 'emotion',
  },
  // 활동/이벤트 계열
  bird: {
    component: VscTwitter,
    color: '#4BFFF9',
    name: 'Bird',
    category: 'activity',
  },
  butterfly: {
    component: RiBlueskyLine,
    color: '#FBFF24',
    name: 'Butterfly',
    category: 'activity',
  },
  birthday: {
    component: RiCake2Line,
    color: '#DA62AC',
    name: 'Birthday',
    category: 'activity',
  },
  mickey: {
    component: RiMickeyFill,
    color: '#000000',
    name: 'Mickey',
    category: 'activity',
  },
  trip: {
    component: RiPlaneFill,
    color: '#00FFF6',
    name: 'Trip',
    category: 'activity',
  },
  pencil: {
    component: PiPencilFill,
    color: '#098FE2',
    name: 'Pencil',
    category: 'activity',
  },
} as const;

// ============================================
// 카테고리별 그룹화
// ============================================

export const SCENT_CATEGORY_ICONS = Object.keys(SCENT_ICONS) as FragranceCategory[];

export const NATURE_ICONS = Object.keys(SPECIAL_ICONS).filter(
  (key): key is SpecialIconType => SPECIAL_ICONS[key as SpecialIconType].category === 'nature'
) as SpecialIconType[];

export const EMOTION_ICONS = Object.keys(SPECIAL_ICONS).filter(
  (key): key is SpecialIconType => SPECIAL_ICONS[key as SpecialIconType].category === 'emotion'
) as SpecialIconType[];

export const ACTIVITY_ICONS = Object.keys(SPECIAL_ICONS).filter(
  (key): key is SpecialIconType => SPECIAL_ICONS[key as SpecialIconType].category === 'activity'
) as SpecialIconType[];

