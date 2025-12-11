/**
 * 실제 파일 시스템에서 이미지 파일 찾기 (공백 무시 매칭)
 * 
 * 모든 공백, 대소문자, 따옴표 차이를 무시하고 실제 파일 시스템에서 매칭하는 이미지 파일 찾기
 */

import fs from "fs";
import path from "path";

/**
 * 공백을 모두 제거한 버전으로 비교 (매칭용)
 * 모든 공백, 탭, 줄바꿈 등을 제거하여 비교
 */
function removeAllSpaces(str: string): string {
  return str
    .replace(/\s+/g, "") // 모든 공백 제거 (스페이스, 탭, 줄바꿈 등)
    .toLowerCase();
}

/**
 * 파일명에서 제목 부분 추출 (확장자, 괄호 제거)
 */
function extractTitleFromFileName(fileName: string): string {
  // 확장자 제거
  let title = fileName.replace(/\.(png|jpg|jpeg)$/i, "");
  // 괄호와 내용 제거 (예: "Song(Artist).png" → "Song")
  title = title.replace(/\([^)]*\)$/, "");
  return title.trim();
}

/**
 * 실제 파일 시스템에서 이미지 파일 찾기 (공백 무시)
 * 
 * @param title - 찾을 제목 (예: "Santa Claus Is Comin' to Town")
 * @param genre - 장르 (예: "Carol")
 * @returns 실제 파일명 (예: "Santa Claus Is  Comin' to Town.png") 또는 null
 */
export function findImageFileByTitle(title: string, genre: string): string | null {
  try {
    const imageDir = path.join(process.cwd(), "public", "album", genre);
    
    // 디렉토리가 없으면 null 반환
    if (!fs.existsSync(imageDir)) {
      return null;
    }
    
    // 모든 이미지 파일 목록 가져오기
    const files = fs.readdirSync(imageDir).filter((file) => 
      /\.(png|jpg|jpeg)$/i.test(file)
    );
    
    // 공백 제거한 제목으로 비교
    const normalizedTitle = removeAllSpaces(title);
    
    // 파일명에서 매칭되는 파일 찾기
    for (const file of files) {
      const fileTitle = extractTitleFromFileName(file);
      const normalizedFileTitle = removeAllSpaces(fileTitle);
      
      // 공백 제거한 버전으로 비교
      if (normalizedTitle === normalizedFileTitle) {
        return file; // 실제 파일명 그대로 반환
      }
    }
    
    return null;
  } catch (error) {
    console.error(`[findImageFileByTitle] 에러 (title: ${title}, genre: ${genre}):`, error);
    return null;
  }
}

/**
 * fileUrl에서 이미지 파일 찾기
 * 
 * @param fileUrl - MP3 파일 URL (예: "/musics/Carol/Santa Claus Is Comin' to Town(Mariah Carey).mp3")
 * @returns 이미지 파일 URL (예: "/musics_img/Carol/Santa Claus Is  Comin' to Town.png") 또는 null
 */
export function findImageUrlFromFileUrl(fileUrl: string): string | null {
  try {
    const urlParts = fileUrl.split("/");
    const fileName = urlParts[urlParts.length - 1];
    
    // "Title(Artist).mp3" 형식에서 Title 추출
    const match = fileName.match(/^(.+?)\((.+?)\)\.mp3$/);
    if (!match) {
      return null;
    }
    
    const title = match[1]; // Title 부분
    const genre = urlParts.length >= 2 ? urlParts[urlParts.length - 2] : null;
    
    if (!genre) {
      return null;
    }
    
    // 실제 파일 시스템에서 찾기
    const actualFileName = findImageFileByTitle(title, genre);
    
    if (actualFileName) {
      return `/album/${genre}/${actualFileName}`;
    }
    
    return null;
  } catch (error) {
    console.error(`[findImageUrlFromFileUrl] 에러 (fileUrl: ${fileUrl}):`, error);
    return null;
  }
}

