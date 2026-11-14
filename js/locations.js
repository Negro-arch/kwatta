// ============================================
// KWATTA — Localités (Bamenda + Bambili)
// ============================================
window.KWATTA_LOCATIONS = {
  bamenda: {
    name: 'Bamenda',
    label_fr: 'Bamenda',
    label_en: 'Bamenda',
    quarters: [
      'Commercial Avenue', 'Nkwen', 'Mankon', 'Up Station',
      'Mile 4', 'Mile 8', 'Ntarikon', 'Old Town', 'Cow Street',
      'Food Market', 'Bali', 'Bafut', 'Mendankwe', 'Mbatu',
      'Nsongwa', 'Chomba', 'Akum', 'Bawock'
    ]
  },
  bambili: {
    name: 'Bambili',
    label_fr: 'Bambili (Campus)',
    label_en: 'Bambili (Campus)',
    quarters: [
      'Ntambije', 'Monmbieb', 'Musongmuobuh', 'Menkenglemb',
      'Ntah', 'Abeur', 'Ntamhwi', 'Nchioken Fengam', 'Mbelua',
      'Ajung Awong', 'Atue', 'Achi', 'Anenbweh', 'Nduombelele',
      'Nchokeleng', 'Mehnehigh', 'Ntam', 'Ntingah', 'Ashi',
      'Anieng', 'Atoghem', 'Djankah', 'Atonchi', 'Ndopmbeng',
      'Menginkenglen'
    ]
  }
};

// Helper : générer les options d'un select ville
window.kwattaRenderCityOptions = function(selectedValue) {
  const lang = window.kwattaGetLang ? window.kwattaGetLang() : 'en';
  const currentCity = (selectedValue || '').split(' · ')[0];
  
  let html = '<option value="">— ' + (lang === 'fr' ? 'Choisir une ville' : 'Choose a city') + ' —</option>';
  
  Object.keys(window.KWATTA_LOCATIONS).forEach(key => {
    const loc = window.KWATTA_LOCATIONS[key];
    const label = lang === 'fr' ? loc.label_fr : loc.label_en;
    const isSelected = label === currentCity ? ' selected' : '';
    html += `<option value="${key}"${isSelected}>${label}</option>`;
  });
  
  return html;
};

// Helper : générer les options de quartier pour une ville
window.kwattaRenderQuarterOptions = function(cityKey, selectedValue) {
  const lang = window.kwattaGetLang ? window.kwattaGetLang() : 'en';
  
  if (!cityKey || !window.KWATTA_LOCATIONS[cityKey]) {
    return '<option value="">— ' + (lang === 'fr' ? 'Choisir un quartier' : 'Choose a neighborhood') + ' —</option>';
  }
  
  const quarters = window.KWATTA_LOCATIONS[cityKey].quarters;
  const currentQuarter = (selectedValue || '').split(' · ')[1] || '';
  
  let html = '<option value="">— ' + (lang === 'fr' ? 'Choisir un quartier' : 'Choose a neighborhood') + ' —</option>';
  
  quarters.forEach(q => {
    const isSelected = q === currentQuarter ? ' selected' : '';
    html += `<option value="${q}"${isSelected}>${q}</option>`;
  });
  
  return html;
};

// Helper : construire la valeur finale "Ville · Quartier"
window.kwattaBuildLocation = function(cityKey, quarter) {
  if (!cityKey) return '';
  const loc = window.KWATTA_LOCATIONS[cityKey];
  if (!loc) return '';
  const label = loc.label_en; // utiliser le label EN pour stockage uniforme
  return quarter ? `${label} · ${quarter}` : label;
};

console.log('[LOCATIONS] Chargé');
