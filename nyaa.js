async function searchSources(q) {
  const url = 'https://nyaa.iss.one/?page=rss&q=' + encodeURIComponent(q) + '&c=1_2&f=0';
  const res = await fetch(url);
  const xml = await res.text();
  
  const $ = cheerio.load(xml, { xmlMode: true });
  const items = [];
  
  $("item").each((i, el) => {
    const title = $(el).find("title").text();
    const seeders = parseInt($(el).find("nyaa\\:seeders").text() || "0", 10);
    const size = $(el).find("nyaa\\:size").text();
    const infoHash = $(el).find("nyaa\\:infoHash").text();
    
    let quality = "Unknown";
    if (title.includes("1080p") || title.includes("1080")) quality = "1080p";
    else if (title.includes("720p") || title.includes("720")) quality = "720p";
    else if (title.includes("2160p") || title.includes("4K")) quality = "4K";
    
    if (infoHash && title) {
      items.push({
        id: "nyaa_" + infoHash,
        name: "[Nyaa] " + title,
        sourceName: "Nyaa", type: "torrent",
        quality: quality,
        size: size,
        seeds: seeders,
        hash: "magnet:?xt=urn:btih:" + infoHash + "&dn=" + encodeURIComponent(title)
      });
    }
  });
  
  return items;
}
