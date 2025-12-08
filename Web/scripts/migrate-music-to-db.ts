/**
 * musicTracks.json 데이터를 DB로 마이그레이션하는 스크립트
 * 
 * 실행 방법:
 *   cd Web
 *   npx tsx scripts/migrate-music-to-db.ts
 */

import { PrismaClient } from "@prisma/client";
import musicTracksData from "../src/lib/music/musicTracks.json";

const prisma = new PrismaClient();

interface MusicTrack {
  musicID: number;
  genre: string;
  title: string;
  mp3Url: string;
  imageUrl: string;
  artist: string;
  description: string;
  duration: number;
}

interface MusicTracksJSON {
  version: string;
  lastUpdated: string;
  tracks: MusicTrack[];
}

async function migrateMusicToDB() {
  try {
    console.log("🎵 음악 데이터 DB 마이그레이션 시작...");
    
    const musicTracks = musicTracksData as MusicTracksJSON;
    const tracks = musicTracks.tracks;
    
    console.log(`📊 총 ${tracks.length}개의 트랙을 마이그레이션합니다.`);
    
    // 1. 장르 생성/조회
    const genreMap = new Map<string, number>();
    const uniqueGenres = [...new Set(tracks.map(t => t.genre))];
    
    console.log(`\n📁 장르 생성 중... (${uniqueGenres.length}개)`);
    for (const genreName of uniqueGenres) {
      const genre = await prisma.genre.upsert({
        where: { name: genreName },
        update: {},
        create: {
          name: genreName,
          description: null,
        },
      });
      genreMap.set(genreName, genre.id);
      console.log(`  ✓ ${genreName} (ID: ${genre.id})`);
    }
    
    // 2. Sound 레코드 생성
    console.log(`\n🎶 Sound 레코드 생성 중...`);
    let successCount = 0;
    let errorCount = 0;
    
    for (const track of tracks) {
      try {
        const genreId = genreMap.get(track.genre);
        if (!genreId) {
          console.error(`  ❌ 장르를 찾을 수 없음: ${track.genre} (트랙: ${track.title})`);
          errorCount++;
          continue;
        }
        
        // componentsJson에 musicID, artist, description 정보 포함
        const componentsJson = {
          musicID: track.musicID,
          artist: track.artist,
          genre: track.genre,
          description: track.description,
        };
        
        // componentsJson에 musicID가 있는 Sound 레코드 조회
        const existingSound = await prisma.sound.findFirst({
          where: {
            componentsJson: {
              path: ["musicID"],
              equals: track.musicID,
            },
          },
        });
        
        if (existingSound) {
          // 기존 레코드 업데이트
          await prisma.sound.update({
            where: { id: existingSound.id },
            data: {
              name: track.title,
              fileUrl: track.mp3Url,
              albumImageUrl: track.imageUrl,
              duration: track.duration,
              genreId: genreId,
              componentsJson: componentsJson,
            },
          });
        } else {
          // 새 레코드 생성
          await prisma.sound.create({
            data: {
              name: track.title,
              fileUrl: track.mp3Url,
              albumImageUrl: track.imageUrl,
              duration: track.duration,
              genreId: genreId,
              componentsJson: componentsJson,
            },
          });
        }
        
        successCount++;
        if (successCount % 10 === 0) {
          console.log(`  ✓ ${successCount}개 완료...`);
        }
      } catch (error) {
        console.error(`  ❌ 오류 발생 (트랙: ${track.title}):`, error);
        errorCount++;
      }
    }
    
    console.log(`\n✅ 마이그레이션 완료!`);
    console.log(`   성공: ${successCount}개`);
    console.log(`   실패: ${errorCount}개`);
    
    // 3. 검증: DB에서 데이터 조회 테스트
    console.log(`\n🔍 데이터 검증 중...`);
    const dbSounds = await prisma.sound.findMany({
      include: { genre: true },
      take: 5,
    });
    
    console.log(`   DB에 저장된 Sound 레코드 샘플 (최대 5개):`);
    dbSounds.forEach((sound, index) => {
      console.log(`   ${index + 1}. ${sound.name} (${sound.genre?.name || "N/A"}) - ${sound.duration}초`);
    });
    
    const totalCount = await prisma.sound.count();
    console.log(`   총 Sound 레코드 수: ${totalCount}개`);
    
  } catch (error) {
    console.error("❌ 마이그레이션 중 오류 발생:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 스크립트 실행
migrateMusicToDB()
  .then(() => {
    console.log("\n🎉 마이그레이션 스크립트 완료!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 마이그레이션 스크립트 실패:", error);
    process.exit(1);
  });

