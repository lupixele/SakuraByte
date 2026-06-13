export async function movie(query, options = {}) {
  const domain = options.settings?.domain || '1337x.to'
  const searchUrl = `https://${domain}/search/${encodeURIComponent(query.titles[0])}/1/`
  
  try {
    const res = await fetch(searchUrl)
    if (!res.ok) throw new Error(`1337x HTTP Error: ${res.status}`)
    const html = await res.text()
    
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    
    const results = []
    const rows = Array.from(doc.querySelectorAll('table.table-list tbody tr')).slice(0, 10)
    
    await Promise.all(rows.map(async (row) => {
      try {
        const titleLink = row.querySelectorAll('td.name a')[1]
        if (!titleLink) return
        
        const title = titleLink.textContent.trim()
        const url = `https://${domain}${titleLink.getAttribute('href')}`
        const seeders = parseInt(row.querySelector('td.seeds')?.textContent || '0', 10)
        const leechers = parseInt(row.querySelector('td.leeches')?.textContent || '0', 10)
        const sizeStr = row.querySelector('td.size')?.childNodes[0]?.textContent?.trim() || '0 MB'
        const dateStr = row.querySelector('td.coll-date')?.textContent || ''
        
        let size = 0
        if (sizeStr.includes('GB')) size = parseFloat(sizeStr) * 1024 * 1024 * 1024
        else if (sizeStr.includes('MB')) size = parseFloat(sizeStr) * 1024 * 1024
        else if (sizeStr.includes('KB')) size = parseFloat(sizeStr) * 1024
        
        const postRes = await fetch(url)
        if (!postRes.ok) return
        const postHtml = await postRes.text()
        const postDoc = parser.parseFromString(postHtml, 'text/html')
        
        const magnetLink = postDoc.querySelector('a[href^="magnet:"]')?.href
        if (!magnetLink) return
        
        const hashMatch = magnetLink.match(/urn:btih:([a-zA-Z0-9]+)/)
        if (!hashMatch) return
        
        results.push({
          title: title,
          link: magnetLink,
          seeders: seeders,
          leechers: leechers,
          downloads: 0,
          hash: hashMatch[1],
          size: size,
          date: new Date().toISOString()
        })
      } catch (err) {
        // Ignore single post fetch failures
      }
    }))
    
    return results
  } catch (err) {
    throw new Error(`Failed to fetch 1337x: ${err.message}`)
  }
}

export async function series(query, options = {}) {
  return movie(query, options)
}

export async function search(query, options = {}) {
  return movie({ titles: [query] }, options)
}
