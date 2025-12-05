/**
 * 이미지 파일 리네이밍 스크립트
 * 
 * 제목 기반 이미지 파일을 Genre_Number.png 형식으로 리네이밍
 * 
 * 사용법: npx tsx scripts/rename-image-files.ts [--dry-run]
 * 
 * ⚠️ 주의: 이 스크립트는 파일을 실제로 리네이밍합니다.
 *          먼저 --dry-run 옵션으로 확인하세요.
 */

import fs from "fs";
import path from "path";

const DRY_RUN = process.argv.includes("--dry-run");

/**
 * 이미지 파일 리네이밍
 */
function renameImageFiles() {
  const musicsImgDir = path.join(process.cwd(), "public", "musics_img");
  
  if (!fs.existsSync(musicsImgDir)) {
    console.error("❌ musics_img 디렉토리를 찾을 수 없습니다.");
    process.exit(1);
  }

  // 각 장르 폴더 순회
  const genreDirs = fs.readdirSync(musicsImgDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)
    .sort();

  let totalRenamed = 0;

  for (const genreDir of genreDirs) {
    const genrePath = path.join(musicsImgDir, genreDir);
    const imageFiles = fs.readdirSync(genrePath)
      .filter(file => file.endsWith(".png") || file.endsWith(".jpg") || file.endsWith(".jpeg"))
      .filter(file => !file.match(/^[A-Z][a-z]+_\d+\.(png|jpg|jpeg)$/)) // 이미 올바른 형식 제외
      .sort();

    if (imageFiles.length === 0) {
      console.log(`\n📁 ${genreDir}: 리네이밍할 파일 없음 (이미 올바른 형식)`);
      continue;
    }

    console.log(`\n📁 ${genreDir}: ${imageFiles.length}개 파일 리네이밍`);
    console.log("-".repeat(60));

    // 최대 10개까지만 처리
    const filesToRename = imageFiles.slice(0, 10);

    for (let i = 0; i < filesToRename.length; i++) {
      const oldFile = filesToRename[i];
      const newFile = `${genreDir}_${i + 1}.png`;
      const oldPath = path.join(genrePath, oldFile);
      const newPath = path.join(genrePath, newFile);

      // 이미 존재하는 경우 스킵
      if (fs.existsSync(newPath)) {
        console.log(`  ⚠️  ${oldFile} → ${newFile} (이미 존재, 스킵)`);
        continue;
      }

      if (DRY_RUN) {
        console.log(`  [DRY-RUN] ${oldFile} → ${newFile}`);
      } else {
        try {
          fs.renameSync(oldPath, newPath);
          console.log(`  ✅ ${oldFile} → ${newFile}`);
          totalRenamed++;
        } catch (error) {
          console.error(`  ❌ ${oldFile} → ${newFile} 실패:`, error);
        }
      }
    }
  }

  console.log("\n" + "=".repeat(60));
  if (DRY_RUN) {
    console.log("🔍 DRY-RUN 모드: 실제로 파일을 변경하지 않았습니다.");
    console.log("   실제 리네이밍을 하려면 --dry-run 옵션을 제거하세요.");
  } else {
    console.log(`✅ 총 ${totalRenamed}개 파일 리네이밍 완료`);
    console.log("\n다음 단계:");
    console.log("  1. JSON 재생성: npx tsx scripts/generate-music-tracks-json.ts");
    console.log("  2. title, artist, description 수동 업데이트 (선택)");
  }
}

// 실행
console.log("🖼️  이미지 파일 리네이밍 시작...\n");
renameImageFiles();

