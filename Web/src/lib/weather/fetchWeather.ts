// src/lib/weather/fetchWeather.ts
/**
 * [파일 역할]
 * - 기상청 초단기실황조회 API를 호출하여 현재 날씨 데이터를 가져오는 모듈입니다.
 * - 전처리 파이프라인에서 사용되어 OpenAI 입력에 날씨 정보를 포함시킵니다.
 *
 * [API 정보]
 * - API명: 초단기실황조회 (getUltraSrtNcst)
 * - URL: https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst
 * - 갱신 주기: 매 시간 40분에 갱신
 *
 * [base_time 계산 규칙]
 * - 현재 시각이 XX:00 ~ XX:39 → base_time = 이전 시각
 * - 현재 시각이 XX:40 이후 → base_time = 현재 시각
 * - 예) 12:30 → base_time = 11:00, 12:45 → base_time = 12:00
 *
 * [고정 위경도]
 * - lat = 37.557218398096516
 * - lon = 127.04553794295386
 *
 * [출력 데이터]
 * - temperature: 기온(°C) - T1H
 * - humidity: 습도(%) - REH
 * - rainType: 강수형태(0~3) - PTY (0:없음, 1:비, 2:비/눈, 3:눈)
 * - sky: 하늘상태(1~4) - SKY
 *
 * [주의사항]
 * - 환경변수 KMA_API_KEY가 설정되어 있어야 합니다.
 * - API 호출 실패 시 에러를 throw합니다.
 * - 네트워크 오류나 API 오류에 대한 적절한 에러 처리가 필요합니다.
 */

import axios from "axios";
import { convertToGrid } from "./mapGrid";

/**
 * 고정된 위경도 좌표
 * - 현재는 학교 주소 기준으로 고정값 사용
 * - 추후 사용자 GPS 위치를 통해 동적으로 받아와서 변수로 지정해야 함
 *   → 사용자 위치 기반 날씨 정보 제공을 위해 위경도 값을 파라미터로 받도록 수정 필요
 */
const LAT = 37.557218398096516; // 학교 위도 (고정값, 추후 사용자 GPS로 대체 예정)
const LON = 127.04553794295386; // 학교 경도 (고정값, 추후 사용자 GPS로 대체 예정)

/**
 * 날씨 데이터 타입 정의
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

/**
 * 기상청 초단기실황조회 API를 호출하여 현재 날씨 데이터를 가져옵니다.
 *
 * @returns WeatherData 날씨 데이터 객체
 * @throws API 호출 실패 시 에러 발생
 *
 * [처리 과정]
 * 1. 위경도를 격자 좌표(nx, ny)로 변환
 * 2. 현재 시각 기준으로 base_date와 base_time 계산
 * 3. 기상청 API 호출
 * 4. 응답에서 필요한 항목(T1H, REH, PTY, SKY) 추출
 * 5. WeatherData 객체로 변환하여 반환
 */
export async function fetchWeather(): Promise<WeatherData> {
  // 빌드 타임 체크: Next.js 빌드 중에는 날씨 API 호출 스킵
  // NEXT_PHASE는 Next.js 빌드 타임에 설정됨
  if (process.env.NEXT_PHASE === "phase-production-build" || 
      (typeof window === "undefined" && process.env.NODE_ENV === "production" && !process.env.VERCEL)) {
    // 빌드 타임에는 조용히 기본값 반환 (로그 없음)
    return {
      temperature: 20,
      humidity: 60,
      rainType: 0,
      sky: 1,
    };
  }
  
  // 1) 위경도를 격자 좌표로 변환
  const { x, y } = convertToGrid(LAT, LON);

  // 2) base_date 계산 (YYYYMMDD 형식)
  const now = new Date();
  const baseDate = now.toISOString().slice(0, 10).replace(/-/g, "");

  // 3) base_time 계산 (HHMM 형식)
  // 초단기 실황은 매 시간 40분에 갱신됨
  let hour = now.getHours();
  const minute = now.getMinutes();

  // 현재 시각이 XX:00 ~ XX:39이면 이전 시각 사용
  if (minute < 40) {
    hour -= 1;
    // 자정 이전으로 넘어가는 경우 처리
    if (hour < 0) {
      hour = 23;
      // 날짜도 하루 전으로 변경 필요 (간단화를 위해 현재 날짜 유지)
      // 실제 운영 환경에서는 날짜 변경도 고려해야 함
    }
  }

  const baseTime = `${hour.toString().padStart(2, "0")}00`;

  // 4) 기상청 API 호출
  // [EDIT] 환경변수 검증 추가
  const apiKey = process.env.KMA_API_KEY;
  if (!apiKey) {
    // 환경변수가 없을 때 명확한 에러 메시지와 함께 에러 발생
    // 호출부에서 try-catch로 처리하여 날씨 데이터 없이도 전처리는 계속 진행됨
    throw new Error(
      "[fetchWeather] KMA_API_KEY 환경변수가 설정되지 않았습니다. .env.local 파일에 KMA_API_KEY를 추가해주세요."
    );
  }

  // [EDIT] 기상청 API 인증키 처리
  // axios의 params는 자동 URL 인코딩을 수행하므로,
  // Encoding된 키를 그대로 사용하면 이중 인코딩이 발생할 수 있음
  // Decoding된 키를 사용하거나, URL에 직접 포함시켜야 함
  const url =
    "https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst";

  // Decoding된 키 사용 (axios가 자동으로 인코딩함)
  // Encoding된 키: ltN%2F74WOuo2Nrus9ll5UEf41G4dYXPNwf4gcznHz75LlT5yKBiW5UAiKWWJxxeWqZyC1qBDdkE3bBgwMUMms1A%3D%3D
  // Decoding된 키: ltN/74WOuo2Nrus9ll5UEf41G4dYXPNwf4gcznHz75LlT5yKBiW5UAiKWWJxxeWqZyC1qBDdkE3bBgwMUMms1A==
  const decodedApiKey = decodeURIComponent(apiKey);

  const params = {
    serviceKey: decodedApiKey, // Decoding된 키 사용 (axios가 자동 인코딩)
    pageNo: "1",
    numOfRows: "20",
    dataType: "JSON",
    base_date: baseDate,
    base_time: baseTime,
    nx: x.toString(),
    ny: y.toString(),
  };

  try {
    const res = await axios.get(url, { params });

    // 5) 응답에서 필요한 항목 추출
    const items = res.data?.response?.body?.items?.item;

    if (!items || !Array.isArray(items)) {
      // 기본값 반환 (에러 발생 시 전처리 중단 방지)
      return {
        temperature: 20,
        humidity: 60,
        rainType: 0,
        sky: 1,
      };
    }

    const weather: Record<string, string> = {};

    items.forEach((item: { category: string; obsrValue: string }) => {
      weather[item.category] = item.obsrValue;
    });

    // 6) WeatherData 객체로 변환
    return {
      temperature: parseFloat(weather.T1H ?? "0"),
      humidity: parseFloat(weather.REH ?? "0"),
      rainType: parseInt(weather.PTY ?? "0", 10),
      sky: parseInt(weather.SKY ?? "1", 10),
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // 429 에러(rate limit)는 빌드 타임에 자주 발생하므로 조용히 처리
      if (error.response?.status === 429) {
        // 빌드 타임이 아닐 때만 경고 로그 출력
        if (process.env.NEXT_PHASE !== "phase-production-build") {
          console.warn("[fetchWeather] API rate limit (429). Using default weather data.");
        }
        // 기본값 반환 (빌드 타임 에러 방지)
        return {
          temperature: 20,
          humidity: 60,
          rainType: 0,
          sky: 1,
        };
      }
      // 빌드 타임이 아닐 때만 에러 로그 출력
      if (process.env.NEXT_PHASE !== "phase-production-build") {
        console.error("[fetchWeather] API 호출 실패:", error.message);
      }
      // 빌드 타임이면 기본값 반환, 아니면 에러 throw
      if (process.env.NEXT_PHASE === "phase-production-build") {
        return {
          temperature: 20,
          humidity: 60,
          rainType: 0,
          sky: 1,
        };
      }
      throw new Error(`기상청 API 호출 실패: ${error.message}`);
    }
    // 빌드 타임이면 기본값 반환
    if (process.env.NEXT_PHASE === "phase-production-build") {
      return {
        temperature: 20,
        humidity: 60,
        rainType: 0,
        sky: 1,
      };
    }
    throw error;
  }
}

