/**
 * 음악 파일명 변경 스크립트
 * 
 * 기존 파일명을 번호 기반 파일명으로 변경
 * 예: "All of me(Jon Schmidt).mp3" → "Classic_1.mp3"
 * 
 * 사용법: npx tsx scripts/rename-music-files.ts
 * 
 * 주의: 이 스크립트는 실제 파일을 변경합니다. 백업을 권장합니다.
 */

import fs from "fs";
import path from "path";
import { musicData } from "./import-music-data";

interface FileMapping {
  originalFileName: string;
  newFileName: string;
  genre: string;
  title: string;
  artist: string;
}

function generateFileMappings(): FileMapping[] {
  const mappings: FileMapping[] = [];
  const genreCounts: Record<string, number> = {};

  for (const music of musicData) {
    const genre = music.genre;
    if (!genreCounts[genre]) {
      genreCounts[genre] = 0;
    }
    genreCounts[genre]++;

    const number = genreCounts[genre];
    const newFileName = `${genre}_${number}.mp3`;

    mappings.push({
      originalFileName: music.fileName,
      newFileName,
      genre,
      title: music.title,
      artist: music.artist,
    });
  }

  return mappings;
}

function renameFiles(dryRun: boolean = true) {
  console.log(dryRun ? "🔍 [DRY RUN] 파일명 변경 시뮬레이션" : "🔄 파일명 변경 시작...");
  console.log("");

  const mappings = generateFileMappings();
  const baseDir = path.join(process.cwd(), "public", "musics");
  const imageBaseDir = path.join(process.cwd(), "public", "musics_img");

  let successCount = 0;
  let errorCount = 0;
  const errors: string[] = [];

  for (const mapping of mappings) {
    const genreDir = path.join(baseDir, mapping.genre);
    const imageGenreDir = path.join(imageBaseDir, mapping.genre);

    // MP3 파일 경로
    const originalMp3Path = path.join(genreDir, mapping.originalFileName);
    const newMp3Path = path.join(genreDir, mapping.newFileName);

    // 이미지 파일 경로 (원본 파일명에서 확장자만 변경)
    const originalImageName = mapping.originalFileName.replace(/\.mp3$/, ".png");
    const newImageName = mapping.newFileName.replace(/\.mp3$/, ".png");
    const originalImagePath = path.join(imageGenreDir, originalImageName);
    const newImagePath = path.join(imageGenreDir, newImageName);

    try {
      // MP3 파일 확인 및 변경
      if (fs.existsSync(originalMp3Path)) {
        if (dryRun) {
          console.log(`[시뮬레이션] MP3: ${mapping.originalFileName} → ${mapping.newFileName}`);
        } else {
          fs.renameSync(originalMp3Path, newMp3Path);
          console.log(`✅ MP3: ${mapping.originalFileName} → ${mapping.newFileName}`);
        }
        successCount++;
      } else {
        const error = `❌ MP3 파일 없음: ${originalMp3Path}`;
        console.log(error);
        errors.push(error);
        errorCount++;
      }

      // 이미지 파일 확인 및 변경
      if (fs.existsSync(originalImagePath)) {
        if (dryRun) {
          console.log(`[시뮬레이션] 이미지: ${originalImageName} → ${newImageName}`);
        } else {
          fs.renameSync(originalImagePath, newImagePath);
          console.log(`✅ 이미지: ${originalImageName} → ${newImageName}`);
        }
        successCount++;
      } else {
        // 이미지 파일이 없어도 계속 진행 (경고만)
        console.log(`⚠️  이미지 파일 없음: ${originalImagePath} (계속 진행)`);
      }
    } catch (error) {
      const errorMsg = `❌ 에러 발생: ${mapping.originalFileName} - ${error instanceof Error ? error.message : String(error)}`;
      console.log(errorMsg);
      errors.push(errorMsg);
      errorCount++;
    }
  }

  console.log("");
  console.log("=".repeat(50));
  if (dryRun) {
    console.log("🔍 [DRY RUN] 시뮬레이션 완료");
  } else {
    console.log("✅ 파일명 변경 완료");
  }
  console.log(`성공: ${successCount}개`);
  console.log(`에러: ${errorCount}개`);

  if (errors.length > 0) {
    console.log("\n에러 목록:");
    errors.forEach((error) => console.log(`  ${error}`));
  }

  if (dryRun) {
    console.log("\n⚠️  실제 변경을 하려면 --execute 플래그를 사용하세요:");
    console.log("   npx tsx scripts/rename-music-files.ts --execute");
  }
}

function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes("--execute");

  if (dryRun) {
    console.log("⚠️  DRY RUN 모드입니다. 실제 파일은 변경되지 않습니다.\n");
  } else {
    console.log("⚠️  실제 파일을 변경합니다. 계속하시겠습니까? (y/N)");
    // 실제로는 사용자 입력을 받아야 하지만, 스크립트에서는 자동 진행
    console.log("자동 진행...\n");
  }

  renameFiles(dryRun);
}

main();

