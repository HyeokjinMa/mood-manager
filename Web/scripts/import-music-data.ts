/**
 * 음악 데이터 임포트 스크립트
 * 
 * 사용법:
 * 1. MP3 파일을 Web/public/music/{genre}/ 폴더에 넣기
 * 2. 이 스크립트 실행: npx tsx scripts/import-music-data.ts
 * 
 * 파일명 규칙:
 * - title(singer)_genre.mp3
 * - 예: River flows in you(Yiruma)_Classic.mp3
 */

import { prisma } from "../src/lib/prisma";

export interface MusicData {
  title: string;
  artist: string;
  genre: string;
  description: string;
  fileName: string; // MP3 파일명 (확장자 포함)
}

// 실제 파일명 기준으로 자동 생성된 musicData
// 스크립트: update-music-data-from-files.ts
export const musicData: MusicData[] = [
  // Classic
  {
    title: "All of me",
    artist: "Jon Schmidt",
    genre: "Classic",
    description: "All of me by Jon Schmidt - classic music",
    fileName: "All of me(Jon Schmidt).mp3",
  },
  {
    title: "Flower Dance",
    artist: "DJ Okawari",
    genre: "Classic",
    description: "Flower Dance by DJ Okawari - classic music",
    fileName: "Flower Dance(DJ Okawari).mp3",
  },
  {
    title: "Kiss the rain",
    artist: "Yiruma",
    genre: "Classic",
    description: "Kiss the rain by Yiruma - classic music",
    fileName: "Kiss the rain(Yiruma).mp3",
  },
  {
    title: "La Campanella",
    artist: "Liszts",
    genre: "Classic",
    description: "La Campanella by Liszts - classic music",
    fileName: "La Campanella(Liszts).mp3",
  },
  {
    title: "May Be",
    artist: "Yiruma",
    genre: "Classic",
    description: "May Be by Yiruma - classic music",
    fileName: "May Be(Yiruma).mp3",
  },
  {
    title: "Moonlight Sonata 3rdmovement",
    artist: "Beethoven",
    genre: "Classic",
    description: "Moonlight Sonata 3rdmovement by Beethoven - classic music",
    fileName: "Moonlight Sonata 3rdmovement(Beethoven).mp3",
  },
  {
    title: "Revolutionary",
    artist: "Chopin",
    genre: "Classic",
    description: "Revolutionary by Chopin - classic music",
    fileName: "Revolutionary(Chopin).mp3",
  },
  {
    title: "River flows in you",
    artist: "Yiruma",
    genre: "Classic",
    description: "River flows in you by Yiruma - classic music",
    fileName: "River flows in you(Yiruma).mp3",
  },
  {
    title: "Torrent",
    artist: "Chopin",
    genre: "Classic",
    description: "Torrent by Chopin - classic music",
    fileName: "Torrent (Chopin).mp3",
  },
  {
    title: "Waterfall",
    artist: "Jon Schmidt",
    genre: "Classic",
    description: "Waterfall by Jon Schmidt - classic music",
    fileName: "Waterfall(Jon Schmidt).mp3",
  },

  // Pop
  {
    title: "A sky full of star",
    artist: "Coldplay",
    genre: "Pop",
    description: "A sky full of star by Coldplay - pop music",
    fileName: "A sky full of star(Coldplay).mp3",
  },
  {
    title: "Believer",
    artist: "Imagine Dragons",
    genre: "Pop",
    description: "Believer by Imagine Dragons - pop music",
    fileName: "Believer(Imagine Dragons).mp3",
  },
  {
    title: "Chandelier",
    artist: "Sia",
    genre: "Pop",
    description: "Chandelier by Sia - pop music",
    fileName: "Chandelier(Sia).mp3",
  },
  {
    title: "Cruel Summer",
    artist: "Taylor Swift",
    genre: "Pop",
    description: "Cruel Summer by Taylor Swift - pop music",
    fileName: "Cruel Summer(Taylor Swift).mp3",
  },
  {
    title: "Die with a Smile",
    artist: "Lady Gaga, Bruno Mars",
    genre: "Pop",
    description: "Die with a Smile by Lady Gaga, Bruno Mars - pop music",
    fileName: "Die with a Smile(Lady Gaga, Bruno Mars).mp3",
  },
  {
    title: "Golden",
    artist: "HunterX",
    genre: "Pop",
    description: "Golden by HunterX - pop music",
    fileName: "Golden(HunterX).mp3",
  },
  {
    title: "Peaches",
    artist: "Justin Bieber",
    genre: "Pop",
    description: "Peaches by Justin Bieber - pop music",
    fileName: "Peaches(Justin Bieber).mp3",
  },
  {
    title: "Stay",
    artist: "The Kid LAROI, Justin Bieber",
    genre: "Pop",
    description: "Stay by The Kid LAROI, Justin Bieber - pop music",
    fileName: "Stay(The Kid LAROI, Justin Bieber).mp3",
  },
  {
    title: "Sugar",
    artist: "Maroon5",
    genre: "Pop",
    description: "Sugar by Maroon5 - pop music",
    fileName: "Sugar(Maroon5).mp3",
  },
  {
    title: "Uptown Funk",
    artist: "Mark Ronson",
    genre: "Pop",
    description: "Uptown Funk by Mark Ronson - pop music",
    fileName: "Uptown Funk(Mark Ronson).mp3",
  },

  // Balad
  {
    title: "A glass of soju",
    artist: "Lim Changjung",
    genre: "Balad",
    description: "A glass of soju by Lim Changjung - balad music",
    fileName: "A glass of soju(Lim Changjung).mp3",
  },
  {
    title: "Because I Don't Love You",
    artist: "Onestar",
    genre: "Balad",
    description: "Because I Don't Love You by Onestar - balad music",
    fileName: "Because I Don't Love You(Onestar).mp3",
  },
  {
    title: "How can I love the heartbreak, you're the one I love",
    artist: "AKMU",
    genre: "Balad",
    description: "How can I love the heartbreak, you're the one I love by AKMU - balad music",
    fileName: "How can I love the heartbreak, you're the one I love(AKMU).mp3",
  },
  {
    title: "If I Love You Again",
    artist: "Kim Pil",
    genre: "Balad",
    description: "If I Love You Again by Kim Pil - balad music",
    fileName: "If I Love You Again(Kim Pil).mp3",
  },
  {
    title: "If",
    artist: "Taeyeon",
    genre: "Balad",
    description: "If by Taeyeon - balad music",
    fileName: "If(Taeyeon).mp3",
  },
  {
    title: "In my dream",
    artist: "Park Jeonghyun",
    genre: "Balad",
    description: "In my dream by Park Jeonghyun - balad music",
    fileName: "In my dream(Park Jeonghyun).mp3",
  },
  {
    title: "Memories of the Wind",
    artist: "Naul",
    genre: "Balad",
    description: "Memories of the Wind by Naul - balad music",
    fileName: "Memories of the Wind(Naul).mp3",
  },
  {
    title: "The Way to Me",
    artist: "Seong Sikyung",
    genre: "Balad",
    description: "The Way to Me by Seong Sikyung - balad music",
    fileName: "The Way to Me(Seong Sikyung).mp3",
  },
  {
    title: "White",
    artist: "Paul Kim",
    genre: "Balad",
    description: "White by Paul Kim - balad music",
    fileName: "White(Paul Kim).mp3",
  },
  {
    title: "Wildflower",
    artist: "Park Hyoshin",
    genre: "Balad",
    description: "Wildflower by Park Hyoshin - balad music",
    fileName: "Wildflower(Park Hyoshin).mp3",
  },

  // Hiphop
  {
    title: "FE!N",
    artist: "Travis Scott",
    genre: "Hiphop",
    description: "FE!N by Travis Scott - hiphop music",
    fileName: "FE!N(Travis Scott).mp3",
  },
  {
    title: "God's Plan",
    artist: "Drake",
    genre: "Hiphop",
    description: "God's Plan by Drake - hiphop music",
    fileName: "God's Plan(Drake).mp3",
  },
  {
    title: "Lose Yourself",
    artist: "Eminem",
    genre: "Hiphop",
    description: "Lose Yourself by Eminem - hiphop music",
    fileName: "Lose Yourself(Eminem).mp3",
  },
  {
    title: "Not like us",
    artist: "Kendrick Lamar",
    genre: "Hiphop",
    description: "Not like us by Kendrick Lamar - hiphop music",
    fileName: "Not like us(Kendrick Lamar).mp3",
  },
  {
    title: "Runaway",
    artist: "Kanye West",
    genre: "Hiphop",
    description: "Runaway by Kanye West - hiphop music",
    fileName: "Runaway(Kanye West).mp3",
  },
  {
    title: "SICKO MODE",
    artist: "Travis Scott",
    genre: "Hiphop",
    description: "SICKO MODE by Travis Scott - hiphop music",
    fileName: "SICKO MODE(Travis Scott).mp3",
  },
  {
    title: "Still D.R.E.",
    artist: "Dr.dre",
    genre: "Hiphop",
    description: "Still D.R.E. by Dr.dre - hiphop music",
    fileName: "Still D.R.E.(Dr.dre).mp3",
  },
  {
    title: "Stronger",
    artist: "Kanye West",
    genre: "Hiphop",
    description: "Stronger by Kanye West - hiphop music",
    fileName: "Stronger(Kanye West).mp3",
  },
  {
    title: "The next episode",
    artist: "Dr.dre, Snoop Dogg",
    genre: "Hiphop",
    description: "The next episode by Dr.dre, Snoop Dogg - hiphop music",
    fileName: "The next episode(Dr.dre, Snoop Dogg).mp3",
  },
  {
    title: "Touch the sky",
    artist: "Kanye West",
    genre: "Hiphop",
    description: "Touch the sky by Kanye West - hiphop music",
    fileName: "Touch the sky(Kanye West).mp3",
  },

  // Jazz
  {
    title: "Autumn Leaves",
    artist: "Chet Baker",
    genre: "Jazz",
    description: "Autumn Leaves by Chet Baker - jazz music",
    fileName: "Autumn Leaves(Chet Baker).mp3",
  },
  {
    title: "Blue in green",
    artist: "Miles Davis",
    genre: "Jazz",
    description: "Blue in green by Miles Davis - jazz music",
    fileName: "Blue in green(Miles Davis).mp3",
  },
  {
    title: "Don't worry be happy",
    artist: "Bobby McFerrin",
    genre: "Jazz",
    description: "Don't worry be happy by Bobby McFerrin - jazz music",
    fileName: "Don't worry be happy(Bobby McFerrin).mp3",
  },
  {
    title: "Fly me to the moon",
    artist: "Frank Sinatra",
    genre: "Jazz",
    description: "Fly me to the moon by Frank Sinatra - jazz music",
    fileName: "Fly me to the moon(Frank Sinatra).mp3",
  },
  {
    title: "Goodbye Pork Pie Hat",
    artist: "Charles Mingus",
    genre: "Jazz",
    description: "Goodbye Pork Pie Hat by Charles Mingus - jazz music",
    fileName: "Goodbye Pork Pie Hat(Charles Mingus).mp3",
  },
  {
    title: "I Fall in Love Too Easily",
    artist: "Chet Baker",
    genre: "Jazz",
    description: "I Fall in Love Too Easily by Chet Baker - jazz music",
    fileName: "I Fall in Love Too Easily(Chet Baker).mp3",
  },
  {
    title: "My baby just cares for me",
    artist: "Nina Simone",
    genre: "Jazz",
    description: "My baby just cares for me by Nina Simone - jazz music",
    fileName: "My baby just cares for me(Nina Simone).mp3",
  },
  {
    title: "Round Midnight",
    artist: "Thelonious Monk",
    genre: "Jazz",
    description: "Round Midnight by Thelonious Monk - jazz music",
    fileName: "Round Midnight(Thelonious Monk).mp3",
  },
  {
    title: "Sing Sing Sing",
    artist: "Benny Goodman",
    genre: "Jazz",
    description: "Sing Sing Sing by Benny Goodman - jazz music",
    fileName: "Sing Sing Sing(Benny Goodman).mp3",
  },
  {
    title: "What a wonderful world",
    artist: "Louis Amstrong",
    genre: "Jazz",
    description: "What a wonderful world by Louis Amstrong - jazz music",
    fileName: "What a wonderful world(Louis Amstrong).mp3",
  },

  // Carol
  {
    title: "All I want for christmas",
    artist: "Mariah Carey",
    genre: "Carol",
    description: "All I want for christmas by Mariah Carey - carol music",
    fileName: "All I want for christmas(Mariah Carey).mp3",
  },
  {
    title: "Because it's Christmas",
    artist: "Sung Sikyung and others",
    genre: "Carol",
    description: "Because it's Christmas by Sung Sikyung and others - carol music",
    fileName: "Because it's Christmas(Sung Sikyung and others).mp3",
  },
  {
    title: "Jingle bell rock",
    artist: "Bobby Helms",
    genre: "Carol",
    description: "Jingle bell rock by Bobby Helms - carol music",
    fileName: "Jingle bell rock(Bobby Helms).mp3",
  },
  {
    title: "Last Christmas",
    artist: "Wham!",
    genre: "Carol",
    description: "Last Christmas by Wham! - carol music",
    fileName: "Last Christmas(Wham!).mp3",
  },
  {
    title: "Merry Christmas in advance",
    artist: "IU",
    genre: "Carol",
    description: "Merry Christmas in advance by IU - carol music",
    fileName: "Merry Christmas in advance(IU).mp3",
  },
  {
    title: "Must have love",
    artist: "SG Wanna Be, Brown Eyed Girls",
    genre: "Carol",
    description: "Must have love by SG Wanna Be, Brown Eyed Girls - carol music",
    fileName: "Must have love(SG Wanna Be, Brown Eyed Girls).mp3",
  },
  {
    title: "Santa Claus Is Comin' to Town",
    artist: "Mariah Carey",
    genre: "Carol",
    description: "Santa Claus Is Comin' to Town by Mariah Carey - carol music",
    fileName: "Santa Claus Is Comin' to Town(Mariah Carey).mp3",
  },
  {
    title: "Santa tell me",
    artist: "Ariana Grande",
    genre: "Carol",
    description: "Santa tell me by Ariana Grande - carol music",
    fileName: "Santa tell me(Ariana Grande).mp3",
  },
  {
    title: "Text Me Merry Christmas",
    artist: "Straight No Chaser",
    genre: "Carol",
    description: "Text Me Merry Christmas by Straight No Chaser - carol music",
    fileName: "Text Me Merry Christmas(Straight No Chaser).mp3",
  },
  {
    title: "Underneath the Tree",
    artist: "Kelly Clarkson",
    genre: "Carol",
    description: "Underneath the Tree by Kelly Clarkson - carol music",
    fileName: "Underneath the Tree(Kelly Clarkson).mp3",
  },
];

async function main() {
  console.log("🎵 음악 데이터 임포트 시작...\n");

  // 1. Genre 생성/확인
  const genreMap = new Map<string, number>();
  const genres = ["Classic", "Pop", "Balad", "Hiphop", "Jazz", "Carol"];

  for (const genreName of genres) {
    // 기존 장르 확인
    let genre = await prisma.genre.findUnique({
      where: { name: genreName },
    });
    
    if (!genre) {
      // 없으면 생성
      genre = await prisma.genre.create({
        data: {
          name: genreName,
          description: `${genreName} genre music`,
        },
      });
    }
    
    genreMap.set(genreName, genre.id);
    console.log(`✅ Genre: ${genreName} (ID: ${genre.id})`);
  }

  console.log("\n📀 Sound 데이터 생성 중...\n");

  // 2. Sound 생성
  for (const music of musicData) {
    const genreId = genreMap.get(music.genre);
    if (!genreId) {
      console.error(`❌ Genre not found: ${music.genre}`);
      continue;
    }

    // 파일명 형식: title(artist).mp3 (실제 파일명 그대로 사용)
    const fileName = music.fileName; // musicData의 fileName 그대로 사용
    const fileUrl = `/musics/${music.genre}/${fileName}`;
    
    // 앨범 이미지 URL (파일명 형식: title.png - 제목만)
    // 대소문자/공백 차이를 고려하여 유연하게 처리 (프론트엔드에서 정규화)
    const albumImageFileName = `${music.title}.png`;
    const albumImageUrl = `/musics_img/${music.genre}/${albumImageFileName}`;

    // componentsJson 생성 (장르, 무드 등 메타데이터)
    const componentsJson = {
      genre: music.genre.toLowerCase(),
      artist: music.artist,
      mood: extractMoodFromDescription(music.description),
    };

    // 기존에 같은 이름의 Sound가 있는지 확인
    const existingSound = await prisma.sound.findFirst({
      where: {
        name: `${music.title} - ${music.artist}`,
      },
    });

    let sound;
    if (existingSound) {
      // 업데이트 (같은 이름이면 업데이트)
      sound = await prisma.sound.update({
        where: { id: existingSound.id },
        data: {
          fileUrl,
          albumImageUrl,
          componentsJson: componentsJson,
        },
      });
    } else {
      // 생성
      sound = await prisma.sound.create({
        data: {
          name: `${music.title} - ${music.artist}`,
          fileUrl,
          albumImageUrl,
          ...(genreId && { genreId }),
          componentsJson: componentsJson as object,
        },
      });
    }

    console.log(`✅ ${sound.name} (ID: ${sound.id})`);
  }

  console.log("\n✨ 음악 데이터 임포트 완료!");
  console.log("\n📁 MP3 파일 배치 위치:");
  console.log("   Web/public/music/classic/");
  console.log("   Web/public/music/pop/");
  console.log("   Web/public/music/balad/");
  console.log("   Web/public/music/hiphop/");
  console.log("   Web/public/music/jazz/");
  console.log("   Web/public/music/carol/");
  console.log("\n🖼️  앨범 이미지 배치 위치:");
  console.log("   Web/public/albums/");
  console.log("   파일명 형식: Title(Artist)_Genre.jpg 또는 .png");
  console.log("   예: River flows in you(Yiruma)_Classic.jpg");
}

function extractMoodFromDescription(description: string): string {
  const lowerDesc = description.toLowerCase();
  
  if (lowerDesc.includes("calm") || lowerDesc.includes("peaceful") || lowerDesc.includes("gentle")) {
    return "calm";
  }
  if (lowerDesc.includes("energetic") || lowerDesc.includes("high-energy") || lowerDesc.includes("celebration")) {
    return "energetic";
  }
  if (lowerDesc.includes("sad") || lowerDesc.includes("pain") || lowerDesc.includes("heartbreak") || lowerDesc.includes("regret")) {
    return "sad";
  }
  if (lowerDesc.includes("love") || lowerDesc.includes("romantic") || lowerDesc.includes("affection")) {
    return "romantic";
  }
  if (lowerDesc.includes("confident") || lowerDesc.includes("triumphant") || lowerDesc.includes("strong")) {
    return "confident";
  }
  
  return "neutral";
}

main()
  .catch((e) => {
    console.error("❌ 에러:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

