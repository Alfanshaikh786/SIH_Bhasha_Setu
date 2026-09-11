const fs = require('fs');
const path = require('path');

// Let's test the translationProviders for "Good Morning Students"
const input = "Good Morning Students";
console.log('Testing Input:', input);

// Check phrase bank
const tsContent = fs.readFileSync('src/services/translationProviders.ts', 'utf8');
console.log('translationProviders.ts length:', tsContent.length);

// Let's check what onlineProvider does in translationProviders.ts
const matchOnline = tsContent.match(/class OnlineTranslationProvider[\s\S]*?\n\}/);
if (matchOnline) {
  console.log('Found OnlineTranslationProvider implementation');
}
