// src/lib/weather/mapGrid.ts
/**
 * [파일 역할]
 * - 위경도 좌표를 기상청 격자 좌표(nx, ny)로 변환하는 모듈입니다.
 * - 기상청 초단기실황조회 API 호출 시 필요한 격자 좌표를 계산합니다.
 *
 * [변환 공식]
 * - 기상청에서 제공하는 표준 격자 변환 공식을 사용합니다.
 * - 위도(lat)와 경도(lon)를 기상청 격자 좌표계로 변환합니다.
 *
 * [사용 위치]
 * - fetchWeather.ts에서 사용되어 고정된 위경도를 격자 좌표로 변환합니다.
 *
 * [주의사항]
 * - 기상청 격자 좌표계는 한국 지역에 특화되어 있습니다.
 * - 해외 지역의 경우 정확도가 떨어질 수 있습니다.
 */

/**
 * 위경도를 기상청 격자 좌표로 변환합니다.
 *
 * @param lat 위도 (latitude)
 * @param lon 경도 (longitude)
 * @returns 기상청 격자 좌표 { x: nx, y: ny }
 *
 * [변환 공식]
 * 기상청 표준 격자 변환 공식 사용:
 * - RE = 6371.00877 (지구 반경, km)
 * - GRID = 5.0 (격자 간격, km)
 * - SLAT1 = 30.0 (표준 위도 1)
 * - SLAT2 = 60.0 (표준 위도 2)
 * - OLON = 126.0 (기준 경도)
 * - OLAT = 38.0 (기준 위도)
 * - XO = 43 (기준점 X)
 * - YO = 136 (기준점 Y)
 */
export function convertToGrid(lat: number, lon: number): { x: number; y: number } {
  const RE = 6371.00877; // 지구 반경(km)
  const GRID = 5.0; // 격자 간격(km)
  const SLAT1 = 30.0; // 표준 위도1
  const SLAT2 = 60.0; // 표준 위도2
  const OLON = 126.0; // 기준 경도
  const OLAT = 38.0; // 기준 위도
  const XO = 43; // 기준점 X좌표
  const YO = 136; // 기준점 Y좌표

  const DEGRAD = Math.PI / 180.0;
  // const RADDEG = 180.0 / Math.PI; // 사용되지 않음

  const re = RE / GRID;
  const slat1 = SLAT1 * DEGRAD;
  const slat2 = SLAT2 * DEGRAD;
  const olon = OLON * DEGRAD;
  const olat = OLAT * DEGRAD;

  let sn =
    Math.tan(Math.PI * 0.25 + slat2 * 0.5) /
    Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);
  let sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sf = Math.pow(sf, sn) * Math.cos(slat1) / sn;
  let ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
  ro = (re * sf) / Math.pow(ro, sn);

  let ra = Math.tan(Math.PI * 0.25 + lat * DEGRAD * 0.5);
  ra = (re * sf) / Math.pow(ra, sn);
  let theta = lon * DEGRAD - olon;
  if (theta > Math.PI) theta -= 2.0 * Math.PI;
  if (theta < -Math.PI) theta += 2.0 * Math.PI;
  theta *= sn;

  const x = Math.floor(ra * Math.sin(theta) + XO + 0.5);
  const y = Math.floor(ro - ra * Math.cos(theta) + YO + 0.5);

  return { x, y };
}

