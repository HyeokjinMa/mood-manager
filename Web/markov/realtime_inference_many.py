# flask_realtime_inference_server_post.py
# -*- coding: utf-8 -*-

"""
어제 생성된 마르코프 기반 무드 모델을 사용해서
실시간 인풋(스트레스/수면/날씨/웃음/한숨)을 받아,
현재 상태와 30분 후 상태를 예측하는 Flask 서버 (POST 방식 <- 왜 POST여야 함?).

- 서버: localhost:3000
- 엔드포인트:
    POST /inference
      Body(JSON):
      {
        "user_id": "user_001",
        "average_stress_index": ...,
        "recent_stress_index": ...,
        "latest_sleep_score": ...,
        "latest_sleep_duration": ...,
        "temperature": ...,
        "humidity": ...,
        "rainType": ...,
        "sky": ...,
        "sigh": ...,
        "laughter": ...
      }

      → 아래 필드를 포함한 JSON 반환:
      {
        "user_id": "user_001",
        "inference_time": "...",
        "current_id": ...,
        "current_title": "...",
        "current_description": "...",
        "future_id": ...,
        "future_title": "...",
        "future_description": "..."
      }
"""

from __future__ import annotations
from typing import Dict, Any, Tuple, List
from pathlib import Path
from datetime import datetime, timedelta, timezone
import json

import numpy as np
import pandas as pd
from flask import Flask, request, Response

# ==============================
# 공통 설정
# ==============================
app = Flask(__name__)

BASE_DEBUG_DIR = Path("./debug_outputs")
MODEL_DIR = BASE_DEBUG_DIR / "model"


def clamp(v: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, v))


# ==============================
# 1. payload → raw_point 변환
# ==============================

def build_raw_point_from_payload(payload: dict) -> dict:
    """
    클라이언트에서 보내준 JSON(payload)을
    모델이 사용하는 raw_point 형식으로 변환한다.

    기대 입력 예시:
    {
        "user_id": "user_001",
        "average_stress_index": 45,
        "recent_stress_index": 39,
        "latest_sleep_score": 79,
        "latest_sleep_duration": 600,
        "temperature": 9.6,
        "humidity": 26,
        "rainType": 0,
        "sky": 1,
        "sigh": 3,
        "laughter": 12
    }
    """

    raw_point = {
        # 1) 스트레스 / 수면
        "average_stress_index": payload["average_stress_index"],
        "recent_stress_index": payload["recent_stress_index"],
        "latest_sleep_score": payload["latest_sleep_score"],
        "latest_sleep_duration": payload["latest_sleep_duration"],
        "temparature": payload["temperature"],
        "humidity": payload["humidity"],
        "rainType": payload["rainType"],
        "sky": payload["sky"],
        "sigh": payload["sigh"],
        "laughter": payload["laughter"]
    }

    return raw_point


# ==============================
# 2. feature 계산
# ==============================

def compute_feature_row(raw_row: pd.Series) -> Dict[str, float]:
    """
    raw_row: Series
      - average_stress_index, recent_stress_index,
        latest_sleep_score, latest_sleep_duration,
        temperature, humidity, rainType, sky,
        laughter, sigh

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
    sleep_dur_norm = raw_row["latest_sleep_duration"] / 600.0
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
    temp_discomfort = abs((temp if temp is not None else 22.0) - 22.0) / 20.0

    humid = raw_row["humidity"]
    humid_discomfort = 0.0
    if humid is not None:
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
    실시간 인풋(raw dict)을 받아서 feature 5개로 변환.
    feature_cols: meta["feature_cols"] 순서
    """
    row = pd.Series(raw_point)
    scores = compute_feature_row(row)
    return np.array([scores[c] for c in feature_cols], dtype=float)


# ==============================
# 3. 클러스터 자연어 설명
# ==============================

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


# ==============================
# 4. 어제 모델 로드
# ==============================

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
        "model_date": yesterday,
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


# ==============================
# 5. 심플 JSON inference (단일 유저)
# ==============================

def infer_state_simple(
    raw_point: Dict[str, float],
    yesterday_model: Dict[str, Any],
    future_minutes: int = 30,
) -> Dict[str, Any]:
    """
    출력 필드:
      - user_id
      - inference_time (UTC ISO string)
      - current_id, current_title, current_description
      - future_id, future_title, future_description
    """
    feature_cols = yesterday_model["feature_cols"]
    feat_vec = feature_from_raw_point(raw_point, feature_cols)

    endpoint_means = np.array(yesterday_model["endpoint_means"])
    dists = np.linalg.norm(endpoint_means - feat_vec[None, :], axis=1)
    current_cluster = int(dists.argmin())

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

    cur_summary = yesterday_model["cluster_summaries"][current_cluster]
    fut_summary = yesterday_model["cluster_summaries"][future_cluster]

    cur_title, cur_desc = explain_cluster(cur_summary)
    fut_title, fut_desc = explain_cluster(fut_summary)

    return {
        "user_id": yesterday_model["user_id"],
        "inference_time": datetime.now(timezone.utc).isoformat(),
        "current_id": current_cluster,
        "current_title": cur_title,
        "current_description": cur_desc,
        "future_id": future_cluster,
        "future_title": fut_title,
        "future_description": fut_desc,
    }


# ==============================
# 6. Flask 서버 세팅 (POST /inference)
# ==============================

@app.route("/", methods=["GET"])
def health():
    return "Mood inference POST server is running.", 200


@app.route("/inference", methods=["POST"])
def inference():
    """
    POST http://localhost:5000/inference   
    """
    now = datetime.now(timezone.utc)
    today = now

    try:
        payload = request.get_json(force=True, silent=False)
    except Exception:
        err = {"error": "invalid_json", "message": "유효한 JSON body가 필요합니다."}
        body = json.dumps(err, ensure_ascii=False)
        return Response(body, status=400, mimetype="application/json; charset=utf-8")

    if not isinstance(payload, dict):
        err = {"error": "invalid_payload", "message": "JSON body는 object 형태여야 합니다."}
        body = json.dumps(err, ensure_ascii=False)
        return Response(body, status=400, mimetype="application/json; charset=utf-8")

    user_id = payload.get("user_id")
    if not user_id:
        err = {"error": "missing_user_id", "message": "user_id가 body에 필요합니다."}
        body = json.dumps(err, ensure_ascii=False)
        return Response(body, status=400, mimetype="application/json; charset=utf-8")

    try:
        # 1) payload → raw_point 변환
        raw_point = build_raw_point_from_payload(payload)

        # 2) 어제 모델 로드
        yesterday_model = load_yesterday_model_runtime(user_id, today)

        # 3) 인퍼런스
        result = infer_state_simple(
            raw_point=raw_point,
            yesterday_model=yesterday_model,
            future_minutes=30,
        )

        body = json.dumps(result, ensure_ascii=False)
        return Response(body, status=200, mimetype="application/json; charset=utf-8")

    except KeyError as e:
        err = {
            "error": "missing_field",
            "message": f"필수 필드가 없습니다: {e}"
        }
        body = json.dumps(err, ensure_ascii=False)
        return Response(body, status=400, mimetype="application/json; charset=utf-8")

    except FileNotFoundError as e:
        err = {"error": "model_not_found", "message": str(e)}
        body = json.dumps(err, ensure_ascii=False)
        return Response(body, status=404, mimetype="application/json; charset=utf-8")

    except Exception as e:
        err = {"error": "internal_error", "message": str(e)}
        body = json.dumps(err, ensure_ascii=False)
        return Response(body, status=500, mimetype="application/json; charset=utf-8")
