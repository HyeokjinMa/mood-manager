/**
 * 파일명 정리 스크립트
 * - 이미지: 제목만 (예: "River flows in you.png")
 * - MP3: 제목(아티스트)만 (예: "River flows in you(Yiruma).mp3")
 * - 장르 태그 제거
 */

import * as fs from "fs";
import * as path from "path";

/**
 * 파일명에서 장르 태그 제거 및 정리
 */
function cleanFileName(fileName: string, isImage: boolean): string {
  const ext = path.extname(fileName);
  const baseName = path.basename(fileName, ext);
  
  // 장르 태그 제거 (예: "_Classic", "_Pop", "_Balad" 등)
  let cleaned = baseName
    .replace(/_Classic$/i, "")
    .replace(/_Pop$/i, "")
    .replace(/_Balad$/i, "")
    .replace(/_Hiphop$/i, "")
    .replace(/_Jazz$/i, "")
    .replace(/_Carol$/i, "")
    .replace(/\s+Classic$/i, "")
    .replace(/\s+Pop$/i, "")
    .replace(/\s+Balad$/i, "")
    .replace(/\s+Hiphop$/i, "")
    .replace(/\s+Jazz$/i, "")
    .replace(/\s+Carol$/i, "")
    .replace(/\s+Classic\s*$/i, "")
    .replace(/\s+Pop\s*$/i, "")
    .replace(/\s+Balad\s*$/i, "")
    .replace(/\s+Hiphop\s*$/i, "")
    .replace(/\s+Jazz\s*$/i, "")
    .replace(/\s+Carol\s*$/i, "");
  
  // 이미지 파일인 경우: 제목만 남기기 (괄호 안 내용 제거)
  if (isImage) {
    // 괄호 안의 내용 제거 (예: "(450x450)", "(Yiruma)" 등)
    cleaned = cleaned.replace(/\s*\([^)]*\)/g, "").trim();
  }
  // MP3 파일인 경우: 제목(아티스트) 형식 유지 (장르 태그만 제거)
  
  // 앞뒤 공백 정리
  cleaned = cleaned.trim();
  
  return cleaned + ext;
}

/**
 * MP3 파일 정리
 */
async function cleanMusicFiles() {
  console.log("🎵 MP3 파일명 정리 시작...\n");
  
  const musicBaseDir = path.join(process.cwd(), "public", "musics");
  const genres = ["Classic", "Pop", "Balad", "Hiphop", "Jazz", "Carol"];
  
  let totalRenamed = 0;
  let totalErrors = 0;
  
  for (const genre of genres) {
    const genreDir = path.join(musicBaseDir, genre);
    
    if (!fs.existsSync(genreDir)) {
      continue;
    }
    
    const files = fs.readdirSync(genreDir).filter(f => f.endsWith(".mp3"));
    
    if (files.length === 0) {
      continue;
    }
    
    console.log(`\n📀 ${genre} (${files.length}개 파일):`);
    
    for (const file of files) {
      const oldPath = path.join(genreDir, file);
      const newFileName = cleanFileName(file, false);
      const newPath = path.join(genreDir, newFileName);
      
      // 이미 올바른 이름이면 건너뜀
      if (file === newFileName) {
        console.log(`  ✓ ${file} (이미 정리됨)`);
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
  
  console.log(`\n✨ MP3 파일 정리 완료!`);
  console.log(`   ✅ 리네이밍: ${totalRenamed}개`);
  console.log(`   ❌ 에러: ${totalErrors}개`);
}

/**
 * 이미지 파일 정리
 */
async function cleanImageFiles() {
  console.log("\n🖼️  이미지 파일명 정리 시작...\n");
  
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
      const newFileName = cleanFileName(file, true);
      const newPath = path.join(genreDir, newFileName);
      
      // 이미 올바른 이름이면 건너뜀
      if (file === newFileName) {
        console.log(`  ✓ ${file} (이미 정리됨)`);
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
  
  console.log(`\n✨ 이미지 파일 정리 완료!`);
  console.log(`   ✅ 리네이밍: ${totalRenamed}개`);
  console.log(`   ❌ 에러: ${totalErrors}개`);
}

/**
 * 메인 함수
 */
async function main() {
  console.log("🔄 파일명 정리 시작...\n");
  console.log("📋 규칙:");
  console.log("  - 이미지: 제목만 (예: 'River flows in you.png')");
  console.log("  - MP3: 제목(아티스트)만 (예: 'River flows in you(Yiruma).mp3')");
  console.log("  - 장르 태그 제거\n");
  
  try {
    await cleanMusicFiles();
    await cleanImageFiles();
    
    console.log("\n✨ 모든 파일명 정리 완료!");
  } catch (error) {
    console.error("❌ 에러:", error);
    process.exit(1);
  }
}

main();

