// ============================================
// KWATTA — Notifications push
// ============================================
(function() {
  'use strict';

  let currentUser = null;
  let realtimeChannel = null;
  let notifications = [];

  const $ = (id) => document.getElementById(id);

  // ============================================
  // INIT
  // ============================================
  async function init() {
    const { data: { session } } = await window.kwatta_db.auth.getSession();
    if (!session) {
      console.log('[NOTIF] Pas connecté, on skip');
      return;
    }
    currentUser = session.user;

    console.log('[NOTIF] Init pour', currentUser.email);

    // Charge les notifications
    await loadNotifications();

    // Setup events
    setupEvents();

    // Realtime
    subscribeRealtime();

    console.log('[NOTIF] ✅ Prêt');
  }

  // ============================================
  // CHARGER LES NOTIFICATIONS
  // ============================================
  async function loadNotifications() {
    const { data, error } = await window.kwatta_db
      .from('notifications')
      .select('*')
      .eq('id_user', currentUser.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('[NOTIF] Erreur:', error);
      return;
    }

    notifications = data || [];
    renderBadge();
    renderDropdown();
  }

  // ============================================
  // BADGE
  // ============================================
  function renderBadge() {
    const badge = $('notif-badge');
    if (!badge) {
      console.warn('[NOTIF] #notif-badge introuvable');
      return;
    }

    const nonLus = notifications.filter(n => !n.lu).length;

    if (nonLus > 0) {
      badge.textContent = nonLus > 99 ? '99+' : nonLus;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }

  // ============================================
  // DROPDOWN
  // ============================================
  function renderDropdown() {
    const list = $('notif-list');
    if (!list) return;

    if (notifications.length === 0) {
      list.innerHTML = `
        <div class="px-4 py-8 text-center">
          <div class="text-4xl mb-2 opacity-40">🔔</div>
          <p class="text-sm text-charcoal/50">Aucune notification</p>
        </div>
      `;
      return;
    }

    list.innerHTML = notifications.slice(0, 10).map(n => {
      const icon = getIcon(n.type);
      const date = formatDate(n.created_at);
      const isUnread = !n.lu;

      return `
        <a href="${n.lien || '#'}" 
           class="notif-item block px-4 py-3 border-b border-charcoal/5 hover:bg-cream transition ${isUnread ? 'bg-terra-50/50' : ''}"
           data-notif-id="${n.id}">
          <div class="flex items-start gap-3">
            <div class="text-2xl shrink-0">${icon}</div>
            <div class="flex-1 min-w-0">
              <div class="font-semibold text-sm ${isUnread ? 'text-charcoal' : 'text-charcoal/70'}">
                ${escapeHtml(n.titre)}
              </div>
              ${n.message ? `<div class="text-xs text-charcoal/60 mt-0.5">${escapeHtml(n.message)}</div>` : ''}
              <div class="text-xs text-charcoal/40 mt-1">${date}</div>
            </div>
            ${isUnread ? '<span class="w-2 h-2 rounded-full bg-terra-500 shrink-0 mt-2"></span>' : ''}
          </div>
        </a>
      `;
    }).join('') + (notifications.length > 10 ? `
      <a href="notifications.html" class="block text-center px-4 py-3 text-sm text-terra-600 hover:bg-cream font-semibold">
        Voir tout (${notifications.length})
      </a>
    ` : '');

    // Marque comme lu au clic
    list.querySelectorAll('.notif-item').forEach(item => {
      item.addEventListener('click', async () => {
        const id = item.dataset.notifId;
        await markAsRead(id);
      });
    });
  }

  // ============================================
  // MARQUER COMME LU
  // ============================================
  async function markAsRead(notifId) {
    const notif = notifications.find(n => n.id === notifId);
    if (!notif || notif.lu) return;

    const { error } = await window.kwatta_db
      .from('notifications')
      .update({ lu: true })
      .eq('id', notifId);

    if (error) {
      console.error('[NOTIF] Erreur markAsRead:', error);
      return;
    }

    notif.lu = true;
    renderBadge();
  }

  async function markAllAsRead() {
    const nonLus = notifications.filter(n => !n.lu);
    if (nonLus.length === 0) return;

    const { error } = await window.kwatta_db
      .from('notifications')
      .update({ lu: true })
      .eq('id_user', currentUser.id)
      .eq('lu', false);

    if (error) {
      console.error('[NOTIF] Erreur markAllAsRead:', error);
      return;
    }

    notifications.forEach(n => n.lu = true);
    renderBadge();
    renderDropdown();
  }

  // ============================================
  // REALTIME
  // ============================================
  function subscribeRealtime() {
    if (realtimeChannel) {
      window.kwatta_db.removeChannel(realtimeChannel);
    }

    realtimeChannel = window.kwatta_db
      .channel('notifications-user')
      .on('postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications',
          filter: `id_user=eq.${currentUser.id}`
        },
        (payload) => {
          console.log('[NOTIF] Nouvelle notif:', payload.new);
          notifications.unshift(payload.new);
          renderBadge();
          renderDropdown();
          
          // Petit effet visuel sur la cloche
          const btn = $('btn-notif');
          if (btn) {
            btn.classList.add('animate-bounce');
            setTimeout(() => btn.classList.remove('animate-bounce'), 1000);
          }
        }
      )
      .subscribe();
  }

  // ============================================
  // EVENTS
  // ============================================
  function setupEvents() {
    const btnNotif = $('btn-notif');
    const dropdown = $('dropdown-notif');

    if (!btnNotif || !dropdown) {
      console.warn('[NOTIF] Éléments dropdown introuvables');
      return;
    }

    // Toggle dropdown au clic
    btnNotif.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('hidden');
      
      // Ferme les autres dropdowns
      document.querySelectorAll('.dropdown:not(#dropdown-notif)').forEach(d => d.classList.add('hidden'));
    });

    // Ferme au clic extérieur
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#btn-notif') && !e.target.closest('#dropdown-notif')) {
        dropdown.classList.add('hidden');
      }
    });

    // Bouton "Tout marquer comme lu"
    const markAllBtn = $('notif-mark-all');
    if (markAllBtn) {
      markAllBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        markAllAsRead();
      });
    }
  }

  // ============================================
  // HELPERS
  // ============================================
  function getIcon(type) {
    const icons = {
      'offre_recue': '💰',
      'offre_acceptee': '✅',
      'offre_refusee': '❌',
      'nouveau_message': '💬',
      'article_vendu': '🎉',
      'avis_recu': '⭐',
      'article_like': '❤️',
      'bienvenue': '👋',
    };
    return icons[type] || '🔔';
  }

  function formatDate(d) {
    const date = new Date(d);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return 'à l\'instant';
    if (diff < 3600) return 'il y a ' + Math.floor(diff / 60) + ' min';
    if (diff < 86400) return 'il y a ' + Math.floor(diff / 3600) + 'h';
    if (diff < 604800) return 'il y a ' + Math.floor(diff / 86400) + 'j';
    
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  }

  function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s || '';
    return div.innerHTML;
  }

  // ============================================
  // DÉMARRAGE
  // ============================================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose
  window.kwattaRefreshNotifications = loadNotifications;
})();
