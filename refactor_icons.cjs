const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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
const iconSet = new Set();
const fileUpdates = [];

for (const file of files) {
  if (file.endsWith('icons.ts')) continue;
  
  let content = fs.readFileSync(file, 'utf8');
  const importRegex = /import\s+([A-Za-z0-9_]+)\s+from\s+['"]@mui\/icons-material\/([A-Za-z0-9_]+)['"];?/g;
  
  let match;
  const fileIcons = new Set();
  let newContent = content;
  let hasMatch = false;
  
  while ((match = importRegex.exec(content)) !== null) {
    const iconName = match[1];
    const muiName = match[2];
    iconSet.add(muiName);
    fileIcons.add(iconName);
    hasMatch = true;
  }
  
  if (hasMatch) {
    // Remove all old imports
    newContent = newContent.replace(importRegex, '');
    
    // Calculate relative path to icons.ts
    const fileDir = path.dirname(file);
    const iconsPath = path.join(__dirname, 'src/components/icons');
    let relPath = path.relative(fileDir, iconsPath);
    if (!relPath.startsWith('.')) {
      relPath = './' + relPath;
    }
    
    // Add new import at the top
    const newImport = `import { ${Array.from(fileIcons).join(', ')} } from '${relPath}';\n`;
    
    // Insert after last import, or at top
    const lastImportIndex = newContent.lastIndexOf('import ');
    if (lastImportIndex !== -1) {
      const endOfLastImport = newContent.indexOf('\n', lastImportIndex) + 1;
      newContent = newContent.slice(0, endOfLastImport) + newImport + newContent.slice(endOfLastImport);
    } else {
      newContent = newImport + newContent;
    }
    
    fs.writeFileSync(file, newContent);
  }
}

// Generate icons.ts
const iconsTsContent = Array.from(iconSet).sort().map(icon => `export { default as ${icon} } from '@mui/icons-material/${icon}';`).join('\n') + '\n';
fs.writeFileSync(path.join(__dirname, 'src/components/icons.ts'), iconsTsContent);

console.log(`Extracted ${iconSet.size} icons across ${files.length} files.`);
