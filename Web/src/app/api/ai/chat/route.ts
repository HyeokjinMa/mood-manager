//openAI RAG 호출 API

import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/ai/chat
 * 
 * OpenAI RAG 호출 API
 * 
 * TODO: 백엔드 서버로 요청을 프록시하거나 직접 호출하도록 구현
 */
export async function POST() {
  // [MOCK] 목업 모드: 목업 응답 반환
  // TODO: 백엔드 API 연동 시 구현
  
  return NextResponse.json({
    message: "AI chat API - Coming soon",
  });
}