/**
 * musics_img 폴더의 모든 파일명에서 언더바 제거
 */

import * as fs from "fs";
import * as path from "path";

/**
 * musics_img 폴더의 모든 파일명에서 언더바 제거
 */
async function removeUnderscores() {
  console.log("🔄 musics_img 폴더의 모든 파일명에서 언더바 제거 시작...\n");
  
  const musicsImgDir = path.join(process.cwd(), "public", "musics_img");
  
  if (!fs.existsSync(musicsImgDir)) {
    console.log("⚠️  musics_img 폴더가 없습니다.");
    return;
  }
  
  const genres = ["Classic", "Pop", "Balad", "Hiphop", "Jazz", "Carol"];
  let totalRenamed = 0;
  let totalErrors = 0;
  
  for (const genre of genres) {
    const genreDir = path.join(musicsImgDir, genre);
    
    if (!fs.existsSync(genreDir)) {
      console.log(`⚠️  ${genre} 폴더가 없습니다.`);
      continue;
    }
    
    const files = fs.readdirSync(genreDir).filter(f => 
      f.endsWith(".png") || f.endsWith(".jpg") || f.endsWith(".jpeg")
    );
    
    if (files.length === 0) {
      continue;
    }
    
    console.log(`\n📁 ${genre} (${files.length}개 파일):`);
    
    for (const file of files) {
      const oldPath = path.join(genreDir, file);
      
      // 언더바를 공백으로 변경
      const newFileName = file.replace(/_/g, " ");
      const newPath = path.join(genreDir, newFileName);
      
      // 이미 언더바가 없으면 건너뜀
      if (file === newFileName) {
        console.log(`  ✓ ${file} (언더바 없음)`);
        continue;
      }
      
      // 새 파일명이 이미 존재하면 에러
      if (fs.existsSync(newPath)) {
        console.log(`  ⚠️  ${file} → ${newFileName} (이미 존재, 건너뜀)`);
        totalErrors++;
        continue;
      }
      
      try {
        fs.renameSync(oldPath, newPath);
        console.log(`  ✅ ${file} → ${newFileName}`);
        totalRenamed++;
      } catch (error: any) {
        console.log(`  ❌ ${file} → ${newFileName} (에러: ${error.message})`);
        totalErrors++;
      }
    }
  }
  
  console.log(`\n✨ 완료!`);
  console.log(`   ✅ 리네이밍: ${totalRenamed}개`);
  console.log(`   ❌ 에러: ${totalErrors}개`);
}

/**
 * 메인 함수
 */
async function main() {
  try {
    await removeUnderscores();
  } catch (error) {
    console.error("❌ 에러:", error);
    process.exit(1);
  }
}

main();

