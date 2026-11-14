// ============================================
// KWATTA — App (init globale)
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
  console.log('[KWATTA] App démarrée');

  if (window.kwattaApplyLang) window.kwattaApplyLang();

  const langToggle = document.getElementById('lang-toggle');
  if (langToggle) {
    langToggle.addEventListener('click', () => {
      if (window.kwattaToggleLang) window.kwattaToggleLang();
    });
  }

  // Chargement des catégories dans la nav
  if (window.kwattaLoadCategories) {
    await window.kwattaLoadCategories();
  }

  // Chargement des produits
  if (window.kwattaLoadProducts) {
    await window.kwattaLoadProducts();
  }

  // Recherche
  if (window.kwattaSetupSearch) window.kwattaSetupSearch();
});


  // ============================================
  // PROTECTION ANTI-SCROLL HORIZONTAL
  // ============================================
  function preventHorizontalScroll() {
    // Force le body à ne pas dépasser
    document.body.style.overflowX = 'hidden';
    document.documentElement.style.overflowX = 'hidden';
    
    // Détecte tout élément qui dépasse la largeur de l'écran
    const maxWidth = window.innerWidth;
    document.querySelectorAll('body > *').forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.right > maxWidth + 5) {
        console.warn('[KWATTA] Élément qui dépasse:', el.tagName, el.className, '| right:', rect.right, '| max:', maxWidth);
      }
    });
  }
  
  // Applique au chargement
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(preventHorizontalScroll, 1000);
  });
  
  // Réapplique en cas de redimensionnement
  window.addEventListener('resize', preventHorizontalScroll);
