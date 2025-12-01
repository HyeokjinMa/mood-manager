/**
 * ScentBackground 그리기 함수들
 */

// 향 타입별 모양 그리기 함수들
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
  ctx.fillStyle = color; // 원래 색으로 복원
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

