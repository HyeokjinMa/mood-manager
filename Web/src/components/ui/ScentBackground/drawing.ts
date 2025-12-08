/**
 * ScentBackground 그리기 함수들
 */

import type { IconKey } from "@/lib/events/iconMapping";

/**
 * 향 타입별 모양 그리기 함수들
 */
export const drawPetal = (ctx: CanvasRenderingContext2D, size: number, color: string) => {
  ctx.fillStyle = color;
  ctx.beginPath();
  // 꽃잎 모양 (부드러운 곡선)
  ctx.ellipse(0, 0, size / 2, size / 3, 0, 0, Math.PI * 2);
  ctx.fill();
  // 중앙에 작은 원
  ctx.beginPath();
  ctx.arc(0, 0, size / 6, 0, Math.PI * 2);
  ctx.fill();
};

export const drawWaterDrop = (ctx: CanvasRenderingContext2D, size: number, color: string) => {
  // 물방울 모양
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
  ctx.fill();
  // 하이라이트
  ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
  ctx.beginPath();
  ctx.arc(-size / 6, -size / 6, size / 6, 0, Math.PI * 2);
  ctx.fill();
  // 원래 색으로 복원
  ctx.fillStyle = color;
};

export const drawCircle = (ctx: CanvasRenderingContext2D, size: number, color: string) => {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
  ctx.fill();
};

export const drawLeaf = (ctx: CanvasRenderingContext2D, size: number, color: string) => {
  // 나뭇잎 모양 (타원형)
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(0, 0, size / 2, size / 3, 0, 0, Math.PI * 2);
  ctx.fill();
  // 중앙 선
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, -size / 3);
  ctx.lineTo(0, size / 3);
  ctx.stroke();
};

export const drawCloud = (ctx: CanvasRenderingContext2D, size: number, color: string) => {
  // 구름 모양 (여러 원형 조합)
  ctx.fillStyle = color;
  const r = size / 3;
  ctx.beginPath();
  ctx.arc(-r, 0, r, 0, Math.PI * 2);
  ctx.arc(r, 0, r, 0, Math.PI * 2);
  ctx.arc(0, -r * 0.5, r, 0, Math.PI * 2);
  ctx.arc(0, r * 0.5, r * 0.8, 0, Math.PI * 2);
  ctx.fill();
};

export const drawHerbLeaf = (ctx: CanvasRenderingContext2D, size: number, color: string) => {
  // 허브 잎 모양 (뾰족한 타원)
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(0, 0, size / 2.5, size / 3.5, 0, 0, Math.PI * 2);
  ctx.fill();
};

export const drawParticle = (ctx: CanvasRenderingContext2D, size: number, color: string) => {
  // 작은 입자
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(0, 0, size / 3, 0, Math.PI * 2);
  ctx.fill();
};

export const drawHoneyDrop = (ctx: CanvasRenderingContext2D, size: number, color: string) => {
  // 꿀 방울 (타원형)
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(0, 0, size / 2.5, size / 2, 0, 0, Math.PI * 2);
  ctx.fill();
};

export const drawDust = (ctx: CanvasRenderingContext2D, size: number, color: string) => {
  // 먼지 입자 (작은 점)
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(0, 0, size / 4, 0, Math.PI * 2);
  ctx.fill();
};

export const drawFragment = (ctx: CanvasRenderingContext2D, size: number, color: string) => {
  // 작은 조각 (사각형)
  ctx.fillStyle = color;
  ctx.fillRect(-size / 3, -size / 3, size / 1.5, size / 1.5);
};

export const drawPowder = (ctx: CanvasRenderingContext2D, size: number, color: string) => {
  // 파우더 입자 (큰 원형)
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
  ctx.fill();
};

/**
 * 이벤트 아이콘 그리기 함수들 (react-icons 기반)
 */
export const drawTree = (ctx: CanvasRenderingContext2D, size: number, color: string) => {
  // 크리스마스 트리 (삼각형 + 직사각형)
  ctx.fillStyle = color;
  // 트리 몸통 (직사각형)
  ctx.fillRect(-size / 8, size / 3, size / 4, size / 3);
  // 트리 층 (삼각형 3개)
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(0, -size / 2 + i * size / 4);
    ctx.lineTo(-size / 2 + i * size / 8, size / 3 - i * size / 4);
    ctx.lineTo(size / 2 - i * size / 8, size / 3 - i * size / 4);
    ctx.closePath();
    ctx.fill();
  }
};

export const drawSnowflake = (ctx: CanvasRenderingContext2D, size: number, color: string) => {
  // 눈송이 (6방향 대칭)
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  const r = size / 2;
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
    ctx.stroke();
    // 가지
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * r * 0.6, Math.sin(angle) * r * 0.6);
    ctx.lineTo(Math.cos(angle + Math.PI / 6) * r * 0.3, Math.sin(angle + Math.PI / 6) * r * 0.3);
    ctx.moveTo(Math.cos(angle) * r * 0.6, Math.sin(angle) * r * 0.6);
    ctx.lineTo(Math.cos(angle - Math.PI / 6) * r * 0.3, Math.sin(angle - Math.PI / 6) * r * 0.3);
    ctx.stroke();
  }
};

export const drawStar = (ctx: CanvasRenderingContext2D, size: number, color: string) => {
  // 별 (5각형)
  ctx.fillStyle = color;
  ctx.beginPath();
  const r = size / 2;
  for (let i = 0; i < 10; i++) {
    const angle = (i * Math.PI) / 5 - Math.PI / 2;
    const radius = i % 2 === 0 ? r : r * 0.4;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
};

export const drawGift = (ctx: CanvasRenderingContext2D, size: number, color: string) => {
  // 선물 상자 (사각형 + 리본)
  ctx.fillStyle = color;
  ctx.fillRect(-size / 3, -size / 3, size / 1.5, size / 1.5);
  // 리본 (십자)
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -size / 3);
  ctx.lineTo(0, size / 3);
  ctx.moveTo(-size / 3, 0);
  ctx.lineTo(size / 3, 0);
  ctx.stroke();
};

export const drawHeart = (ctx: CanvasRenderingContext2D, size: number, color: string) => {
  // 하트 (두 원 + 삼각형)
  ctx.fillStyle = color;
  const r = size / 4;
  ctx.beginPath();
  ctx.arc(-r, -r, r, 0, Math.PI * 2);
  ctx.arc(r, -r, r, 0, Math.PI * 2);
  ctx.moveTo(0, r);
  ctx.lineTo(-size / 2, -r);
  ctx.lineTo(size / 2, -r);
  ctx.closePath();
  ctx.fill();
};

export const drawRose = (ctx: CanvasRenderingContext2D, size: number, color: string) => {
  // 장미 (원형 + 꽃잎)
  ctx.fillStyle = color;
  // 중심
  ctx.beginPath();
  ctx.arc(0, 0, size / 6, 0, Math.PI * 2);
  ctx.fill();
  // 꽃잎 (원형)
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4;
    ctx.beginPath();
    ctx.ellipse(
      Math.cos(angle) * size / 4,
      Math.sin(angle) * size / 4,
      size / 6,
      size / 8,
      angle,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }
};

export const drawPumpkin = (ctx: CanvasRenderingContext2D, size: number, color: string) => {
  // 호박 (타원형 + 줄기)
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(0, 0, size / 2, size / 3, 0, 0, Math.PI * 2);
  ctx.fill();
  // 줄기
  ctx.fillRect(-size / 12, -size / 2, size / 6, size / 6);
  // 눈 (삼각형)
  ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
  ctx.beginPath();
  ctx.moveTo(-size / 6, -size / 8);
  ctx.lineTo(-size / 12, size / 8);
  ctx.lineTo(-size / 4, size / 8);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(size / 6, -size / 8);
  ctx.lineTo(size / 12, size / 8);
  ctx.lineTo(size / 4, size / 8);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = color; // 복원
};

/**
 * 아이콘 키에 따른 그리기 함수 매핑
 */
export const drawIconByKey = (ctx: CanvasRenderingContext2D, iconKey: IconKey, size: number, color: string) => {
  switch (iconKey) {
    // 크리스마스
    case "tree": drawTree(ctx, size, color); break;
    case "snowflake": drawSnowflake(ctx, size, color); break;
    case "star": drawStar(ctx, size, color); break;
    case "gift": drawGift(ctx, size, color); break;
    case "bell": drawCircle(ctx, size, color); break; // 간단히 원형
    case "candle": drawCircle(ctx, size, color); break;
    case "snowman": drawCircle(ctx, size, color); break;
    case "santa": drawCircle(ctx, size, color); break;
    // 발렌타인
    case "heart": drawHeart(ctx, size, color); break;
    case "heartBroken": drawHeart(ctx, size, color); break;
    case "heartbeat": drawHeart(ctx, size, color); break;
    case "rose": drawRose(ctx, size, color); break;
    case "flower": drawPetal(ctx, size, color); break;
    case "gem": drawCircle(ctx, size, color); break;
    case "ribbon": drawCircle(ctx, size, color); break;
    case "envelope": drawCircle(ctx, size, color); break;
    // 할로윈
    case "pumpkin": drawPumpkin(ctx, size, color); break;
    case "ghost": drawCloud(ctx, size, color); break;
    case "spider": drawCircle(ctx, size, color); break;
    case "spiderWeb": drawCircle(ctx, size, color); break;
    case "hatWizard": drawCircle(ctx, size, color); break;
    case "skull": drawCircle(ctx, size, color); break;
    case "moon": drawCircle(ctx, size, color); break;
    case "cloudMoon": drawCloud(ctx, size, color); break;
    // 기본
    case "petal": drawPetal(ctx, size, color); break;
    case "waterDrop": drawWaterDrop(ctx, size, color); break;
    case "circle": drawCircle(ctx, size, color); break;
    case "cloud": drawCloud(ctx, size, color); break;
    case "leaf": drawLeaf(ctx, size, color); break;
    default: drawCircle(ctx, size, color); break;
  }
};

