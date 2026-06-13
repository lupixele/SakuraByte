// Nyaa.si extension for Hanami

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

export async function validate() {
  try {
    const res = await fetch(`https://${this.settings?.domain || 'nyaa.si'}/`)
    return res.ok
  } catch {
    return false
  }
}

export async function searchNyaa(queryStr, category = '1_2', domain = 'nyaa.si') {
  // 1_2 is Anime - English-translated
  const url = `https://${domain}/?f=0&c=${category}&q=${encodeURIComponent(queryStr)}&s=seeders&o=desc`
  
  // Nyaa doesn't have a JSON API, but the RSS feed is clean
  const rssUrl = `https://${domain}/?page=rss&c=${category}&q=${encodeURIComponent(queryStr)}&s=seeders&o=desc`
    
    const res = await fetch(rssUrl)
    if (!res.ok) throw new Error('Failed to fetch Nyaa')
    const xml = await res.text()
    
    const items = []
    const itemRegex = /<item>([\s\S]*?)<\/item>/g
    let match
    
    while ((match = itemRegex.exec(xml)) !== null) {
      const itemBlock = match[1]
      
      const titleMatch = itemBlock.match(/<title>([\s\S]*?)<\/title>/)
      const linkMatch = itemBlock.match(/<link>([\s\S]*?)<\/link>/)
      const hashMatch = itemBlock.match(/<nyaa:infoHash>([\s\S]*?)<\/nyaa:infoHash>/)
      const seedersMatch = itemBlock.match(/<nyaa:seeders>(\d+)<\/nyaa:seeders>/)
      const leechersMatch = itemBlock.match(/<nyaa:leechers>(\d+)<\/nyaa:leechers>/)
      const sizeMatch = itemBlock.match(/<nyaa:size>([\s\S]*?)<\/nyaa:size>/)
      const dateMatch = itemBlock.match(/<pubDate>([\s\S]*?)<\/pubDate>/)
      
      const stripCDATA = (str) => str ? str.replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '').trim() : ''

      if (titleMatch && hashMatch) {
        items.push({
          title: stripCDATA(titleMatch[1]).replace(/&amp;/g, '&'),
          link: stripCDATA(linkMatch ? linkMatch[1] : ''),
          hash: stripCDATA(hashMatch[1]),
          seeders: seedersMatch ? parseInt(seedersMatch[1]) : 0,
          leechers: leechersMatch ? parseInt(leechersMatch[1]) : 0,
          downloads: 0,
          size: sizeMatch ? parseSizeToBytes(stripCDATA(sizeMatch[1])) : 0,
          date: dateMatch ? new Date(stripCDATA(dateMatch[1])) : new Date()
        })
      }
    }
    
    return items
  },

export async function anime(options) {
  const domain = options.settings?.domain || 'nyaa.si'
  const ep = options.episode ? options.episode.toString().padStart(2, '0') : ''
  const titles = (options.titles || []).slice(0, 3)
  let allResults = []
  
  for (const title of titles) {
    const query = `${title} ${ep}`.trim()
    try {
      const results = await searchNyaa(query, '1_2', domain)
      const valid = results.filter(r => !/batch|complete|season/i.test(r.title))
        if (valid.length > 0) {
          allResults = allResults.concat(valid)
          break // Found good episode results, stop trying other titles
        }
      } catch (err) {
        continue
      }
    }
    
    // Also try to find batches for the whole season
    for (const title of titles) {
      try {
      const results = await searchNyaa(`${title} batch`, '1_2', domain)
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
  const domain = options.settings?.domain || 'nyaa.si'
  // For anime movies, just search the titles without episode numbers
  const titles = (options.titles || []).slice(0, 3)
  for (const title of titles) {
    try {
      const results = await searchNyaa(title, '1_2', domain)
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
