// NekoBT extension for Hanami

export default {
  settings: {
    domain: 'nekobt.to'
  },

  async validate() {
    try {
      const res = await fetch(`https://${this.settings.domain}/api/v1/announcements`)
      return res.ok
    } catch {
      return false
    }
  },

  async search(queryStr) {
    const res = await fetch(`https://${this.settings.domain}/api/v1/torrents/search?query=${encodeURIComponent(queryStr)}`)
    const json = await res.json()
    if (!json.data || !json.data.results) return []

    return json.data.results.map(entry => ({
      title: entry.title,
      link: `https://${this.settings.domain}/api/v1/torrents/${entry.id}/download?public=true`,
      seeders: Number(entry.seeders) || 0,
      leechers: Number(entry.leechers) || 0,
      downloads: Number(entry.completed) || 0,
      hash: entry.infohash,
      size: Number(entry.filesize) || 0,
      accuracy: 'medium',
      date: new Date(entry.uploaded_at)
    }))
  },

  async anime(options) {
    const ep = options.episode ? options.episode.toString().padStart(2, '0') : ''
    const titles = (options.titles || []).slice(0, 3)
    let allResults = []

    for (const title of titles) {
      const query = `${title} ${ep}`.trim()
      try {
        const results = await this.search(query)
        const valid = results.filter(r => !/batch|complete|season/i.test(r.title))
        if (valid.length > 0) {
          allResults = allResults.concat(valid)
          break
        }
      } catch (err) {
        continue
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
