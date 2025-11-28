/**
 * File: src/types/preset.ts
 *
 * Preset Component Types (Fragrance, Sound componentsJson)
 */

// Fragrance componentsJson 타입
export interface FragranceComponents {
  type: string;  // 예: "musk", "citrus", "woody"
  intensity?: number;
  notes?: string[];
}

// Sound componentsJson 타입
export interface SoundComponents {
  genre: string;  // 예: "newage", "classical", "jazz"
  mood?: string;
  tempo?: number;
}

// 타입 가드 함수
export function parseFragranceComponents(json: unknown): FragranceComponents {
  if (typeof json === 'object' && json !== null && 'type' in json) {
    return json as FragranceComponents;
  }
  return { type: "citrus" };  // 기본값
}

export function parseSoundComponents(json: unknown): SoundComponents {
  if (typeof json === 'object' && json !== null && 'genre' in json) {
    return json as SoundComponents;
  }
  return { genre: "newage" };  // 기본값
}
