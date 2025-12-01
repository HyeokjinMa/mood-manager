# realtime_inference_yesterday_model_simple_json.py
# -*- coding: utf-8 -*-
"""
어제 생성해둔 모델 메타(json)를 로드해서,
다음 날 실시간 인풋 1건을 API에서 받아온 뒤:

- user_id
- inference_time (UTC ISO string)
- current_id / current_title / current_description
- future_id / future_title / future_description

만 포함된 심플 JSON(dict)을 반환/출력하는 스크립트.
"""

from __future__ import annotations
from typing import Dict, Any, Tuple, List
from pathlib import Path
from datetime import datetime, timedelta
import json

import numpy as np
import pandas as pd
# 실시간 데이터 API 호출용 (직접 엔드포인트/파라미터 채우면 됨)
import requests


BASE_DEBUG_DIR = Path("./debug_outputs")
MODEL_DIR = BASE_DEBUG_DIR / "model"


def clamp(v: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, v))


# ============================================================
# 1. feature 계산 (build 스크립트와 동일)
# ============================================================

def compute_feature_row(raw_row: pd.Series) -> Dict[str, float]:
    """
    raw_row: Series
      - average_stress_index, recent_stress_index, latest_sleep_score, latest_sleep_duration,
        temperature, humidity, rainType, sky, laughter, sigh
    output:
      5개 0~1 score (Stress/Calm/Fatigue/Vibrancy/Weather)
    """
    # --- Stress / Calm ---
    avg_stress = raw_row["average_stress_index"] / 100.0
    recent_stress = raw_row["recent_stress_index"] / 100.0
    stress_raw = 0.4 * avg_stress + 0.6 * recent_stress
    StressScore = clamp(stress_raw, 0.0, 1.0)

    CalmScore = clamp(1.0 - StressScore * 0.9, 0.0, 1.0)

    # --- Fatigue ---
    sleep_score = raw_row["latest_sleep_score"] / 100.0
    sleep_dur_norm = raw_row["latest_sleep_duration"] / 600.0  # 0~600분
    sleep_fatigue = clamp(1.0 - 0.7 * sleep_score - 0.3 * sleep_dur_norm, 0.0, 1.0)

    sigh = raw_row["sigh"]
    sigh_norm = clamp(sigh / 10.0, 0.0, 1.0)
    FatigueScore = clamp(0.6 * sleep_fatigue + 0.4 * sigh_norm, 0.0, 1.0)

    # --- Vibrancy ---
    laughter = raw_row["laughter"]
    laugh_norm = clamp(laughter / 10.0, 0.0, 1.0)
    VibrancyScore = clamp(0.7 * laugh_norm + 0.3 * (1.0 - FatigueScore), 0.0, 1.0)

    # --- Weather ---
    temp = raw_row["temperature"]
    temp_discomfort = abs(temp - 22.0) / 20.0  # 22도에서 멀어질수록 불편
    humid = raw_row["humidity"]
    humid_discomfort = max(0.0, (humid - 60.0) / 40.0)

    rainType = raw_row["rainType"]
    sky = raw_row["sky"]
    rain_penalty = 0.0
    if rainType == 1:
        rain_penalty = 0.1
    elif rainType in (2, 3):
        rain_penalty = 0.2
    sky_penalty = 0.0
    if sky == 4:
        sky_penalty = 0.05

    discomfort = clamp(
        temp_discomfort + humid_discomfort + rain_penalty + sky_penalty,
        0.0,
        1.5,
    )
    WeatherScore = clamp(1.0 - discomfort, 0.0, 1.0)

    return {
        "StressScore": StressScore,
        "CalmScore": CalmScore,
        "FatigueScore": FatigueScore,
        "VibrancyScore": VibrancyScore,
        "WeatherScore": WeatherScore,
    }


def feature_from_raw_point(raw_point: Dict[str, float],
                           feature_cols: List[str]) -> np.ndarray:
    """
    실시간 인풋 1점(raw dict)을 받아서 feature 5개로 변환.
    feature_cols: meta["feature_cols"] 순서
    """
    row = pd.Series(raw_point)
    scores = compute_feature_row(row)
    return np.array([scores[c] for c in feature_cols], dtype=float)


# ============================================================
# 2. 클러스터 자연어 설명
# ============================================================

def _describe_level(x: float, low=0.33, high=0.66,
                    words=("낮은", "보통인", "높은")) -> str:
    if x < low:
        return words[0]
    elif x > high:
        return words[2]
    else:
        return words[1]


def _overall_mood_title(valence: float, arousal: float,
                        stress: float, fatigue: float, vibrancy: float) -> str:
    if valence > 0.7 and arousal > 0.55:
        base = "활력이 느껴지는 긍정 상태"
    elif valence > 0.7 and arousal <= 0.55:
        base = "편안한 긍정 상태"
    elif valence > 0.2:
        base = "안정적인 중립~긍정 상태"
    elif valence < -0.3 and arousal < 0.4:
        base = "기운이 빠진 다운 상태"
    elif valence < -0.3 and arousal >= 0.4:
        base = "예민하거나 긴장된 상태"
    else:
        base = "복합적인 감정 상태"

    stress_level = _describe_level(stress, words=("낮은", "보통인", "높은"))
    fatigue_level = _describe_level(fatigue, words=("낮은", "보통인", "높은"))
    vib_level = _describe_level(vibrancy, words=("낮은", "보통인", "높은"))

    if "긍정" in base and fatigue_level == "낮은" and vib_level == "높은":
        return "에너지가 좋은 상향 긍정 상태"
    if "긍정" in base and fatigue_level == "보통인" and vib_level == "낮은":
        return "기분은 괜찮지만 조금 지친 긍정 상태"
    if "다운" in base and stress_level == "높은":
        return "지치고 부담이 큰 다운 상태"
    if "편안한 긍정" in base and fatigue_level != "높은":
        return "잔잔하고 편안한 긍정 상태"

    return base


def explain_cluster(summary: dict) -> Tuple[str, str]:
    """
    cluster_summaries[k] 하나를 받아서
    (title, description) 반환.
    """
    s = summary["mean_scores"]
    Stress = float(s["StressScore"])
    Calm = float(s["CalmScore"])
    Fatigue = float(s["FatigueScore"])
    Vibrancy = float(s["VibrancyScore"])
    Weather = float(s["WeatherScore"])
    val = float(summary["valence"])
    aro = float(summary["arousal"])

    title = _overall_mood_title(val, aro, Stress, Fatigue, Vibrancy)

    parts: List[str] = []

    if val > 0.7:
        parts.append("전반적으로 기분이 꽤 좋은 편이에요.")
    elif val > 0.2:
        parts.append("전반적으로 무난하고 안정적인 감정 상태예요.")
    elif val > -0.2:
        parts.append("크게 좋지도 나쁘지도 않은 보통 감정 상태예요.")
    else:
        parts.append("조금은 기분이 가라앉아 있는 편이에요.")

    if aro > 0.6:
        parts.append("에너지가 올라와 있고, 뭔가를 해볼 수 있는 여유가 느껴져요.")
    elif aro > 0.4:
        parts.append("적당한 에너지가 있어서 일상적인 일을 하기에는 무리가 없어요.")
    else:
        parts.append("에너지가 다소 떨어져 있어서 무리한 활동보다는 휴식이 잘 어울리는 상태예요.")

    if Stress > 0.6:
        parts.append("스트레스나 긴장은 비교적 높은 편이라, 스스로를 좀 더 보호해 줄 필요가 있어요.")
    elif Stress < 0.4:
        parts.append("스트레스 수준은 낮은 편이라 크게 압박을 느끼고 있지는 않아요.")

    if Calm > 0.65:
        parts.append("마음은 꽤 차분하고 안정적인 상태예요.")
    elif Calm < 0.45:
        parts.append("마음이 다소 산만하거나 불안정하게 느껴질 수 있어요.")

    if Fatigue > 0.6:
        parts.append("피로감이 많이 쌓여 있어서 충분한 휴식이 필요해 보여요.")
    elif Fatigue > 0.35:
        parts.append("어느 정도 피로가 느껴지지만, 완전히 지친 수준은 아니어요.")
    else:
        parts.append("피로감은 크지 않은 편이라 컨디션은 비교적 괜찮아요.")

    if Vibrancy > 0.6:
        parts.append("흥미나 즐거움이 잘 느껴지는 상태예요.")
    elif Vibrancy < 0.3:
        parts.append("흥미나 설렘은 다소 낮아서, 새로운 자극보다는 익숙한 것이 편할 수 있어요.")

    if Weather > 0.7:
        parts.append("외부 환경이나 날씨도 컨디션을 크게 방해하지는 않는 편이에요.")
    elif Weather < 0.4:
        parts.append("날씨나 환경이 컨디션에 조금 부정적인 영향을 줄 수 있어요.")

    description = " ".join(parts)
    return title, description


# ============================================================
# 3. 어제 모델 로드
# ============================================================

def load_yesterday_model_runtime(user_id: str, today: datetime) -> Dict[str, Any]:
    """
    today 기준으로 '어제' 날짜의 모델 메타를 읽어서
    실시간 추론에 사용할 runtime_model dict로 변환.
    """
    yesterday = today - timedelta(days=1)
    date_str = yesterday.strftime("%Y%m%d")
    prefix = f"{user_id}_{date_str}"
    meta_path = MODEL_DIR / f"{prefix}_yesterday_model_meta.json"

    if not meta_path.exists():
        raise FileNotFoundError(f"Model meta not found: {meta_path}")

    with meta_path.open("r", encoding="utf-8") as f:
        meta = json.load(f)

    centroids = np.load(meta["centroids_npy"])
    endpoint_means = np.load(meta["endpoint_means_npy"])
    P1 = np.load(meta["P1_npy"])
    P3 = np.load(meta["P3_npy"])

    runtime_model = {
        "user_id": user_id,
        "model_date": yesterday,          # datetime
        "meta_path": str(meta_path),
        "freq_minutes": meta["freq_minutes"],
        "window_length": meta["window_length"],
        "K": meta["K"],
        "feature_cols": meta["feature_cols"],
        "centroids": centroids,
        "endpoint_means": endpoint_means,
        "P1": P1,
        "P3": P3,
        "cluster_summaries": meta["cluster_summaries"],
    }
    return runtime_model


# ============================================================
# 4. 실시간 raw 데이터 API에서 가져오기 (여기만 실제 엔드포인트로 채우면 됨)
# ============================================================

def fetch_current_raw_from_api(user_id: str) -> Dict[str, float]:
    """
    실시간 센서/서비스 API에서 '현재 시점' raw 데이터를 한 건 받아오는 함수.

    ⚠️ 아래는 템플릿 예시이고, 실제 URL/파라미터/응답 포맷에 맞게 수정해야 함.
    기대하는 반환 형식은 예를 들면:

    {
        "average_stress_index": 35,
        "recent_stress_index": 40,
        "latest_sleep_score": 82,
        "latest_sleep_duration": 420,
        "temperature": 21.5,
        "humidity": 55,
        "rainType": 0,
        "sky": 1,
        "laughter": 3,
        "sigh": 1
    }
    """

    # === 예시 코드 (실제 값으로 교체해서 사용) ===
    #
    # url = "https://your-service-domain.com/api/mood/current"
    # params = {
    #     "user_id": user_id,
    # }
    # resp = requests.get(url, params=params, timeout=3)
    # resp.raise_for_status()
    # data = resp.json()
    #
    # # 만약 data가 {"data": {...}} 형태라면:
    # # data = data["data"]
    #
    # return {
    #     "average_stress_index": data["average_stress_index"],
    #     "recent_stress_index": data["recent_stress_index"],
    #     "latest_sleep_score": data["latest_sleep_score"],
    #     "latest_sleep_duration": data["latest_sleep_duration"],
    #     "temperature": data["temperature"],
    #     "humidity": data["humidity"],
    #     "rainType": data["rainType"],
    #     "sky": data["sky"],
    #     "laughter": data["laughter"],
    #     "sigh": data["sigh"],
    # }

    raise NotImplementedError("fetch_current_raw_from_api() 안에 실제 실시간 API 호출 로직을 구현하세요.")


# ============================================================
# 5. 심플 JSON inference
# ============================================================

def infer_state_simple(
    raw_point: Dict[str, float],
    yesterday_model: Dict[str, Any],
    future_minutes: int = 30,
) -> Dict[str, Any]:
    """
    raw_point: 실시간 인풋 (dict)
    yesterday_model: load_yesterday_model_runtime 결과
    future_minutes: 몇 분 후 상태를 볼 것인지 (예: 30 → 3 step)

    return: 아래 필드만 포함된 dict
      - user_id
      - inference_time (UTC)
      - current_id, current_title, current_description
      - future_id, future_title, future_description
    """
    feature_cols = yesterday_model["feature_cols"]
    feat_vec = feature_from_raw_point(raw_point, feature_cols)

    endpoint_means = np.array(yesterday_model["endpoint_means"])
    K = endpoint_means.shape[0]

    # 현재 state
    dists = np.linalg.norm(endpoint_means - feat_vec[None, :], axis=1)
    current_cluster = int(dists.argmin())

    # 마르코프 step
    freq = yesterday_model["freq_minutes"]
    step = max(1, future_minutes // freq)

    if step == 3:
        P = np.array(yesterday_model["P3"])
    elif step == 1:
        P = np.array(yesterday_model["P1"])
    else:
        P1 = np.array(yesterday_model["P1"])
        P = np.linalg.matrix_power(P1, step)

    transition_row = P[current_cluster]
    future_cluster = int(transition_row.argmax())

    # 자연어 설명
    cur_summary = yesterday_model["cluster_summaries"][current_cluster]
    fut_summary = yesterday_model["cluster_summaries"][future_cluster]

    cur_title, cur_desc = explain_cluster(cur_summary)
    fut_title, fut_desc = explain_cluster(fut_summary)

    return {
        "user_id": yesterday_model["user_id"],
        "inference_time": datetime.utcnow().isoformat(),
        "current_id": current_cluster,
        "current_title": cur_title,
        "current_description": cur_desc,
        "future_id": future_cluster,
        "future_title": fut_title,
        "future_description": fut_desc,
    }


# ============================================================
# 6. 예시 main: API에서 받아와서 콘솔에 JSON 출력
# ============================================================

if __name__ == "__main__":
    user_id = "user_001"  # TODO: 실제 user_id 입력

    # 오늘 기준 어제 모델 사용
    today = datetime.today()
    yesterday_model = load_yesterday_model_runtime(user_id, today)

    # ✅ 실시간 raw 데이터 API에서 가져오기 (여기서 실제 API 호출)
    raw_point = fetch_current_raw_from_api(user_id=user_id)

    result = infer_state_simple(
        raw_point=raw_point,
        yesterday_model=yesterday_model,
        future_minutes=30,
    )

    print(json.dumps(result, ensure_ascii=False, indent=2))
