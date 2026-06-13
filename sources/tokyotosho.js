// TokyoTosho extension for Hanami

function parseSizeToBytes(sizeStr) {
  const match = sizeStr.match(/([\d.]+)\s*([KMGT]B|B)/i)
  if (!match) return 0
  const val = parseFloat(match[1])
  const unit = match[2].toUpperCase()
  if (unit === 'KB') return val * 1024
  if (unit === 'MB') return val * 1024 * 1024
  if (unit === 'GB') return val * 1024 * 1024 * 1024
  if (unit === 'TB') return val * 1024 * 1024 * 1024 * 1024
  return val
}

export default {
  settings: {},

  async validate() {
    return true
  },

  async searchTokyoTosho(queryStr) {
    // TokyoTosho RSS format
    // type 1 = Anime
    const rssUrl = `https://tokyotosho.info/rss.php?terms=${encodeURIComponent(queryStr)}&type=1&searchName=true&searchComment=true&size_min=&size_max=&username=`
    
    const res = await fetch(rssUrl)
    if (!res.ok) throw new Error('Failed to fetch TokyoTosho')
    const xml = await res.text()
    
    const items = []
    const itemRegex = /<item>([\s\S]*?)<\/item>/g
    let match
    
    while ((match = itemRegex.exec(xml)) !== null) {
      const itemBlock = match[1]
      
      const titleMatch = itemBlock.match(/<title>([\s\S]*?)<\/title>/)
      const linkMatch = itemBlock.match(/<link>([\s\S]*?)<\/link>/)
      const descMatch = itemBlock.match(/<description>([\s\S]*?)<\/description>/)
      
      const stripCDATA = (str) => str ? str.replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '').trim() : ''

      let size = 0
      let seeders = 0
      let leechers = 0
      
      if (descMatch) {
        const desc = stripCDATA(descMatch[1])
        const sizeM = desc.match(/Size: (.*?)(?: \||$)/)
        if (sizeM) size = parseSizeToBytes(sizeM[1])
        
        const seedM = desc.match(/Seeders: (\d+)/)
        if (seedM) seeders = parseInt(seedM[1])
        
        const leechM = desc.match(/Leechers: (\d+)/)
        if (leechM) leechers = parseInt(leechM[1])
      }
      
      const dateMatch = itemBlock.match(/<pubDate>([\s\S]*?)<\/pubDate>/)
      
      if (titleMatch && linkMatch) {
        let hash = stripCDATA(linkMatch[1]).replace(/&amp;/g, '&')
        const hashExtractor = hash.match(/btih:([a-zA-Z0-9]+)/)
        if (hashExtractor) {
          hash = hashExtractor[1]
        }
        
        items.push({
          title: stripCDATA(titleMatch[1]).replace(/&amp;/g, '&'),
          link: '',
          hash: hash,
          seeders: seeders,
          leechers: leechers,
          downloads: 0,
          size: size,
          date: dateMatch ? new Date(stripCDATA(dateMatch[1])) : new Date()
        })
      }
    }
    
    return items
  },

  async single(options) {
    const ep = options.episode ? options.episode.toString().padStart(2, '0') : ''
    const titles = (options.titles || []).slice(0, 3)
    
    for (const title of titles) {
      const query = `${title} ${ep}`.trim()
      try {
        const results = await this.searchTokyoTosho(query)
        const valid = results.filter(r => !/batch|complete|season/i.test(r.title))
        if (valid.length > 0) return valid
      } catch (err) {
        continue
      }
    }
    return []
  },

  async batch(options) {
    const titles = (options.titles || []).slice(0, 3)
    
    for (const title of titles) {
      try {
        const results = await this.searchTokyoTosho(`${title} batch`)
        if (results.length > 0) return results
      } catch (err) {
        continue
      }
    }
    return []
  }
}
