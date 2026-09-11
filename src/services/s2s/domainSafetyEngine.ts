/**
 * Bhasha Setu — S2S Domain Safety & Never-Guess Engine
 * 
 * Solves the critical architectural problem:
 * "A correct transcription can still produce an unreliable translation."
 * 
 * Evaluates:
 * 1. ASR Confidence (Acoustic clarity only: 0.0 - 1.0)
 * 2. Translation Confidence (Semantic reliability only: 0.0 - 1.0)
 * 3. Domain Risk (Healthcare vs Education vs Agri vs General)
 * 
 * Enforces the "Never-Guess Policy":
 * - In Healthcare and Critical Clinical contexts, strict reliability thresholds are applied.
 * - Under-confident utterances are transparently marked as 'needs_review' rather than
 *   silently presenting hallucinated or risky tribal words as verified.
 */

import {
  DomainCategory,
  RiskLevel,
  DomainRiskAssessment,
  FinalTurnReliability,
  ConfidenceTier
} from './s2sTypes';

export class DomainSafetyEngine {
  // Domain keyword lexicons (multilingual: English, Hindi transliterated/Devanagari, Santali Ol Chiki/Roman)
  private static readonly CRITICAL_HEALTHCARE_KEYWORDS = [
    'sickle cell', 'ᱥᱤᱠᱤᱞ ᱥᱮᱞ', 'sikil sel',
    'blood', 'ᱢᱟᱭᱟᱢ', 'mayam', 'खून', 'रक्त',
    'dose', 'dosage', 'खुराक', 'ᱨᱟᱱ ᱡᱚᱢ',
    'fever', 'ruwa', 'ᱨᱩᱣᱟᱹ', 'बुखार',
    'pain', 'hasu', 'ᱦᱟᱹᱥᱩ', 'दर्द',
    'emergency', 'आपातकाल', 'गंभीर',
    'poison', 'विष', 'ᱡᱚᱦᱚᱨ',
    'pregnant', 'pregnancy', 'गर्भवती', 'ᱜᱤᱫᱽᱨᱟᱹ ᱢᱮᱱᱟᱜ',
    'infection', 'संक्रमण'
  ];

  private static readonly HEALTHCARE_KEYWORDS = [
    'hospital', 'ᱦᱟᱥᱯᱟᱛᱟᱞ', 'haspatal', 'अस्पताल',
    'doctor', 'डाक्टर', 'डॉक्टर',
    'medicine', 'ᱨᱟᱱ', 'ran', 'दवा', 'औषधि',
    'nurse', 'सिस्टर', 'నర్సు',
    'clinic', 'स्वास्थ्य', 'ᱠᱞᱤᱱᱤᱠ',
    'test', 'ᱵᱤᱰᱟᱹᱣ', 'bidaw', 'जांच',
    'ill', 'sick', 'बीमार', 'ᱨᱩᱣᱟᱹᱜ'
  ];

  private static readonly EDUCATION_KEYWORDS = [
    'school', 'ᱟᱥᱲᱟ', 'asra', 'विद्यालय', 'स्कूल',
    'teacher', 'मास्टर', 'शिक्षक', 'ᱜᱩᱨᱩ', 'guru',
    'book', 'ᱯᱩᱛᱷᱤ', 'puthi', 'किताब', 'पुस्तक',
    'student', 'छात्र', 'विद्यार्थी', 'ᱯᱟᱹᱴᱷᱩᱣᱟᱹ',
    'read', 'reading', 'ᱯᱟᱲᱦᱟᱣ', 'parhao', 'पढ़ना',
    'write', 'writing', 'ᱚᱞ', 'ol', 'लिखना',
    'ol chiki', 'ᱚᱞ ᱪᱤᱠᱤ',
    'class', 'classroom', 'कक्षा', 'শ্রেণী'
  ];

  private static readonly AGRICULTURE_KEYWORDS = [
    'farm', 'field', 'ᱠᱷᱮᱛ', 'khet', 'खेत',
    'seed', 'seeds', 'ᱤᱛᱟᱹ', 'ita', 'बीज',
    'crop', 'harvest', 'ᱯᱷᱚᱥᱚᱞ', 'फसल',
    'sow', 'sowing', 'ᱤᱛᱟᱹ ᱮᱨ', 'बोना',
    'cow', 'ᱜᱟᱹᱭ', 'gai', 'गाय',
    'ox', 'ᱫᱟᱸᱜᱽᱨᱟ', 'dangra', 'बैल',
    'plough', 'नांगल', 'ᱥᱤ',
    'water', 'ᱫᱟᱜ', 'daag', 'पानी'
  ];

  private static readonly ADMINISTRATION_KEYWORDS = [
    'ration', 'राशन', 'ᱨᱟᱥᱚᱱ',
    'aadhaar', 'आधार',
    'block', 'bdo', 'ब्लॉक', 'प्रखंड',
    'scheme', 'योजना', 'ᱯᱚᱱᱛᱷᱟ',
    'panchayat', 'पंचायत', 'ᱯᱟᱸᱪᱟᱭᱟᱛ',
    'officer', 'अधिकारी',
    'certificate', 'प्रमाणपत्र'
  ];

  /**
   * Identifies the primary operational domain of an utterance.
   */
  public static classifyDomain(sourceText: string, targetText: string = ''): DomainRiskAssessment {
    const combined = `${sourceText.toLowerCase()} ${targetText.toLowerCase()}`;
    const detectedKeywords: string[] = [];

    // 1. Check Critical Healthcare
    for (const kw of this.CRITICAL_HEALTHCARE_KEYWORDS) {
      if (combined.includes(kw.toLowerCase())) {
        detectedKeywords.push(kw);
      }
    }
    if (detectedKeywords.length > 0) {
      return {
        domain: 'CRITICAL_HEALTHCARE',
        riskLevel: 'critical',
        requiresReview: false, // Calculated further in evaluateTurn
        safetyPassed: true,
        detectedKeywords,
        riskExplanation: `Contains clinical terms: ${detectedKeywords.slice(0, 3).join(', ')}`
      };
    }

    // 2. Check General Healthcare
    for (const kw of this.HEALTHCARE_KEYWORDS) {
      if (combined.includes(kw.toLowerCase())) {
        detectedKeywords.push(kw);
      }
    }
    if (detectedKeywords.length > 0) {
      return {
        domain: 'HEALTHCARE',
        riskLevel: 'high',
        requiresReview: false,
        safetyPassed: true,
        detectedKeywords,
        riskExplanation: `Contains healthcare context: ${detectedKeywords.slice(0, 3).join(', ')}`
      };
    }

    // 3. Check Education
    for (const kw of this.EDUCATION_KEYWORDS) {
      if (combined.includes(kw.toLowerCase())) {
        detectedKeywords.push(kw);
      }
    }
    if (detectedKeywords.length > 0) {
      return {
        domain: 'EDUCATION',
        riskLevel: 'moderate',
        requiresReview: false,
        safetyPassed: true,
        detectedKeywords,
        riskExplanation: `Educational classroom context`
      };
    }

    // 4. Check Agriculture
    for (const kw of this.AGRICULTURE_KEYWORDS) {
      if (combined.includes(kw.toLowerCase())) {
        detectedKeywords.push(kw);
      }
    }
    if (detectedKeywords.length > 0) {
      return {
        domain: 'AGRICULTURE',
        riskLevel: 'low',
        requiresReview: false,
        safetyPassed: true,
        detectedKeywords,
        riskExplanation: `Agricultural & rural life context`
      };
    }

    // 5. Check Administration
    for (const kw of this.ADMINISTRATION_KEYWORDS) {
      if (combined.includes(kw.toLowerCase())) {
        detectedKeywords.push(kw);
      }
    }
    if (detectedKeywords.length > 0) {
      return {
        domain: 'ADMINISTRATION',
        riskLevel: 'moderate',
        requiresReview: false,
        safetyPassed: true,
        detectedKeywords,
        riskExplanation: `Administrative civic context`
      };
    }

    // Default: General
    return {
      domain: 'GENERAL',
      riskLevel: 'low',
      requiresReview: false,
      safetyPassed: true,
      detectedKeywords: [],
      riskExplanation: `General daily conversation`
    };
  }

  /**
   * Synthesizes independent ASR acoustic confidence, Translation reliability, and Domain Risk
   * to determine the final transparent tier badge and review status.
   */
  public static evaluateTurnReliability(
    asrConfidence: number,
    translationConfidence: number,
    translationMethod: string,
    sourceText: string,
    targetText: string
  ): FinalTurnReliability {
    const domainAssessment = this.classifyDomain(sourceText, targetText);

    // Baseline tier from translation reliability
    let finalTier: ConfidenceTier = 'fallback';
    if (translationMethod === 'verified_exact' || translationMethod === 'verified_lexicon') {
      finalTier = 'verified';
    } else if (translationMethod === 'dataset_match') {
      finalTier = 'dataset';
    } else {
      finalTier = 'fallback';
    }

    // NEVER-GUESS POLICY ENFORCEMENT:
    // Rule 1: Acoustic failure or low acoustic confidence (< 0.68) triggers 'needs_review'
    if (asrConfidence < 0.68) {
      finalTier = 'needs_review';
      domainAssessment.requiresReview = true;
      domainAssessment.riskExplanation = 'Acoustic ASR confidence is low (< 68%). Spoken words may be distorted.';
    }

    // Rule 2: Critical Healthcare requires high standards (ASR >= 0.75 and MT >= 0.88)
    if (domainAssessment.domain === 'CRITICAL_HEALTHCARE') {
      if (asrConfidence < 0.75 || translationConfidence < 0.88) {
        finalTier = 'needs_review';
        domainAssessment.requiresReview = true;
        domainAssessment.riskExplanation = 'Critical clinical terms require verified certainty. Human review advised.';
      }
    } else if (domainAssessment.domain === 'HEALTHCARE') {
      if (asrConfidence < 0.70 || translationConfidence < 0.80) {
        finalTier = 'needs_review';
        domainAssessment.requiresReview = true;
        domainAssessment.riskExplanation = 'Healthcare guidance requires high confidence.';
      }
    }

    // Rule 3: Empty or ultra-short unverified inputs trigger review
    if (sourceText.trim().length <= 1) {
      finalTier = 'needs_review';
      domainAssessment.requiresReview = true;
    }

    // Rule 4: Numerical Dosage & Entity Preservation Guard
    const srcDigits = (sourceText.match(/\b\d+\b/g) || []).sort().join(',');
    const tgtDigits = (targetText.match(/\b\d+\b/g) || []).sort().join(',');
    if (srcDigits && tgtDigits && srcDigits !== tgtDigits) {
      finalTier = 'needs_review';
      domainAssessment.requiresReview = true;
      domainAssessment.riskExplanation = `Numerical mismatch detected (source: "${srcDigits}" vs target: "${tgtDigits}"). Review required.`;
    }

    // Rule 5: Negation Polarity Inversion Guard
    const NEGATION_REGEX = /\b(not|never|no|don't|doesn't|didn't|cannot|won't)\b|(?:^|\s|[.,!?])(नहीं|मत|ना|न)(?:$|\s|[.,!?])|(?:^|\s|[.,!?])(ᱵᱟᱝ|ᱵᱟᱹᱧ|ᱵᱟᱹᱱᱩᱜ)(?:$|\s|[.,!?])/i;
    const srcNeg = NEGATION_REGEX.test(sourceText);
    const tgtNeg = NEGATION_REGEX.test(targetText);
    if (srcNeg && !tgtNeg && targetText.trim().length > 0) {
      finalTier = 'needs_review';
      domainAssessment.requiresReview = true;
      domainAssessment.riskExplanation = 'Negation polarity inversion: source sentence has negative polarity but translation is affirmative.';
    }

    const needsReview = finalTier === 'needs_review';
    domainAssessment.safetyPassed = !needsReview;

    const provenanceSummary = [
      `ASR: ${(asrConfidence * 100).toFixed(0)}%`,
      `MT: ${(translationConfidence * 100).toFixed(0)}% (${translationMethod})`,
      `Domain: ${domainAssessment.domain}`
    ].join(' | ');

    return {
      asrConfidence,
      translationConfidence,
      domainRisk: domainAssessment,
      finalTier,
      needsReview,
      provenanceSummary
    };
  }
}
