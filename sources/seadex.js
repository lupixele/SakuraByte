// SeaDex extension for Hanami

export default {
  settings: {
    domain: 'releases.moe'
  },

  async validate() {
    try {
      const res = await fetch(`https://${this.settings.domain}/api/collections/entries/records?page=1&perPage=1`)
      return res.ok
    } catch {
      return false
    }
  },

  async _fetchTorrents(anilistId, titles, episodeCount) {
    if (!anilistId) return []
    try {
      const res = await fetch(`https://${this.settings.domain}/api/collections/entries/records?page=1&perPage=1&filter=alID%3D%22${anilistId}%22&skipTotal=1&expand=trs`)
      const json = await res.json()
      if (!json.items || !json.items[0]?.expand?.trs?.length) return []
      
      const trs = json.items[0].expand.trs
      return trs
        .filter(torrent => torrent.infoHash !== "<redacted>" && (!episodeCount || episodeCount === 1 || torrent.files.length !== 1))
        .map(torrent => ({
          hash: torrent.infoHash,
          link: torrent.infoHash, // We only get infohash, so we return it as link (client will convert to magnet)
          title: torrent.files.length === 1 ? torrent.files[0].name : `[${torrent.releaseGroup}] ${titles[0] || 'Unknown Title'} ${torrent.dualAudio ? "Dual Audio" : ""}`,
          size: torrent.files.reduce((prev, curr) => prev + curr.length, 0),
          type: torrent.isBest ? "best" : "alt",
          date: new Date(torrent.created),
          seeders: 0, // SeaDex does not provide seeders
          leechers: 0,
          downloads: 0,
          accuracy: "high"
        }))
    } catch {
      return []
    }
  },

  async anime(options) {
    // If querying an episode, episodeCount=1
    return this._fetchTorrents(options.anilistId, options.titles || [], options.episode ? 1 : undefined)
  },

  async movie(options) {
    return this._fetchTorrents(options.anilistId, options.titles || [], 1)
  },

  async series(options) {
    return this.anime(options)
  }
}
