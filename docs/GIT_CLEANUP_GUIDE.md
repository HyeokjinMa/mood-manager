# Git 저장소 정리 가이드

## 문제 상황

AWS EC2에서 504 에러와 trufflehog 과호출 문제가 발생했습니다. 원인은 Git 저장소에 큰 파일들이 포함되어 있기 때문입니다.

## 현재 상태

### 제거 완료된 파일들
- ✅ ML 모델 파일들 (약 814MB): `ML/saved_model/`, `ML/onnx_model/`
- ✅ Web 빌드 아티팩트: `Web/static/` (46개 파일), `Web/cache/` (6개 파일)
- ✅ 로그 파일: `Web/build.log`
- ✅ 빌드 아티팩트: `Web/.build-artifacts/` (16개 파일)

### Git 히스토리에 남아있는 큰 파일들
Git 히스토리에는 여전히 큰 파일들이 포함되어 있습니다:
- `Web/public/musics/` 폴더의 MP3 파일들 (각 7-13MB)
- `Web/node_modules/`의 일부 바이너리 파일들 (129MB의 next-swc 등)

**현재 Git 저장소 크기**: 1.7GB (pack 파일: 252.17 MiB)

## 해결 방법

### 1. 현재 변경사항 커밋 (권장)

먼저 현재 변경사항을 커밋합니다:

```bash
git add Web/.gitignore ML/.gitignore
git commit -m "chore: Remove large files from Git tracking

- Remove ML model files (814MB)
- Remove Web build artifacts (static/, cache/, .build-artifacts/)
- Remove log files
- Update .gitignore to prevent future commits"
```

### 2. Git 히스토리에서 큰 파일 완전 제거 (선택사항)

**⚠️ 주의**: 이 작업은 Git 히스토리를 재작성하므로 위험합니다. 팀원들과 협의 후 진행하세요.

#### 방법 A: git filter-repo 사용 (권장)

```bash
# git-filter-repo 설치 (없는 경우)
pip install git-filter-repo

# public/musics/ 폴더 히스토리에서 제거
git filter-repo --path Web/public/musics/ --invert-paths

# node_modules 히스토리에서 제거 (혹시 있는 경우)
git filter-repo --path Web/node_modules/ --invert-paths
```

#### 방법 B: BFG Repo-Cleaner 사용

```bash
# BFG 다운로드
# https://rtyley.github.io/bfg-repo-cleaner/

# 큰 파일 제거
java -jar bfg.jar --strip-blobs-bigger-than 10M

# 정리
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

### 3. 강제 푸시 (히스토리 재작성 후)

**⚠️ 주의**: 히스토리를 재작성한 경우 강제 푸시가 필요합니다.

```bash
# 모든 브랜치에 적용
git push origin --force --all

# 태그도 업데이트
git push origin --force --tags
```

### 4. 팀원 동기화

히스토리를 재작성한 경우, 모든 팀원이 저장소를 다시 클론해야 합니다:

```bash
# 기존 클론 삭제 후 재클론
rm -rf mood-manager
git clone <repository-url>
```

## 예방 조치

### .gitignore 확인

다음 항목들이 `.gitignore`에 포함되어 있는지 확인하세요:

- `node_modules/`
- `.next/`
- `static/`
- `cache/`
- `.build-artifacts/`
- `*.log`
- `public/musics/`
- `public/musics_img/`
- `public/album/`
- `ML/saved_model/`
- `ML/onnx_model/`

### Git LFS 사용 (선택사항)

큰 파일이 반드시 필요한 경우 Git LFS를 사용하세요:

```bash
# Git LFS 설치
git lfs install

# 큰 파일 타입 추적
git lfs track "*.mp3"
git lfs track "*.onnx"
git lfs track "*.safetensors"
```

## 확인 명령어

### 현재 추적 중인 큰 파일 확인

```bash
git ls-files | xargs -I {} du -h {} 2>/dev/null | sort -rh | head -20
```

### Git 저장소 크기 확인

```bash
git count-objects -vH
du -sh .git
```

### 히스토리의 큰 파일 확인

```bash
git rev-list --objects --all | git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' | awk '/^blob/ && $3 > 1000000 {print $3/1024/1024 "MB " $4}' | sort -rn | head -20
```

## 참고사항

- trufflehog는 보안 스캔 도구로, Git 히스토리를 스캔하여 민감한 정보를 찾습니다
- 큰 파일이 많으면 스캔 시간이 길어져 504 타임아웃이 발생할 수 있습니다
- 히스토리 정리 후에는 스캔 시간이 크게 단축됩니다

