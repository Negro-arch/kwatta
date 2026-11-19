// ============================================
// KWATTA — Bottom Navigation (injecté partout)
// ============================================
(function() {
  'use strict';

  // Ne pas injecter si on est sur une page admin
  if (window.location.pathname.includes('/admin/')) return;

  // Ne pas injecter si on est déjà sur une page qui l'a en dur
  if (document.querySelector('.bottom-nav')) {
    console.log('[BOTTOM-NAV] Déjà présent, skip');
    return;
  }

  // ============================================
  // Détermine la page actuelle pour surligner le bon item
  // ============================================
  function getCurrentPage() {
    const path = window.location.pathname;
    if (path.endsWith('index.html') || path.endsWith('/')) return 'home';
    if (path.includes('search.html')) return 'search';
    if (path.includes('sell.html')) return 'sell';
    if (path.includes('messages.html') || path.includes('chat.html')) return 'messages';
    if (path.includes('profile.html') || path.includes('wallet.html') || path.includes('commandes.html') || path.includes('offres.html')) return 'profile';
    return '';
  }

  // ============================================
  // Injecte le bottom-nav
  // ============================================
  function inject() {
    const current = getCurrentPage();

    const nav = document.createElement('nav');
    nav.className = 'bottom-nav';
    nav.innerHTML = `
      <a href="index.html" class="bottom-nav-item ${current === 'home' ? 'active' : ''}">
        <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
        <span>Accueil</span>
      </a>

      <a href="search.html" class="bottom-nav-item ${current === 'search' ? 'active' : ''}">
        <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
        <span>Rechercher</span>
      </a>

      <a href="sell.html" class="bottom-nav-item bottom-nav-center ${current === 'sell' ? 'active' : ''}">
        <div class="w-12 h-12 rounded-full bg-terra-500 flex items-center justify-center -mt-6 shadow-lg shadow-terra-500/40">
          <svg width="24" height="24" fill="none" stroke="#fff" stroke-width="2.5" viewBox="0 0 24 24">
            <path d="M12 5v14M5 12h14"/>
          </svg>
        </div>
        <span>Vendre</span>
      </a>

      <a href="messages.html" class="bottom-nav-item ${current === 'messages' ? 'active' : ''}">
        <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        <span>Messages</span>
      </a>

      <a href="profile.html" class="bottom-nav-item ${current === 'profile' ? 'active' : ''}">
        <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <circle cx="12" cy="8" r="4"/>
          <path d="M4 21v-2a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2"/>
        </svg>
        <span>Profil</span>
      </a>
    `;

    document.body.appendChild(nav);
    console.log('[BOTTOM-NAV] Injecté sur', current);
  }

  // ============================================
  // Attend que le DOM soit prêt
  // ============================================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }
})();
