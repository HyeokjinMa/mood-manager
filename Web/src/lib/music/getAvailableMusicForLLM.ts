/**
 * LLM 프롬프트에 포함할 사용 가능한 음악 목록 조회
 * 
 * 새로운 간단한 구조: musicID + description만 제공
 * LLM이 musicID를 선택하도록 함
 */

import { getTracksForLLM } from "./getMusicTrackByID";

/**
 * LLM용 트랙 목록 가져오기 (musicID + description만)
 */
export async function getAvailableMusicForLLM(): Promise<Array<{ musicID: number; description: string }>> {
  try {
    return getTracksForLLM();
  } catch (error) {
    console.error("[getAvailableMusicForLLM] 에러:", error);
    return [];
  }
}

/**
 * LLM 프롬프트용 음악 목록 포맷팅 (musicID 기반)
 * 
 * musicID와 description만 제공하여 LLM이 musicID를 선택하도록 함
 * 비용 상관없이 모든 정보를 전달
 */
export function formatMusicListForLLM(tracks: Array<{ musicID: number; description: string }>): string {
  if (tracks.length === 0) {
    return "[AVAILABLE MUSIC] No tracks available.";
  }
  
  // 장르별로 그룹화 (musicID 범위로)
  const byGenre: Record<string, Array<{ musicID: number; description: string }>> = {};
  for (const track of tracks) {
    let genre = "Other";
    if (track.musicID >= 10 && track.musicID < 20) genre = "Balad";
    else if (track.musicID >= 20 && track.musicID < 30) genre = "Pop";
    else if (track.musicID >= 30 && track.musicID < 40) genre = "Classic";
    else if (track.musicID >= 40 && track.musicID < 50) genre = "Jazz";
    else if (track.musicID >= 50 && track.musicID < 60) genre = "Hiphop";
    else if (track.musicID >= 60 && track.musicID < 70) genre = "Carol";
    
    if (!byGenre[genre]) {
      byGenre[genre] = [];
    }
    byGenre[genre].push(track);
  }
  
  const lines: string[] = [];
  lines.push("=".repeat(100));
  lines.push("🎵 AVAILABLE MUSIC TRACKS - SELECT BY MUSIC ID (10-69)");
  lines.push("=".repeat(100));
  lines.push("");
  lines.push("⚠️ CRITICAL: You MUST select music IDs ONLY from 10 to 69.");
  lines.push("⚠️ This is the ONLY valid range. Music IDs 1-9 and 70+ are NOT available.");
  lines.push(`📊 Total available tracks: ${tracks.length} (Music IDs: ${tracks[0]?.musicID || 10} to ${tracks[tracks.length - 1]?.musicID || 69})`);
  lines.push("");
  lines.push("📋 IMPORTANT: You must select music by MUSIC ID (10-69) from the list below.");
  lines.push("📋 Your response should be the MUSIC ID number only (e.g., 10, 15, 23, 45, 67).");
  lines.push("📋 Each segment must have a DIFFERENT music ID (10 unique tracks for 10 segments).");
  lines.push("");
  lines.push("=".repeat(100));
  lines.push("MUSIC TRACKS LIST (SELECT BY MUSIC ID):");
  lines.push("=".repeat(100));
  lines.push("");
  
  // 장르별로 그룹화하여 표시 (모든 정보 포함)
  for (const [genre, genreTracks] of Object.entries(byGenre)) {
    const minID = genreTracks[0]?.musicID || 0;
    const maxID = genreTracks[genreTracks.length - 1]?.musicID || 0;
    lines.push(`━━━ ${genre.toUpperCase()} GENRE (${genreTracks.length} tracks, Music ID: ${minID}-${maxID}) ━━━`);
    genreTracks.forEach((track) => {
      lines.push(`  [Music ID: ${track.musicID}] ${track.description || "No description"}`);
    });
    lines.push("");
  }
  
  lines.push("=".repeat(100));
  lines.push("SELECTION RULES:");
  lines.push("=".repeat(100));
  lines.push("");
  lines.push("RULE 1: Select music by MUSIC ID (10-69) from the list above.");
  lines.push("  ⚠️ CRITICAL: Music IDs MUST be between 10 and 69 (inclusive)");
  lines.push("  ⚠️ Music IDs 1-9 and 70+ are INVALID and will cause errors");
  lines.push("  ✅ CORRECT format: Return the music ID number only (e.g., 10, 15, 23, 45, 67)");
  lines.push("  ❌ WRONG format: Do NOT return track titles, descriptions, or numbers outside 10-69");
  lines.push("");
  lines.push("RULE 2: For EACH of the 10 segments, select a DIFFERENT music ID from the 60 available tracks.");
  lines.push("  - Segment 0: Choose one music ID (e.g., 10)");
  lines.push("  - Segment 1: Choose a DIFFERENT music ID (e.g., 15)");
  lines.push("  - Segment 2: Choose a DIFFERENT music ID (e.g., 23)");
  lines.push("  - Continue for all 10 segments, each with a UNIQUE music ID (10 different tracks)");
  lines.push("  - You have 60 tracks available, so you have plenty of options");
  lines.push("");
  lines.push("RULE 3: Your response format: Return only the music ID number (integer 10-69)");
  lines.push("  Example: If you want to select music ID 15, return: 15");
  lines.push("  Example: If you want to select music ID 45, return: 45");
  lines.push("  Invalid examples: 5 (too low), 75 (too high), \"Song Title\" (not a number)");
  lines.push("");
  lines.push("RULE 4: Match the mood/emotion of each segment to the track description.");
  lines.push("  Read the description carefully and choose the music ID that best fits.");
  lines.push("  Consider the genre, mood, and emotional tone when selecting.");
  lines.push("");
  lines.push("=".repeat(100));
  lines.push("⚠️ REMEMBER: RETURN THE MUSIC ID NUMBER (10-69) ONLY, NOT THE DESCRIPTION.");
  lines.push("⚠️ ONLY 60 TRACKS ARE AVAILABLE (Music IDs 10-69). USE ONLY THESE.");
  lines.push("=".repeat(100));
  
  return lines.join("\n");
}
