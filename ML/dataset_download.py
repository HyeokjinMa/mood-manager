import os
import io
import soundfile as sf
import librosa
import numpy as np
from datasets import load_dataset, Audio
from tqdm import tqdm

# ==========================================
# 1. 저장 폴더 설정
# ==========================================
SAVE_ROOT = "./dataset/train"
CLASSES = ["laughter", "sigh", "negative"]

# 폴더가 없으면 생성
for cls in CLASSES:
    os.makedirs(os.path.join(SAVE_ROOT, cls), exist_ok=True)

print(f"📂 저장 경로 준비 완료: {SAVE_ROOT}")

# ==========================================
# 2. 사용자 정의 데이터셋 설정 (업데이트됨)
# ==========================================
DATASETS_CONFIG = [
    {
        "id": "lmms-lab/vocalsound", 
        "split": "test", 
        "text_col": "answer"
    },
    {
        "id": "DynamicSuperb/VocalSoundRecognition_VocalSound", 
        "split": "test", 
        "text_col": "label"
    },
    {
        "id": "krishnakalyan3/sound_effect_15k", 
        "split": "train", 
        "text_col": "prompt"
    }
]

# ==========================================
# 3. 핵심 함수들 (안전 로딩 & 분류)
# ==========================================
def determine_class(text_label):
    """텍스트를 분석해 3가지 클래스 중 하나로 분류"""
    if text_label is None: return "negative"
    text = str(text_label).lower()
    
    # 웃음 키워드
    if any(x in text for x in ["laugh", "chuckle", "giggle", "laughter"]):
        return "laughter"
    # 한숨 키워드
    if any(x in text for x in ["sigh", "gasp", "heavy breathing"]):
        return "sigh"
    # 나머지는 모두 Negative (소음, 말소리 등)
    return "negative"

def safe_load_audio(audio_bytes, sr=16000):
    """바이트 데이터를 받아 wav(numpy)로 변환. 실패 시 None 반환"""
    if audio_bytes is None: return None, None
    
    try:
        file_like = io.BytesIO(audio_bytes)
        # 1. Soundfile로 시도 (빠름)
        try:
            y, orig_sr = sf.read(file_like)
        except Exception:
            # 2. 실패하면 Librosa로 재시도 (강력함)
            file_like.seek(0)
            y, orig_sr = librosa.load(file_like, sr=None)

        # Mono 변환 (채널이 여러 개면 평균냄)
        if y.ndim > 1: y = y.mean(axis=1)
        
        # 샘플링 레이트 맞추기 (Resample)
        if orig_sr != sr:
            y = librosa.resample(y, orig_sr=orig_sr, target_sr=sr)
            
        return y, sr
    except Exception:
        return None, None

# ==========================================
# 4. 메인 프로세스
# ==========================================
def process_datasets():
    global_counts = {"laughter": 0, "sigh": 0, "negative": 0}
    
    for config in DATASETS_CONFIG:
        ds_id = config["id"]
        split = config["split"]
        target_text_col = config["text_col"]
        
        print(f"\n⬇️  Processing Dataset: {ds_id} (split: {split})")
        
        try:
            # 1. 데이터셋 로드 (Streaming 모드)
            ds = load_dataset(ds_id, split=split, streaming=True)
            
            # 2. 오디오 컬럼 이름 자동 찾기 (audio? file? speech?)
            audio_col_name = None
            # (A) 타입으로 찾기
            for name, feature in ds.features.items():
                if isinstance(feature, Audio):
                    audio_col_name = name
                    break
            # (B) 이름으로 찾기 (타입으로 못 찾았을 경우)
            if not audio_col_name:
                for candidate in ["audio", "file", "speech", "sound"]:
                    if candidate in ds.column_names:
                        audio_col_name = candidate
                        break
            
            if not audio_col_name:
                print("   ⚠️ 오디오 컬럼을 찾을 수 없어 스킵합니다.")
                continue
                
            print(f"   👉 오디오 컬럼: '{audio_col_name}' / 텍스트 컬럼: '{target_text_col}'")

            # 3. ⭐️ 핵심: 자동 디코딩 끄기 (Windows 에러 방지)
            ds = ds.cast_column(audio_col_name, Audio(decode=False))

        except Exception as e:
            print(f"   ⚠️ 데이터셋 초기화 실패: {e}")
            continue

        # 4. 데이터 순회 및 저장
        # 테스트를 위해 각 데이터셋 당 5000개만 받습니다. (필요시 숫자 조정)
        MAX_PER_DATASET = 5000 
        
        current_count = 0
        try:
            for i, item in enumerate(tqdm(ds)):
                if current_count >= MAX_PER_DATASET: break
                
                try:
                    # (1) 라벨 텍스트 추출
                    label_text = item.get(target_text_col, "")
                    
                    # (2) 클래스 판별 (Mix & Filter)
                    target_class = determine_class(label_text)
                    
                    # (3) 오디오 데이터 추출 (bytes 상태)
                    audio_data = item[audio_col_name]
                    
                    # 데이터 구조에 따라 bytes 꺼내기
                    audio_bytes = None
                    if isinstance(audio_data, dict) and 'bytes' in audio_data:
                        audio_bytes = audio_data['bytes']
                    elif isinstance(audio_data, bytes):
                        audio_bytes = audio_data
                    
                    if audio_bytes is None: continue

                    # (4) 안전하게 변환
                    y, sr = safe_load_audio(audio_bytes, sr=16000)
                    if y is None: continue # 변환 실패 시 스킵
                    
                    if len(y) < sr * 0.1: continue # 너무 짧음 (0.1초 미만)

                    # (5) 파일 저장
                    safe_ds_name = ds_id.split("/")[-1]
                    filename = f"{target_class}_{safe_ds_name}_{i}.wav"
                    save_path = os.path.join(SAVE_ROOT, target_class, filename)
                    
                    sf.write(save_path, y, sr)
                    
                    global_counts[target_class] += 1
                    current_count += 1
                    
                except Exception:
                    # 개별 파일 에러는 무시하고 계속 진행
                    continue

        except Exception as e:
            print(f"   ❌ 반복문 실행 중 오류 (해당 데이터셋 스킵): {e}")
            continue

    print("\n🎉 모든 처리가 완료되었습니다!")
    print(f"📊 최종 수집 결과: {global_counts}")
    print(f"📂 저장 위치: {os.path.abspath(SAVE_ROOT)}")

if __name__ == "__main__":
    process_datasets()

    # {'laughter': 719, 'sigh': 718, 'negative': 2926}