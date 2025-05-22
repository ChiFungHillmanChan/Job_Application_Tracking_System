// Create this as inspect-path-to-regexp.js in the backend directory
// Inspect the path-to-regexp package to understand the error

const fs = require('fs');
const path = require('path');

console.log('🔍 Inspecting path-to-regexp package...\n');

// Check if the package exists
const pathToRegexpDir = './node_modules/path-to-regexp';
const indexPath = path.join(pathToRegexpDir, 'dist/index.js');
const packageJsonPath = path.join(pathToRegexpDir, 'package.json');

console.log('Checking paths:');
console.log('Package directory:', pathToRegexpDir);
console.log('Index file:', indexPath);
console.log('Package.json:', packageJsonPath);
console.log('');

// Check package.json
if (fs.existsSync(packageJsonPath)) {
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    console.log('📦 path-to-regexp package info:');
    console.log('  Name:', packageJson.name);
    console.log('  Version:', packageJson.version);
    console.log('  Main:', packageJson.main);
    console.log('  Description:', packageJson.description);
    console.log('');
  } catch (error) {
    console.log('❌ Error reading package.json:', error.message);
  }
} else {
  console.log('❌ package.json not found');
}

// Check the problematic index.js file
if (fs.existsSync(indexPath)) {
  try {
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    const lines = indexContent.split('\n');
    
    console.log('📄 Index.js file info:');
    console.log('  File size:', indexContent.length, 'characters');
    console.log('  Total lines:', lines.length);
    console.log('');
    
    // Show lines around line 73 (where the error occurs)
    console.log('🔍 Content around line 73 (error location):');
    const startLine = Math.max(0, 70);
    const endLine = Math.min(lines.length, 80);
    
    for (let i = startLine; i < endLine; i++) {
      const lineNum = i + 1;
      const marker = lineNum === 73 ? '>>> ' : '    ';
      console.log(`${marker}${lineNum}: ${lines[i]}`);
    }
    
    console.log('');
    
    // Look for the specific error message
    const errorLine = lines[72]; // Line 73 (0-indexed)
    if (errorLine) {
      console.log('🚨 Line 73 content:');
      console.log(`"${errorLine.trim()}"`);
      console.log('');
    }
    
    // Search for the error message in the file
    if (indexContent.includes('Missing parameter name')) {
      console.log('🔍 Found "Missing parameter name" error message in file');
      
      // Find all occurrences
      const errorLines = lines
        .map((line, index) => ({ line, number: index + 1 }))
        .filter(({ line }) => line.includes('Missing parameter name'));
        
      errorLines.forEach(({ line, number }) => {
        console.log(`  Line ${number}: ${line.trim()}`);
      });
      console.log('');
    }
    
    // Look for DEBUG_URL references
    if (indexContent.includes('DEBUG_URL')) {
      console.log('🔍 Found DEBUG_URL references:');
      const debugLines = lines
        .map((line, index) => ({ line, number: index + 1 }))
        .filter(({ line }) => line.includes('DEBUG_URL'));
        
      debugLines.forEach(({ line, number }) => {
        console.log(`  Line ${number}: ${line.trim()}`);
      });
      console.log('');
    }
    
  } catch (error) {
    console.log('❌ Error reading index.js:', error.message);
  }
} else {
  console.log('❌ dist/index.js not found');
  
  // Check for alternative locations
  const alternatives = [
    './node_modules/path-to-regexp/index.js',
    './node_modules/path-to-regexp/lib/index.js',
    './node_modules/path-to-regexp/src/index.js'
  ];
  
  console.log('🔍 Checking alternative locations:');
  alternatives.forEach(altPath => {
    if (fs.existsSync(altPath)) {
      console.log(`  ✅ Found: ${altPath}`);
    } else {
      console.log(`  ❌ Not found: ${altPath}`);
    }
  });
}

// Check what's calling path-to-regexp
console.log('🔍 Checking which packages depend on path-to-regexp...');
try {
  const packageLockPath = './package-lock.json';
  if (fs.existsSync(packageLockPath)) {
    const packageLock = JSON.parse(fs.readFileSync(packageLockPath, 'utf8'));
    
    // Find dependencies that use path-to-regexp
    const findDependents = (packages, parentName = 'root') => {
      const dependents = [];
      
      for (const [name, info] of Object.entries(packages || {})) {
        if (info.dependencies && info.dependencies['path-to-regexp']) {
          dependents.push({
            package: name,
            parent: parentName,
            version: info.dependencies['path-to-regexp']
          });
        }
        
        if (info.dependencies) {
          dependents.push(...findDependents(info.dependencies, name));
        }
      }
      
      return dependents;
    };
    
    const dependents = findDependents(packageLock.packages);
    
    if (dependents.length > 0) {
      console.log('📦 Packages that depend on path-to-regexp:');
      dependents.forEach(dep => {
        console.log(`  ${dep.package} (${dep.version}) via ${dep.parent}`);
      });
    } else {
      console.log('  No direct dependents found in package-lock.json');
    }
    
  } else {
    console.log('  package-lock.json not found');
  }
} catch (error) {
  console.log('❌ Error checking dependents:', error.message);
}

console.log('\n✅ path-to-regexp inspection complete');