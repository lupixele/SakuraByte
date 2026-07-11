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
  let imdbId = null;
  try {
     const cmRes = await fetch(cinemetaUrl);
     const cmData = await cmRes.json();
     if (cmData.metas && cmData.metas.length > 0) {
        imdbId = cmData.metas[0].imdb_id;
     }
  } catch(e){}
  
  if (!imdbId) return [];
  
  const sfUrl = type === "movie" 
    ? `https://stremio-addon.superflix.to/stream/movie/${imdbId}.json`
    : `https://stremio-addon.superflix.to/stream/series/${imdbId}:${season}:${episode}.json`;

  console.log('[Superflix] Fetching Stremio Addon Stream:', sfUrl);

  let directUrl = null;
  try {
     // Use the backend proxyFetch to avoid simple CORS issues or use native fetch if supported
     let sfData;
     if (window && window.Native && window.Native.extensions && window.Native.extensions.proxyFetch) {
        const proxyRes = await window.Native.extensions.proxyFetch(sfUrl);
        if (proxyRes.text) sfData = JSON.parse(proxyRes.text);
     } else {
        const res = await fetch(sfUrl);
        sfData = await res.json();
     }
     
     if (sfData && sfData.streams && sfData.streams.length > 0) {
        directUrl = sfData.streams[0].url;
     }
  } catch(e){
     console.error('[Superflix] Failed to parse streams', e);
  }
  
  if (!directUrl) {
     return [];
  }

  return [
    {
      id: "superflix_" + imdbId,
      name: searchName + " (Superflix)",
      sourceName: "Superflix", 
      type: "stream",
      quality: "Auto",
      url: directUrl
    }
  ];
}
