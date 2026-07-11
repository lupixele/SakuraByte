async function searchSources(q) {
  // Parse query to see if it has season/episode info (e.g. "Frieren S01E29")
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
  
  // Hit Torrentio API
  const tUrl = type === "movie" 
    ? `https://torrentio.strem.fun/stream/movie/${imdbId}.json`
    : `https://torrentio.strem.fun/stream/series/${imdbId}:${season}:${episode}.json`;
    
  const tRes = await fetch(tUrl);
  const tData = await tRes.json();
  
  if (!tData.streams) return [];
  
  return tData.streams.map(s => {
    const lines = (s.title || "").split('\n');
    let size = "Unknown";
    let seeders = 0;
    
    lines.forEach(l => {
      if (l.includes("GB") || l.includes("MB")) size = l.trim();
      // Use match to find seeds safely
      const seedMatch = l.match(/(\d+)/);
      if (l.includes("👤") || l.includes("seeds")) {
        seeders = parseInt((l.match(/\D+(\d+)/) || [])[1] || "0", 10);
      }
    });
    
    // Parse name and quality from name or title
    let quality = "Unknown";
    const t = (s.title || "").toLowerCase();
    const n = (s.name || "").toLowerCase();
    
    if (t.includes("1080p") || n.includes("1080p") || t.includes("1080") || n.includes("1080")) quality = "1080p";
    else if (t.includes("720p") || n.includes("720p") || t.includes("720") || n.includes("720")) quality = "720p";
    else if (t.includes("4k") || n.includes("4k") || t.includes("2160p") || n.includes("2160p")) quality = "4K";

    // Torrentio usually has the release/file name on the first or second line of title.
    // Use the longest line from the first two as the filename/release name.
    let fileName = "Torrentio Result";
    if (lines.length > 1 && lines[1].length > lines[0].length) {
       fileName = lines[1];
    } else if (lines.length > 0) {
       fileName = lines[0];
    }

    const trackers = [
      "udp://tracker.opentrackr.org:1337/announce",
      "udp://open.demonii.com:1337/announce",
      "udp://tracker.openbittorrent.com:80",
      "udp://tracker.coppersurfer.tk:6969",
      "udp://glotorrents.pw:6969/announce",
      "udp://tracker.leechers-paradise.org:6969",
      "udp://p4p.arenabg.com:1337"
    ];
    const trString = trackers.map(tr => "&tr=" + encodeURIComponent(tr)).join("");

    return {
      id: "torrentio_" + s.infoHash,
      sourceName: "Torrentio",
      name: fileName,
      type: "torrent",
      quality: quality,
      size: size,
      seeds: seeders,
      hash: "magnet:?xt=urn:btih:" + s.infoHash + trString,
      fileIdx: s.fileIdx
    };
  });
}
