# Watch 폴더 문제 진단

## 확인된 사항

### ✅ 정상 작동하는 부분
1. **Kotlin 파일 구조**: 모든 파일이 올바른 패키지 구조에 위치
2. **의존성 설정**: `build.gradle.kts`와 `libs.versions.toml` 설정 정상
3. **AndroidManifest.xml**: 권한 및 서비스 등록 정상
4. **리소스 파일**: strings.xml, AndroidManifest.xml 정상

### 🔍 가능한 문제점

#### 1. R 클래스 생성 문제
- `PeriodicDataService.kt`와 `AudioEventService.kt`에서 `com.moodmanager.watch.R` 사용
- R 클래스는 빌드 시 자동 생성되므로, **Gradle 동기화가 필요**할 수 있음

#### 2. IDE 캐시 문제
- Android Studio에서 프로젝트를 열 때 캐시 문제로 인해 빨간 표시가 나타날 수 있음

#### 3. Gradle 동기화 필요
- 의존성이 다운로드되지 않았거나, Gradle 동기화가 완료되지 않았을 수 있음

## 해결 방법

### 방법 1: Gradle 동기화 (권장)
1. Android Studio에서 프로젝트 열기
2. `File > Sync Project with Gradle Files` 실행
3. 동기화 완료 대기

### 방법 2: 캐시 무효화
1. `File > Invalidate Caches / Restart`
2. `Invalidate and Restart` 선택
3. Android Studio 재시작

### 방법 3: Clean & Rebuild
1. `Build > Clean Project`
2. `Build > Rebuild Project`
3. 빌드 완료 대기

### 방법 4: Gradle Wrapper 실행 (터미널)
```bash
cd Watch
./gradlew clean
./gradlew build
```

## 예상 원인

가장 가능성 높은 원인:
- **Gradle 동기화 미완료**: 프로젝트를 처음 열거나 설정이 변경된 경우
- **IDE 캐시 문제**: 이전 빌드 캐시와 충돌

## 확인 사항

코드 자체는 문제가 없으므로, IDE 설정 문제일 가능성이 높습니다.

