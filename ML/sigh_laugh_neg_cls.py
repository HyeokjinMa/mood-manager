import torch
import os
import glob
import torch.nn as nn
import torch.optim as optim
import numpy as np
import librosa
from torch.utils.data import Dataset, DataLoader
from transformers import Wav2Vec2ForSequenceClassification, Wav2Vec2FeatureExtractor
from audiomentations import Compose, AddGaussianNoise, AddBackgroundNoise, Shift, Gain
from sklearn.metrics import (
    accuracy_score, precision_recall_fscore_support, confusion_matrix, classification_report, average_precision_score
)
import matplotlib.pyplot as plt
import seaborn as sns

# ======= Preprocessing ========

# Hyperparameters
SAMPLE_RATE = 16000
TARGET_LENGTH = 16000 * 2    # 2 sec (change it when needed)
BATCH_SIZE = 8
NUM_LABELS = 3               # laughter, sigh, negative
EPOCHS = 10
LR = 1e-5
DATA_ROOT = "./dataset"
SAVE_PATH = "./saved_model"

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Augmentation Definition (for training)
augment = Compose([
    AddGaussianNoise(min_amplitude=0.0001, max_amplitude=0.001, p=0.3),
    Shift(min_shift=-0.1, max_shift=0.1, p=0.4),
    Gain(min_gain_in_db=-6, max_gain_in_db=6, p=0.4)
])

def crop_or_pad(y, target_length=TARGET_LENGTH):
    """
    Wav2Vec2 입력 길이를 target_length로 통일
    - 길면: Random Crop
    - 짧으면: Random Padding (Front, Back)
    """
    length = len(y)

    # Case 1 : Crop
    if length > target_length:
        start = np.random.randint(0, length - target_length)
        y = y[start:start + target_length]

    # Case 2 : Padding
    elif length < target_length:
        pad_length = target_length - length
        pad_front = np.random.randint(0, pad_length + 1)
        pad_back = pad_length - pad_front
        y = np.pad(y, (pad_front, pad_back), mode='constant')
    
    return y.astype(np.float32)

class AudioDataset(Dataset):
    def __init__(self, file_paths, labels, is_train=True):
        """
        Args:
            file_paths (list): audio file path
            labels (list): int label list
            is_train (bool): Augmentation 적용 유무 
        """
        self.file_paths = file_paths
        self.labels = labels
        self.is_train = is_train

        # Wav2Vec2 Feature Extracter (normalization)
        self.processor = Wav2Vec2FeatureExtractor.from_pretrained("facebook/wav2vec2-base")

    def __len__(self):
        return len(self.file_paths)
    
    def __getitem__(self, idx):
        file_path = self.file_paths[idx]
        label = self.labels[idx]

        # 1. Audio load, sr 통일
        y, sr = librosa.load(file_path, sr=SAMPLE_RATE)

        # 2. Augmentation when it is train
        if self.is_train:
            y = augment(samples=y, sample_rate=SAMPLE_RATE)

        # 3. Crop or Pad
        y = crop_or_pad(y)

        # 4. Transfrom into Wav2Vec2 -> pt (pytorch tensor)
        inputs = self.processor(y, sampling_rate=SAMPLE_RATE, return_tensors="pt")

        # returns model input and label (정답 라벨)
        return {
            "input_values": inputs.input_values.squeeze(0),   # (1, seq_len) -> (seq_len)
            "labels": torch.tensor(label, dtype=torch.long) 
        }
    

def load_data_by_split(root_dir, split):
    """
    args:
        root_dir : 데이터셋 최상위 폴더 경로 ("./dataset")
        split : train/val/test
    """
    class_map = {
        "laughter" : 0,
        "sigh" : 1,
        "negative" : 2
    }

    file_paths = []
    labels = []

    split_dir = os.path.join(root_dir, split)

    if not os.path.exists(split_dir):
        print(f"Warning! There is no {split_dir}!")
        return [], []
    
    for class_name, label_idx in class_map.items():
        folder_path = os.path.join(split_dir, class_name)
        wav_files = glob.glob(os.path.join(folder_path, "*.wav"))

        file_paths.extend(wav_files)
        labels.extend([label_idx] * len(wav_files))

    print(f"  -> {len(file_paths)} File load completed")
    return file_paths, labels

# ======== Model Train/Eval Funcs ==========

# model load function
def get_model(pretrained_path=None):
    if pretrained_path:
        model = Wav2Vec2ForSequenceClassification.from_pretrained(pretrained_path)
    else:
        model = Wav2Vec2ForSequenceClassification.from_pretrained(
            "facebook/wav2vec2-base",
            num_labels = NUM_LABELS
        )

        # 학습된 모델의 설정을 따름
        model.freeze_feature_extractor()  # (Optional: 초반 레이어 고정하여 학습 속도 향상)
    return model.to(device)


def train_epoch(model, loader, criterion, optimizer):
    model.train()
    total_loss = 0
    for i, batch in enumerate(loader):
        input_values = batch['input_values'].to(device)
        labels = batch['labels'].to(device)

        outputs = model(input_values)
        loss = criterion(outputs.logits, labels)

        optimizer.zero_grad()
        loss.backward()
        optimizer.step()
        total_loss += loss.item()

        if i % 10 == 0:
            print(f"   Batch {i}/{len(loader)} | Loss: {loss.item():.4f}", end='\r')
    return total_loss / len(loader)

def evaluate(model, loader):
    model.eval()
    correct = 0
    total = 0
    with torch.no_grad():
        for batch in loader:
            input_values = batch['input_values'].to(device)
            labels = batch['labels'].to(device)

            outputs = model(input_values)
            predictions = torch.argmax(outputs.logits, dim=-1)

            correct += (predictions == labels).sum().item()
            total += labels.size(0)
    return (correct / total) * 100 if total > 0 else 0

def plot_confusion_matrix(cm, labels):
    plt.figure(figsize=(6,5))
    sns.heatmap(cm, annot=True, fmt="d", cmap="Blues", xticklabels=labels, yticklabels=labels)
    plt.xlabel("Predicted")
    plt.ylabel("True")
    plt.title("Confusion Matrix")
    plt.savefig('confusion_matrix.png')
    #plt.show()

def plot_class_metrics(precision, recall, f1, labels):
    x = np.arange(len(labels))
    width = 0.25

    plt.figure(figsize=(10,5))
    plt.bar(x - width, precision, width, label="Precision")
    plt.bar(x, recall, width, label="Recall")
    plt.bar(x + width, f1, width, label="F1")

    plt.xticks(x, labels)
    plt.ylabel("Score")
    plt.ylim(0,1)
    plt.title("Per Class Evaluation Metrics")
    plt.legend()
    plt.grid(axis='y', linestyle='--', alpha=0.5)
    plt.savefig('class_metrics.png')
    #plt.show()


def evaluate_with_metrics(model, loader, label_names=["laughter", "sigh", "negative"]):
    model.eval()
    all_preds = []
    all_labels = []
    all_probs = []

    with torch.no_grad():
        for batch in loader:
            input_values = batch['input_values'].to(device)
            labels = batch['labels'].to(device)

            outputs = model(input_values)
            logits = outputs.logits
            probs = torch.softmax(logits, dim=-1)

            preds = torch.argmax(probs, dim=-1)

            all_labels.extend(labels.cpu().numpy())
            all_preds.extend(preds.cpu().numpy())
            all_probs.extend(probs.cpu().numpy())

    all_labels = np.array(all_labels)
    all_preds = np.array(all_preds)
    all_probs = np.array(all_probs)

    # ---- Basic accuracy ----
    acc = accuracy_score(all_labels, all_preds)

    # ---- Precision, Recall, F1 ----
    precision, recall, f1, _ = precision_recall_fscore_support(
        all_labels, all_preds, average=None
    )
    macro_f1 = f1.mean()

    # ---- Confusion Matrix ----
    cm = confusion_matrix(all_labels, all_preds)

    # ---- mAP (multi-class) ----
    # Convert labels to one-hot
    num_classes = len(label_names)
    labels_onehot = np.eye(num_classes)[all_labels]

    ap_per_class = {}
    for i, name in enumerate(label_names):
        ap = average_precision_score(labels_onehot[:, i], all_probs[:, i])
        ap_per_class[name] = ap
    mAP = np.mean(list(ap_per_class.values()))

    # ---- Print results ----
    print("\n========== Evaluation Results ==========")
    print(f"Accuracy: {acc*100:.2f}%")
    print(f"Macro F1: {macro_f1:.4f}")

    print("\n--- Per-Class Metrics ---")
    for i, name in enumerate(label_names):
        print(f"{name}: Precision={precision[i]:.3f}, Recall={recall[i]:.3f}, F1={f1[i]:.3f}, AP={ap_per_class[name]:.3f}")

    print("\n--- Confusion Matrix ---")
    print(cm)

    print("\n--- Classification Report ---")
    print(classification_report(all_labels, all_preds, target_names=label_names))

    print(f"\nOverall mAP: {mAP:.4f}")
    print("========================================\n")

    plot_confusion_matrix(cm, label_names)
    plot_class_metrics(precision, recall, f1, label_names)

    return {
        "accuracy": acc,
        "macro_f1": macro_f1,
        "per_class_ap": ap_per_class,
        "mAP": mAP,
        "confusion_matrix": cm
    }

# =========== Main Controller ==========
def run_training():
    # 1. Data load
    train_files, train_labels = load_data_by_split(DATA_ROOT, "train")
    val_files, val_labels = load_data_by_split(DATA_ROOT, "val")

    if len(train_files) == 0:
        print("There is no data for training")
        return
    
    # 2. Create datasets
    train_ds = AudioDataset(train_files, train_labels, is_train=True)
    val_ds = AudioDataset(val_files, val_labels, is_train=False)    # No aug at val

    train_loader = DataLoader(train_ds, batch_size=BATCH_SIZE, shuffle=True)
    val_loader = DataLoader(val_ds, batch_size=BATCH_SIZE, shuffle=False)

    # 3. Model setup
    model = get_model()

    # Weights to resolve class unbalance problem
    weights = torch.tensor([4.1, 4.1, 1.0]).to(device)
    criterion = nn.CrossEntropyLoss(weight=weights)
    optimizer = optim.AdamW(model.parameters(), lr=LR)

    # 4. Graphing Epoch Train Loss / Val Accuracy
    train_losses = []
    val_accs=[]

    # 5. Start Training
    print("Start Training...")
    best_acc = 0

    for epoch in range(EPOCHS):
        train_loss = train_epoch(model, train_loader, criterion, optimizer)
        val_acc = evaluate(model, val_loader)

        print(f"Epoch {epoch+1}/{EPOCHS} | Train Loss: {train_loss:.4f} | Val Acc: {val_acc:2f}%")
        train_losses.append(train_loss)
        val_accs.append(val_acc)

        if val_acc > best_acc:
            best_acc = val_acc
            print(f"Best Performance - Model saved at {SAVE_PATH}")
            model.save_pretrained(SAVE_PATH)
    
    # plt setting
    plt.figure(figsize=(12,5))

    plt.subplot(1,2,1)
    plt.plot(train_losses, label="Train Loss")
    plt.title("Training Loss per Epoch")
    plt.xlabel("Epoch")
    plt.ylabel("Loss")
    plt.grid(True)
    plt.legend()

    plt.subplot(1,2,2)
    plt.plot(val_accs, label="Validation Accuracy", color='orange')
    plt.title("Validation Accuracy per Epoch")
    plt.xlabel("Epoch")
    plt.ylabel("Accuracy (%)")
    plt.grid(True)
    plt.legend()

    plt.savefig('epoch_val_metrics.png')
    #plt.show()
    

def run_evaluation():
    test_files, test_labels = load_data_by_split(DATA_ROOT, "test")

    if len(test_files) == 0:
        print("No test data at (dataset/test)")
        return
    if not os.path.exists(SAVE_PATH):
        print("No existing model. Start training.")
        return
    
    print("Model Test Set")
    model = get_model(pretrained_path=SAVE_PATH)

    test_ds = AudioDataset(test_files, test_labels, is_train=False)
    test_loader = DataLoader(test_ds, batch_size=BATCH_SIZE, shuffle=False)

    #acc = evaluate(model, test_loader)
    #print(f"Final Accuracy: {acc:2f}%")

    results = evaluate_with_metrics(model, test_loader)
    print(f"Final mAP: {results['mAP']:.4f}")

if __name__ == "__main__":
    run_training()
    run_evaluation()
