// AniSearch extension for Hanami

export default {
  settings: {
    domain: 'api.anisearch.org'
  },

  async validate() {
    try {
      const res = await fetch(`https://${this.settings.domain}/torrents?limit=1`)
      return res.ok
    } catch {
      return false
    }
  },

  async search(queryStr, filters = {}) {
    let url = `https://${this.settings.domain}/torrents?`
    const params = new URLSearchParams()
    if (filters.anidbEid) params.append('eid', filters.anidbEid.toString())
    else if (filters.anidbAid) params.append('aid', filters.anidbAid.toString())
    else if (queryStr) params.append('name', `ilike.*${queryStr}*`)
    
    const res = await fetch(url + params.toString())
    if (!res.ok) return []
    const json = await res.json()
    if (!json || !Array.isArray(json)) return []

    return json.map(entry => ({
      title: entry.torrentName || entry.releaseName,
      link: entry.torrentFileUrl,
      seeders: 0,
      leechers: 0,
      downloads: 0,
      hash: entry.infohash,
      size: entry.length,
      accuracy: 'medium',
      type: /batch|complete|season/i.test(entry.torrentName || '') ? 'batch' : undefined,
      date: new Date(entry.createdAt)
    }))
  },

  async anime(options) {
    const ep = options.episode ? options.episode.toString().padStart(2, '0') : ''
    const titles = (options.titles || []).slice(0, 3)
    let allResults = []

    if (options.anidbEid) {
      try {
        const results = await this.search('', { anidbEid: options.anidbEid })
        if (results.length > 0) return results
      } catch (err) {}
    }

    for (const title of titles) {
      const query = `${title} ${ep}`.trim()
      try {
        const results = await this.search(query, options.anidbAid ? { anidbAid: options.anidbAid } : {})
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
      if (options.anidbAid) {
        try {
          const results = await this.search('', { anidbAid: options.anidbAid })
          const batch = results.filter(r => r.type === 'batch')
          if (batch.length > 0) return batch
        } catch (err) {}
      }

      for (const title of titles) {
        try {
          const results = await this.search(`${title} batch`, options.anidbAid ? { anidbAid: options.anidbAid } : {})
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
        const results = await this.search(title)
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
