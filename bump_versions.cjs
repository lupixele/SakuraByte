const fs = require('fs');
const file = 'P:/Projects/SakuraByte/index.json';
let extensions = JSON.parse(fs.readFileSync(file, 'utf8'));

for (let ext of extensions) {
  if (['nyaa', 'vidlink', 'vidsrc'].includes(ext.id)) {
    let parts = ext.version.split('.');
    parts[2] = parseInt(parts[2]) + 1;
    ext.version = parts.join('.');
  }
}

fs.writeFileSync(file, JSON.stringify(extensions, null, 2), 'utf8');
console.log('Bumped versions!');
