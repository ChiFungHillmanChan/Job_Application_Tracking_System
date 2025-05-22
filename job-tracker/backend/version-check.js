// Create this as version-check.js in the backend directory
// Check versions of critical packages

const fs = require('fs');
const path = require('path');

console.log('🔍 Checking versions and package compatibility...\n');

// Check Node.js version
console.log('Node.js version:', process.version);
console.log('Platform:', process.platform);
console.log('Architecture:', process.arch);
console.log('');

// Check package.json
try {
  const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  console.log('📦 Dependencies from package.json:');
  
  Object.entries(packageJson.dependencies || {}).forEach(([name, version]) => {
    console.log(`  ${name}: ${version}`);
  });
  
  console.log('\n📦 DevDependencies from package.json:');
  Object.entries(packageJson.devDependencies || {}).forEach(([name, version]) => {
    console.log(`  ${name}: ${version}`);
  });
  
} catch (error) {
  console.log('❌ Error reading package.json:', error.message);
}

// Check installed versions in node_modules
console.log('\n🔍 Checking installed package versions...');

const criticalPackages = [
  'express',
  'path-to-regexp',
  'cors'
];

criticalPackages.forEach(packageName => {
  try {
    const packagePath = `./node_modules/${packageName}/package.json`;
    if (fs.existsSync(packagePath)) {
      const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      console.log(`  ${packageName}: ${pkg.version} (installed)`);
    } else {
      console.log(`  ${packageName}: NOT FOUND in node_modules`);
    }
  } catch (error) {
    console.log(`  ${packageName}: ERROR reading package info`);
  }
});

// Check for package-lock.json
console.log('\n🔒 Lock file status:');
if (fs.existsSync('./package-lock.json')) {
  console.log('  ✅ package-lock.json exists');
} else {
  console.log('  ❌ package-lock.json missing');
}

console.log('\n✅ Version check complete');