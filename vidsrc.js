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
  
  // Construct Vidsrc embed link
  const embedUrl = type === "movie" 
    ? `https://vidsrc.me/embed/movie?imdb=${imdbId}`
    : `https://vidsrc.me/embed/tv?imdb=${imdbId}&season=${season}&episode=${episode}`;

  console.log('Extracting from Vidsrc:', embedUrl);

  // Ask Kureha's Main Process to do a headless extraction of the .m3u8 link from the embed
  let directM3U8 = null;
  if (window && window.Native && window.Native.extensions && window.Native.extensions.extractM3U8) {
     directM3U8 = await window.Native.extensions.extractM3U8(embedUrl);
  }
  
  if (!directM3U8) {
     console.log('Failed to extract direct M3U8 from vidsrc');
     return [];
  }

  return [
    {
      id: "vidsrc_" + imdbId,
      name: searchName + " (Direct Stream)",
      sourceName: "Vidsrc", 
      type: "stream",
      quality: "1080p",
      url: directM3U8
    }
  ];
}
