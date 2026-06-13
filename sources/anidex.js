// AniDex extension for Hanami

export async function validate() {
  return true
}

export async function searchAniDex(queryStr) {
    // AniDex actually has a JSON API for searching
    // 1 = Anime Sub
    const url = `https://anidex.info/api/?q=${encodeURIComponent(queryStr)}&id=1`
    
    // Sometimes their API is wonky, we can also parse their RSS
    const rssUrl = `https://anidex.info/rss/?q=${encodeURIComponent(queryStr)}&id=1`
    
    const res = await fetch(rssUrl)
    if (!res.ok) throw new Error('Failed to fetch AniDex')
    const xml = await res.text()
    
    const items = []
    const itemRegex = /<item>([\s\S]*?)<\/item>/g
    let match
    
    while ((match = itemRegex.exec(xml)) !== null) {
      const itemBlock = match[1]
      
      const titleMatch = itemBlock.match(/<title>([\s\S]*?)<\/title>/)
      const linkMatch = itemBlock.match(/<link>([\s\S]*?)<\/link>/)
      const hashMatch = itemBlock.match(/<torrent:infoHash>([\s\S]*?)<\/torrent:infoHash>/) || itemBlock.match(/magnet:\?xt=urn:btih:([a-zA-Z0-9]+)/)
      const seedersMatch = itemBlock.match(/<torrent:seeds>(\d+)<\/torrent:seeds>/)
      const leechersMatch = itemBlock.match(/<torrent:peers>(\d+)<\/torrent:peers>/)
      const sizeMatch = itemBlock.match(/<torrent:contentLength>([\s\S]*?)<\/torrent:contentLength>/)
      const dateMatch = itemBlock.match(/<pubDate>([\s\S]*?)<\/pubDate>/)
      
      const stripCDATA = (str) => str ? str.replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '').trim() : ''

      if (titleMatch && hashMatch) {
        items.push({
          title: stripCDATA(titleMatch[1]).replace(/&amp;/g, '&'),
          link: linkMatch ? stripCDATA(linkMatch[1]) : '',
          hash: stripCDATA(hashMatch[1]),
          seeders: seedersMatch ? parseInt(seedersMatch[1]) : 0,
          leechers: leechersMatch ? parseInt(leechersMatch[1]) : 0,
          downloads: 0,
          size: sizeMatch ? parseInt(stripCDATA(sizeMatch[1])) : 0,
          date: dateMatch ? new Date(stripCDATA(dateMatch[1])) : new Date()
        })
      }
    }
    
    return items
  },

export async function anime(options) {
    const ep = options.episode ? options.episode.toString().padStart(2, '0') : ''
    const titles = (options.titles || []).slice(0, 3)
    let allResults = []
    
    for (const title of titles) {
      const query = `${title} ${ep}`.trim()
      try {
        const results = await searchAniDex(query)
        const valid = results.filter(r => !/batch|complete|season/i.test(r.title))
        if (valid.length > 0) {
          allResults = allResults.concat(valid)
          break
        }
      } catch (err) {
        continue
      }
    }
    
    for (const title of titles) {
      try {
        const results = await searchAniDex(`${title} batch`)
        if (results.length > 0) {
          allResults = allResults.concat(results)
          break
        }
      } catch (err) {
        continue
      }
    }
    return allResults
  },

export async function movie(options) {
    const titles = (options.titles || []).slice(0, 3)
    for (const title of titles) {
      try {
        const results = await searchAniDex(title)
        if (results.length > 0) return results
      } catch (err) {
        continue
      }
    }
    return []
  },

export async function series(options) {
  return anime(options)
}
