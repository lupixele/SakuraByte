// AnimeTosho (Old) extension for Hanami

export default {
  settings: {
    domain: 'feed.animetosho.org',
    useTorrent: false
  },

  async validate() {
    try {
      const res = await fetch(`https://${this.settings.domain}/json`)
      return res.ok
    } catch {
      return false
    }
  },

  map(entries, batch = false, useTorrent = false) {
    return entries.map(entry => ({
      title: entry.title || entry.torrent_name,
      link: useTorrent ? entry.torrent_url : entry.magnet_uri,
      seeders: (entry.seeders || 0) >= 30000 ? 0 : entry.seeders || 0,
      leechers: (entry.leechers || 0) >= 30000 ? 0 : entry.leechers || 0,
      downloads: entry.torrent_downloaded_count || 0,
      hash: entry.info_hash,
      size: entry.total_size,
      accuracy: entry.anidb_fid && !batch ? 'high' : 'medium',
      type: batch ? 'batch' : undefined,
      date: new Date(entry.timestamp * 1000)
    }))
  },

  async search(queryStr, useTorrent) {
    const res = await fetch(`https://${this.settings.domain}/json?q=${encodeURIComponent(queryStr)}`)
    const data = await res.json()
    return data.length ? this.map(data, false, useTorrent) : []
  },

  async anime(options) {
    const ep = options.episode ? options.episode.toString().padStart(2, '0') : ''
    const titles = (options.titles || []).slice(0, 3)
    let allResults = []

    for (const title of titles) {
      const query = `${title} ${ep}`.trim()
      try {
        const results = await this.search(query, this.settings.useTorrent)
        const valid = results.filter(r => !/batch|complete|season/i.test(r.title))
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
            allResults = allResults.concat(results.map(r => ({ ...r, type: 'batch' })))
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
