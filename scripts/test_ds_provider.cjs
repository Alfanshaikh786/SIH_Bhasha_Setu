const fs = require('fs');

// Test what localDbProvider and santaliDatasetProvider return
// Let's check how santaliDatasetProvider works
const code = fs.readFileSync('src/services/translationProviders.ts', 'utf8');

// View SantaliDatasetProvider
const matchDs = code.match(/class SantaliDatasetProvider[\s\S]*?\n\}/);
console.log('SantaliDatasetProvider implementation:');
console.log(matchDs ? matchDs[0] : 'Not found');
