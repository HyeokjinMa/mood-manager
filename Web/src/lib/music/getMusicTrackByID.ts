/**
 * 간단한 음악 트랙 조회 (musicID 기반)
 * 
 * musicID 선택 → DB에서 해당 트랙 로드
 */

import { prisma } from "@/lib/prisma";

export interface MusicTrack {
  musicID: number; // 10-69
  genre: string; // "Balad", "Pop" 등
  title: string;
  mp3Url: string;
  imageUrl: string;
  artist: string;
  description: string;
  duration: number; // seconds
}

/**
 * musicID로 음악 트랙 찾기 (DB에서 조회)
 * 
 * @param musicID - 10-69
 * @returns MusicTrack 또는 null
 */
export async function getMusicTrackByID(musicID: number): Promise<MusicTrack | null> {
  try {
    // 모든 Sound 레코드를 가져와서 componentsJson에서 musicID를 확인
    const sounds = await prisma.sound.findMany({
      include: {
        genre: true,
      },
    });
    
    const sound = sounds.find((s) => {
      const components = s.componentsJson as { musicID?: number } | null;
      return components?.musicID === musicID;
    });

    if (!sound) {
      return null;
    }

    // componentsJson에서 추가 정보 추출
    const components = sound.componentsJson as { musicID?: number; artist?: string; genre?: string; description?: string } | null;
    const artist = components?.artist || "";
    const description = components?.description || "";

    return {
      musicID: components?.musicID || musicID,
      genre: sound.genre?.name || components?.genre || "",
      title: sound.name,
      mp3Url: sound.fileUrl,
      imageUrl: sound.albumImageUrl || "",
      artist: artist,
      description: description,
      duration: sound.duration || 0,
    };
  } catch (error) {
    console.error(`[getMusicTrackByID] DB 조회 오류 (musicID: ${musicID}):`, error);
    return null;
  }
}

/**
 * 장르별로 그룹화된 트랙 목록 가져오기 (DB에서 조회)
 * 
 * @param genre - "Balad", "Pop" 등
 * @returns 해당 장르의 모든 트랙
 */
export async function getMusicTracksByGenre(genre: string): Promise<MusicTrack[]> {
  try {
    const genreRecord = await prisma.genre.findUnique({
      where: { name: genre },
    });

    if (!genreRecord) {
      return [];
    }

    const sounds = await prisma.sound.findMany({
      where: {
        genreId: genreRecord.id,
      },
      include: {
        genre: true,
      },
    });

    return sounds.map((sound) => {
      const components = sound.componentsJson as { musicID?: number; artist?: string; genre?: string; description?: string } | null;
      return {
        musicID: components?.musicID || 0,
        genre: sound.genre?.name || genre,
        title: sound.name,
        mp3Url: sound.fileUrl,
        imageUrl: sound.albumImageUrl || "",
        artist: components?.artist || "",
        description: components?.description || "",
        duration: sound.duration || 0,
      };
    });
  } catch (error) {
    console.error(`[getMusicTracksByGenre] DB 조회 오류 (genre: ${genre}):`, error);
    return [];
  }
}

/**
 * 모든 트랙 가져오기 (DB에서 조회)
 */
export async function getAllMusicTracks(): Promise<MusicTrack[]> {
  try {
    const sounds = await prisma.sound.findMany({
      include: {
        genre: true,
      },
    });

    return sounds.map((sound) => {
      const components = sound.componentsJson as { musicID?: number; artist?: string; genre?: string; description?: string } | null;
      return {
        musicID: components?.musicID || 0,
        genre: sound.genre?.name || "",
        title: sound.name,
        mp3Url: sound.fileUrl,
        imageUrl: sound.albumImageUrl || "",
        artist: components?.artist || "",
        description: components?.description || "",
        duration: sound.duration || 0,
      };
    });
  } catch (error) {
    console.error("[getAllMusicTracks] DB 조회 오류:", error);
    return [];
  }
}

/**
 * 제목으로 음악 트랙 찾기 (DB에서 조회)
 * 
 * @param title - 노래 제목
 * @returns MusicTrack 또는 null
 */
export async function getMusicTrackByTitle(title: string): Promise<MusicTrack | null> {
  try {
    const sound = await prisma.sound.findFirst({
      where: {
        name: title,
      },
      include: {
        genre: true,
      },
    });

    if (!sound) {
      return null;
    }

    const components = sound.componentsJson as { musicID?: number; artist?: string; genre?: string; description?: string } | null;
    return {
      musicID: components?.musicID || 0,
      genre: sound.genre?.name || "",
      title: sound.name,
      mp3Url: sound.fileUrl,
      imageUrl: sound.albumImageUrl || "",
      artist: components?.artist || "",
      description: components?.description || "",
      duration: sound.duration || 0,
    };
  } catch (error) {
    console.error(`[getMusicTrackByTitle] DB 조회 오류 (title: ${title}):`, error);
    return null;
  }
}

/**
 * LLM용 트랙 목록 가져오기 (musicID + description만)
 * 
 * 주의: description은 현재 DB에 저장되지 않았으므로 빈 문자열 반환
 */
export async function getTracksForLLM(): Promise<Array<{ musicID: number; description: string }>> {
  try {
    const sounds = await prisma.sound.findMany();

    return sounds.map((sound) => {
      const components = sound.componentsJson as { musicID?: number; description?: string } | null;
      return {
        musicID: components?.musicID || 0,
        description: components?.description || "",
      };
    });
  } catch (error) {
    console.error("[getTracksForLLM] DB 조회 오류:", error);
    return [];
  }
}
