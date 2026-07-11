async function searchSources(q) {
  let type = "movie";
  let searchName = q;
  let season = 1;
  let episode = 1;
  
  const seMatch = q.match(/(.+) S(\d+)E(\d+)/i);
  if (seMatch) {
    type = "series";
    searchName = seMatch[1].trim();
    season = parseInt(seMatch[2], 10);
    episode = parseInt(seMatch[3], 10);
  }

  // Find IMDb ID using Cinemeta
  const cinemetaUrl = `https://v3-cinemeta.strem.io/catalog/${type}/top/search=${encodeURIComponent(searchName)}.json`;
  const cmRes = await fetch(cinemetaUrl);
  const cmData = await cmRes.json();
  
  if (!cmData.metas || cmData.metas.length === 0) return [];
  const imdbId = cmData.metas[0].imdb_id;
  
  // NOTE: Vidsrc heavily obfuscates its direct links and requires a headless browser scraper. 
  // To demonstrate Kureha's native PlayerUI handling non-magnet Web Streams with qualities and subtitles,
  // we return a mock direct stream payload below.
  
  return [
    {
      id: "vidsrc_" + imdbId,
      name: searchName + " (Mock Stream)",
      sourceName: "Vidsrc", 
      type: "stream",
      quality: "1080p",
      url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
      qualities: {
        "1080p (Direct)": "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
        "720p (Direct)": "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
        "480p (Direct)": "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
      },
      subtitles: [
        { language: "English", url: "https://raw.githubusercontent.com/andreyvit/subtitle-tools/master/sample.srt" },
        { language: "Spanish", url: "https://raw.githubusercontent.com/andreyvit/subtitle-tools/master/sample.srt" }
      ]
    }
  ];
}
