import onnxruntime as ort
import numpy as np
from scipy.signal import resample
import soundfile as sf
import io
import base64
import json
import firebase_admin
from firebase_admin import credentials, firestore, initialize_app
import requests
from datetime import datetime

# ======== Settings =========
MODEL_PATH = "/var/task/onnx_model/model_quantized.onnx"           ## docker absolute path
SAMPLE_RATE = 16000

WEB_SERVER_URL = "https://moodmanager.me/api/ml/emotion-counts"
LAMBDA_SECRET = "mm-ml-2025-demo-ABCD-9876"              

ort_session = None
db = None

# LabelMap
LABELMAP = {
    0: "Laughter",
    1: "Sigh",
    2: "Negative"
}

# ========= Resource Load ==========
def load_resources():
    global ort_session, db

    if ort_session is None:
        print("ONNX Loading...")
        ort_session = ort.InferenceSession(MODEL_PATH, providers=["CPUExecutionProvider"])
    
    if db is None:
        if not firebase_admin._apps:
            cred = credentials.Certificate("/var/task/moodManagerCredKey.json")   ## docker absolute path
            initialize_app(cred)
        db = firestore.client()


# ========= Prediction ==========
def predict_onnx(base64_str):
    try:
        audio_bytes = base64.b64decode(base64_str)

        with io.BytesIO(audio_bytes) as byte_io:
            y, sr = sf.read(byte_io)

        if y.ndim > 1:          # ndim == dimension
            y = y.mean(axis=1)
        if sr != SAMPLE_RATE:
            target_length = int(len(y) *SAMPLE_RATE / sr)
            y = resample(y, target_length)

        # ONNX input
        input_values = y.astype(np.float32)[np.newaxis, :]
        input_name = ort_session.get_inputs()[0].name

        # Execution
        logits = ort_session.run(None, {input_name: input_values})[0]

        # Softmax
        def softmax(x):
            e_x = np.exp(x - np.max(x))
            return e_x / e_x.sum(axis=1, keepdims=True)
        
        probs = softmax(logits)
        pred_idx = np.argmax(probs)
        confidence = probs[0][pred_idx] * 100

        return LABELMAP[pred_idx], confidence
    except Exception as e:
        print(f"Prediction Error: {e}")
        return "error", 0.0

    
# ========== Access DB & Predict Transmit  ===========
def lambda_handler(event, context):
    load_resources()

    processed_count = 0
    error_count = 0

    docs = db.collection("users").document("testUser").collection("raw_events").where('ml_processed', '==', 'pending').stream()
    for doc in docs:
        doc_id = doc.id
        data = doc.to_dict()
        timestamp = data['timestamp']

        if hasattr(timestamp, "isoformat"):
            timestamp = timestamp.isoformat()

        doc.reference.update({'ml_processed': 'processing'})

        if 'audio_base64' not in data:
            doc.reference.update({'ml_processed': 'error'})
            error_count += 1
            continue

        label, conf = predict_onnx(data['audio_base64'])

        doc.reference.update({
            'event_type_result': label,
            'confidence': float(conf),
            'ml_processed': 'done'
        })
        processed_count += 1
        print(f"result: {label} ({conf:.2f}%)")
        
        # POST Web Server by JSON Body
        try:
            payload = {
                "result": label,
                "confidence": float(conf),
                "timestamp": timestamp
            }

            headers = {
                "x-ml-api-key": LAMBDA_SECRET,
                "Content-Type": "application/json"
            }

            res = requests.post(WEB_SERVER_URL, json=payload, headers=headers, timeout=3)
            print(res.status_code)
        except Exception as e:
            print(e)

    return f"Batch Job Complete: Processed {processed_count} docs, Errors {error_count}"
