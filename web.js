async function searchSources(q) {
  // A mock web stream scraper that returns a Big Buck Bunny stream
  // just to demonstrate HTTP stream scraping in the UI
  return [
    {
      id: "web_bunny",
      name: "[Web] Big Buck Bunny 1080p",
      type: "stream",
      quality: "1080p",
      url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
    }
  ];
}
