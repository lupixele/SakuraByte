# Kureha Grove Extension Development Guide

Welcome to the Grove extension ecosystem! This guide explains how to build, test, and deploy custom scrapers and extensions for **Kureha**, relying on its powerful **Grove** sandboxed architecture.

## What is Grove?

**Grove** is Kureha's built-in extension execution environment. Because running untrusted third-party JavaScript is extremely dangerous, Kureha spins up an isolated, sandboxed Electron `UtilityProcess`. Inside this process, your extension runs inside a strict Node.js `vm` instance.

This guarantees:
- **Maximum Security:** No access to the user's filesystem (`fs`), environment variables (`process`), or native OS commands.
- **Blazing Performance:** Executing natively in the V8 engine, with no heavy browser instances required.
- **CORS Bypass:** Because the code runs in the Electron Main process (Utility Process), the native `fetch()` API automatically bypasses all Cross-Origin Resource Sharing (CORS) restrictions. You can scrape any website directly!

## Extension Structure

Every extension is a single, self-contained JavaScript file. The only strict requirement is that it must expose a globally scoped, asynchronous function named `searchSources(q)`.

### The `searchSources(q)` API

When a user searches for something in Kureha, it passes the raw search string to your extension via this function.

```javascript
// Example: minimal.js
async function searchSources(q) {
  // `q` is the text query (e.g., "Frieren 1080p")
  
  const url = `https://some-anime-site.com/search?q=${encodeURIComponent(q)}`;
  const response = await fetch(url);
  const data = await response.json();
  
  return data.map(item => ({
    id: `minimal_${item.id}`,
    sourceName: "Minimal Scraper",
    name: item.title,
    type: "torrent", // or "stream" if providing an M3U8/MP4 link
    quality: "1080p", // 4K, 1080p, 720p, 480p, Unknown
    size: "1.2 GB",   // Formatted string
    seeds: item.seeders || 0,
    hash: item.infoHash // Required for type: "torrent"
  }));
}
```

### The Return Object

Your `searchSources` function must return an array of objects. The Kureha UI expects the following fields:

- `id` (String): A unique identifier for this result (usually prefixed with your extension name).
- `sourceName` (String): The name of your extension to display in the UI (e.g., "AnimeTosho").
- `name` (String): The full title of the release or torrent.
- `type` (String): Either `"torrent"` or `"stream"`.
- `quality` (String): Visual quality indicator (e.g., `"4K"`, `"1080p"`, `"720p"`, `"480p"`).
- `size` (String): Human-readable file size (e.g., `"500 MB"`, `"1.2 GB"`).
- `seeds` (Number): Number of active seeders (for torrents).
- `hash` (String): The raw torrent InfoHash (required if `type === "torrent"`). Kureha will automatically handle injecting UDP/TCP/HTTP trackers into this hash!
- `url` (String): The direct `.m3u8` or `.mp4` link (required if `type === "stream"`).

## Exposed APIs and Capabilities

While `fs` and `process` are blocked, Grove provides powerful native tools directly to your script:

1. **`fetch(url, options)`**: Standard web fetch. No CORS restrictions.
2. **`cheerio`**: Pre-loaded for insanely fast HTML parsing (like jQuery).
   - *Example:* `const $ = cheerio.load(await response.text());`
3. **`crypto`**: Node's built-in crypto module for hashing or decoding signatures.
4. **`window.Native.extensions.extractM3U8(url)`**: RPC call to Kureha's powerful main-process video extractor. If your scraper finds an iframe (like Vidstreaming), you can pass it to this function to attempt auto-extraction.
5. **`window.Native.extensions.proxyFetch(url, opts)`**: RPC call to fetch data through Kureha's internal proxy systems (useful if standard `fetch` is being blocked by bot-protection).

## Managing the Manifest (`index.json`)

To make Kureha recognize your extension, it must be declared in an `index.json` manifest.

```json
{
  "id": "my_scraper",
  "name": "My Scraper",
  "version": "1.0.0",
  "description": "Scrapes MyAnimeSite for 1080p torrents.",
  "main": "https://raw.githubusercontent.com/username/repo/main/minimal.js",
  "update": "gh:username/repo"
}
```

When users paste `gh:username/repo` into Kureha's extension menu, Kureha pulls this `index.json` via `esm.sh` and maps it directly to the UI.

## Best Practices

1. **Fail Gracefully**: Wrap your logic in `try/catch`. If the target site goes down, return `[]` instead of throwing an unhandled exception that crashes the VM.
2. **Timeout Awareness**: Kureha forcibly kills any script taking longer than **30 seconds**.
3. **Avoid AniList/MAL logic**: Kureha's search is fundamentally text-based. You don't need complex ID mappers. Just pass the raw text query to the site!

---
*Happy scraping!*
