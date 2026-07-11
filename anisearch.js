async function searchSources(q) {
  const parts = q.split(' ').map(p => encodeURIComponent(p)).join('.*');
  const url = `https://api.anisearch.org/torrents?name=ilike.*${parts}*&limit=30`;
  
  try {
    const res = await fetch(url);
    const json = await res.json();
    
    if (!json || !json.length) return [];
    
    return json.map(r => {
      let quality = "Unknown";
      const t = r.torrentName.toLowerCase();
      if (t.includes("1080")) quality = "1080p";
      else if (t.includes("720")) quality = "720p";
      else if (t.includes("2160") || t.includes("4k")) quality = "4K";
      else if (t.includes("480")) quality = "480p";

      let sizeStr = r.length;
      if (sizeStr) {
        const bytes = parseInt(sizeStr, 10);
        if (bytes > 1024 * 1024 * 1024) sizeStr = (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
        else sizeStr = (bytes / (1024 * 1024)).toFixed(2) + " MB";
      }

      return {
        id: "anisearch_" + r.infohash,
        sourceName: "AniSearch",
        name: r.torrentName,
        type: "torrent",
        quality: quality,
        size: sizeStr,
        seeds: 0,
        hash: r.infohash
      };
    });
  } catch (err) {
    console.error("AniSearch error:", err);
    return [];
  }
}
