# fix_config.py
from transformers import Wav2Vec2FeatureExtractor
import os

SAVE_PATH = "./saved_model"

print("🔧 설정 파일 복구 중...")

# 1. 페이스북 원본 모델에서 '귀(Feature Extractor)' 설정만 빌려오기
feature_extractor = Wav2Vec2FeatureExtractor.from_pretrained("facebook/wav2vec2-base")

# 2. 내 모델 폴더에 저장해주기
feature_extractor.save_pretrained(SAVE_PATH)

print(f"✅ 복구 완료! 이제 {SAVE_PATH} 폴더에 preprocessor_config.json이 생겼습니다.")