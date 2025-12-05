from optimum.onnxruntime import ORTModelForAudioClassification
from transformers import AutoFeatureExtractor
from optimum.onnxruntime.configuration import AutoQuantizationConfig
from optimum.onnxruntime import ORTQuantizer
import os

# 1. 경로 설정
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PYTORCH_MODEL_PATH = os.path.join(BASE_DIR, "saved_model")  # 학습된 PyTorch 모델 경로
ONNX_EXPORT_PATH = os.path.join(BASE_DIR, "onnx_model")     # 결과물이 저장될 경로

# 2. PyTorch 모델 로드 및 ONNX 변환 (export=True가 핵심)
model = ORTModelForAudioClassification.from_pretrained(
    PYTORCH_MODEL_PATH,
    export=True
)
feature_extractor = AutoFeatureExtractor.from_pretrained(PYTORCH_MODEL_PATH)

# 3. ONNX 모델 저장
model.save_pretrained(ONNX_EXPORT_PATH)
feature_extractor.save_pretrained(ONNX_EXPORT_PATH)
print(f"ONNX transform completed ({ONNX_EXPORT_PATH})")

# ==========================================
# 4. 양자화 (Quantization) - 선택사항이지만 강력 추천
# ==========================================
print("Quantization Start...")

# 양자화 설정 (avx2는 일반적인 CPU 명령어셋)
qconfig = AutoQuantizationConfig.avx2(is_static=False, per_channel=True)
quantizer = ORTQuantizer.from_pretrained(model)

# 양자화된 모델 저장
quantizer.quantize(
    save_dir=ONNX_EXPORT_PATH,
    quantization_config=qconfig,
)
print("Quantization Fin...")