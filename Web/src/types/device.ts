/**
 * File: src/types/device.ts
 *
 * Device Type Definition
 */

export type DeviceType = "manager" | "light" | "scent" | "speaker";

export interface Device {
  id: string;
  type: DeviceType;
  name: string;

  battery: number; // 0~100
  power: boolean;

  // 출력값 (디바이스 타입별로 사용되는 필드만 세팅됨)
  output: {
    brightness?: number;   // light
    color?: string;        // light RGB or HEX
    temperature?: number;  // light color temperature (2000-6500K)
    scentType?: string;    // scent preset
    scentLevel?: number;   // scent intensity (레거시)
    scentInterval?: number; // scent 분사 주기 (5, 10, 15, 20, 25, 30분)
    volume?: number;       // speaker volume
    nowPlaying?: string;   // speaker now playing info
  };
}

