async function searchSources(q) {
  const url = 'https://feed.animetosho.org/json?qx=1&q=' + encodeURIComponent(q);
  
  try {
    const res = await fetch(url);
    const json = await res.json();
    
    if (!json || !json.length) return [];
    
    return json.map(r => {
      let quality = "Unknown";
      const titleStr = r.title || r.torrent_name || "";
      const t = titleStr.toLowerCase();
      if (t.includes("1080")) quality = "1080p";
      else if (t.includes("720")) quality = "720p";
      else if (t.includes("2160") || t.includes("4k")) quality = "4K";
      else if (t.includes("480")) quality = "480p";

      let sizeStr = r.total_size;
      if (sizeStr) {
        const bytes = parseInt(sizeStr, 10);
        if (bytes > 1024 * 1024 * 1024) sizeStr = (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
        else sizeStr = (bytes / (1024 * 1024)).toFixed(2) + " MB";
      }

      return {
        id: "animetosho_" + r.info_hash,
        sourceName: "AnimeTosho",
        name: titleStr,
        type: "torrent",
        quality: quality,
        size: sizeStr,
        seeds: parseInt(r.seeders || "0", 10),
        hash: r.info_hash
      };
    });
  } catch (err) {
    console.error("AnimeTosho error:", err);
    return [];
  }
}
