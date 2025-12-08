/**
 * 실제 album 폴더의 파일을 스캔하여 musicTracks.json 생성
 * 
 * 사용법: npx tsx scripts/generate-music-tracks-from-album.ts > src/lib/music/musicTracks.json
 * 
 * 이 스크립트는:
 * 1. Web/public/album/all-songs.md에서 메타데이터 읽기
 * 2. Web/public/album/{Genre}/ 폴더에서 실제 파일 스캔
 * 3. MP3 파일과 PNG 파일을 매칭
 * 4. musicID를 자동 할당
 * 5. musicTracks.json 형식으로 출력
 */

import * as fs from "fs";
import * as path from "path";

const ALBUM_DIR = path.join(process.cwd(), "public", "album");
const METADATA_FILE = path.join(ALBUM_DIR, "all-songs.md");
const GENRES = ["Balad", "Pop", "Classic", "Jazz", "Hiphop", "Carol"];

// 장르별 musicID 범위
const genreRanges: Record<string, { start: number; end: number }> = {
  "Balad": { start: 10, end: 19 },
  "Pop": { start: 20, end: 29 },
  "Classic": { start: 30, end: 39 },
  "Jazz": { start: 40, end: 49 },
  "Hiphop": { start: 50, end: 59 },
  "Carol": { start: 60, end: 69 },
};

interface TrackMetadata {
  title: string;
  mp3: string; // "Balad/Balad_01.mp3"
  png: string; // "Balad/A glass of soju.png"
  artist: string;
  description: string;
  duration: number;
}

interface TrackInfo {
  musicID: number;
  genre: string;
  title: string;
  mp3Url: string;
  imageUrl: string;
  artist: string;
  description: string;
  duration: number;
}

/**
 * 마크다운 파일에서 JSON 블록 추출
 */
function extractMetadataFromMarkdown(markdown: string): TrackMetadata[] {
  const metadata: TrackMetadata[] = [];
  const regex = /```json\s*([\s\S]*?)\s*```/g;
  let match;
  
  while ((match = regex.exec(markdown)) !== null) {
    try {
      const json = JSON.parse(match[1]);
      metadata.push(json);
    } catch (e) {
      // JSON 파싱 실패 시 무시
    }
  }
  
  return metadata;
}

/**
 * 메타데이터를 장르별로 그룹화
 */
function groupMetadataByGenre(metadata: TrackMetadata[]): Record<string, TrackMetadata[]> {
  const grouped: Record<string, TrackMetadata[]> = {};
  
  metadata.forEach((item) => {
    const genre = item.mp3.split("/")[0];
    if (!grouped[genre]) {
      grouped[genre] = [];
    }
    grouped[genre].push(item);
  });
  
  return grouped;
}

/**
 * 장르 폴더에서 실제 파일 목록 가져오기
 */
function getFilesInGenre(genre: string): { mp3Files: string[]; pngFiles: string[] } {
  const genreDir = path.join(ALBUM_DIR, genre);
  
  if (!fs.existsSync(genreDir)) {
    return { mp3Files: [], pngFiles: [] };
  }

  const files = fs.readdirSync(genreDir);
  
  return {
    mp3Files: files.filter((f) => f.toLowerCase().endsWith(".mp3")).sort(),
    pngFiles: files.filter((f) => f.toLowerCase().endsWith(".png")).sort(),
  };
}

/**
 * 메인 함수
 */
function main() {
  // 1. 메타데이터 파일 읽기
  let metadataByGenre: Record<string, TrackMetadata[]> = {};
  
  if (fs.existsSync(METADATA_FILE)) {
    const markdown = fs.readFileSync(METADATA_FILE, "utf-8");
    const allMetadata = extractMetadataFromMarkdown(markdown);
    metadataByGenre = groupMetadataByGenre(allMetadata);
  }

  const allTracks: TrackInfo[] = [];

  // 2. 각 장르별로 트랙 생성
  GENRES.forEach((genre) => {
    const range = genreRanges[genre];
    if (!range) {
      console.error(`❌ Unknown genre: ${genre}`);
      return;
    }

    const metadata = metadataByGenre[genre] || [];
    const { mp3Files, pngFiles } = getFilesInGenre(genre);

    if (mp3Files.length === 0) {
      console.error(`⚠️  ${genre}: MP3 파일이 없습니다.`);
      return;
    }

    // 메타데이터와 실제 파일을 매칭
    mp3Files.forEach((mp3File, index) => {
      const musicID = range.start + index;
      
      // 메타데이터에서 찾기 (mp3 파일명 기준)
      const meta = metadata.find((m) => {
        const metaMp3Name = m.mp3.split("/")[1];
        return metaMp3Name === mp3File;
      });

      // PNG 파일 찾기
      let pngFile = "";
      if (meta) {
        // 메타데이터에 PNG 정보가 있으면 사용
        const metaPngName = meta.png.split("/")[1];
        if (pngFiles.includes(metaPngName)) {
          pngFile = metaPngName;
        }
      }
      
      // 메타데이터에서 찾지 못한 경우, 순서대로 매칭
      if (!pngFile && pngFiles.length > index) {
        pngFile = pngFiles[index];
      }

      // 제목은 PNG 파일명에서 추출 (확장자 제거)
      let title = meta?.title || pngFile.replace(/\.png$/i, "") || `Track ${index + 1}`;
      const artist = meta?.artist || "Unknown";
      const description = meta?.description || `${title} by ${artist} - ${genre.toLowerCase()} music`;
      const duration = meta?.duration || 180;

      allTracks.push({
        musicID,
        genre,
        title,
        mp3Url: `/album/${genre}/${mp3File}`,
        imageUrl: pngFile ? `/album/${genre}/${pngFile}` : "",
        artist,
        description,
        duration,
      });
    });

  });

  // musicID 순서로 정렬
  allTracks.sort((a, b) => a.musicID - b.musicID);

  // 최종 JSON 생성
  const output = {
    version: "2.0.0",
    lastUpdated: new Date().toISOString().split("T")[0],
    tracks: allTracks,
  };

  // JSON 출력 (stdout만 - 순수 JSON)
  console.log(JSON.stringify(output, null, 2));
}

main();
