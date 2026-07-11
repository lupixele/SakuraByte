const engines = [
    { name: 'YTS(+)', active: true },
    { name: 'EZTV(+)', active: true },
    { name: 'RARBG(+)', active: true },
    { name: '1337x(+)', active: true },
    { name: 'ThePirateBay(+)', active: true },
    { name: 'KickassTorrents(+)', active: true },
    { name: 'TorrentGalaxy(+)', active: true },
    { name: 'MagnetDL(+)', active: true },
    { name: 'NyaaSi(+)', active: true },
    { name: 'TokyoTosho(+)', active: false },
    { name: 'AniDex(+)', active: false }
];

const container = document.getElementById('engines-container');
const selectAllBtn = document.getElementById('select-all-engines');
const searchBtn = document.getElementById('search-btn');
const searchInput = document.getElementById('search-input');
const resultsContainer = document.getElementById('results-container');
const resultsList = document.getElementById('results-list');

function renderEngines() {
    container.innerHTML = '';
    engines.forEach((engine) => {
        const btn = document.createElement('button');
        btn.className = `engine-pill ${engine.active ? '' : 'inactive'}`;
        btn.textContent = engine.name;
        btn.onclick = () => {
            engine.active = !engine.active;
            renderEngines();
        };
        container.appendChild(btn);
    });
}

selectAllBtn.onclick = () => {
    const allActive = engines.every(e => e.active);
    engines.forEach(e => e.active = !allActive);
    renderEngines();
};

searchBtn.onclick = async () => {
    const query = searchInput.value.trim();
    if (!query) return;

    searchBtn.textContent = 'Searching Cinemeta...';
    searchBtn.disabled = true;
    resultsList.innerHTML = '<div style="color: #8c96a8;">Loading results...</div>';
    resultsContainer.style.display = 'block';

    try {
        // Step 1: Query Cinemeta for the IMDb ID
        const cinemetaUrl = `https://v3-cinemeta.strem.io/catalog/movie/top/search=${encodeURIComponent(query)}.json`;
        const cinemetaRes = await fetch(cinemetaUrl);
        const cinemetaData = await cinemetaRes.json();
        
        if (!cinemetaData.metas || cinemetaData.metas.length === 0) {
            resultsList.innerHTML = '<div style="color: #ff5e5e;">No movies found for that query.</div>';
            return;
        }

        const movie = cinemetaData.metas[0];
        const imdbId = movie.imdb_id;
        
        if (!imdbId) {
             resultsList.innerHTML = '<div style="color: #ff5e5e;">Found a movie but it has no IMDb ID.</div>';
             return;
        }

        searchBtn.textContent = `Found "${movie.name}" - Fetching Torrents...`;

        // Step 2: Query Torrentio
        // Optional: construct providers string if Torrentio supports it via URL (e.g. /providers=yts,eztv)
        // For now we'll just hit the default endpoint which searches configured/default providers.
        // Use our local proxy to bypass CORS reliably
        const torrentioUrl = `/api/search/${imdbId}.json`;
        const torrentioRes = await fetch(torrentioUrl);
        const torrentioData = await torrentioRes.json();
        
        if (!torrentioData.streams || torrentioData.streams.length === 0) {
            resultsList.innerHTML = `<div style="color: #ff5e5e;">No streams found for "${movie.name}".</div>`;
            return;
        }

        renderResults(movie, torrentioData.streams);

    } catch (error) {
        console.error(error);
        resultsList.innerHTML = `<div style="color: #ff5e5e;">An error occurred during search. Check console for details.</div>`;
    } finally {
        searchBtn.textContent = 'Search';
        searchBtn.disabled = false;
    }
};

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchBtn.click();
    }
});

function renderResults(movie, streams) {
    resultsList.innerHTML = '';
    
    // Header showing the movie we are searching for
    const movieHeader = document.createElement('div');
    movieHeader.style.marginBottom = '20px';
    movieHeader.style.padding = '15px';
    movieHeader.style.backgroundColor = 'rgba(47, 174, 73, 0.1)';
    movieHeader.style.border = '1px solid #2fae49';
    movieHeader.style.borderRadius = '8px';
    movieHeader.innerHTML = `<strong style="color: #2fae49; font-size: 16px;">Results for: ${movie.name} (${movie.year || 'N/A'})</strong><br><span style="color: #8c96a8; font-size: 12px;">IMDb ID: ${movie.imdb_id}</span>`;
    resultsList.appendChild(movieHeader);

    streams.forEach(stream => {
        const resultDiv = document.createElement('div');
        resultDiv.className = 'result-item';
        
        const titleLine = document.createElement('div');
        titleLine.style.marginBottom = '8px';
        titleLine.style.display = 'flex';
        titleLine.style.alignItems = 'center';
        titleLine.style.gap = '10px';
        titleLine.style.flexWrap = 'wrap';

        // Extract provider from stream title or use default
        let provider = 'Torrent';
        if (stream.name) {
             const parts = stream.name.split('\n');
             if (parts.length > 0) provider = parts[0];
        }

        const badge = document.createElement('span');
        badge.className = 'source-badge';
        badge.textContent = provider;
        
        // Use the title from the stream
        const titleLink = document.createElement('a');
        titleLink.className = 'result-title';
        titleLink.href = stream.url || '#';
        titleLink.textContent = stream.title ? stream.title.split('\n').join(' - ') : 'Unknown Title';
        
        titleLine.appendChild(badge);
        titleLine.appendChild(titleLink);
        
        const descDiv = document.createElement('div');
        descDiv.className = 'result-desc';
        // Add info about resolution/size if available in the title
        descDiv.textContent = 'Click the title to open the magnet link. Ensure you have a torrent client installed.';
        
        resultDiv.appendChild(titleLine);
        resultDiv.appendChild(descDiv);
        
        resultsList.appendChild(resultDiv);
    });

    resultsContainer.scrollIntoView({ behavior: 'smooth' });
}

// Initial render
renderEngines();
