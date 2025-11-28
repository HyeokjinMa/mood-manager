// src/lib/weather/index.ts
/**
 * [파일 역할]
 * - 날씨 관련 모듈들을 한 곳에서 export 해주는 엔트리 파일입니다.
 *
 * [내보내는 것]
 * - fetchWeather: 기상청 API 호출 함수
 * - convertToGrid: 위경도 → 격자 좌표 변환 함수
 * - WeatherData: 날씨 데이터 타입
 */

export { fetchWeather, type WeatherData } from "./fetchWeather";
export { convertToGrid } from "./mapGrid";

