export async function movie(query, options = {}) {
  const domain = options.settings?.domain || 'solidtorrents.to'
  // 2 is the category ID for Video (varies sometimes, but searching all or 'Video' works)
  const searchUrl = `https://${domain}/api/v1/search?q=${encodeURIComponent(query.titles[0])}&category=Video`
  
  try {
    const res = await fetch(searchUrl)
    if (!res.ok) throw new Error(`SolidTorrents HTTP Error: ${res.status}`)
    const json = await res.json()
    
    if (!json.results) return []
    
    return json.results.map(item => ({
      title: item.title,
      link: item.magnet,
      seeders: item.swarm?.seeders || 0,
      leechers: item.swarm?.leechers || 0,
      downloads: item.swarm?.downloads || 0,
      hash: item.infohash || item.magnet.match(/urn:btih:([a-zA-Z0-9]+)/)?.[1],
      size: item.size || 0,
      date: item.imported || new Date().toISOString()
    }))
  } catch (err) {
    throw new Error(`Failed to fetch SolidTorrents: ${err.message}`)
  }
}

export async function series(query, options = {}) {
  return movie(query, options)
}

export async function search(query, options = {}) {
  return movie({ titles: [query] }, options)
}
