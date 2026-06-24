// AnimeTosho (New) extension for Hanami

export default {
  settings: {
    domain: 'feed.animetosho.xyz',
    useTorrent: false
  },

  async validate() {
    try {
      const res = await fetch(`https://${this.settings.domain}/json/v1/search?q=test`)
      return res.ok
    } catch {
      return false
    }
  },

  map(entries, useTorrent = false) {
    return entries.map(entry => ({
      title: entry.title,
      link: useTorrent ? entry.torrent_url : entry.magnet,
      seeders: (entry.seeders || 0) >= 30000 ? 0 : entry.seeders || 0,
      leechers: (entry.leechers || 0) >= 30000 ? 0 : entry.leechers || 0,
      downloads: entry.downloads || 0,
      hash: entry.info_hash,
      size: entry.size_bytes,
      accuracy: 'medium',
      type: entry.is_batch ? 'batch' : undefined,
      date: new Date(entry.date_added)
    }))
  },

  async search(queryStr, useTorrent) {
    const res = await fetch(`https://${this.settings.domain}/json/v1/search?q=${encodeURIComponent(queryStr)}`)
    const data = await res.json()
    return data?.data?.length ? this.map(data.data, useTorrent) : []
  },

  async anime(options) {
    const ep = options.episode ? options.episode.toString().padStart(2, '0') : ''
    const titles = (options.titles || []).slice(0, 3)
    let allResults = []

    for (const title of titles) {
      const query = `${title} ${ep}`.trim()
      try {
        const results = await this.search(query, this.settings.useTorrent)
        const valid = results.filter(r => r.type !== 'batch')
        if (valid.length > 0) {
          allResults = allResults.concat(valid)
          break
        }
      } catch (err) {
        continue
      }
    }
    
    if (allResults.length === 0) {
      for (const title of titles) {
        try {
          const results = await this.search(`${title} batch`, this.settings.useTorrent)
          if (results.length > 0) {
            allResults = allResults.concat(results.filter(r => r.type === 'batch'))
            break
          }
        } catch (err) {
          continue
        }
      }
    }
    
    return allResults
  },

  async movie(options) {
    const titles = (options.titles || []).slice(0, 3)
    for (const title of titles) {
      try {
        const results = await this.search(title, this.settings.useTorrent)
        if (results.length > 0) return results
      } catch (err) {
        continue
      }
    }
    return []
  },

  async series(options) {
    return this.anime(options)
  }
}
