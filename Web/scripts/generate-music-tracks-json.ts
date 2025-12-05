/**
 * 새로운 음악 트랙 JSON 생성 스크립트 (musicID 기반)
 * 
 * musicID 할당 규칙:
 * - Balad: 10-19
 * - Pop: 20-29
 * - Classic: 30-39
 * - Jazz: 40-49
 * - Hiphop: 50-59
 * - Carol: 60-69
 * 
 * 사용법: npx tsx scripts/generate-music-tracks-json.ts
 */

import fs from "fs";
import path from "path";

interface MusicTrack {
  musicID: number; // 10-69
  genre: string; // "Balad", "Pop", "Classic" 등
  title: string;
  mp3Url: string; // "/musics/Balad/Balad_1.mp3"
  imageUrl: string; // "/musics_img/Balad/Balad_1.png"
  artist: string;
  description: string;
  duration: number; // seconds
}

interface MusicTracksJSON {
  version: string;
  lastUpdated: string;
  tracks: MusicTrack[];
}

// 장르별 musicID 시작 번호
const GENRE_ID_MAP: Record<string, number> = {
  "Balad": 10,
  "Pop": 20,
  "Classic": 30,
  "Jazz": 40,
  "Hiphop": 50,
  "Carol": 60,
};

/**
 * 실제 파일 시스템에서 음악 트랙 정보 생성
 */
function generateMusicTracks(): MusicTracksJSON {
  const tracks: MusicTrack[] = [];
  const musicsDir = path.join(process.cwd(), "public", "musics");
  const musicsImgDir = path.join(process.cwd(), "public", "musics_img");

  // 각 장르 폴더 순회
  const genreDirs = fs.readdirSync(musicsDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)
    .sort(); // 정렬

  for (const genreDir of genreDirs) {
    const genrePath = path.join(musicsDir, genreDir);
    const mp3Files = fs.readdirSync(genrePath)
      .filter(file => file.endsWith(".mp3"))
      .sort(); // 파일명 순서대로 정렬

    // 장르별 시작 ID 가져오기
    const startID = GENRE_ID_MAP[genreDir] || 10;
    let trackIndex = 0;

    for (const mp3File of mp3Files) {
      const musicID = startID + trackIndex;
      
      // 최대 10개까지만 (각 장르당)
      if (trackIndex >= 10) {
        console.warn(`⚠️  ${genreDir} 장르는 10개를 초과하여 ${mp3File}은 건너뜁니다.`);
        continue;
      }

      // 이미지 파일 확인
      const baseName = mp3File.replace(/\.mp3$/, "");
      const imageFile = baseName + ".png";
      const imagePath = path.join(musicsImgDir, genreDir, imageFile);
      const imageUrl = `/musics_img/${genreDir}/${imageFile}`;

      // 파일명에서 제목과 아티스트 추출 시도
      // 예: "Balad_1.mp3" → title: "Balad 1", artist: "Unknown"
      // 실제로는 DB나 별도 메타데이터에서 가져와야 함
      const title = baseName.replace(/_/g, " "); // "Balad_1" → "Balad 1"
      const artist = "Unknown"; // 나중에 DB에서 가져오기
      const description = `${title} by ${artist} - ${genreDir.toLowerCase()} music`;

      tracks.push({
        musicID, // 10-69
        genre: genreDir,
        title,
        mp3Url: `/musics/${genreDir}/${mp3File}`,
        imageUrl,
        artist,
        description,
        duration: 180, // 기본값, 나중에 DB에서 가져오기
      });

      trackIndex++;
    }
  }

  return {
    version: "2.0.0",
    lastUpdated: new Date().toISOString().split("T")[0],
    tracks,
  };
}

function main() {
  console.log("🎵 새로운 음악 트랙 JSON 생성 중 (musicID 기반)...");

  const musicTracks = generateMusicTracks();

  // JSON 파일 저장
  const outputPath = path.join(process.cwd(), "src/lib/music/musicTracks.json");
  fs.writeFileSync(outputPath, JSON.stringify(musicTracks, null, 2), "utf-8");

  console.log(`✅ 음악 트랙 JSON 생성 완료: ${outputPath}`);
  console.log(`총 ${musicTracks.tracks.length}개 트랙`);
  
  // 장르별 통계
  const genreStats: Record<string, number> = {};
  for (const track of musicTracks.tracks) {
    genreStats[track.genre] = (genreStats[track.genre] || 0) + 1;
  }
  
  console.log("\n장르별 통계:");
  for (const [genre, count] of Object.entries(genreStats)) {
    const startID = GENRE_ID_MAP[genre] || 10;
    const endID = startID + count - 1;
    console.log(`  ${genre}: ${count}개 (musicID: ${startID}-${endID})`);
  }

  console.log("\n⚠️  주의: title, artist, description, duration은 기본값입니다.");
  console.log("   실제 데이터는 DB에서 가져오거나 수동으로 업데이트해야 합니다.");
}

main();
