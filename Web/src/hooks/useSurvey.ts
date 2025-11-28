import { useState, useEffect } from "react";
import toast from "react-hot-toast";

/**
 * 설문 조사 관리 커스텀 훅
 * 
 * 홈 화면에서 팝업으로 설문 조사를 표시하고 처리
 */
export function useSurvey() {
  const [showSurvey, setShowSurvey] = useState(false);

  // 설문 조사 완료 여부 확인 (초기 로드 시 1회)
  useEffect(() => {
    const checkSurveyStatus = async () => {
      try {
        const response = await fetch("/api/auth/survey-status", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });
        if (!response.ok) {
          // 에러 발생 시 설문 표시하지 않음
          return;
        }
        const data = await response.json();
        // hasSurvey가 false면 설문 오버레이 표시
        if (data.hasSurvey === false) {
          setShowSurvey(true);
        }
      } catch (error) {
        console.error("Error checking survey status:", error);
        // 에러 발생 시 설문 표시하지 않음
      }
    };
    checkSurveyStatus();
  }, []);

  // 설문 완료 핸들러 (향, 음악 장르 선호도 저장)
  const handleSurveyComplete = async (
    scentLiked: string[],
    scentDisliked: string[],
    musicLiked: string[],
    musicDisliked: string[]
  ) => {
    try {
      // 선호도 저장 API 호출
      const response = await fetch("/api/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          scentLiked,
          scentDisliked,
          colorLiked: [], // 색상은 설문에서 제외
          colorDisliked: [],
          musicLiked,
          musicDisliked,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save preferences");
      }

      toast.success("설문이 완료되었습니다!");
      setShowSurvey(false);
    } catch (error) {
      console.error("Error saving survey:", error);
      toast.error("설문 저장 중 오류가 발생했습니다.");
    }
  };

  // 설문 건너뛰기 핸들러 (모든 요소를 긍정으로 처리)
  const handleSurveySkip = async () => {
    try {
      // 건너뛰기 시 모든 향과 음악 장르를 긍정으로 처리
      const allScents = ["Citrus", "Floral", "Woody", "Fresh", "Spicy", "Sweet", "Herbal", "Fruity", 
        "Musk", "Aromatic", "Honey", "Green", "Dry", "Leathery", "Marine", "Powdery"];
      const allMusic = ["newage", "classical", "jazz", "ambient", "nature", 
        "meditation", "piano", "guitar", "orchestral", "electronic"];

      // 모든 요소를 긍정으로 저장
      const response = await fetch("/api/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          scentLiked: allScents,
          scentDisliked: [],
          colorLiked: [],
          colorDisliked: [],
          musicLiked: allMusic,
          musicDisliked: [],
        }),
      });

      if (!response.ok) {
        // 저장 실패해도 설문 건너뛰기 API 호출
        const skipResponse = await fetch("/api/auth/survey-skip", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });
        if (!skipResponse.ok) throw new Error("Failed to skip survey");
      }

      toast.success("설문을 건너뛰었습니다. (모든 항목을 긍정으로 처리했습니다)");
      setShowSurvey(false);
    } catch (error) {
      console.error("Error skipping survey:", error);
      // 에러 발생해도 오버레이 닫기
      setShowSurvey(false);
    }
  };

  return {
    showSurvey,
    handleSurveyComplete,
    handleSurveySkip,
  };
}

