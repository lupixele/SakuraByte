export async function movie(query, options = {}) {
  const domain = options.settings?.domain || '1tamilmv.cards'
  const searchUrl = `https://www.${domain}/index.php?/search/&q=${encodeURIComponent(query.titles[0])}&type=forums_topic`
  
  try {
    const res = await fetch(searchUrl)
    if (!res.ok) throw new Error(`TamilMV HTTP Error: ${res.status}`)
    const html = await res.text()
    
    // In a sandboxed iframe, we have DOMParser!
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    
    // Find all topic links from search results
    const results = []
    const topics = Array.from(doc.querySelectorAll('a[data-role="title"]')).slice(0, 5) // Limit to top 5 to avoid too many fetches
    
    // Concurrently fetch each topic page to extract magnets
    await Promise.all(topics.map(async (topic) => {
      const title = topic.textContent.trim()
      const url = topic.href
      if (!url) return
      
      try {
        const topicRes = await fetch(url)
        if (!topicRes.ok) return
        const topicHtml = await topicRes.text()
        const topicDoc = parser.parseFromString(topicHtml, 'text/html')
        
        // Find all magnet links in the post
        const magnets = Array.from(topicDoc.querySelectorAll('a[href^="magnet:"]'))
        
        for (const mag of magnets) {
          const hashMatch = mag.href.match(/urn:btih:([a-zA-Z0-9]+)/)
          if (!hashMatch) continue
          
          results.push({
            title: `${title} (TamilMV)`,
            link: mag.href,
            seeders: 0, // TamilMV doesn't show seeders in the post text easily
            leechers: 0,
            downloads: 0,
            hash: hashMatch[1],
            size: 0,
            date: new Date().toISOString()
          })
        }
      } catch (err) {
        // Ignore single topic fetch failures
      }
    }))
    
    return results
  } catch (err) {
    throw new Error(`Failed to fetch TamilMV: ${err.message}`)
  }
}

export async function series(query, options = {}) {
  return movie(query, options)
}

export async function search(query, options = {}) {
  return movie({ titles: [query] }, options)
}
