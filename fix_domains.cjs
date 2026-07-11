const fs = require('fs');

const replaceInFile = (file, oldStr, newStr) => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(new RegExp(oldStr, 'g'), newStr);
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Replaced in ${file}`);
  }
};

replaceInFile('P:/Projects/SakuraByte/nyaa.js', 'nyaa.si', 'nyaa.iss.one');
replaceInFile('P:/Projects/SakuraByte/vidlink.js', 'vidlink.pro', 'vidlink.online');
replaceInFile('P:/Projects/SakuraByte/vidsrc.js', 'vidsrc.me', 'vidsrc.in');

console.log('Fixed Domains in SakuraByte!');
