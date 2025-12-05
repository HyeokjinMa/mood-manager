/**
 * 마크다운 파일의 음악 메타데이터를 musicTracks.json 형식으로 변환
 * 
 * 사용법: npx tsx scripts/convert-markdown-to-music-tracks.ts
 */

const markdownData = `
# All Songs

## Balad Songs

\`\`\`json
{
  "title": "A glass of soju",
  "mp3": "Balad/A-glass-of-soju.mp3",
  "png": "Balad/A-glass-of-soju.png",
  "artist": "Lim Changjung",
  "description": "A heartfelt ballad capturing the pain of love poured out like a glass of soju.",
  "duration": 291
}
\`\`\`

\`\`\`json
{
  "title": "Because I Don't Love You",
  "mp3": "Balad/Because-I-Don't-Love-You.mp3",
  "png": "Balad/Because-I-Don't-Love-You.png",
  "artist": "Onestar",
  "description": "A sorrowful confession of drifting feelings and the heartbreak of letting go.",
  "duration": 224
}
\`\`\`

\`\`\`json
{
  "title": "How can I love the heartbreak, you're the one I love",
  "mp3": "Balad/How-can-I-love-the-heartbreak,-you're-the-one-I-love.mp3",
  "png": "Balad/How-can-I-love-the-heartbreak,-you're-the-one-I-love.png",
  "artist": "AKMU",
  "description": "A tender song about loving someone so deeply that even heartbreak feels like love.",
  "duration": 290
}
\`\`\`

\`\`\`json
{
  "title": "If",
  "mp3": "Balad/If.mp3",
  "png": "Balad/If.png",
  "artist": "Taeyeon",
  "description": "A soft and emotional reflection on unspoken feelings and fragile longing.",
  "duration": 260
}
\`\`\`

\`\`\`json
{
  "title": "If I Love You Again",
  "mp3": "Balad/If-I-Love-You-Again.mp3",
  "png": "Balad/If-I-Love-You-Again.png",
  "artist": "Kim Pil",
  "description": "A soulful plea wondering whether love could bloom again if given another chance.",
  "duration": 242
}
\`\`\`

\`\`\`json
{
  "title": "In my dream",
  "mp3": "Balad/In-my-dream.mp3",
  "png": "Balad/In-my-dream.png",
  "artist": "Park Jeonghyun",
  "description": "A dreamy, powerful ballad about holding onto love that lives only in memories.",
  "duration": 337
}
\`\`\`

\`\`\`json
{
  "title": "Memories of the Wind",
  "mp3": "Balad/Memories-of-the-Wind.mp3",
  "png": "Balad/Memories-of-the-Wind.png",
  "artist": "Naul",
  "description": "A nostalgic song that drifts through past love like wind carrying old memories.",
  "duration": 308
}
\`\`\`

\`\`\`json
{
  "title": "The Way to Me",
  "mp3": "Balad/The-Way-to-Me.mp3",
  "png": "Balad/The-Way-to-Me.png",
  "artist": "Seong Sikyung",
  "description": "A warm, comforting ballad about finding the path back to someone's heart.",
  "duration": 240
}
\`\`\`

\`\`\`json
{
  "title": "White",
  "mp3": "Balad/White.mp3",
  "png": "Balad/White.png",
  "artist": "Paul Kim",
  "description": "A gentle winter-like song that expresses pure, quiet affection.",
  "duration": 236
}
\`\`\`

\`\`\`json
{
  "title": "Wildflower",
  "mp3": "Balad/Wildflower.mp3",
  "png": "Balad/Wildflower.png",
  "artist": "Park Hyoshin",
  "description": "A soaring emotional ballad symbolizing resilience and love blooming through hardship.",
  "duration": 312
}
\`\`\`

## Carol Songs

\`\`\`json
{
  "title": "All I want for christmas",
  "mp3": "Carol/All-I-want-for-christmas.mp3",
  "png": "Carol/All-I-want-for-christmas.png",
  "artist": "Mariah Carey",
  "description": "A joyful classic celebrating the simple wish to be with the one you love for Christmas.",
  "duration": 242
}
\`\`\`

\`\`\`json
{
  "title": "Because it's Christmas",
  "mp3": "Carol/Because-it's-Christmas.mp3",
  "png": "Carol/Because-it's-Christmas.png",
  "artist": "Sung Sikyung and others",
  "description": "A warm, uplifting song that captures the gentle togetherness of the holiday season.",
  "duration": 226
}
\`\`\`

\`\`\`json
{
  "title": "Jingle bell rock",
  "mp3": "Carol/Jingle-bell-rock.mp3",
  "png": "Carol/Jingle-bell-rock.png",
  "artist": "Bobby Helms",
  "description": "A fun, upbeat Christmas tune that brings rock-and-roll cheer to the holidays.",
  "duration": 130
}
\`\`\`

\`\`\`json
{
  "title": "Last Christmas",
  "mp3": "Carol/Last-Christmas.mp3",
  "png": "Carol/Last-Christmas.png",
  "artist": "Wham!",
  "description": "A bittersweet holiday hit about heartbreak, reflection, and the hope for new love.",
  "duration": 263
}
\`\`\`

\`\`\`json
{
  "title": "Merry Christmas in advance",
  "mp3": "Carol/Merry-Christmas-in-advance.mp3",
  "png": "Carol/Merry-Christmas-in-advance.png",
  "artist": "IU",
  "description": "A sweet and heartfelt carol expressing shy affection and early holiday wishes.",
  "duration": 270
}
\`\`\`

\`\`\`json
{
  "title": "Must have love",
  "mp3": "Carol/Must-have-love.mp3",
  "png": "Carol/Must-have-love.png",
  "artist": "SG Wanna Be, Brown Eyed Girls",
  "description": "A bright winter duet filled with cheerful melodies and the excitement of seasonal romance.",
  "duration": 260
}
\`\`\`

\`\`\`json
{
  "title": "Santa Claus Is Comin' to Town",
  "mp3": "Carol/Santa-Claus-Is-Comin'-to-Town.mp3",
  "png": "Carol/Santa-Claus-Is-Comin'-to-Town.png",
  "artist": "Mariah Carey",
  "description": "A festive, energetic rendition reminding everyone that Santa is on his way.",
  "duration": 205
}
\`\`\`

\`\`\`json
{
  "title": "Santa tell me",
  "mp3": "Carol/Santa-tell-me.mp3",
  "png": "Carol/Santa-tell-me.png",
  "artist": "Ariana Grande",
  "description": "A playful pop carol asking Santa for a love that lasts beyond the holidays.",
  "duration": 204
}
\`\`\`

\`\`\`json
{
  "title": "Text Me Merry Christmas",
  "mp3": "Carol/Text-Me-Merry-Christmas.mp3",
  "png": "Carol/Text-Me-Merry-Christmas.png",
  "artist": "Straight No Chaser",
  "description": "A humorous and charming a cappella song about digital-age holiday romance.",
  "duration": 161
}
\`\`\`

\`\`\`json
{
  "title": "Underneath the Tree",
  "mp3": "Carol/Underneath-the-Tree.mp3",
  "png": "Carol/Underneath-the-Tree.png",
  "artist": "Kelly Clarkson",
  "description": "A powerful, cheerful anthem celebrating finding love at the heart of Christmas.",
  "duration": 227
}
\`\`\`

## Hiphop Songs

\`\`\`json
{
  "title": "FE!N",
  "mp3": "Hiphop/FE!N.mp3",
  "png": "Hiphop/FE!N.png",
  "artist": "Travis Scott",
  "description": "A hard-hitting, hypnotic track driven by relentless energy and attitude.",
  "duration": 194
}
\`\`\`

\`\`\`json
{
  "title": "God's Plan",
  "mp3": "Hiphop/God's-Plan.mp3",
  "png": "Hiphop/God's-Plan.png",
  "artist": "Drake",
  "description": "An uplifting rap anthem about gratitude, success, and staying true to purpose.",
  "duration": 199
}
\`\`\`

\`\`\`json
{
  "title": "Lose Yourself",
  "mp3": "Hiphop/Lose-Yourself.mp3",
  "png": "Hiphop/Lose-Yourself.png",
  "artist": "Eminem",
  "description": "A powerful motivational track urging you to seize every moment without hesitation.",
  "duration": 320
}
\`\`\`

\`\`\`json
{
  "title": "Not like us",
  "mp3": "Hiphop/Not-like-us.mp3",
  "png": "Hiphop/Not-like-us.png",
  "artist": "Kendrick Lamar",
  "description": "A sharp, confident diss anthem showcasing Kendrick's lyrical dominance.",
  "duration": 273
}
\`\`\`

\`\`\`json
{
  "title": "Runaway",
  "mp3": "Hiphop/Runaway.mp3",
  "png": "Hiphop/Runaway.png",
  "artist": "Kanye West",
  "description": "A reflective, emotional rap piece exploring regret, vulnerability, and self-awareness.",
  "duration": 338
}
\`\`\`

\`\`\`json
{
  "title": "SICKO MODE",
  "mp3": "Hiphop/SICKO-MODE.mp3",
  "png": "Hiphop/SICKO-MODE.png",
  "artist": "Travis Scott",
  "description": "A dynamic, multi-section banger packed with shifting beats and explosive energy.",
  "duration": 313
}
\`\`\`

\`\`\`json
{
  "title": "Still D.R.E.",
  "mp3": "Hiphop/Still-D.R.E..mp3",
  "png": "Hiphop/Still-D.R.E..png",
  "artist": "Dr.dre",
  "description": "A timeless West Coast classic marked by its iconic piano riff and smooth swagger.",
  "duration": 271
}
\`\`\`

\`\`\`json
{
  "title": "Stronger",
  "mp3": "Hiphop/Stronger.mp3",
  "png": "Hiphop/Stronger.png",
  "artist": "Kanye West",
  "description": "A bold fusion of hip-hop and electronic sound proclaiming resilience and growth.",
  "duration": 312
}
\`\`\`

\`\`\`json
{
  "title": "The next episode",
  "mp3": "Hiphop/The-next-episode.mp3",
  "png": "Hiphop/The-next-episode.png",
  "artist": "Dr.dre, Snoop Dogg",
  "description": "A smooth, laid-back West Coast anthem powered by unmistakable G-funk vibes.",
  "duration": 162
}
\`\`\`

\`\`\`json
{
  "title": "Touch the sky",
  "mp3": "Hiphop/Touch-the-sky.mp3",
  "png": "Hiphop/Touch-the-sky.png",
  "artist": "Kanye West",
  "description": "An inspirational track about rising above challenges and chasing greatness.",
  "duration": 237
}
\`\`\`

## Jazz Songs

\`\`\`json
{
  "title": "Autumn Leaves",
  "mp3": "Jazz/Autumn-Leaves.mp3",
  "png": "Jazz/Autumn-Leaves.png",
  "artist": "Chet Baker",
  "description": "A melancholic jazz classic drifting through memories like falling autumn leaves.",
  "duration": 422
}
\`\`\`

\`\`\`json
{
  "title": "Blue in green",
  "mp3": "Jazz/Blue-in-green.mp3",
  "png": "Jazz/Blue-in-green.png",
  "artist": "Miles Davis",
  "description": "A beautifully haunting, atmospheric ballad filled with deep introspection.",
  "duration": 339
}
\`\`\`

\`\`\`json
{
  "title": "Don't worry be happy",
  "mp3": "Jazz/Don't-worry-be-happy.mp3",
  "png": "Jazz/Don't-worry-be-happy.png",
  "artist": "Bobby McFerrin",
  "description": "A lighthearted vocal jazz tune reminding you to let go and embrace simple joy.",
  "duration": 232
}
\`\`\`

\`\`\`json
{
  "title": "Fly me to the moon",
  "mp3": "Jazz/Fly-me-to-the-moon.mp3",
  "png": "Jazz/Fly-me-to-the-moon.png",
  "artist": "Frank Sinatra",
  "description": "A timeless swing standard radiating charm, romance, and effortless smoothness.",
  "duration": 156
}
\`\`\`

\`\`\`json
{
  "title": "Goodbye Pork Pie Hat",
  "mp3": "Jazz/Goodbye-Pork-Pie-Hat.mp3",
  "png": "Jazz/Goodbye-Pork-Pie-Hat.png",
  "artist": "Charles Mingus",
  "description": "A soulful jazz elegy blending bluesy emotion with expressive improvisation.",
  "duration": 583
}
\`\`\`

\`\`\`json
{
  "title": "I Fall in Love Too Easily",
  "mp3": "Jazz/I-Fall-in-Love-Too-Easily.mp3",
  "png": "Jazz/I-Fall-in-Love-Too-Easily.png",
  "artist": "Chet Baker",
  "description": "A tender and vulnerable ballad capturing the fragility of falling in love.",
  "duration": 197
}
\`\`\`

\`\`\`json
{
  "title": "My baby just cares for me",
  "mp3": "Jazz/My-baby-just-cares-for-me.mp3",
  "png": "Jazz/My-baby-just-cares-for-me.png",
  "artist": "Nina Simone",
  "description": "A playful, groovy jazz number showcasing Nina Simone's timeless charm.",
  "duration": 220
}
\`\`\`

\`\`\`json
{
  "title": "Round Midnight",
  "mp3": "Jazz/Round-Midnight.mp3",
  "png": "Jazz/Round-Midnight.png",
  "artist": "Thelonious Monk",
  "description": "A moody, introspective piece echoing the quiet loneliness of late-night hours.",
  "duration": 229
}
\`\`\`

\`\`\`json
{
  "title": "Sing Sing Sing",
  "mp3": "Jazz/Sing-Sing-Sing.mp3",
  "png": "Jazz/Sing-Sing-Sing.png",
  "artist": "Benny Goodman",
  "description": "An explosive big band classic full of infectious rhythm and exhilarating energy.",
  "duration": 323
}
\`\`\`

\`\`\`json
{
  "title": "What a wonderful world",
  "mp3": "Jazz/What-a-wonderful-world.mp3",
  "png": "Jazz/What-a-wonderful-world.png",
  "artist": "Louis Amstrong",
  "description": "A warm, hopeful jazz ballad celebrating the simple beauty found in everyday life.",
  "duration": 149
}
\`\`\`

## Pop Songs

\`\`\`json
{
  "title": "A sky full of stars",
  "mp3": "Pop/A-sky-full-of-stars.mp3",
  "png": "Pop/A-sky-full-of-stars.png",
  "artist": "Coldplay",
  "description": "An uplifting, cosmic love anthem bursting with brightness and emotion.",
  "duration": 275
}
\`\`\`

\`\`\`json
{
  "title": "Believer",
  "mp3": "Pop/Believer.mp3",
  "png": "Pop/Believer.png",
  "artist": "Imagine Dragons",
  "description": "A powerful, explosive track about turning pain into strength and self-belief.",
  "duration": 204
}
\`\`\`

\`\`\`json
{
  "title": "Chandelier",
  "mp3": "Pop/Chandelier.mp3",
  "png": "Pop/Chandelier.png",
  "artist": "Sia",
  "description": "A dramatic pop masterpiece capturing the struggle behind wild, reckless escape.",
  "duration": 216
}
\`\`\`

\`\`\`json
{
  "title": "Cruel Summer",
  "mp3": "Pop/Cruel-Summer.mp3",
  "png": "Pop/Cruel-Summer.png",
  "artist": "Taylor Swift",
  "description": "A passionate, fast-paced pop track about forbidden love and overwhelming desire.",
  "duration": 179
}
\`\`\`

\`\`\`json
{
  "title": "Die with a smile",
  "mp3": "Pop/Die-with-a-smile.mp3",
  "png": "Pop/Die-with-a-smile.png",
  "artist": "Lady Gaga, Bruno Mars",
  "description": "A romantic duet expressing the wish to cherish love until the very last moment.",
  "duration": 252
}
\`\`\`

\`\`\`json
{
  "title": "Golden",
  "mp3": "Pop/Golden.mp3",
  "png": "Pop/Golden.png",
  "artist": "HunterX",
  "description": "A bright, energetic pop tune radiating confidence and feel-good warmth.",
  "duration": 195
}
\`\`\`

\`\`\`json
{
  "title": "Peaches",
  "mp3": "Pop/Peaches.mp3",
  "png": "Pop/Peaches.png",
  "artist": "Justin Bieber",
  "description": "A smooth, catchy groove celebrating love, good vibes, and carefree moments.",
  "duration": 198
}
\`\`\`

\`\`\`json
{
  "title": "Stay",
  "mp3": "Pop/Stay.mp3",
  "png": "Pop/Stay.png",
  "artist": "The Kid LAROI, Justin Bieber",
  "description": "An emotional, high-energy pop track pleading for a love that feels impossible to let go.",
  "duration": 140
}
\`\`\`

\`\`\`json
{
  "title": "Sugar",
  "mp3": "Pop/Sugar.mp3",
  "png": "Pop/Sugar.png",
  "artist": "Maroon5",
  "description": "A sweet, feel-good pop hit overflowing with charm and lighthearted romance.",
  "duration": 264
}
\`\`\`

\`\`\`json
{
  "title": "Uptown Funk",
  "mp3": "Pop/Uptown-Funk.mp3",
  "png": "Pop/Uptown-Funk.png",
  "artist": "Mark Ronson",
  "description": "A funky, infectious party anthem packed with swagger and irresistible groove.",
  "duration": 268
}
\`\`\`

## Classic Songs

\`\`\`json
{
  "title": "All of Me",
  "mp3": "Classic/All-of-Me.mp3",
  "png": "Classic/All-of-Me.png",
  "artist": "Jon Schmidt",
  "description": "An expressive piano piece blending passion and playfulness in a dynamic flow.",
  "duration": 179
}
\`\`\`

\`\`\`json
{
  "title": "Flower Dance",
  "mp3": "Classic/Flower-Dance.mp3",
  "png": "Classic/Flower-Dance.png",
  "artist": "DJ Okawari",
  "description": "A gentle, melodic track that moves gracefully like petals dancing in the wind.",
  "duration": 264
}
\`\`\`

\`\`\`json
{
  "title": "Kiss the rain",
  "mp3": "Classic/Kiss-the-rain.mp3",
  "png": "Classic/Kiss-the-rain.png",
  "artist": "Yiruma",
  "description": "A soft, emotional piano piece evoking quiet longing and peaceful reflection.",
  "duration": 300
}
\`\`\`

\`\`\`json
{
  "title": "La Campanella",
  "mp3": "Classic/La-Campanella.mp3",
  "png": "Classic/La-Campanella.png",
  "artist": "Liszts",
  "description": "A dazzling virtuoso showpiece known for its sparkling, bell-like brilliance.",
  "duration": 275
}
\`\`\`

\`\`\`json
{
  "title": "May Be",
  "mp3": "Classic/May-Be.mp3",
  "png": "Classic/May-Be.png",
  "artist": "Yiruma",
  "description": "A warm and delicate melody capturing innocence, hope, and simple beauty.",
  "duration": 241
}
\`\`\`

\`\`\`json
{
  "title": "Moonlight Sonata 3rdmovement",
  "mp3": "Classic/Moonlight-Sonata-3rdmovement.mp3",
  "png": "Classic/Moonlight-Sonata-3rdmovement.png",
  "artist": "Beethoven",
  "description": "A stormy, intense movement filled with driving energy and dramatic passion.",
  "duration": 387
}
\`\`\`

\`\`\`json
{
  "title": "Revolutionary",
  "mp3": "Classic/Revolutionary.mp3",
  "png": "Classic/Revolutionary.png",
  "artist": "Chopin",
  "description": "A fierce, powerful étude showcasing rapid left-hand runs and emotional urgency.",
  "duration": 154
}
\`\`\`

\`\`\`json
{
  "title": "River flows in you",
  "mp3": "Classic/River-flows-in-you.mp3",
  "png": "Classic/River-flows-in-you.png",
  "artist": "Yiruma",
  "description": "A soothing, flowing piano melody that feels intimate, warm, and timeless.",
  "duration": 189
}
\`\`\`

\`\`\`json
{
  "title": "Torrent",
  "mp3": "Classic/Torrent.mp3",
  "png": "Classic/Torrent.png",
  "artist": "Chopin",
  "description": "A fast, cascading étude bursting with momentum and virtuosic intensity.",
  "duration": 114
}
\`\`\`

\`\`\`json
{
  "title": "Waterfall",
  "mp3": "Classic/Waterfall.mp3",
  "png": "Classic/Waterfall.png",
  "artist": "Jon Schmidt",
  "description": "A vibrant piano composition rushing forward with rhythmic power and clarity.",
  "duration": 181
}
\`\`\`
`;

// 마크다운에서 JSON 블록 추출
function extractJSONBlocks(markdown: string): any[] {
  const jsonBlocks: any[] = [];
  const regex = /```json\s*([\s\S]*?)\s*```/g;
  let match;
  
  while ((match = regex.exec(markdown)) !== null) {
    try {
      const json = JSON.parse(match[1]);
      jsonBlocks.push(json);
    } catch (e) {
      console.error("JSON 파싱 실패:", match[1]);
    }
  }
  
  return jsonBlocks;
}

// 장르별 musicID 범위
const genreRanges: Record<string, { start: number; end: number }> = {
  "Balad": { start: 10, end: 19 },
  "Pop": { start: 20, end: 29 },
  "Classic": { start: 30, end: 39 },
  "Jazz": { start: 40, end: 49 },
  "Hiphop": { start: 50, end: 59 },
  "Carol": { start: 60, end: 69 },
};

// 장르별 카운터
const genreCounters: Record<string, number> = {
  "Balad": 0,
  "Pop": 0,
  "Classic": 0,
  "Jazz": 0,
  "Hiphop": 0,
  "Carol": 0,
};

// 마크다운에서 JSON 추출
const jsonBlocks = extractJSONBlocks(markdownData);

// 장르별로 그룹화
const byGenre: Record<string, any[]> = {};
jsonBlocks.forEach((block) => {
  const genre = block.mp3.split("/")[0];
  if (!byGenre[genre]) {
    byGenre[genre] = [];
  }
  byGenre[genre].push(block);
});

// musicTracks.json 형식으로 변환
const tracks: any[] = [];

Object.entries(byGenre).forEach(([genre, blocks]) => {
  const range = genreRanges[genre];
  if (!range) {
    console.warn(`알 수 없는 장르: ${genre}`);
    return;
  }
  
  blocks.forEach((block, index) => {
    const musicID = range.start + genreCounters[genre];
    genreCounters[genre]++;
    
    // mp3 경로에서 파일명 추출
    const mp3FileName = block.mp3.split("/")[1];
    const pngFileName = block.png.split("/")[1];
    
    tracks.push({
      musicID,
      genre,
      title: block.title,
      mp3Url: `/musics/${block.mp3}`,
      imageUrl: `/musics_img/${block.png}`,
      artist: block.artist,
      description: block.description,
      duration: block.duration,
    });
  });
});

// musicID 순서로 정렬
tracks.sort((a, b) => a.musicID - b.musicID);

// 최종 JSON 생성
const output = {
  version: "2.0.0",
  lastUpdated: new Date().toISOString().split("T")[0],
  tracks,
};

console.log(JSON.stringify(output, null, 2));

