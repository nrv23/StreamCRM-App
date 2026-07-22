const fs = require('fs');
const path = require('path');

const walkSync = function(dir, filelist) {
  const files = fs.readdirSync(dir);
  filelist = filelist || [];
  files.forEach(function(file) {
    if (fs.statSync(path.join(dir, file)).isDirectory()) {
      filelist = walkSync(path.join(dir, file), filelist);
    }
    else {
      if (file.endsWith('.ts')) {
        filelist.push(path.join(dir, file));
      }
    }
  });
  return filelist;
};

const dirs = ['src', 'tests'];
let files = [];
dirs.forEach(d => {
    if (fs.existsSync(d)) {
        files = walkSync(d, files);
    }
});

let updatedCount = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace .js with .ts in import/export paths
    let newContent = content.replace(/(import|export)([\s\S]*?from\s*)(['"])([^'"]+)\.js\3/g, '$1$2$3$4.ts$3');
    
    // Catch bare imports: import './file.js'
    newContent = newContent.replace(/import(\s*)(['"])([^'"]+)\.js\2/g, 'import$1$2$3.ts$2');

    // Catch dynamic imports: import('./file.js')
    newContent = newContent.replace(/import\(\s*(['"])([^'"]+)\.js\1\s*\)/g, 'import($1$2.ts$1)');
    
    if (content !== newContent) {
        fs.writeFileSync(file, newContent, 'utf8');
        updatedCount++;
    }
});

console.log(`Updated ${updatedCount} files.`);
