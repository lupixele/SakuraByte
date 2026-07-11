const fs = require('fs');
const file = 'P:/Projects/SakuraByte/index.json';
let extensions = JSON.parse(fs.readFileSync(file, 'utf8'));

extensions = extensions.filter(e => e.id !== 'torrentio' && e.id !== 'superflix');

fs.writeFileSync(file, JSON.stringify(extensions, null, 2), 'utf8');

if (fs.existsSync('P:/Projects/SakuraByte/torrentio.js')) {
    fs.unlinkSync('P:/Projects/SakuraByte/torrentio.js');
}
if (fs.existsSync('P:/Projects/SakuraByte/superflix.js')) {
    fs.unlinkSync('P:/Projects/SakuraByte/superflix.js');
}

console.log('Removed legacy stremio addons from SakuraByte!');
