import os
import shutil
import random
from tqdm import tqdm

# ==========================================
# ⚙️ 설정
# ==========================================
BASE_ROOT = "./dataset"  # dataset 폴더 (이 안에 train, val, test가 있어야 함)
CLASSES = ["laughter", "sigh", "negative"]

# 이동시킬 비율 (전체의 몇 %를 보낼 것인가)
VAL_RATIO = 0.1   # 10%
TEST_RATIO = 0.1  # 10%
# 나머지는 자동으로 Train에 남음 (80%)

def distribute_dataset():
    print(f"🚀 데이터 분배 시작 (Train 폴더에서 Val/Test로 이동)")
    print(f"📂 작업 경로: {os.path.abspath(BASE_ROOT)}\n")

    # 통계용
    stats = {cls: {"train": 0, "val": 0, "test": 0} for cls in CLASSES}

    for cls in CLASSES:
        # 1. 현재 모든 파일이 있는 Train 경로
        src_dir = os.path.join(BASE_ROOT, "train", cls)
        
        # 이동할 목적지 경로
        val_dir = os.path.join(BASE_ROOT, "val", cls)
        test_dir = os.path.join(BASE_ROOT, "test", cls)

        # 목적지 폴더가 없으면 생성
        os.makedirs(val_dir, exist_ok=True)
        os.makedirs(test_dir, exist_ok=True)

        # 2. 파일 목록 가져오기
        if not os.path.exists(src_dir):
            print(f"⚠️ 경고: {src_dir} 경로가 없습니다. 스킵합니다.")
            continue

        files = [f for f in os.listdir(src_dir) if f.lower().endswith('.wav')]
        random.shuffle(files) # ⭐️ 랜덤 섞기 (필수)

        total_files = len(files)
        
        # 3. 몇 개를 옮길지 계산
        num_val = int(total_files * VAL_RATIO)
        num_test = int(total_files * TEST_RATIO)
        
        # 슬라이싱으로 리스트 나누기
        # files 리스트 구조: [Val용... | Test용... | 나머지(Train용)...]
        files_to_val = files[:num_val]
        files_to_test = files[num_val : num_val + num_test]
        # files_to_remain = files[num_val + num_test:] # 이건 그냥 둠

        print(f"Processing '{cls}' (Total: {total_files})")
        print(f"  👉 Moving {len(files_to_val)} files to VAL")
        print(f"  👉 Moving {len(files_to_test)} files to TEST")
        print(f"  👉 Remaining {total_files - len(files_to_val) - len(files_to_test)} files in TRAIN")

        # 4. 파일 이동 (Move)
        # Val로 이동
        for fname in tqdm(files_to_val, desc=f"  Moving to Val", leave=False):
            shutil.move(os.path.join(src_dir, fname), os.path.join(val_dir, fname))

        # Test로 이동
        for fname in tqdm(files_to_test, desc=f"  Moving to Test", leave=False):
            shutil.move(os.path.join(src_dir, fname), os.path.join(test_dir, fname))
        
        # 5. 결과 통계 기록 (남아있는 파일 수 다시 체크)
        stats[cls]["train"] = len([f for f in os.listdir(src_dir) if f.endswith('.wav')])
        stats[cls]["val"] = len([f for f in os.listdir(val_dir) if f.endswith('.wav')])
        stats[cls]["test"] = len([f for f in os.listdir(test_dir) if f.endswith('.wav')])

    # 6. 최종 결과 출력
    print("\n" + "="*55)
    print("✅ 데이터 분배 완료! 최종 파일 개수:")
    print("="*55)
    print(f"{'Class':<10} | {'Train (80%)':<12} | {'Val (10%)':<10} | {'Test (10%)':<10}")
    print("-" * 55)
    
    for cls in CLASSES:
        print(f"{cls:<10} | {stats[cls]['train']:<12} | {stats[cls]['val']:<10} | {stats[cls]['test']:<10}")
    
    print("-" * 55)
    print("⚠️  파일이 복사가 아니라 '이동'되었습니다.")
    print("="*55)

if __name__ == "__main__":
    distribute_dataset()