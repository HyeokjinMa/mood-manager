/**
 * 날씨 관련 타입 정의
 * 
 * Phase 2 리팩토링: lib/weather 내부의 타입을 통합
 */

/**
 * 날씨 데이터 타입 정의
 * (src/lib/weather/fetchWeather.ts에서 이동)
 */
export interface WeatherData {
  /** 기온 (°C) */
  temperature: number;
  /** 습도 (%) */
  humidity: number;
  /** 강수형태 (0:없음, 1:비, 2:비/눈, 3:눈) */
  rainType: number;
  /** 하늘상태 (1~4) */
  sky: number;
}

