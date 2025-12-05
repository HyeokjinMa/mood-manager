/**
 * 음악 메타데이터 JSON 생성 스크립트
 * 
 * 기존 musicData를 번호 기반 JSON으로 변환
 * 사용법: npx tsx scripts/generate-music-metadata.ts
 */

import { musicData } from "./import-music-data";
import fs from "fs";
import path from "path";

interface MusicMetadata {
  id: string; // "Genre_Number" 형식 (예: "Classic_1")
  genre: string;
  number: number;
  title: string;
  artist: string;
  description: string;
  fileName: string; // 새로운 파일명 (예: "Classic_1.mp3")
  imageFileName: string; // 이미지 파일명 (예: "Classic_1.png")
  fileUrl: string; // MP3 파일 URL
  imageUrl: string; // 이미지 파일 URL
  originalFileName?: string; // 원본 파일명 (변경 전)
}

interface MusicMetadataJSON {
  version: string;
  lastUpdated: string;
  tracks: MusicMetadata[];
}

function generateMusicMetadata(): MusicMetadataJSON {
  const tracks: MusicMetadata[] = [];
  const genreCounts: Record<string, number> = {};

  // 장르별로 번호 부여
  for (const music of musicData) {
    const genre = music.genre;
    if (!genreCounts[genre]) {
      genreCounts[genre] = 0;
    }
    genreCounts[genre]++;

    const number = genreCounts[genre];
    const id = `${genre}_${number}`;
    const fileName = `${genre}_${number}.mp3`;
    const imageFileName = `${genre}_${number}.png`;

    tracks.push({
      id,
      genre,
      number,
      title: music.title,
      artist: music.artist,
      description: music.description,
      fileName,
      imageFileName,
      fileUrl: `/musics/${genre}/${fileName}`,
      imageUrl: `/musics_img/${genre}/${imageFileName}`,
      originalFileName: music.fileName, // 원본 파일명 보존
    });
  }

  return {
    version: "1.0.0",
    lastUpdated: new Date().toISOString().split("T")[0],
    tracks,
  };
}

function main() {
  console.log("음악 메타데이터 JSON 생성 중...");

  const metadata = generateMusicMetadata();

  // JSON 파일 저장
  const outputPath = path.join(process.cwd(), "src/lib/music/musicMetadata.json");
  fs.writeFileSync(outputPath, JSON.stringify(metadata, null, 2), "utf-8");

  console.log(`✅ 메타데이터 JSON 생성 완료: ${outputPath}`);
  console.log(`총 ${metadata.tracks.length}개 트랙`);
  
  // 장르별 통계
  const genreStats: Record<string, number> = {};
  for (const track of metadata.tracks) {
    genreStats[track.genre] = (genreStats[track.genre] || 0) + 1;
  }
  
  console.log("\n장르별 통계:");
  for (const [genre, count] of Object.entries(genreStats)) {
    console.log(`  ${genre}: ${count}개`);
  }
}

main();

