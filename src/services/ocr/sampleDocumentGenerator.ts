/**
 * Authentic Document Image Generator for Testing & Multi-Script Benchmarking
 * Generates crisp, realistic document images directly on Canvas with known Ground Truth:
 * 1. Clean English printed administrative notice (Latin)
 * 2. Clean Hindi Devanagari health directive (Devanagari)
 * 3. Mixed English + Hindi bilingual notice (Bilingual)
 * 4. Classroom Blackboard (Chalk on Slate)
 * 5. Shadowed camera document (Shadow Gradient test)
 * 6. Santali Ol Chiki community notice (Ol Chiki test)
 */

export interface GeneratedSampleDoc {
  id: string;
  title: string;
  language: string;
  languageCode: string;
  previewUrl: string;
  sampleText: string;
  category: string;
  scriptType: 'latin' | 'devanagari' | 'mixed' | 'ol_chiki' | 'warang_chiti';
  groundTruthText: string;
}

/**
 * Renders an authentic document image to Canvas and returns PNG Data URL
 */
function renderDocumentCard(options: {
  title: string;
  subtitle: string;
  lines: string[];
  isBlackboard?: boolean;
  hasShadow?: boolean;
  isTilted?: boolean;
}): string {
  const width = 1000;
  const height = 640;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  if (options.isBlackboard) {
    // Slate blackboard background
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, width, height);

    // Blackboard wooden frame
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 14;
    ctx.strokeRect(7, 7, width - 14, height - 14);

    // Chalk border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.strokeRect(30, 30, width - 60, height - 60);

    // Chalk text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px "Inter", "Outfit", "Arial", sans-serif';
    ctx.fillText(options.title, 55, 80);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.font = 'bold 20px "Inter", "Outfit", "Arial", sans-serif';
    ctx.fillText(options.subtitle, 55, 120);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(55, 140);
    ctx.lineTo(width - 55, 140);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.font = '22px "Inter", "Outfit", "Arial", sans-serif';
    let y = 195;
    for (const line of options.lines) {
      ctx.fillText(line, 55, y);
      y += 42;
    }
    return canvas.toDataURL('image/png');
  }

  // Paper Document
  ctx.fillStyle = '#fdfbf7';
  ctx.fillRect(0, 0, width, height);

  // Document border
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.strokeRect(20, 20, width - 40, height - 40);

  // Header Banner
  ctx.fillStyle = '#065f46';
  ctx.fillRect(20, 20, width - 40, 64);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px "Inter", "Outfit", "Arial", sans-serif';
  ctx.fillText(options.title, 50, 60);

  ctx.fillStyle = '#047857';
  ctx.font = 'bold 18px "Inter", "Outfit", "Arial", sans-serif';
  ctx.fillText(options.subtitle, 50, 122);

  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(50, 142);
  ctx.lineTo(width - 50, 142);
  ctx.stroke();

  // Document Body Lines
  ctx.fillStyle = '#0f172a';
  ctx.font = '22px "Inter", "Outfit", "Segoe UI", sans-serif';
  let y = 192;
  for (const line of options.lines) {
    ctx.fillText(line, 50, y);
    y += 44;
  }

  // Official Seal Stamp simulation
  ctx.save();
  ctx.translate(width - 150, height - 120);
  ctx.rotate(-0.1);
  ctx.strokeStyle = '#dc2626';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, 48, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#dc2626';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('VERIFIED', 0, -6);
  ctx.fillText('DIRECTIVE', 0, 12);
  ctx.restore();

  // If Shadow test is requested, apply a diagonal shadow gradient
  if (options.hasShadow) {
    const shadowGrad = ctx.createLinearGradient(0, 0, width, height);
    shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    shadowGrad.addColorStop(0.35, 'rgba(0, 0, 0, 0.12)');
    shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0.68)');
    ctx.fillStyle = shadowGrad;
    ctx.fillRect(0, 0, width, height);
  }

  return canvas.toDataURL('image/png');
}

/**
 * Returns authentic test sample documents with known Ground Truth text
 */
export function getAuthenticSampleDocs(): GeneratedSampleDoc[] {
  if (typeof window === 'undefined') return [];

  // 1. Clean English Document
  const englishTitle = 'MINISTRY OF TRIBAL AFFAIRS';
  const englishSubtitle = 'Universal Tribal Health Guidelines (Directives 2026)';
  const englishLines = [
    'Universal screening for sickle cell traits across 278 tribal districts.',
    'Primary Health Centres will provide free counseling and medical support.',
    'All local community health workers must complete registration by Monday.',
    'Contact the District Medical Officer for emergency medical supplies.'
  ];
  const englishGroundTruth = [englishTitle, englishSubtitle, ...englishLines].join('\n');
  const englishDocUrl = renderDocumentCard({
    title: englishTitle,
    subtitle: englishSubtitle,
    lines: englishLines
  });

  // 2. Clean Hindi Devanagari Document
  const hindiTitle = 'जनजातीय विकास एवं कल्याण केंद्र';
  const hindiSubtitle = 'औषध वितरण एवं सिकल सेल जांच शिविर निर्देशिका';
  const hindiLines = [
    'भीली एवं गोंडी जनजातीय विकास केंद्र में आपका स्वागत है।',
    'निःशुल्क सिकल सेल जांच एवं परामर्श शिविर का आयोजन किया जा रहा है।',
    'सभी नागरिक अपने स्वास्थ्य कार्ड के साथ उपस्थित हों।',
    'अधिक जानकारी के लिए ग्राम पंचायत अथवा स्वास्थ्य केंद्र से संपर्क करें।'
  ];
  const hindiGroundTruth = [hindiTitle, hindiSubtitle, ...hindiLines].join('\n');
  const hindiDocUrl = renderDocumentCard({
    title: hindiTitle,
    subtitle: hindiSubtitle,
    lines: hindiLines
  });

  // 3. Mixed English + Hindi Document
  const mixedTitle = 'GOVERNMENT ADVISORY / सरकारी सूचना';
  const mixedSubtitle = 'Universal Health & Education Guidelines • स्वास्थ्य एवं शिक्षा निर्देशिका';
  const mixedLines = [
    'Primary Health Centre provides free counseling and medical aid.',
    'प्राथमिक स्वास्थ्य केंद्र निःशुल्क परामर्श एवं औषधि प्रदान करता है।',
    'All community health workers must register at the district office.',
    'सभी स्वास्थ्य कार्यकर्ता जिला कार्यालय में पंजीकरण अनिवार्य रूप से कराएं।'
  ];
  const mixedGroundTruth = [mixedTitle, mixedSubtitle, ...mixedLines].join('\n');
  const mixedDocUrl = renderDocumentCard({
    title: mixedTitle,
    subtitle: mixedSubtitle,
    lines: mixedLines
  });

  // 4. Classroom Blackboard Document
  const bbTitle = 'CLASSROOM BLACKBOARD NOTES';
  const bbSubtitle = 'School Education & Tribal Language Study (Chalk on Slate)';
  const bbLines = [
    'Lesson 4: Tribal Languages and Cultural Heritage.',
    'Vocabulary: Johar (Greeting), Hasa (Soil/Earth), Ran (Medicine).',
    'Practice writing everyday words in both Latin and Devanagari.',
    'Homework: Complete the 5 translated sentences for tomorrow.'
  ];
  const bbGroundTruth = [bbTitle, bbSubtitle, ...bbLines].join('\n');
  const blackboardDocUrl = renderDocumentCard({
    title: bbTitle,
    subtitle: bbSubtitle,
    lines: bbLines,
    isBlackboard: true
  });

  // 5. Shadowed Camera Document
  const shadowTitle = 'FIELD HEALTH NOTIFICATION';
  const shadowSubtitle = 'Mobile Clinic Schedule (Captured under Camera Shadow)';
  const shadowLines = [
    'Mobile medical vans will visit remote villages twice weekly.',
    'Emergency medicine kits are available at the sub-centre.',
    'Report any high fever symptoms to the local ASHA supervisor immediately.'
  ];
  const shadowGroundTruth = [shadowTitle, shadowSubtitle, ...shadowLines].join('\n');
  const shadowedDocUrl = renderDocumentCard({
    title: shadowTitle,
    subtitle: shadowSubtitle,
    lines: shadowLines,
    hasShadow: true
  });

  // 6. Santali Ol Chiki Community Notice
  const santaliTitle = 'SANTALI OL CHIKI COMMUNITY NOTICE';
  const santaliSubtitle = 'ᱵᱷᱟᱨᱚᱛ ᱥᱚᱨᱠᱟᱨ • ᱥᱟᱱᱛᱟᱲᱤ ᱥᱮᱪᱮᱫ ᱦᱟᱹᱴᱤᱧ';
  const santaliLines = [
    'ᱡᱚᱦᱟᱨ • ᱥᱤᱠᱤᱞ ᱥᱮᱞ ᱵᱤᱰᱟᱹᱣ ᱦᱟᱥᱯᱟᱛᱟᱞ ᱨᱮ ᱦᱩᱭᱩᱜ ᱠᱟᱱᱟ᱾',
    'ᱥᱟᱱᱟᱢ ᱦᱚᱲ ᱱᱚᱣᱟ ᱠᱮᱢᱯ ᱨᱮ ᱥᱮᱞᱮᱫᱚᱜ ᱛᱟᱵᱚᱱ ᱯᱮ᱾',
    'ᱟᱵᱚᱣᱟᱜ ᱦᱟᱥᱟ ᱟᱨ ᱟᱵᱚᱣᱟᱜ ᱡᱤᱣᱤ ᱫᱩᱜ ᱫᱚᱦᱚᱭ ᱢᱟ᱾'
  ];
  const santaliGroundTruth = [santaliTitle, santaliSubtitle, ...santaliLines].join('\n');
  const santaliDocUrl = renderDocumentCard({
    title: santaliTitle,
    subtitle: santaliSubtitle,
    lines: santaliLines
  });

  return [
    {
      id: 'sample-english-guide',
      title: 'Tribal Welfare Directives (English)',
      language: 'English',
      languageCode: 'eng',
      previewUrl: englishDocUrl,
      sampleText: 'Ministry of Tribal Affairs: Universal screening for sickle cell traits across 278 districts.',
      category: 'Clean English Print',
      scriptType: 'latin',
      groundTruthText: englishGroundTruth
    },
    {
      id: 'sample-bhili',
      title: 'Health Directive (Hindi / Devanagari)',
      language: 'Hindi',
      languageCode: 'hin',
      previewUrl: hindiDocUrl,
      sampleText: 'जनजातीय विकास एवं कल्याण केंद्र • औषध वितरण एवं सिकल सेल जांच शिविर निर्देशिका।',
      category: 'Clean Hindi Print',
      scriptType: 'devanagari',
      groundTruthText: hindiGroundTruth
    },
    {
      id: 'sample-mixed',
      title: 'Bilingual Notice (Mixed Eng + Hindi)',
      language: 'Mixed (Eng+Hin)',
      languageCode: 'eng+hin',
      previewUrl: mixedDocUrl,
      sampleText: 'Government Advisory / सरकारी सूचना: Universal Health & Education Guidelines.',
      category: 'Bilingual English + Hindi',
      scriptType: 'mixed',
      groundTruthText: mixedGroundTruth
    },
    {
      id: 'sample-shadowed',
      title: 'Camera Snapshot with Shadow',
      language: 'English',
      languageCode: 'eng',
      previewUrl: shadowedDocUrl,
      sampleText: 'Mobile medical vans will visit remote villages twice weekly.',
      category: 'Shadowed Camera Doc',
      scriptType: 'latin',
      groundTruthText: shadowGroundTruth
    },
    {
      id: 'sample-blackboard',
      title: 'Classroom Blackboard (Chalk on Slate)',
      language: 'English',
      languageCode: 'eng',
      previewUrl: blackboardDocUrl,
      sampleText: 'Classroom Blackboard Notes: Lesson 4 Tribal Languages and Cultural Heritage.',
      category: 'Blackboard / Slate',
      scriptType: 'mixed',
      groundTruthText: bbGroundTruth
    },
    {
      id: 'sample-santali',
      title: 'Santali Ol Chiki Notice',
      language: 'Santali',
      languageCode: 'sat',
      previewUrl: santaliDocUrl,
      sampleText: 'ᱡᱚᱦᱟᱨ • ᱥᱤᱠᱤᱞ ᱥᱮᱞ ᱵᱤᱰᱟᱹᱣ ᱦᱟᱥᱯᱟᱛᱟᱞ ᱨᱮ ᱦᱩᱭᱩᱜ ᱠᱟᱱᱟ᱾',
      category: 'Ol Chiki Script',
      scriptType: 'ol_chiki',
      groundTruthText: santaliGroundTruth
    }
  ];
}
