export async function movie(query, options = {}) {
  const domain = options.settings?.domain || '5movierulz.ro'
  const searchUrl = `https://ww4.${domain}/?s=${encodeURIComponent(query.titles[0])}`
  
  try {
    const res = await fetch(searchUrl)
    if (!res.ok) throw new Error(`Movierulz HTTP Error: ${res.status}`)
    const html = await res.text()
    
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    
    // Find post links. Movierulz usually wraps posts in <div class="box"> or <div class="content">
    // We can just grab the main titles
    const results = []
    const posts = Array.from(doc.querySelectorAll('.box a, .content a')).filter(a => {
      return a.href && a.href.includes(domain) && !a.href.includes('/category/') && !a.href.includes('/page/')
    }).slice(0, 5) // Limit to top 5
    
    // Deduplicate post URLs
    const uniqueUrls = [...new Set(posts.map(p => p.href))]
    
    await Promise.all(uniqueUrls.map(async (url) => {
      try {
        const postRes = await fetch(url)
        if (!postRes.ok) return
        const postHtml = await postRes.text()
        const postDoc = parser.parseFromString(postHtml, 'text/html')
        
        const titleMatch = postDoc.querySelector('h1.entry-title, h2.entry-title')
        const postTitle = titleMatch ? titleMatch.textContent.trim() : query.titles[0]
        
        // Find all magnet links
        const magnets = Array.from(postDoc.querySelectorAll('a[href^="magnet:"]'))
        
        for (const mag of magnets) {
          const hashMatch = mag.href.match(/urn:btih:([a-zA-Z0-9]+)/)
          if (!hashMatch) continue
          
          let titleSuffix = mag.textContent.trim() || 'Unknown Quality'
          
          results.push({
            title: `${postTitle} [${titleSuffix}] (Movierulz)`,
            link: mag.href,
            seeders: 0,
            leechers: 0,
            downloads: 0,
            hash: hashMatch[1],
            size: 0,
            date: new Date().toISOString()
          })
        }
      } catch (err) {
        // Ignore single post fetch failures
      }
    }))
    
    return results
  } catch (err) {
    throw new Error(`Failed to fetch Movierulz: ${err.message}`)
  }
}

export async function series(query, options = {}) {
  return movie(query, options)
}

export async function search(query, options = {}) {
  return movie({ titles: [query] }, options)
}
