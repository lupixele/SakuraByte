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

  const cinemetaUrl = `https://v3-cinemeta.strem.io/catalog/${type}/top/search=${encodeURIComponent(searchName)}.json`;
  const cmRes = await fetch(cinemetaUrl);
  const cmData = await cmRes.json();
  
  if (!cmData.metas || cmData.metas.length === 0) return [];
  const imdbId = cmData.metas[0].imdb_id;
  
  const url = type === "movie" 
    ? `https://autoembed.to/movie/imdb/${imdbId}`
    : `https://autoembed.to/tv/imdb/${imdbId}-${season}-${episode}`;

  return [
    {
      id: "autoembed_" + imdbId,
      name: searchName,
      sourceName: "Autoembed", type: "stream",
      quality: "720p",
      url: url,
    }
  ];
}
