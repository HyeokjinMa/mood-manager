# build_yesterday_model_from_api_step2lite.py
# -*- coding: utf-8 -*-
"""
어제 하루(10분 간격) 실제 API raw 데이터를 받아서
→ step2-lite (결측치 보간 + ffill/bfill, count=0, categorical ffill)
→ feature score 5개 계산
→ 슬라이딩 윈도우 → DTW 클러스터링 + 마르코프 + endpoint μ_k
→ debug_outputs/ 이하에 중간 산출물 + yesterday_model_meta.json 저장.

⚠️ fetch_day_raw_from_api() 안만 실제 API 호출 로직으로 채우면 됨.
"""

from __future__ import annotations
from typing import List, Dict, Any, Tuple
from pathlib import Path
from datetime import datetime, timedelta
import json

import numpy as np
import pandas as pd
from tslearn.clustering import TimeSeriesKMeans


# ============================================================
# 0. 공통 설정 + 디렉토리
# ============================================================

SLOT_MINUTES = 10             # 10분 간격
SLOTS_PER_DAY = 24 * 60 // SLOT_MINUTES  # 144
WINDOW_LENGTH = 24            # 24 * 10분 = 4시간
K_CLUSTERS = 5
RANDOM_SEED = 42

np.random.seed(RANDOM_SEED)

BASE_DEBUG_DIR = Path("./debug_outputs")
RAW_DIR = BASE_DEBUG_DIR / "raw"
CLEAN_DIR = BASE_DEBUG_DIR / "clean"
FEAT_DIR = BASE_DEBUG_DIR / "features"
WIN_DIR = BASE_DEBUG_DIR / "windows"
CLUSTER_DIR = BASE_DEBUG_DIR / "clusters"
MODEL_DIR = BASE_DEBUG_DIR / "model"

for d in [BASE_DEBUG_DIR, RAW_DIR, CLEAN_DIR, FEAT_DIR, WIN_DIR, CLUSTER_DIR, MODEL_DIR]:
    d.mkdir(parents=True, exist_ok=True)


def clamp(v: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, v))


# ============================================================
# 1. step2-lite: 결측치 + 간단 클린
# ============================================================

def clean_raw_df_step2lite(raw_df: pd.DataFrame) -> pd.DataFrame:
    """
    Step2-lite 버전
    - continuous: 선형 보간 + ffill + bfill
    - count: NaN -> 0
    - categorical: ffill + bfill
    - timestamp 정렬
    """
    df = raw_df.copy()

    # timestamp 처리 (API에서 문자열로 올 것을 가정)
    if "timestamp" in df.columns:
        df["timestamp"] = pd.to_datetime(df["timestamp"])
        df = df.sort_values("timestamp").reset_index(drop=True)

    # 컬럼 타입 분리 (실제 API 필드명에 맞게 필요하면 수정)
    continuous_cols_base = [
        "average_stress_index",
        "recent_stress_index",
        "latest_sleep_score",
        "latest_sleep_duration",
        "temperature",
        "humidity",
    ]
    count_cols_base = ["sigh", "laughter"]  # ex) sigh, laughter
    categorical_cols_base = ["rainType", "sky"]

    # 실제 존재하는 컬럼만 사용
    continuous_cols = [c for c in continuous_cols_base if c in df.columns]
    count_cols = [c for c in count_cols_base if c in df.columns]
    categorical_cols = [c for c in categorical_cols_base if c in df.columns]

    # 1) continuous: interpolate + ffill + bfill
    if continuous_cols:
        df[continuous_cols] = (
            df[continuous_cols]
            .interpolate(method="linear", limit_direction="both")
            .ffill()
            .bfill()
        )

    # 2) count: NaN -> 0
    if count_cols:
        df[count_cols] = df[count_cols].fillna(0)

    # 3) categorical: ffill + bfill
    if categorical_cols:
        df[categorical_cols] = df[categorical_cols].ffill().bfill()

    return df


# ============================================================
# 2. feature score 5개 계산
# ============================================================

FEATURE_COLS = [
    "StressScore",
    "CalmScore",
    "FatigueScore",
    "VibrancyScore",
    "WeatherScore",
]


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


def compute_feature_df(raw_df: pd.DataFrame) -> pd.DataFrame:
    feat_rows = []
    for _, row in raw_df.iterrows():
        scores = compute_feature_row(row)
        feat_rows.append(scores)
    df_feat = pd.DataFrame(feat_rows, index=raw_df["timestamp"])
    df_feat.index.name = "timestamp"
    return df_feat


# ============================================================
# 3. 슬라이딩 윈도우
# ============================================================

def make_sliding_windows(arr: np.ndarray, L: int) -> Tuple[np.ndarray, List[int]]:
    """
    arr: (T, D)
    return:
      windows: (N, L, D)
      end_indices: 각 window가 끝나는 index 리스트
    """
    T, D = arr.shape
    if T < L:
        return np.empty((0, L, D)), []

    windows = []
    end_indices = []
    for end in range(L - 1, T):
        start = end - L + 1
        windows.append(arr[start:end+1])
        end_indices.append(end)

    return np.stack(windows, axis=0), end_indices


# ============================================================
# 4. DTW K-means + 마르코프 + endpoint μ_k
# ============================================================

def dtw_cluster(all_windows: np.ndarray, K: int = K_CLUSTERS) -> Tuple[np.ndarray, np.ndarray]:
    """
    all_windows: (N, L, D)
    return:
      labels: (N,)
      centroids: (K, L, D)
    """
    km = TimeSeriesKMeans(
        n_clusters=K,
        metric="dtw",
        metric_params={"sakoe_chiba_radius": 2},
        max_iter=5,
        n_init=1,
        random_state=RANDOM_SEED,
        n_jobs=-1,
        verbose=False,
    )
    labels = km.fit_predict(all_windows)
    centroids = km.cluster_centers_
    return labels, centroids


def compute_markov_transition(labels: np.ndarray, K: int, step: int = 1) -> np.ndarray:
    """
    labels 시퀀스로부터 KxK 전이행렬 계산.
    step=1이면 바로 다음, step=3이면 3 step 후 전이 추정.
    """
    P = np.zeros((K, K), dtype=float)
    N = len(labels)
    for i in range(N - step):
        s = labels[i]
        t = labels[i + step]
        P[s, t] += 1.0

    for i in range(K):
        total = P[i].sum()
        if total > 0:
            P[i] /= total
        else:
            P[i, i] = 1.0
    return P


def compute_endpoint_means(windows: np.ndarray, labels: np.ndarray, K: int) -> np.ndarray:
    """
    각 클러스터별로 window 마지막 시점 feature의 평균(μ_k) 계산
    windows: (N, L, D)
    labels: (N,)
    return:
      endpoint_means: (K, D)
    """
    N, L, D = windows.shape
    endpoint_means = np.zeros((K, D), dtype=float)
    counts = np.zeros(K, dtype=int)

    for i in range(N):
        c = labels[i]
        x_end = windows[i, L - 1, :]
        endpoint_means[c] += x_end
        counts[c] += 1

    for k in range(K):
        if counts[k] > 0:
            endpoint_means[k] /= counts[k]
    return endpoint_means


# ============================================================
# 5. raw DataFrame → yesterday_model_meta.json
# ============================================================

def build_yesterday_model_from_raw(
    raw_df: pd.DataFrame,
    save_prefix: str,
) -> Dict[str, Any]:
    """
    한 유저, 하루 raw_df(10분 간격)를 받아서
    Step2-lite 클린 → feature → 윈도우 → 클러스터링 → 마르코프 → endpoint μ_k
    → 모델 메타/중간 산출물 저장
    """

    # -------- (A) step2-lite clean --------
    clean_df = clean_raw_df_step2lite(raw_df)
    clean_path = CLEAN_DIR / f"{save_prefix}_clean.csv"
    clean_df.to_csv(clean_path, index=False, encoding="utf-8-sig")
    print(f"💾 saved clean data to {clean_path}")

    # -------- (B) feature 계산 + 저장 --------
    df_feat = compute_feature_df(clean_df)
    feat_path = FEAT_DIR / f"{save_prefix}_features.csv"
    df_feat.to_csv(feat_path, encoding="utf-8-sig")
    print(f"💾 saved features to {feat_path}")

    arr = df_feat.values.astype(float)    # (T, 5)

    # -------- (C) 윈도우 생성 + 저장 --------
    windows, end_idx = make_sliding_windows(arr, L=WINDOW_LENGTH)
    if windows.shape[0] == 0:
        raise ValueError("윈도우 수가 0입니다. T < L 인지 확인 필요.")

    win_path = WIN_DIR / f"{save_prefix}_windows_L{WINDOW_LENGTH}.npy"
    np.save(win_path, windows)
    print(f"💾 saved windows to {win_path} (shape={windows.shape})")

    end_timestamps = [df_feat.index[i] for i in end_idx]
    df_win_meta = pd.DataFrame({
        "window_id": list(range(len(end_idx))),
        "end_index": end_idx,
        "end_timestamp": end_timestamps,
    })
    win_meta_path = WIN_DIR / f"{save_prefix}_windows_meta_L{WINDOW_LENGTH}.csv"
    df_win_meta.to_csv(win_meta_path, index=False, encoding="utf-8-sig")
    print(f"💾 saved window meta to {win_meta_path}")

    # -------- (D) 클러스터링 --------
    labels, centroids = dtw_cluster(windows, K=K_CLUSTERS)

    df_clusters = pd.DataFrame({
        "window_id": list(range(len(labels))),
        "end_timestamp": end_timestamps,
        "cluster": labels,
    })
    cluster_path = CLUSTER_DIR / f"{save_prefix}_cluster_labels.csv"
    df_clusters.to_csv(cluster_path, index=False, encoding="utf-8-sig")
    print(f"💾 saved cluster labels to {cluster_path}")

    cent_path = MODEL_DIR / f"{save_prefix}_centroids_K{K_CLUSTERS}_L{WINDOW_LENGTH}.npy"
    np.save(cent_path, centroids)
    print(f"💾 saved centroids to {cent_path} (shape={centroids.shape})")

    # -------- (E) 마르코프 전이행렬 --------
    P1 = compute_markov_transition(labels, K_CLUSTERS, step=1)
    P3 = compute_markov_transition(labels, K_CLUSTERS, step=3)

    P1_path = MODEL_DIR / f"{save_prefix}_P1_step1.npy"
    P3_path = MODEL_DIR / f"{save_prefix}_P3_step3.npy"
    np.save(P1_path, P1)
    np.save(P3_path, P3)
    print(f"💾 saved P1 to {P1_path}, P3 to {P3_path}")

    # -------- (F) endpoint 평균 μ_k --------
    endpoint_means = compute_endpoint_means(windows, labels, K_CLUSTERS)
    ep_path = MODEL_DIR / f"{save_prefix}_endpoint_means_K{K_CLUSTERS}.npy"
    np.save(ep_path, endpoint_means)
    print(f"💾 saved endpoint_means to {ep_path} (shape={endpoint_means.shape})")

    # -------- (G) 클러스터 summary --------
    cluster_summaries = []
    for k in range(K_CLUSTERS):
        c = centroids[k]              # (L, 5)
        mean_vals = c.mean(axis=0)    # (5,)
        Stress, Calm, Fatigue, Vibrancy, Weather = mean_vals
        valence = (Calm + Vibrancy + Weather) - (Stress + Fatigue)
        arousal = (Stress + Vibrancy) / 2.0

        cluster_summaries.append({
            "cluster_id": k,
            "mean_scores": {
                "StressScore": float(Stress),
                "CalmScore": float(Calm),
                "FatigueScore": float(Fatigue),
                "VibrancyScore": float(Vibrancy),
                "WeatherScore": float(Weather),
            },
            "valence": float(valence),
            "arousal": float(arousal),
        })

    # -------- (H) 모델 메타 json --------
    model_meta = {
        "freq_minutes": SLOT_MINUTES,
        "window_length": WINDOW_LENGTH,
        "K": K_CLUSTERS,
        "feature_cols": FEATURE_COLS,
        "centroids_npy": str(cent_path),
        "endpoint_means_npy": str(ep_path),
        "P1_npy": str(P1_path),
        "P3_npy": str(P3_path),
        "windows_npy": str(win_path),
        "windows_meta_csv": str(win_meta_path),
        "cluster_labels_csv": str(cluster_path),
        "features_csv": str(feat_path),
        "clean_csv": str(clean_path),
        "raw_note": "raw data 저장은 main에서 처리",
        "cluster_summaries": cluster_summaries,
    }

    model_json_path = MODEL_DIR / f"{save_prefix}_yesterday_model_meta.json"
    with model_json_path.open("w", encoding="utf-8") as f:
        json.dump(model_meta, f, ensure_ascii=False, indent=2)
    print(f"💾 saved model meta to {model_json_path}")

    runtime_model = {
        "freq_minutes": SLOT_MINUTES,
        "window_length": WINDOW_LENGTH,
        "K": K_CLUSTERS,
        "feature_cols": FEATURE_COLS,
        "centroids": centroids,
        "endpoint_means": endpoint_means,
        "P1": P1,
        "P3": P3,
        "cluster_summaries": cluster_summaries,
    }
    return runtime_model


# ============================================================
# 6. 실제 API에서 하루 raw 데이터 받아오기 (TODO)
# ============================================================

def fetch_day_raw_from_api(user_id: str, date: datetime) -> pd.DataFrame:
    """
    실제 서비스 API에서 어제 하루(10분 간격) raw 데이터를 불러오는 함수.

    ⚠️ 이 부분은 서비스 API 스펙에 맞게 구현해야 함.
       아래는 "예시 구조"만 보여주는 템플릿 코드.
    """
    # 예시:
    # import requests
    # url = "https://your-service/api/mood/raw"
    # params = {
    #     "user_id": user_id,
    #     "date": date.strftime("%Y-%m-%d"),
    # }
    # r = requests.get(url, params=params)
    # r.raise_for_status()
    # data = r.json()
    # df = pd.DataFrame(data)
    # return df

    raise NotImplementedError("fetch_day_raw_from_api() 안에 실제 API 호출 로직을 구현하세요.")


# ============================================================
# 7. 메인: 어제 모델 생성
# ============================================================

if __name__ == "__main__":
    user_id = "user_001"  # TODO: 실제 user_id로 교체

    today = datetime.today()
    yesterday = today - timedelta(days=1)
    date_str = yesterday.strftime("%Y%m%d")
    prefix = f"{user_id}_{date_str}"

    # 1) 어제 raw 데이터 API에서 가져오기
    raw_df = fetch_day_raw_from_api(user_id, yesterday)

    # raw csv 저장
    raw_path = RAW_DIR / f"{prefix}_raw.csv"
    raw_df.to_csv(raw_path, index=False, encoding="utf-8-sig")
    print(f"💾 saved raw data to {raw_path}")

    if raw_df.shape[0] != SLOTS_PER_DAY:
        print(f"[WARN] expected {SLOTS_PER_DAY} rows, got {raw_df.shape[0]} rows")

    # 2) 모델 생성 + 저장
    yesterday_model = build_yesterday_model_from_raw(raw_df, save_prefix=prefix)

    print("\n=== Yesterday model built ===")
    print("K:", yesterday_model["K"])
    for s in yesterday_model["cluster_summaries"]:
        print(s)
