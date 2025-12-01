/**
 * Python 예측 제공자 팩토리
 * 
 * REST API 또는 파일 기반 중 선택 가능
 */

import type { EmotionPredictionProvider } from "./EmotionPredictionProvider";
import { PythonEmotionPredictionProvider } from "./PythonEmotionPredictionProvider";
import { PythonFileBasedProvider } from "./PythonFileBasedProvider";

export type PythonProviderType = "rest" | "file";

/**
 * Python 예측 제공자 생성
 */
export function createPythonProvider(type?: PythonProviderType): EmotionPredictionProvider {
  const providerType = type || (process.env.PYTHON_PROVIDER_TYPE as PythonProviderType) || "rest";
  
  switch (providerType) {
    case "file":
      console.log("[PythonProviderFactory] Using file-based Python provider");
      return new PythonFileBasedProvider();
    
    case "rest":
    default:
      console.log("[PythonProviderFactory] Using REST API Python provider");
      return new PythonEmotionPredictionProvider();
  }
}

