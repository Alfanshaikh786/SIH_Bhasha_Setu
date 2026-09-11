async function testGoogle() {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=sat&dt=t&q=Good%20Morning%20Students`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log('Google response:', JSON.stringify(data));
    const translated = data[0].map(p => p[0]).join('').trim();
    console.log('Translated text:', translated);
    for (const ch of translated) {
      console.log(ch, 'U+' + ch.charCodeAt(0).toString(16).toUpperCase());
    }
  } catch (e) {
    console.error('Fetch error:', e);
  }
}
testGoogle();
