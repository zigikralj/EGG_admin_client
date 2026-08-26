const fs = require('fs');
const path = require('path');

function findFiles(dir, filter, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      findFiles(filePath, filter, fileList);
    } else if (filter.test(filePath)) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const files = findFiles(path.join(__dirname, 'src'), /\.(tsx|ts)$/);
const iconMapping = new Map();

for (const file of files) {
  if (file.endsWith('icons.ts')) continue;
  
  let content = fs.readFileSync(file, 'utf8');
  
  // Find import { ... } from '.../icons';
  const importRegex = /import\s+\{([^}]+)\}\s+from\s+['"](?:\.\.\/)+components\/icons['"]|import\s+\{([^}]+)\}\s+from\s+['"](?:\.\.\/)+icons['"]|import\s+\{([^}]+)\}\s+from\s+['"]\.\/icons['"]|import\s+\{([^}]+)\}\s+from\s+['"]\.\/components\/icons['"]/g;
  
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    const importStr = match[1] || match[2] || match[3] || match[4];
    if (!importStr) continue;
    
    const icons = importStr.split(',').map(s => s.trim()).filter(Boolean);
    for (const icon of icons) {
      // Determine mui path
      let muiPath = icon;
      if (icon.endsWith('Icon')) {
        muiPath = icon.slice(0, -4);
      }
      iconMapping.set(icon, muiPath);
    }
  }
}

const sortedIcons = Array.from(iconMapping.keys()).sort();
const iconsTsContent = sortedIcons.map(icon => `export { default as ${icon} } from '@mui/icons-material/${iconMapping.get(icon)}';`).join('\n') + '\n';
fs.writeFileSync(path.join(__dirname, 'src/components/icons.ts'), iconsTsContent);

console.log(`Generated ${sortedIcons.length} exports for icons.ts`);
