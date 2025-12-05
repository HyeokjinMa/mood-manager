/**
 * 간단한 파일 리네이밍 스크립트
 * 1. 모든 MP3 파일명에서 언더바(_)를 공백으로 변경
 * 2. musicData 기준으로 정확한 형식으로 리네이밍
 */

import * as fs from "fs";
import * as path from "path";
import { musicData, type MusicData } from "./import-music-data";

/**
 * 파일명 정규화 (Title(Artist)_Genre 형식)
 */
function normalizeFileName(title: string, artist: string, genre: string, extension: string): string {
  return `${title}(${artist})_${genre}${extension}`;
}

/**
 * 문자열 정규화 (비교용 - 언더바 제거, 소문자)
 */
function normalizeForComparison(str: string): string {
  return str
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/**
 * musicData에서 매칭되는 항목 찾기
 */
function findMatchingMusic(fileName: string, genre: string): MusicData | null {
  const baseName = path.basename(fileName, path.extname(fileName));
  const normalizedBaseName = normalizeForComparison(baseName);
  
  const genreMusic = musicData.filter(m => m.genre === genre);
  
  for (const music of genreMusic) {
    const normalizedTitle = normalizeForComparison(music.title);
    const normalizedArtist = normalizeForComparison(music.artist);
    
    // 제목과 아티스트가 모두 포함되어 있는지 확인
    if (normalizedBaseName.includes(normalizedTitle) && 
        normalizedBaseName.includes(normalizedArtist)) {
      return music;
    }
    
    // 아티스트가 "/"로 구분되어 있으면 각각 확인
    const artistParts = normalizedArtist.split("/").map(a => a.trim());
    const artistMatches = artistParts.some(part => normalizedBaseName.includes(part));
    
    if (normalizedBaseName.includes(normalizedTitle) && artistMatches) {
      return music;
    }
  }
  
  return null;
}

/**
 * MP3 파일 리네이밍
 */
async function renameMusicFiles() {
  console.log("🎵 MP3 파일 리네이밍 시작...\n");
  
  const musicBaseDir = path.join(process.cwd(), "public", "musics");
  const genres = ["Classic", "Pop", "Balad", "Hiphop", "Jazz", "Carol"];
  
  let renamedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  
  for (const genre of genres) {
    const genreDir = path.join(musicBaseDir, genre);
    
    if (!fs.existsSync(genreDir)) {
      console.log(`⚠️  ${genre} 폴더가 없습니다.`);
      continue;
    }
    
    const files = fs.readdirSync(genreDir).filter(f => f.endsWith(".mp3"));
    console.log(`\n📀 ${genre} (${files.length}개 파일):`);
    
    for (const file of files) {
      const oldPath = path.join(genreDir, file);
      
      // 1단계: 언더바를 공백으로 변경한 임시 파일명
      const tempFileName = file.replace(/_/g, " ");
      const tempPath = path.join(genreDir, tempFileName);
      
      // 2단계: musicData에서 매칭되는 항목 찾기
      const matchingMusic = findMatchingMusic(tempFileName, genre);
      
      if (!matchingMusic) {
        // 매칭 안 되면 일단 언더바만 제거
        if (file !== tempFileName) {
          try {
            fs.renameSync(oldPath, tempPath);
            console.log(`  ✅ ${file} → ${tempFileName} (언더바 제거)`);
            renamedCount++;
          } catch (error: any) {
            console.log(`  ⚠️  ${file} → ${tempFileName} (에러: ${error.message})`);
            errorCount++;
          }
        } else {
          console.log(`  ⚠️  ${file} → 매칭되는 musicData 없음 (건너뜀)`);
          skippedCount++;
        }
        continue;
      }
      
      // 3단계: 정확한 형식으로 리네이밍
      const newFileName = normalizeFileName(
        matchingMusic.title,
        matchingMusic.artist,
        matchingMusic.genre,
        ".mp3"
      );
      const newPath = path.join(genreDir, newFileName);
      
      // 이미 올바른 이름이면 건너뜀
      if (file === newFileName) {
        console.log(`  ✓ ${file} (이미 올바른 이름)`);
        continue;
      }
      
      // 새 파일명이 이미 존재하면 에러
      if (fs.existsSync(newPath)) {
        console.log(`  ⚠️  ${file} → ${newFileName} (이미 존재, 건너뜀)`);
        errorCount++;
        continue;
      }
      
      try {
        // 파일명 변경
        fs.renameSync(oldPath, newPath);
        console.log(`  ✅ ${file} → ${newFileName}`);
        renamedCount++;
      } catch (error: any) {
        console.log(`  ⚠️  ${file} → ${newFileName} (에러: ${error.message})`);
        errorCount++;
      }
    }
  }
  
  console.log(`\n✨ MP3 리네이밍 완료!`);
  console.log(`   ✅ 리네이밍: ${renamedCount}개`);
  console.log(`   ⚠️  건너뜀: ${skippedCount}개`);
  console.log(`   ❌ 에러: ${errorCount}개`);
}

/**
 * 앨범 이미지 파일 리네이밍
 */
async function renameAlbumImages() {
  console.log("\n🖼️  앨범 이미지 파일 리네이밍 시작...\n");
  
  const albumsDir = path.join(process.cwd(), "public", "albums");
  const musicsImgDir = path.join(process.cwd(), "public", "musics_img");
  
  // albums 폴더 생성
  if (!fs.existsSync(albumsDir)) {
    fs.mkdirSync(albumsDir, { recursive: true });
  }
  
  const imageExtensions = [".jpg", ".jpeg", ".png"];
  let allFiles: Array<{ file: string; dir: string; genre?: string }> = [];
  
  // musics_img에서 파일 수집
  if (fs.existsSync(musicsImgDir)) {
    const genres = ["Classic", "Pop", "Balad", "Hiphop", "Jazz", "Carol"];
    for (const genre of genres) {
      const genreDir = path.join(musicsImgDir, genre);
      if (fs.existsSync(genreDir) && fs.statSync(genreDir).isDirectory()) {
        const files = fs.readdirSync(genreDir)
          .filter(f => imageExtensions.some(ext => f.toLowerCase().endsWith(ext)))
          .map(f => ({ file: f, dir: genreDir, genre }));
        allFiles.push(...files);
      }
    }
  }
  
  if (allFiles.length === 0) {
    console.log("   앨범 이미지 파일이 없습니다.");
    return;
  }
  
  console.log(`📸 앨범 이미지 (${allFiles.length}개 파일):`);
  
  let renamedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  
  for (const { file, dir: sourceDir, genre } of allFiles) {
    const oldPath = path.join(sourceDir, file);
    
    // 언더바 제거한 임시 파일명 (확장자 제거)
    const baseName = path.basename(file, path.extname(file));
    const tempFileName = baseName.replace(/_/g, " ");
    
    // musicData에서 매칭
    let matchingMusic: MusicData | null = null;
    if (genre) {
      matchingMusic = findMatchingMusic(tempFileName, genre);
    } else {
      // 장르가 없으면 모든 장르에서 찾기
      for (const searchGenre of ["Classic", "Pop", "Balad", "Hiphop", "Jazz", "Carol"]) {
        matchingMusic = findMatchingMusic(tempFileName, searchGenre);
        if (matchingMusic) break;
      }
    }
    
    if (!matchingMusic) {
      console.log(`  ⚠️  ${file} → 매칭되는 musicData 없음 (건너뜀)`);
      skippedCount++;
      continue;
    }
    
    // 정확한 형식으로 리네이밍
    const originalExt = path.extname(file).toLowerCase();
    const newFileName = normalizeFileName(
      matchingMusic.title,
      matchingMusic.artist,
      matchingMusic.genre,
      originalExt
    );
    const newPath = path.join(albumsDir, newFileName);
    
    // 이미 존재하면 건너뜀
    if (fs.existsSync(newPath)) {
      console.log(`  ⚠️  ${file} → ${newFileName} (이미 존재)`);
      continue;
    }
    
    try {
      // 파일 복사 후 원본 삭제
      fs.copyFileSync(oldPath, newPath);
      fs.unlinkSync(oldPath);
      console.log(`  ✅ ${file} → ${newFileName}`);
      renamedCount++;
    } catch (error: any) {
      console.log(`  ⚠️  ${file} → ${newFileName} (에러: ${error.message})`);
      errorCount++;
    }
  }
  
  console.log(`\n✨ 앨범 이미지 리네이밍 완료!`);
  console.log(`   ✅ 리네이밍: ${renamedCount}개`);
  console.log(`   ⚠️  건너뜀: ${skippedCount}개`);
  console.log(`   ❌ 에러: ${errorCount}개`);
}

/**
 * 메인 함수
 */
async function main() {
  console.log("🔄 간단한 파일 리네이밍 시작...\n");
  console.log("1단계: 모든 언더바(_)를 공백으로 변경\n");
  console.log("2단계: musicData 기준으로 정확한 형식으로 리네이밍\n");
  
  try {
    await renameMusicFiles();
    await renameAlbumImages();
    
    console.log("\n✨ 모든 리네이밍 완료!");
  } catch (error) {
    console.error("❌ 에러:", error);
    process.exit(1);
  }
}

main();

