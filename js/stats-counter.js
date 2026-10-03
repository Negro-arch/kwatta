// ============================================
// KWATTA — Compteurs animés (section stats)
// ============================================

(function() {
  'use strict';

  // ============================================
  // Valeurs cibles
  // ============================================
  // Note : "Vendeurs actifs" est une valeur marketing fixe (5000+).
  // Les autres sont chargées depuis la base de données.
  const TARGETS = {
    'stat-listings':   0,      // Chargé depuis Supabase
    'stat-sellers':    5000,   // Marketing fixe
    'stat-categories': 0,      // Chargé depuis Supabase
  };

  // ============================================
  // ANIMATION : compte de 0 à la valeur cible
  // ============================================
  function animateCounter(el, target, duration = 2000) {
    if (!el) return;

    const startTime = performance.now();
    const startValue = 0;

    function tick(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing cubic-out : rapide au début, ralentit à la fin
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(startValue + (target - startValue) * eased);

      // Format avec séparateur de milliers
      el.textContent = current.toLocaleString('fr-FR');

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        // Fin : affiche la valeur exacte + "+" pour les vendeurs
        if (target >= 1000) {
          el.textContent = target.toLocaleString('fr-FR') + '+';
        } else {
          el.textContent = target.toLocaleString('fr-FR');
        }
      }
    }

    requestAnimationFrame(tick);
  }

  // ============================================
  // DÉCLENCHEMENT AU SCROLL (IntersectionObserver)
  // ============================================
  function setupObserver() {
    const section = document.getElementById('stats-section');
    if (!section) {
      console.warn('[STATS] #stats-section introuvable');
      return;
    }

    let alreadyAnimated = false;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !alreadyAnimated) {
          alreadyAnimated = true;
          console.log('[STATS] Section visible → animation');

          // Animation pour chaque compteur
          Object.entries(TARGETS).forEach(([id, target]) => {
            const el = document.getElementById(id);
            if (el) animateCounter(el, target);
          });

          // On peut déconnecter l'observer une fois l'animation lancée
          observer.disconnect();
        }
      });
    }, {
      threshold: 0.3  // Déclenche quand 30% de la section est visible
    });

    observer.observe(section);
  }

  // ============================================
  // CHARGER LES VRAIES VALEURS depuis Supabase
  // ============================================
  async function loadRealValues() {
    if (!window.kwatta_db) {
      console.warn('[STATS] kwatta_db indisponible');
      return;
    }

    // Annonces publiées
    const { count: listingsCount } = await window.kwatta_db
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published');

    // Catégories
    const { count: categoriesCount } = await window.kwatta_db
      .from('categories')
      .select('*', { count: 'exact', head: true });

    TARGETS['stat-listings'] = listingsCount || 0;
    TARGETS['stat-categories'] = categoriesCount || 0;

    console.log('[STATS] Valeurs chargées :', TARGETS);
  }

  // ============================================
  // INIT
  // ============================================
  async function init() {
    await loadRealValues();
    setupObserver();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.kwattaReloadStats = init;
})();
