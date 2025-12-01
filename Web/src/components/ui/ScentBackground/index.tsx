/**
 * ScentBackground Component
 * 
 * 향 타입에 따라 다른 동적 배경 효과를 제공합니다.
 * - 향 아이콘을 눈/비처럼 흩날리게 표시
 * - 백그라운드에 불투명도 50% 레이어 적용
 * - 대시보드 영역은 효과가 보이지 않도록 처리
 */

"use client";

import { useEffect, useRef, useState } from "react";
import type { ScentType } from "@/types/mood";
import { blendWithWhite } from "@/lib/utils";
import type { ScentParticle, ScentBackgroundProps } from "./types";
import { SCENT_ANIMATION_STYLES } from "./constants";
import {
  drawPetal,
  drawWaterDrop,
  drawCircle,
  drawLeaf,
  drawCloud,
  drawHerbLeaf,
  drawParticle,
  drawHoneyDrop,
  drawDust,
  drawFragment,
  drawPowder,
} from "./drawing";

export default function ScentBackground({
  scentType,
  scentColor,
  intensity,
  className = "",
  backgroundIcon, // TODO: 향후 아이콘 렌더링 구현 예정 (현재 미사용)
  backgroundWind,
  animationSpeed = 4,
  iconOpacity = 0.7,
  backgroundColor,
}: ScentBackgroundProps) {
  // backgroundIcon은 향후 구현 예정이므로 현재는 사용하지 않음
  void backgroundIcon;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const particlesRef = useRef<ScentParticle[]>([]);
  const [particleCount, setParticleCount] = useState(0);
  const [currentBgColor, setCurrentBgColor] = useState<string>("");

  const style = SCENT_ANIMATION_STYLES[scentType];

  // 배경 색상 부드러운 전환
  useEffect(() => {
    // 기본 배경: 향 타입별 파스텔 톤
    let bg = style.backgroundColor;
    // moodColor가 들어올 경우, 흰색과 섞어서 파스텔톤으로만 살짝 덮어줌
    if (backgroundColor) {
      bg = blendWithWhite(backgroundColor, 0.9);
    }
    setCurrentBgColor(bg);

    // 배경 색상 전환 (파티클 컬러는 애니메이션 루프에서 직접 backgroundColor 사용)
  }, [backgroundColor, style.backgroundColor]);

  // 파티클 수 계산 (향 레벨에 따라)
  useEffect(() => {
    const baseCount = 50; // 최대 약 50개 수준으로 조정
    const densityMultiplier = style.density;
    const intensityMultiplier = intensity / 10;
    const count = Math.floor(baseCount * densityMultiplier * intensityMultiplier);
    setParticleCount(count);
  }, [scentType, intensity, style.density]);

  // 파티클 초기화
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 캔버스 크기 설정
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // 파티클 생성 (불규칙성을 위한 랜덤 요소 추가)
    const createParticle = (initialY?: number): ScentParticle => {
      const sizeRange = style.size;
      const speedRange = style.speed;
      const baseSpeed = speedRange.min + Math.random() * (speedRange.max - speedRange.min);
      
      // 화면 전체에 골고루 분포 (상단에서 시작하되 화면 전체 높이에 분산)
      const yPosition = initialY !== undefined 
        ? initialY 
        : Math.random() * canvas.height * 1.5 - canvas.height * 0.5; // -0.5h ~ 1.5h 범위
      
      return {
        id: Math.random(),
        x: Math.random() * canvas.width,
        y: yPosition,
        size: sizeRange.min + Math.random() * (sizeRange.max - sizeRange.min),
        speed: baseSpeed,
        opacity: 0.6 + Math.random() * 0.4, // 0.6-1.0
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 2, // -1 ~ 1
        // 불규칙성 추가
        windX: (Math.random() - 0.5) * 0.3, // 좌우 바람 (-0.15 ~ 0.15)
        windY: (Math.random() - 0.5) * 0.2, // 상하 바람 (-0.1 ~ 0.1)
        turbulence: Math.random() * 0.5 + 0.3, // 난류 강도 (0.3 ~ 0.8)
        life: 1.0, // 초기 생명력
        lifeSpeed: 0.0003 + Math.random() * 0.0005, // 생명력 감소 속도 감소 (더 오래 유지)
      };
    };

    // 초기 파티클 생성 (화면 전체에 골고루 분포)
    particlesRef.current = Array.from({ length: particleCount }, (_, i) => {
      // 화면 전체 높이에 골고루 분산
      const yPos = (i / particleCount) * canvas.height * 2 - canvas.height * 0.5;
      return createParticle(yPos);
    });

    // 애니메이션 루프
    const animate = () => {
      if (!ctx) return;

      // 스타일 범위 정의 (스코프 문제 해결)
      const sizeRange = style.size;
      const speedRange = style.speed;

      // 현재 파티클 컬러 계산 (무드 컬러 우선 사용)
      const particleColor = backgroundColor || scentColor;

      // 캔버스 클리어 (LLM 추천 배경 색상 또는 기본 색상)
      ctx.fillStyle = currentBgColor || style.backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 시간 기반 변화 (불규칙성 추가)
      const time = Date.now() * 0.001; // 초 단위 시간

      // 파티클 업데이트 및 그리기
      particlesRef.current.forEach((particle, index) => {
        // 생명주기 업데이트
        particle.life -= particle.lifeSpeed;
        if (particle.life <= 0) {
          // 파티클 재생성 (완전히 새로운 위치와 속성)
          const baseSpeed = speedRange.min + Math.random() * (speedRange.max - speedRange.min);
          
          particle.x = Math.random() * canvas.width;
          particle.y = -particle.size;
          particle.size = sizeRange.min + Math.random() * (sizeRange.max - sizeRange.min);
          particle.speed = baseSpeed;
          particle.opacity = 0.6 + Math.random() * 0.4;
          particle.rotation = Math.random() * 360;
          particle.rotationSpeed = (Math.random() - 0.5) * 2;
          particle.windX = (Math.random() - 0.5) * 0.3;
          particle.windY = (Math.random() - 0.5) * 0.2;
          particle.turbulence = Math.random() * 0.5 + 0.3;
          particle.life = 1.0;
          particle.lifeSpeed = 0.0003 + Math.random() * 0.0005; // 생명력 감소 속도 감소 (더 오래 유지)
        }

        // LLM 풍향/풍속 적용
        const windDirection = backgroundWind?.direction || 180; // 기본값: 아래로
        const windSpeed = backgroundWind?.speed || 3; // 기본값: 3
        const windRad = (windDirection * Math.PI) / 180;
        const windX = Math.cos(windRad) * windSpeed * 0.1;
        const windY = Math.sin(windRad) * windSpeed * 0.1;
        
        // 불규칙한 바람 효과 (시간에 따라 변화) - LLM 풍향 반영
        const sway = Math.sin(particle.y * 0.01 + time * 0.5 + index) * style.swayAmount * particle.turbulence;
        const currentWindX = particle.windX + sway + windX;

        // 모든 파티클이 바닥으로 떨어짐 (LLM 풍향/속도 반영)
        const speedMultiplier = animationSpeed ? animationSpeed / 4 : 1; // 기본값 4를 기준으로 조절
        particle.y += particle.speed * (0.9 + Math.random() * 0.2) * speedMultiplier + windY;
        particle.x += currentWindX; // 좌우 흔들림 + LLM 풍향
        
        // 바닥에 도달하면 재생성
        if (particle.y > canvas.height) {
          particle.y = -particle.size;
          particle.x = Math.random() * canvas.width;
          particle.speed = speedRange.min + Math.random() * (speedRange.max - speedRange.min);
          particle.windX = (Math.random() - 0.5) * 0.2;
          particle.turbulence = Math.random() * 0.5 + 0.3;
          particle.rotation = Math.random() * 360;
        }

        // 회전 업데이트 (향 타입별 회전 속도)
        particle.rotation += particle.rotationSpeed * style.rotationSpeed * (0.9 + Math.random() * 0.2);

        // 파티클 그리기 (LLM iconOpacity 반영)
        ctx.save();
        ctx.translate(particle.x, particle.y);
        ctx.rotate((particle.rotation * Math.PI) / 180);
        ctx.globalAlpha = (particle.opacity * particle.life) * (iconOpacity || 0.7); // LLM iconOpacity 반영

        // 향 타입별 모양 그리기 (무드 컬러 직접 사용)
        ctx.fillStyle = particleColor;
        ctx.strokeStyle = particleColor;
        ctx.lineWidth = 1;

        switch (scentType) {
          case "Floral":
            drawPetal(ctx, particle.size, particleColor);
            break;
          case "Marine":
            drawWaterDrop(ctx, particle.size, particleColor);
            break;
          case "Citrus":
            drawCircle(ctx, particle.size, particleColor);
            break;
          case "Woody":
            drawLeaf(ctx, particle.size, particleColor);
            break;
          case "Musk":
            drawCloud(ctx, particle.size, particleColor);
            break;
          case "Aromatic":
            drawHerbLeaf(ctx, particle.size, particleColor);
            break;
          case "Green":
            drawLeaf(ctx, particle.size, particleColor);
            break;
          case "Spicy":
            drawParticle(ctx, particle.size, particleColor);
            break;
          case "Honey":
            drawHoneyDrop(ctx, particle.size, particleColor);
            break;
          case "Dry":
            drawDust(ctx, particle.size, particleColor);
            break;
          case "Leathery":
            drawFragment(ctx, particle.size, particleColor);
            break;
          case "Powdery":
            drawPowder(ctx, particle.size, particleColor);
            break;
          default:
            drawCircle(ctx, particle.size, particleColor);
        }

        ctx.restore();
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [particleCount, scentType, scentColor, backgroundColor, style, backgroundWind, animationSpeed, iconOpacity, currentBgColor]);

  return (
    <div
      className={`fixed inset-0 pointer-events-none z-0 ${className}`}
      style={{
        opacity: 1.0, // 항상 100% 선명도
      }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{
          mixBlendMode: "multiply", // 블렌딩 모드로 자연스러운 효과
        }}
      />
    </div>
  );
}

