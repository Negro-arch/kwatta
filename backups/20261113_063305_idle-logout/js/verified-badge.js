// ============================================
// KWATTA — Badge "✓ Vérifié" réutilisable
// ============================================

(function() {
  'use strict';

  /**
   * Retourne le HTML d'un badge vérifié
   * @param {boolean} isVerified - L'user est-il vérifié ?
   * @param {string} size - 'sm' (12px) | 'md' (14px) | 'lg' (16px)
   * @returns {string} HTML du badge ou chaîne vide
   */
  window.renderVerifiedBadge = function(isVerified, size) {
    if (!isVerified) return '';
    size = size || 'md';

    const sizes = {
      'sm': 'width: 14px; height: 14px; font-size: 9px;',
      'md': 'width: 16px; height: 16px; font-size: 10px;',
      'lg': 'width: 20px; height: 20px; font-size: 12px;',
    };

    const style = sizes[size] || sizes['md'];

    return '<span class="kwatta-verified-badge" style="' + style + '" title="Vendeur vérifié par KWATTA">✓</span>';
  };

  console.log('[VERIFIED-BADGE] Helper chargé');
})();
