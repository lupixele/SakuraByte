export async function movie(query, options = {}) {
  const domain = options.settings?.domain || 'yts.rs'
  const searchUrl = `https://${domain}/api/v2/list_movies.json?query_term=${encodeURIComponent(query.titles[0])}`
  
  try {
    const res = await fetch(searchUrl)
    if (!res.ok) throw new Error(`YTS HTTP Error: ${res.status}`)
    const json = await res.json()
    
    if (json.status !== 'ok' || !json.data || !json.data.movies) {
      return []
    }

    const results = []
    
    for (const m of json.data.movies) {
      if (!m.torrents) continue
      
      for (const t of m.torrents) {
        results.push({
          title: `${m.title} (${m.year}) [${t.quality}] [${t.type}] YTS`,
          link: `magnet:?xt=urn:btih:${t.hash}&dn=${encodeURIComponent(m.title)}&tr=udp%3A%2F%2Fglotorrents.pw%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337%2Fannounce`,
          seeders: t.seeds,
          leechers: t.peers,
          downloads: 0,
          hash: t.hash,
          size: t.size_bytes,
          date: new Date(t.date_uploaded).toISOString()
        })
      }
    }
    
    return results
  } catch (err) {
    throw new Error(`Failed to fetch YTS: ${err.message}`)
  }
}

export async function series(query, options = {}) {
  return [] // YTS is strictly movies
}

export async function search(query, options = {}) {
  return movie({ titles: [query] }, options)
}
