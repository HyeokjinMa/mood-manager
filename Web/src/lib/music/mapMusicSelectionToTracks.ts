/**
 * LLM의 musicSelection을 실제 MusicTrack으로 매핑
 * 
 * 번호 기반 매핑 시스템 (1-60)
 * LLM이 번호를 반환하면 JSON 메타데이터에서 직접 매핑
 */

import { prisma } from "@/lib/prisma";
import type { MusicTrack } from "@/hooks/useMoodStream/types";
import { getAllTracks } from "./getMusicMetadata";
import { findImageFileByTitle } from "./findImageFile";

interface MapMusicSelectionOptions {
  musicSelection: string; // LLM이 반환한 음악 선택 (번호 또는 문자열)
  genre?: string; // 현재 세그먼트의 장르 (선택적, fallback용)
  userId?: string; // 사용자 ID (선택적, 미사용)
}

/**
 * LLM의 musicSelection을 MusicTrack 1개로 변환
 * 
 * 번호 기반 매핑: LLM이 번호(1-60)를 반환하면 JSON 메타데이터에서 직접 매핑
 * 
 * @param options - 매핑 옵션
 * @returns MusicTrack 1개 (단일 노래)
 */
export async function mapMusicSelectionToTracks(
  options: MapMusicSelectionOptions
): Promise<MusicTrack[]> {
  const { musicSelection } = options;
  
  // 번호 기반 매핑 (LLM이 번호를 반환한 경우)
  const numberMatch = musicSelection.match(/^(\d+)$/);
  if (numberMatch) {
    const selectedNumber = parseInt(numberMatch[1], 10);
    if (selectedNumber >= 1 && selectedNumber <= 60) {
      // JSON 메타데이터에서 번호로 찾기
      const allTracks = getAllTracks();
      const trackByNumber = allTracks[selectedNumber - 1]; // 0-based index
      
      if (trackByNumber) {
        // duration을 DB에서 가져오기 (fileUrl로 매칭)
        let duration = 180 * 1000; // 기본값
        try {
          const sound = await prisma.sound.findFirst({
            where: {
              fileUrl: trackByNumber.fileUrl,
            },
            select: {
              duration: true,
            },
          });
          
          if (sound?.duration && sound.duration > 0) {
            duration = sound.duration * 1000; // 초 → 밀리초
          }
        } catch (error) {
          // DB 조회 실패 시 기본값 사용
          console.warn(`[mapMusicSelectionToTracks] Duration 조회 실패 (number: ${selectedNumber}):`, error);
        }
        
        // 실제 파일명 사용 (originalFileName이 있으면 사용, 없으면 fileUrl 사용)
        const actualFileName = trackByNumber.originalFileName || trackByNumber.fileName;
        
        // fileUrl을 실제 파일명으로 구성
        const actualFileUrl = `/musics/${trackByNumber.genre}/${actualFileName}`;
        
        // 이미지 파일명 찾기 (공백 차이 등을 고려하여 실제 파일 시스템에서 찾기)
        let actualImageUrl = `/musics_img/${trackByNumber.genre}/${trackByNumber.imageFileName}`;
        if (trackByNumber.originalFileName) {
          // originalFileName에서 제목 추출 (예: "Santa Claus Is Comin' to Town(Mariah Carey).mp3" → "Santa Claus Is Comin' to Town")
          const titleFromFileName = trackByNumber.originalFileName
            .replace(/\([^)]+\)\.mp3$/, '') // "(Artist).mp3" 제거
            .replace(/\.mp3$/, ''); // ".mp3" 제거
          
          // 실제 파일 시스템에서 이미지 파일 찾기
          const foundImageFile = findImageFileByTitle(titleFromFileName, trackByNumber.genre);
          if (foundImageFile) {
            actualImageUrl = foundImageFile;
          } else {
            // 찾지 못하면 originalFileName 기반으로 생성
            actualImageUrl = `/musics_img/${trackByNumber.genre}/${titleFromFileName}.png`;
          }
        }
        
        // JSON 메타데이터에서 직접 MusicTrack 생성
        const musicTrack: MusicTrack = {
          title: trackByNumber.title,
          artist: trackByNumber.artist,
          duration, // DB에서 가져온 실제 MP3 길이
          startOffset: 0,
          fadeIn: 750,
          fadeOut: 750,
          fileUrl: actualFileUrl, // 실제 파일명 사용
          albumImageUrl: actualImageUrl, // 실제 이미지 파일명 사용
        };
        
        return [musicTrack];
      }
    }
  }
  
  // 번호가 아니면 빈 배열 반환 (LLM이 번호를 반환해야 함)
  console.warn(`[mapMusicSelectionToTracks] 번호가 아닌 musicSelection: "${musicSelection}"`);
  return [];
}

/**
 * Fallback: 기본 Sound 레코드 조회 (매핑 실패 시)
 * JSON 메타데이터에서 해당 장르의 첫 번째 트랙 선택
 */
export async function getFallbackMusicTracks(genre: string = "Pop"): Promise<MusicTrack[]> {
  try {
    // JSON 메타데이터에서 해당 장르의 첫 번째 트랙 선택
    const allTracks = getAllTracks();
    const genreTracks = allTracks.filter(track => track.genre === genre);
    
    if (genreTracks.length > 0) {
      const fallbackTrack = genreTracks[0];
      
      // duration을 DB에서 가져오기
      let duration = 180 * 1000;
      try {
        const sound = await prisma.sound.findFirst({
          where: {
            fileUrl: fallbackTrack.fileUrl,
          },
          select: {
            duration: true,
          },
        });
        
        if (sound?.duration && sound.duration > 0) {
          duration = sound.duration * 1000;
        }
      } catch (error) {
        console.warn(`[getFallbackMusicTracks] Duration 조회 실패:`, error);
      }
      
      // 실제 파일명 사용
      const actualFileName = fallbackTrack.originalFileName || fallbackTrack.fileName;
      const actualFileUrl = `/musics/${fallbackTrack.genre}/${actualFileName}`;
      
      // 이미지 파일명 찾기
      let actualImageUrl = `/musics_img/${fallbackTrack.genre}/${fallbackTrack.imageFileName}`;
      if (fallbackTrack.originalFileName) {
        const titleFromFileName = fallbackTrack.originalFileName
          .replace(/\([^)]+\)\.mp3$/, '')
          .replace(/\.mp3$/, '');
        
        const foundImageFile = findImageFileByTitle(titleFromFileName, fallbackTrack.genre);
        if (foundImageFile) {
          actualImageUrl = foundImageFile;
        } else {
          actualImageUrl = `/musics_img/${fallbackTrack.genre}/${titleFromFileName}.png`;
        }
      }
      
      return [{
        title: fallbackTrack.title,
        artist: fallbackTrack.artist,
        duration,
        startOffset: 0,
        fadeIn: 750,
        fadeOut: 750,
        fileUrl: actualFileUrl,
        albumImageUrl: actualImageUrl,
      }];
    }
    
    // 장르가 없으면 전체에서 첫 번째 선택
    if (allTracks.length > 0) {
      const fallbackTrack = allTracks[0];
      let duration = 180 * 1000;
      
      try {
        const sound = await prisma.sound.findFirst({
          where: {
            fileUrl: fallbackTrack.fileUrl,
          },
          select: {
            duration: true,
          },
        });
        
        if (sound?.duration && sound.duration > 0) {
          duration = sound.duration * 1000;
        }
      } catch (error) {
        console.warn(`[getFallbackMusicTracks] Duration 조회 실패:`, error);
      }
      
      // 실제 파일명 사용
      const actualFileName = fallbackTrack.originalFileName || fallbackTrack.fileName;
      const actualFileUrl = `/musics/${fallbackTrack.genre}/${actualFileName}`;
      
      // 이미지 파일명 찾기
      let actualImageUrl = `/musics_img/${fallbackTrack.genre}/${fallbackTrack.imageFileName}`;
      if (fallbackTrack.originalFileName) {
        const titleFromFileName = fallbackTrack.originalFileName
          .replace(/\([^)]+\)\.mp3$/, '')
          .replace(/\.mp3$/, '');
        
        const foundImageFile = findImageFileByTitle(titleFromFileName, fallbackTrack.genre);
        if (foundImageFile) {
          actualImageUrl = foundImageFile;
        } else {
          actualImageUrl = `/musics_img/${fallbackTrack.genre}/${titleFromFileName}.png`;
        }
      }
      
      return [{
        title: fallbackTrack.title,
        artist: fallbackTrack.artist,
        duration,
        startOffset: 0,
        fadeIn: 750,
        fadeOut: 750,
        fileUrl: actualFileUrl,
        albumImageUrl: actualImageUrl,
      }];
    }
    
    return [];
  } catch (error) {
    console.error("[getFallbackMusicTracks] 에러:", error);
    return [];
  }
}
