async function searchSources(q) {
  const url = 'https://nekobt.to/api/v1/torrents/search?limit=30&query=' + encodeURIComponent(q);
  try {
    const res = await fetch(url);
    const json = await res.json();
    
    if (json.error || !json.data || !json.data.results) return [];
    
    return json.data.results.map(r => {
      let quality = "Unknown";
      const t = r.title.toLowerCase();
      if (t.includes("1080")) quality = "1080p";
      else if (t.includes("720")) quality = "720p";
      else if (t.includes("2160") || t.includes("4k")) quality = "4K";
      else if (t.includes("480")) quality = "480p";

      let sizeStr = r.filesize;
      if (sizeStr) {
        const bytes = parseInt(sizeStr, 10);
        if (bytes > 1024 * 1024 * 1024) sizeStr = (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
        else sizeStr = (bytes / (1024 * 1024)).toFixed(2) + " MB";
      }

      return {
        id: "nekobt_" + r.infohash,
        sourceName: "NekoBT",
        name: r.title,
        type: "torrent",
        quality: quality,
        size: sizeStr,
        seeds: parseInt(r.seeders || "0", 10),
        hash: r.infohash
      };
    });
  } catch (err) {
    console.error("NekoBT error:", err);
    return [];
  }
}
