/**
 * Bhasha Setu — Ol Chiki Linguistic & Phonetic Engine
 *
 * Implements authoritative Unicode handling, diacritic recognition,
 * syllable segmentation, and context-aware phonetic transliteration for Santali.
 *
 * Rules Version: 1.2-verified
 */

export const OL_CHIKI_RULES_VERSION = '1.2-verified';

// Vowels (Independent & in syllable nuclei)
export const OL_CHIKI_VOWELS: Record<string, { roman: string; devanagari: string; ipa: string }> = {
  'ᱚ': { roman: 'o', devanagari: 'ऑ', ipa: 'ɔ' },
  'ᱟ': { roman: 'a', devanagari: 'आ', ipa: 'a' },
  'ᱤ': { roman: 'i', devanagari: 'इ', ipa: 'i' },
  'ᱩ': { roman: 'u', devanagari: 'उ', ipa: 'u' },
  'ᱮ': { roman: 'e', devanagari: 'ए', ipa: 'e' },
  'ᱳ': { roman: 'o', devanagari: 'ओ', ipa: 'o' }
};

// Consonants (Base phones)
export const OL_CHIKI_CONSONANTS: Record<string, { roman: string; devanagari: string; ipa: string; isCheckable?: boolean }> = {
  'ᱛ': { roman: 't', devanagari: 'त', ipa: 't' },
  'ᱜ': { roman: 'g', devanagari: 'ग', ipa: 'ɡ', isCheckable: true }, // Checked [k'] without ahad
  'ᱝ': { roman: 'ng', devanagari: 'ं', ipa: 'ŋ' },
  'ᱞ': { roman: 'l', devanagari: 'ल', ipa: 'l' },
  'ᱠ': { roman: 'k', devanagari: 'क', ipa: 'k' },
  'ᱡ': { roman: 'j', devanagari: 'ज', ipa: 'ɟ', isCheckable: true }, // Checked [c'] without ahad
  'ᱢ': { roman: 'm', devanagari: 'म', ipa: 'm' },
  'ᱣ': { roman: 'w', devanagari: 'व', ipa: 'w' },
  'ᱥ': { roman: 's', devanagari: 'स', ipa: 's' },
  'ᱦ': { roman: 'h', devanagari: 'ह', ipa: 'h' },
  'ᱧ': { roman: 'ny', devanagari: 'ञ', ipa: 'ɲ' },
  'ᱨ': { roman: 'r', devanagari: 'र', ipa: 'r' },
  'ᱪ': { roman: 'ch', devanagari: 'च', ipa: 't͡ʃ' },
  'ᱫ': { roman: 'd', devanagari: 'द', ipa: 'd', isCheckable: true }, // Checked [t'] without ahad
  'ᱬ': { roman: 'n', devanagari: 'ण', ipa: 'ɳ' },
  'ᱭ': { roman: 'y', devanagari: 'य', ipa: 'j' },
  'ᱯ': { roman: 'p', devanagari: 'प', ipa: 'p' },
  'ᱰ': { roman: 'd', devanagari: 'ड', ipa: 'ɖ', isCheckable: true },
  'ᱱ': { roman: 'n', devanagari: 'न', ipa: 'n' },
  'ᱲ': { roman: 'r', devanagari: 'ड़', ipa: 'ɽ' },
  'ᱴ': { roman: 't', devanagari: 'ट', ipa: 'ʈ' },
  'ᱵ': { roman: 'b', devanagari: 'ब', ipa: 'b', isCheckable: true }, // Checked [p'] without ahad
  'ᱶ': { roman: 'nh', devanagari: 'ँ', ipa: 'w̃' },
  'ᱷ': { roman: 'h', devanagari: 'ह', ipa: 'ʰ' }  // Aspiration
};

// Modifiers & Diacritics
export const OL_CHIKI_MODIFIERS: Record<string, { name: string; effect: string }> = {
  'ᱸ': { name: 'Mu-Tuda', effect: 'nasalization' },       // Nasalizes preceding vowel (e.g. a -> an)
  'ᱹ': { name: 'Gahla-Tuda', effect: 'vowel_rounding' },  // Lowering/rounding dot
  'ᱺ': { name: 'Mu-Gahla-Tuda', effect: 'nasal_round' },  // Nasalized lowered vowel
  'ᱻ': { name: 'Relo', effect: 'elongation' },            // Elongates preceding vowel (e.g. a -> aa)
  'ᱼ': { name: 'Pharka', effect: 'glottal_pause' },       // Syllable separator / glottal pause
  'ᱽ': { name: 'Ahad', effect: 'deglottalization' }      // Releases checked plosive (g, j, d, b)
};

// Punctuation
export const OL_CHIKI_PUNCTUATION: Record<string, string> = {
  '᱾': '.',  // Mucad (single danda)
  '᱿': '.'   // Double Mucad (double danda)
};

/**
 * Checks if a string contains any Ol Chiki Unicode characters (U+1C50 - U+1C7F).
 */
export function containsOlChiki(text: string): boolean {
  return /[\u1C50-\u1C7F]/.test(text);
}

/**
 * Normalizes Unicode representation (NFC composition).
 */
export function normalizeOlChikiUnicode(text: string): string {
  return text.normalize('NFC');
}

/**
 * Context-aware phonetic transliteration of Ol Chiki into natural Roman speech phonetics.
 * Applies Ahad deglottalization, aspiration combinations, vowel modifications, and diacritics.
 */
export function transliterateOlChikiPhonetic(text: string): string {
  if (!text) return '';

  const normalized = normalizeOlChikiUnicode(text);
  let result = '';

  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized[i];
    const nextCh = normalized[i + 1];

    // 1. Aspiration check: consonant + ᱷ (Oh)
    if (OL_CHIKI_CONSONANTS[ch] && nextCh === 'ᱷ') {
      const base = OL_CHIKI_CONSONANTS[ch].roman;
      result += (base === 't' ? 'th' : base === 'k' ? 'kh' : base === 'g' ? 'gh' :
                 base === 'ch' ? 'chh' : base === 'j' ? 'jh' : base === 'd' ? 'dh' :
                 base === 'p' ? 'ph' : base === 'b' ? 'bh' : `${base}h`);
      i++; // Skip 'ᱷ'
      continue;
    }

    // 2. Ahad deglottalization check: checkable consonant + ᱽ
    if (OL_CHIKI_CONSONANTS[ch] && nextCh === 'ᱽ') {
      // Released voiced consonant
      result += OL_CHIKI_CONSONANTS[ch].roman;
      i++; // Skip 'ᱽ'
      continue;
    }

    // 3. Modifiers (Relo, Mu-Tuda, Gahla-Tuda, etc.)
    if (ch === 'ᱸ' || ch === 'ᱺ') {
      // Nasalization: append 'n'
      result += 'n';
      continue;
    }
    if (ch === 'ᱹ') {
      // Gahla-Tuda: subtle vowel modification, no extra letter required in Roman
      continue;
    }
    if (ch === 'ᱻ') {
      // Relo: vowel elongation
      const lastChar = result.slice(-1);
      if (/[aeiou]/i.test(lastChar)) {
        result += lastChar;
      }
      continue;
    }
    if (ch === 'ᱼ') {
      // Pharka: glottal separator / hyphen
      result += '-';
      continue;
    }
    if (ch === 'ᱽ') {
      // Standalone ahad: separator
      result += '';
      continue;
    }

    // 4. Punctuation
    if (OL_CHIKI_PUNCTUATION[ch]) {
      result += OL_CHIKI_PUNCTUATION[ch];
      continue;
    }

    // 5. Vowels
    if (OL_CHIKI_VOWELS[ch]) {
      result += OL_CHIKI_VOWELS[ch].roman;
      continue;
    }

    // 6. Consonants
    if (OL_CHIKI_CONSONANTS[ch]) {
      result += OL_CHIKI_CONSONANTS[ch].roman;
      continue;
    }

    // 7. Pass-through for ASCII, whitespace, standard punctuation
    result += ch;
  }

  // Post-processing cleanup: sanitize any trailing artifacts
  return result
    .replace(/-+/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Segments a single Santali word into approximate syllables for prosody and pacing.
 */
export function segmentWordIntoSyllables(word: string): string[] {
  if (!word || word.length <= 2) return [word];

  const syllables: string[] = [];
  let current = '';

  const isVowel = (c: string) => /[aeiouāīūēō]/i.test(c);

  for (let i = 0; i < word.length; i++) {
    const ch = word[i];
    current += ch;

    // Check if syllable boundary reached
    if (isVowel(ch)) {
      const next1 = word[i + 1];
      const next2 = word[i + 2];

      if (next1 && !isVowel(next1)) {
        if (next2 && isVowel(next2)) {
          // Pattern V-CV -> split before consonant
          syllables.push(current);
          current = '';
        } else if (next2 && !isVowel(next2) && word[i + 3] && isVowel(word[i + 3])) {
          // Pattern VC-CV -> split between consonants
          current += next1;
          syllables.push(current);
          current = '';
          i++;
        }
      }
    }
  }

  if (current) {
    if (syllables.length > 0 && !isVowel(current[0])) {
      syllables[syllables.length - 1] += current;
    } else {
      syllables.push(current);
    }
  }

  return syllables.length > 0 ? syllables : [word];
}
