export async function movie(query, options = {}) {
  const domain = options.settings?.domain || 'btdig.com'
  const searchUrl = `https://${domain}/search?q=${encodeURIComponent(query.titles[0])}`
  
  try {
    const res = await fetch(searchUrl)
    if (!res.ok) throw new Error(`BTDigg HTTP Error: ${res.status}`)
    const html = await res.text()
    
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    
    const results = []
    const rows = Array.from(doc.querySelectorAll('.one_result')).slice(0, 15)
    
    for (const row of rows) {
      const titleEl = row.querySelector('.torrent_name a')
      const magnetLink = row.querySelector('a[href^="magnet:"]')?.href || titleEl?.href
      
      if (!titleEl || !magnetLink || !magnetLink.startsWith('magnet:')) continue
      
      const title = titleEl.textContent.trim()
      const sizeStr = row.querySelector('.torrent_size')?.textContent?.trim() || '0 MB'
      
      let size = 0
      if (sizeStr.includes('GB')) size = parseFloat(sizeStr) * 1024 * 1024 * 1024
      else if (sizeStr.includes('MB')) size = parseFloat(sizeStr) * 1024 * 1024
      else if (sizeStr.includes('KB')) size = parseFloat(sizeStr) * 1024
      
      const hashMatch = magnetLink.match(/urn:btih:([a-zA-Z0-9]+)/)
      if (!hashMatch) continue
      
      // BTDigg does not reliably provide seeds/peers since it's a DHT crawler, we fake a reasonable amount or parse if available.
      results.push({
        title: title,
        link: magnetLink,
        seeders: 10, // DHT results don't have accurate seeders
        leechers: 0,
        downloads: 0,
        hash: hashMatch[1],
        size: size,
        date: new Date().toISOString()
      })
    }
    
    return results
  } catch (err) {
    throw new Error(`Failed to fetch BTDigg: ${err.message}`)
  }
}

export async function series(query, options = {}) {
  return movie(query, options)
}

export async function search(query, options = {}) {
  return movie({ titles: [query] }, options)
}
