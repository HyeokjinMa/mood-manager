/**
 * 음악 파일 및 앨범 이미지 리네이밍 스크립트 (수정 버전)
 * 
 * musicData 배열을 기준으로 모든 파일을 Title(Artist)_Genre 형식으로 리네이밍
 * 
 * 사용법:
 * npx tsx scripts/rename-music-files-fixed.ts
 * 
 * 주의: 파일 시스템 권한이 필요합니다. 권한 오류가 발생하면 터미널에서 직접 실행하세요.
 */

import * as fs from "fs";
import * as path from "path";
import { musicData, type MusicData } from "./import-music-data";

/**
 * 파일명 정규화 (언더바 제거, 공백 처리)
 */
function normalizeFileName(title: string, artist: string, genre: string, extension: string): string {
  // 제목과 아티스트에서 언더바 제거, 공백은 유지
  const normalizedTitle = title.replace(/_/g, " ").trim();
  const normalizedArtist = artist.replace(/_/g, " ").trim();
  
  return `${normalizedTitle}(${normalizedArtist})_${genre}${extension}`;
}

/**
 * 기존 파일명에서 제목과 아티스트 추출 시도
 */
function extractTitleAndArtist(fileName: string): { title: string; artist: string } | null {
  const baseName = path.basename(fileName, path.extname(fileName));
  
  // 패턴 1: Title(Artist)_Genre 형식
  const pattern1 = /^(.+?)\((.+?)\)(?:_\w+)?$/i;
  const match1 = baseName.match(pattern1);
  if (match1) {
    return {
      title: match1[1].trim(),
      artist: match1[2].trim(),
    };
  }
  
  // 패턴 2: Title_Artist_Genre 형식 (마지막 언더바가 장르)
  const pattern2 = /^(.+?)_(.+?)_(\w+)$/i;
  const match2 = baseName.match(pattern2);
  if (match2) {
    // 장르 부분 제거하고 제목과 아티스트 추출
    const titlePart = match2[1];
    const artistPart = match2[2];
    return {
      title: titlePart.trim(),
      artist: artistPart.trim(),
    };
  }
  
  // 패턴 3: Title_Artist 형식 (장르 없음)
  const pattern3 = /^(.+?)_(.+?)$/i;
  const match3 = baseName.match(pattern3);
  if (match3) {
    return {
      title: match3[1].trim(),
      artist: match3[2].trim(),
    };
  }
  
  return null;
}

/**
 * 문자열 정규화 (비교용)
 */
function normalizeForComparison(str: string): string {
  return str
    .replace(/_/g, " ") // 언더바를 공백으로
    .replace(/\s+/g, " ") // 여러 공백을 하나로
    .trim()
    .toLowerCase();
}

/**
 * musicData에서 파일명으로 매칭되는 항목 찾기
 */
function findMatchingMusic(fileName: string, genre: string): MusicData | null {
  const baseName = path.basename(fileName, path.extname(fileName));
  
  // 해당 장르의 musicData만 필터링
  const genreMusic = musicData.filter(m => m.genre === genre);
  
  // 1. 파일명에서 제목과 아티스트 추출 시도
  const extracted = extractTitleAndArtist(fileName);
  
  if (extracted) {
    const normalizedExtractedTitle = normalizeForComparison(extracted.title);
    const normalizedExtractedArtist = normalizeForComparison(extracted.artist);
    
    // 추출한 제목/아티스트로 매칭
    for (const music of genreMusic) {
      const normalizedTitle = normalizeForComparison(music.title);
      const normalizedArtist = normalizeForComparison(music.artist);
      
      // 제목과 아티스트가 모두 매칭되면 성공
      if (normalizedTitle === normalizedExtractedTitle && 
          normalizedArtist === normalizedExtractedArtist) {
        return music;
      }
      
      // 부분 매칭 (제목이 포함되어 있고 아티스트가 매칭)
      if (normalizedTitle.includes(normalizedExtractedTitle) || 
          normalizedExtractedTitle.includes(normalizedTitle)) {
        if (normalizedArtist === normalizedExtractedArtist) {
          return music;
        }
      }
    }
  }
  
  // 2. 파일명 전체를 정규화해서 비교
  const normalizedBaseName = normalizeForComparison(baseName);
  
  for (const music of genreMusic) {
    const normalizedTitle = normalizeForComparison(music.title);
    const normalizedArtist = normalizeForComparison(music.artist);
    
    // 아티스트 이름이 "/"로 구분되어 있으면 각각 확인
    const artistParts = normalizedArtist.split("/").map(a => a.trim());
    const artistMatches = artistParts.some(part => normalizedBaseName.includes(part));
    
    // 제목이 포함되어 있고 아티스트도 매칭되면 성공
    if (normalizedBaseName.includes(normalizedTitle) && artistMatches) {
      return music;
    }
    
    // 제목의 주요 단어들이 포함되어 있는지 확인 (예: "Revolutionary", "Torrent")
    const titleWords = normalizedTitle.split(/\s+/).filter(w => w.length > 3);
    const titleMatches = titleWords.length > 0 && titleWords.every(word => normalizedBaseName.includes(word));
    
    if (titleMatches && artistMatches) {
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
      console.log(`⚠️  ${genre} 폴더가 없습니다. 건너뜁니다.`);
      continue;
    }
    
    const files = fs.readdirSync(genreDir).filter(f => f.endsWith(".mp3"));
    console.log(`\n📀 ${genre} (${files.length}개 파일):`);
    
    for (const file of files) {
      const oldPath = path.join(genreDir, file);
      const matchingMusic = findMatchingMusic(file, genre);
      
      if (!matchingMusic) {
        console.log(`  ⚠️  ${file} → 매칭되는 musicData 없음 (건너뜀)`);
        skippedCount++;
        continue;
      }
      
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
        console.log(`  ❌ ${file} → ${newFileName} (이미 존재, 건너뜀)`);
        errorCount++;
        continue;
      }
      
      try {
        // 파일 복사 후 원본 삭제 (권한 문제 대응)
        fs.copyFileSync(oldPath, newPath);
        fs.unlinkSync(oldPath);
        console.log(`  ✅ ${file} → ${newFileName}`);
        renamedCount++;
      } catch (error: any) {
        if (error.code === 'EACCES') {
          console.log(`  ⚠️  ${file} → ${newFileName} (권한 오류: 터미널에서 직접 실행하세요)`);
        } else {
          console.error(`  ❌ ${file} → ${newFileName} (에러: ${error.message})`);
        }
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
  
  // albums 폴더가 없으면 생성
  if (!fs.existsSync(albumsDir)) {
    console.log("📁 albums 폴더 생성 중...");
    fs.mkdirSync(albumsDir, { recursive: true });
  }
  
  // musics_img 폴더가 있으면 그곳에서도 이미지 찾기
  const sourceDirs = [albumsDir];
  if (fs.existsSync(musicsImgDir)) {
    sourceDirs.push(musicsImgDir);
  }
  
  const imageExtensions = [".jpg", ".jpeg", ".png"];
  let allFiles: Array<{ file: string; dir: string; genre?: string }> = [];
  
  // 모든 소스 디렉토리에서 파일 수집
  for (const sourceDir of sourceDirs) {
    if (!fs.existsSync(sourceDir)) continue;
    
    // 장르별 폴더가 있는 경우 (musics_img)
    const genres = ["Classic", "Pop", "Balad", "Hiphop", "Jazz", "Carol"];
    for (const genre of genres) {
      const genreDir = path.join(sourceDir, genre);
      if (fs.existsSync(genreDir) && fs.statSync(genreDir).isDirectory()) {
        const files = fs.readdirSync(genreDir, { withFileTypes: true })
          .filter(dirent => dirent.isFile())
          .filter(dirent => imageExtensions.some(ext => dirent.name.toLowerCase().endsWith(ext)))
          .map(dirent => ({ file: dirent.name, dir: genreDir, genre }));
        allFiles.push(...files);
      }
    }
    
    // 루트 디렉토리에 직접 파일이 있는 경우 (albums)
    if (sourceDir === albumsDir) {
      const files = fs.readdirSync(sourceDir, { withFileTypes: true })
        .filter(dirent => dirent.isFile())
        .filter(dirent => imageExtensions.some(ext => dirent.name.toLowerCase().endsWith(ext)))
        .map(dirent => ({ file: dirent.name, dir: sourceDir }));
      allFiles.push(...files);
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
  let movedCount = 0;
  
  for (const { file, dir: sourceDir, genre } of allFiles) {
    const oldPath = path.join(sourceDir, file);
    
    // 앨범 이미지는 장르를 파일명에서 추출하거나 모든 장르에서 찾기
    let matchingMusic: MusicData | null = null;
    const searchGenres = genre ? [genre] : ["Classic", "Pop", "Balad", "Hiphop", "Jazz", "Carol"];
    for (const searchGenre of searchGenres) {
      matchingMusic = findMatchingMusic(file, searchGenre);
      if (matchingMusic) break;
    }
    
    if (!matchingMusic) {
      console.log(`  ⚠️  ${file} → 매칭되는 musicData 없음 (건너뜀)`);
      skippedCount++;
      continue;
    }
    
    // 원본 파일의 확장자 유지
    const originalExt = path.extname(file).toLowerCase();
    const newFileName = normalizeFileName(
      matchingMusic.title,
      matchingMusic.artist,
      matchingMusic.genre,
      originalExt
    );
    const newPath = path.join(albumsDir, newFileName);
    
    // 이미 올바른 이름이고 albums 폴더에 있으면 건너뜀
    if (file === newFileName && sourceDir === albumsDir) {
      console.log(`  ✓ ${file} (이미 올바른 이름)`);
      continue;
    }
    
    // 새 파일명이 이미 존재하면 에러
    if (fs.existsSync(newPath)) {
      console.log(`  ⚠️  ${file} → ${newFileName} (이미 존재, 원본만 삭제)`);
      if (sourceDir !== albumsDir) {
        try {
          fs.unlinkSync(oldPath);
          movedCount++;
        } catch (e) {
          // 무시
        }
      }
      continue;
    }
    
    try {
      // 파일 복사 후 원본 삭제 (권한 문제 대응)
      fs.copyFileSync(oldPath, newPath);
      if (sourceDir !== albumsDir) {
        fs.unlinkSync(oldPath); // musics_img에서 옮긴 경우만 삭제
        movedCount++;
      }
      console.log(`  ✅ ${file} → ${newFileName}${sourceDir !== albumsDir ? ' (이동됨)' : ''}`);
      renamedCount++;
    } catch (error: any) {
      if (error.code === 'EACCES') {
        console.log(`  ⚠️  ${file} → ${newFileName} (권한 오류: 터미널에서 직접 실행하세요)`);
      } else {
        console.error(`  ❌ ${file} → ${newFileName} (에러: ${error.message})`);
      }
      errorCount++;
    }
  }
  
  console.log(`\n✨ 앨범 이미지 리네이밍 완료!`);
  console.log(`   ✅ 리네이밍: ${renamedCount}개`);
  console.log(`   📦 이동: ${movedCount}개 (musics_img → albums)`);
  console.log(`   ⚠️  건너뜀: ${skippedCount}개`);
  console.log(`   ❌ 에러: ${errorCount}개`);
}

/**
 * 메인 함수
 */
async function main() {
  console.log("🔄 음악 파일 및 앨범 이미지 리네이밍 시작...\n");
  console.log("📋 기준: import-music-data.ts의 musicData 배열\n");
  
  try {
    await renameMusicFiles();
    await renameAlbumImages();
    
    console.log("\n✨ 모든 리네이밍 완료!");
    console.log("\n📝 다음 단계:");
    console.log("   1. 리네이밍 결과 확인");
    console.log("   2. npx tsx scripts/import-music-data.ts 실행하여 DB에 입력");
  } catch (error) {
    console.error("❌ 에러:", error);
    process.exit(1);
  }
}

main();

