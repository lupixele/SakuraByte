export async function movie(query, options = {}) {
  const domain = options.settings?.domain || 'apibay.org'
  const searchUrl = `https://${domain}/q.php?q=${encodeURIComponent(query.titles[0])}`
  
  try {
    const res = await fetch(searchUrl)
    if (!res.ok) throw new Error(`TPB HTTP Error: ${res.status}`)
    const json = await res.json()
    
    if (json.length > 0 && json[0].id === '0') {
      return [] // "No results returned"
    }

    return json.map(item => ({
      title: item.name,
      link: `magnet:?xt=urn:btih:${item.info_hash}&dn=${encodeURIComponent(item.name)}&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969%2Fannounce&tr=udp%3A%2F%2F9.rarbg.to%3A2920%2Fannounce&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337`,
      seeders: parseInt(item.seeders, 10),
      leechers: parseInt(item.leechers, 10),
      downloads: 0,
      hash: item.info_hash,
      size: parseInt(item.size, 10),
      date: new Date(parseInt(item.added, 10) * 1000).toISOString()
    }))
  } catch (err) {
    throw new Error(`Failed to fetch Pirate Bay: ${err.message}`)
  }
}

export async function series(query, options = {}) {
  // Since Pirate Bay relies on string search, we can format the series title + episode
  const searchTerm = query.episode 
    ? `${query.titles[0]} s01e${query.episode.toString().padStart(2, '0')}` // Assume season 1 if not provided, or just search title
    : query.titles[0]
    
  return movie({ ...query, titles: [searchTerm] }, options)
}

export async function search(query, options = {}) {
  return movie({ titles: [query] }, options)
}
