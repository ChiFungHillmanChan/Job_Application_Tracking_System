// Create this as route-file-checker.js in the backend directory
// Check the actual content and structure of route files

const fs = require('fs');
const path = require('path');

console.log('🔍 Checking route file contents...\n');

// Function to safely read and analyze a file
function analyzeRouteFile(filePath, fileName) {
  console.log(`Analyzing ${fileName}:`);
  
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`   ❌ File does not exist: ${filePath}\n`);
      return;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n').length;
    const size = content.length;
    
    console.log(`   📄 File exists: ${filePath}`);
    console.log(`   📏 Size: ${size} characters, ${lines} lines`);
    
    // Check for empty file
    if (content.trim().length === 0) {
      console.log(`   ⚠️  File is empty!`);
    }
    
    // Look for potential route definition issues
    const routePatterns = content.match(/router\.(get|post|put|delete|patch|use)\s*\(\s*['"`]([^'"`]+)['"`]/g);
    
    if (routePatterns) {
      console.log(`   🛣️  Found ${routePatterns.length} route definitions:`);
      routePatterns.forEach((pattern, index) => {
        console.log(`      ${index + 1}. ${pattern}`);
        
        // Check for potentially problematic patterns
        if (pattern.includes(':/:') || pattern.includes('::') || pattern.includes(':)') || pattern.includes(':[')) {
          console.log(`         ⚠️  Potentially malformed route pattern!`);
        }
      });
    } else {
      console.log(`   ℹ️  No obvious route patterns found`);
    }
    
    // Check for require statements
    const requires = content.match(/require\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g);
    if (requires) {
      console.log(`   📦 Dependencies: ${requires.length} require statements`);
    }
    
    console.log('   ✅ File analysis complete\n');
    
  } catch (error) {
    console.log(`   ❌ Error reading file: ${error.message}\n`);
  }
}

// Check each route file
const routeFiles = [
  { path: './routes/auth.js', name: 'Auth Routes' },
  { path: './routes/jobs.js', name: 'Jobs Routes' },
  { path: './routes/resumes.js', name: 'Resume Routes' }
];

routeFiles.forEach(file => {
  analyzeRouteFile(file.path, file.name);
});

// Also check for any other route files
console.log('🔍 Scanning for other route files...');

try {
  const routesDir = './routes';
  if (fs.existsSync(routesDir)) {
    const files = fs.readdirSync(routesDir);
    console.log(`Found files in routes directory: ${files.join(', ')}`);
    
    files.forEach(file => {
      if (file.endsWith('.js') && !['auth.js', 'jobs.js', 'resumes.js'].includes(file)) {
        console.log(`\n📁 Additional route file found: ${file}`);
        analyzeRouteFile(path.join(routesDir, file), file);
      }
    });
  }
} catch (error) {
  console.log(`Error scanning routes directory: ${error.message}`);
}

console.log('✅ Route file analysis complete!');