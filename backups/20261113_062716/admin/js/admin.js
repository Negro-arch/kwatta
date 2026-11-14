// ============================================
// KWATTA ADMIN — Logique partagée
// ============================================

(function() {
  'use strict';

  // ============================================
  // UTILS
  // ============================================
  function formatPrice(p) {
    if (p === null || p === undefined) return '0 FCFA';
    return new Intl.NumberFormat('fr-FR').format(Math.round(p)) + ' FCFA';
  }

  function formatNumber(n) {
    if (n === null || n === undefined) return '0';
    return new Intl.NumberFormat('fr-FR').format(n);
  }

  function formatDate(d) {
    if (!d) return '—';
    const date = new Date(d);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return 'à l\'instant';
    if (diff < 3600) return 'il y a ' + Math.floor(diff / 60) + ' min';
    if (diff < 86400) return 'il y a ' + Math.floor(diff / 3600) + 'h';
    if (diff < 604800) return 'il y a ' + Math.floor(diff / 86400) + 'j';
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function escapeHtml(s) {
    const d = document.createElement('div');
    d.textContent = s || '';
    return d.innerHTML;
  }

  // ============================================
  // ATTEND QUE kwatta_db SOIT PRÊT
  // ============================================
  async function waitForDb(maxWaitMs) {
    maxWaitMs = maxWaitMs || 5000;
    const start = Date.now();
    while (!window.kwatta_db && Date.now() - start < maxWaitMs) {
      await new Promise(r => setTimeout(r, 50));
    }
    return !!window.kwatta_db;
  }

  // ============================================
  // AUTH ADMIN — vérifie que l'user est admin
  // ============================================
  async function requireAdmin() {
    console.log('[ADMIN-AUTH] Début vérification...');

    const ready = await waitForDb();
    if (!ready) {
      console.log('[ADMIN-AUTH] ❌ kwatta_db indisponible après 5s');
      alert('Erreur : Supabase n\'est pas chargé.');
      return null;
    }
    console.log('[ADMIN-AUTH] ✅ kwatta_db OK');

    const { data: { session }, error: sessionErr } = await window.kwatta_db.auth.getSession();
    console.log('[ADMIN-AUTH] session:', session ? session.user.email : 'AUCUNE', '| erreur:', sessionErr);

    if (sessionErr) {
      alert('Erreur session : ' + sessionErr.message);
      return null;
    }

    if (!session) {
      console.log('[ADMIN-AUTH] Pas de session → redirection login');
      window.location.href = '../index.html';
      return null;
    }

    console.log('[ADMIN-AUTH] Fetch profil pour id:', session.user.id);

    const { data: profile, error: profileErr } = await window.kwatta_db
      .from('profiles')
      .select('id, username, display_name, role, avatar_url')
      .eq('id', session.user.id)
      .single();

    console.log('[ADMIN-AUTH] profil:', profile);
    console.log('[ADMIN-AUTH] erreur profil:', profileErr);

    if (profileErr) {
      alert('Erreur chargement profil : ' + profileErr.message);
      return null;
    }

    if (!profile) {
      alert('Profil introuvable pour ' + session.user.email);
      return null;
    }

    console.log('[ADMIN-AUTH] Rôle détecté:', profile.role);

    if (profile.role !== 'admin') {
      alert('Accès refusé — ton rôle est "' + profile.role + '". Il faut être admin.');
      window.location.href = '../index.html';
      return null;
    }

    console.log('[ADMIN-AUTH] ✅ Admin confirmé :', profile.username);
    return { user: session.user, profile: profile };
  }

  // ============================================
  // SIDEBAR — navigation
  // ============================================
  const NAV_ITEMS = [
    { href: 'index.html',        icon: '📊', label: 'Vue d\'ensemble', key: 'dashboard' },
    { href: 'users.html',        icon: '👥', label: 'Utilisateurs',    key: 'users' },
    { href: 'verifications.html',icon: '🪪', label: 'Vérifications',    key: 'verifications' },
    { href: 'listings.html',     icon: '📦', label: 'Annonces',        key: 'listings' },
    { href: 'transactions.html', icon: '💳', label: 'Transactions',    key: 'transactions' },
    { href: 'wallet.html',       icon: '💰', label: 'Retraits',        key: 'wallet' },
    { href: 'boosts.html',       icon: '🚀', label: 'Boosts',          key: 'boosts' },
    { href: 'reports.html',      icon: '🚨', label: 'Signalements',    key: 'reports' },
    { href: 'logs.html',         icon: '📜', label: 'Logs',            key: 'logs' },
  ];

  function renderSidebar(activeKey, adminProfile) {
    const sidebar = document.getElementById('admin-sidebar');
    if (!sidebar) {
      console.warn('[ADMIN] #admin-sidebar introuvable');
      return;
    }

    const navHtml = NAV_ITEMS.map(item => `
      <a href="${item.href}" class="admin-nav-item ${item.key === activeKey ? 'active' : ''}">
        <span>${item.icon}</span>
        <span>${item.label}</span>
        <span class="badge-count hidden" data-badge="${item.key}">0</span>
      </a>
    `).join('');

    const name = adminProfile.display_name || adminProfile.username || '?';
    const avatarHtml = adminProfile.avatar_url
      ? '<img src="' + adminProfile.avatar_url + '" alt="Avatar">'
      : name[0].toUpperCase();

    sidebar.innerHTML = `
      <div class="admin-logo">
        <div class="admin-logo-mark">K</div>
        <div>
          <div class="admin-logo-text">KWATTA</div>
          <div class="admin-logo-sub">Admin Panel</div>
        </div>
      </div>

      <nav>
        ${navHtml}
      </nav>

      <div class="admin-sidebar-footer">
        <div class="admin-user-info">
          <div class="admin-user-avatar">${avatarHtml}</div>
          <div style="min-width:0; flex:1;">
            <div class="admin-user-name">${escapeHtml(name)}</div>
            <div class="admin-user-role">Admin</div>
          </div>
        </div>
        <a href="../index.html" class="admin-nav-item" style="font-size:13px;">
          <span>🛍️</span>
          <span>Voir la boutique</span>
        </a>
        <button id="admin-logout" class="admin-nav-item" style="font-size:13px; color:#DC2626;">
          <span>🚪</span>
          <span>Déconnexion</span>
        </button>
      </div>
    `;

    const logoutBtn = document.getElementById('admin-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        if (!confirm('Se déconnecter ?')) return;
        await window.kwatta_db.auth.signOut();
        window.location.href = '../index.html';
      });
    }

    // ============================================
    // INJECTION DU DRAWER MOBILE
    // ============================================
    const shell = sidebar.closest('.admin-shell');
    if (!shell) {
      console.warn('[ADMIN] .admin-shell introuvable');
      return;
    }

    // Évite les doublons
    if (!shell.querySelector('.admin-mobile-header')) {
      // 1) Header mobile avec hamburger
      const mobileHeader = document.createElement('div');
      mobileHeader.className = 'admin-mobile-header';
      mobileHeader.innerHTML = `
        <button class="admin-hamburger" id="admin-hamburger" aria-label="Ouvrir le menu">
          <svg width="22" height="22" fill="none" stroke="#2D2A26" stroke-width="2" viewBox="0 0 24 24">
            <path d="M3 6h18M3 12h18M3 18h18"/>
          </svg>
        </button>
        <div class="admin-mobile-header-logo">K</div>
        <div class="admin-mobile-header-title">Admin KWATTA</div>
      `;
      shell.insertBefore(mobileHeader, shell.firstChild);

      // 2) Overlay
      const overlay = document.createElement('div');
      overlay.className = 'admin-overlay';
      overlay.id = 'admin-overlay';
      shell.insertBefore(overlay, mobileHeader.nextSibling);

      // 3) Événements
      const hamburger = document.getElementById('admin-hamburger');

      function openSidebar() {
        sidebar.classList.add('open');
        overlay.classList.add('open');
        document.body.style.overflow = 'hidden';
      }

      function closeSidebar() {
        sidebar.classList.remove('open');
        overlay.classList.remove('open');
        document.body.style.overflow = '';
      }

      hamburger.addEventListener('click', openSidebar);
      overlay.addEventListener('click', closeSidebar);

      // Ferme automatiquement après clic sur un item de nav (mobile)
      sidebar.querySelectorAll('.admin-nav-item, #admin-logout').forEach(item => {
        item.addEventListener('click', () => {
          if (window.innerWidth <= 900) closeSidebar();
        });
      });

      // Ferme au resize (passage en desktop)
      window.addEventListener('resize', () => {
        if (window.innerWidth > 900) closeSidebar();
      });

      console.log('[ADMIN] Drawer mobile prêt');
    }
  }

  // ============================================
  // BADGES DYNAMIQUES dans la sidebar
  // ============================================
  async function loadSidebarBadges() {
    if (!window.kwatta_db) return;

    // Annonces en attente
    try {
      const { count } = await window.kwatta_db
        .from('listings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending_review');
      setBadge('listings', count);
    } catch (e) { console.warn('[BADGE] listings:', e); }

    // Retraits en attente
    try {
      const { count } = await window.kwatta_db
        .from('withdrawals')
        .select('*', { count: 'exact', head: true })
        .eq('statut', 'en_attente');
      setBadge('wallet', count);
    } catch (e) { console.warn('[BADGE] wallet:', e); }

    // CNI en attente
    try {
      const { count } = await window.kwatta_db
        .from('cni_uploads')
        .select('*', { count: 'exact', head: true })
        .eq('statut', 'en_attente');
      setBadge('verifications', count);
    } catch (e) { console.warn('[BADGE] verifications:', e); }

    // Boosts en attente
    try {
      const { count } = await window.kwatta_db
        .from('boost_requests')
        .select('*', { count: 'exact', head: true })
        .eq('statut', 'en_attente');
      setBadge('boosts', count);
    } catch (e) { console.warn('[BADGE] boosts:', e); }

    // Signalements en attente (table peut ne pas exister)
    try {
      const { count } = await window.kwatta_db
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('statut', 'en_attente');
      setBadge('reports', count);
    } catch (e) { /* ignore */ }
  }

  function setBadge(key, count) {
    const el = document.querySelector('[data-badge="' + key + '"]');
    if (!el) return;
    if (count && count > 0) {
      el.textContent = count > 99 ? '99+' : count;
      el.classList.remove('hidden');
    } else {
      el.classList.add('hidden');
    }
  }

  // ============================================
  // EXPOSE
  // ============================================
  window.AdminUtils = {
    formatPrice: formatPrice,
    formatNumber: formatNumber,
    formatDate: formatDate,
    escapeHtml: escapeHtml,
    requireAdmin: requireAdmin,
    renderSidebar: renderSidebar,
    loadSidebarBadges: loadSidebarBadges,
    waitForDb: waitForDb,
    NAV_ITEMS: NAV_ITEMS,
  };

  console.log('[ADMIN] Utils chargés');
})();
