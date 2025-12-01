/**
 * Python 응답 검증
 * 
 * Python 서버에서 받은 응답이 유효한지 검증
 */

import type { PythonPredictionResponse } from "./types";

/**
 * Python 응답 유효성 검증
 */
export function validatePythonResponse(data: unknown): data is PythonPredictionResponse {
  if (!data || typeof data !== "object") {
    console.error("[validatePythonResponse] Invalid response: not an object");
    return false;
  }
  
  const response = data as Record<string, unknown>;
  
  // 필수 필드 검증
  const requiredFields = [
    "user_id",
    "inference_time",
    "current_id",
    "current_title",
    "current_description",
    "future_id",
    "future_title",
    "future_description",
  ];
  
  for (const field of requiredFields) {
    if (!(field in response)) {
      console.error(`[validatePythonResponse] Missing required field: ${field}`);
      return false;
    }
  }
  
  // 타입 검증
  if (typeof response.user_id !== "string") {
    console.error("[validatePythonResponse] Invalid user_id: must be string");
    return false;
  }
  
  if (typeof response.inference_time !== "string") {
    console.error("[validatePythonResponse] Invalid inference_time: must be string");
    return false;
  }
  
  if (typeof response.current_id !== "number") {
    console.error("[validatePythonResponse] Invalid current_id: must be number");
    return false;
  }
  
  if (typeof response.current_title !== "string" || response.current_title.trim().length === 0) {
    console.error("[validatePythonResponse] Invalid current_title:", {
      value: response.current_title,
      type: typeof response.current_title,
    });
    return false;
  }
  
  if (typeof response.current_description !== "string" || response.current_description.trim().length === 0) {
    console.error("[validatePythonResponse] Invalid current_description:", {
      value: response.current_description,
      type: typeof response.current_description,
    });
    return false;
  }
  
  if (typeof response.future_id !== "number") {
    console.error("[validatePythonResponse] Invalid future_id:", {
      value: response.future_id,
      type: typeof response.future_id,
    });
    return false;
  }
  
  if (typeof response.future_title !== "string" || response.future_title.trim().length === 0) {
    console.error("[validatePythonResponse] Invalid future_title:", {
      value: response.future_title,
      type: typeof response.future_title,
    });
    return false;
  }
  
  if (typeof response.future_description !== "string" || response.future_description.trim().length === 0) {
    console.error("[validatePythonResponse] Invalid future_description:", {
      value: response.future_description,
      type: typeof response.future_description,
    });
    return false;
  }
  
  // inference_time 형식 검증 (ISO 8601)
  try {
    const date = new Date(response.inference_time);
    if (isNaN(date.getTime())) {
      console.error("[validatePythonResponse] Invalid inference_time: not a valid date");
      return false;
    }
  } catch (error) {
    console.error("[validatePythonResponse] Invalid inference_time format:", error);
    return false;
  }
  
  return true;
}

