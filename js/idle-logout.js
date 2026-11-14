// ============================================
// KWATTA — Auto-logout après 10 min d'inactivité
// ============================================
(function () {
  'use strict';

  // Ne pas s'activer sur les pages admin
  if (window.location.pathname.includes('/admin/')) return;

  // Ne pas s'activer sur la page login
  if (window.location.pathname.endsWith('login.html')) return;

  const IDLE_MS      = 10 * 60 * 1000;   // 10 minutes → logout
  const WARN_MS      =  9 * 60 * 1000;   // 9 minutes  → avertissement
  const STORAGE_KEY  = 'kwatta_last_activity';
  const CHANNEL_KEY  = 'kwatta_logout_signal';

  let warnTimer = null;
  let logoutTimer = null;
  let warnShown = false;
  let isRunning = false;

  // ============================================
  // HELPERS
  // ============================================
  function now() { return Date.now(); }

  function touchActivity() {
    try { localStorage.setItem(STORAGE_KEY, String(now())); } catch (e) {}
  }

  function getLastActivity() {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      return v ? parseInt(v, 10) : 0;
    } catch (e) { return 0; }
  }

  function clearTimers() {
    if (warnTimer)   { clearTimeout(warnTimer);   warnTimer = null; }
    if (logoutTimer) { clearTimeout(logoutTimer); logoutTimer = null; }
  }

  // ============================================
  // AFFICHE L'AVERTISSEMENT (toast)
  // ============================================
  function showWarning() {
    if (warnShown) return;
    warnShown = true;

    // Supprime un éventuel toast existant
    const existing = document.getElementById('kwatta-idle-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'kwatta-idle-toast';
    toast.style.cssText = `
      position: fixed;
      bottom: 88px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 99999;
      background: #0C1A16;
      color: #FAF6F0;
      padding: 14px 18px;
      border-radius: 14px;
      box-shadow: 0 12px 32px rgba(12,26,22,0.35);
      display: flex;
      align-items: center;
      gap: 14px;
      max-width: calc(100vw - 32px);
      font-family: 'Inter', system-ui, sans-serif;
      font-size: 13px;
      line-height: 1.4;
      animation: kwattaIdleSlideUp 0.3s ease;
    `;

    toast.innerHTML = `
      <span style="font-size: 20px; flex-shrink: 0;">⏱️</span>
      <span style="flex: 1;">Vous serez déconnecté dans <strong>1 minute</strong> par inactivité.</span>
      <button id="kwatta-idle-stay" style="
        background: #F2A93B;
        color: #3A2606;
        border: none;
        padding: 8px 14px;
        border-radius: 100px;
        font-weight: 700;
        font-size: 12px;
        cursor: pointer;
        font-family: 'Sora', system-ui, sans-serif;
        white-space: nowrap;
      ">Rester connecté</button>
    `;

    // Style keyframes injecté une seule fois
    if (!document.getElementById('kwatta-idle-style')) {
      const style = document.createElement('style');
      style.id = 'kwatta-idle-style';
      style.textContent = `
        @keyframes kwattaIdleSlideUp {
          from { opacity: 0; transform: translate(-50%, 20px); }
          to   { opacity: 1; transform: translate(-50%, 0); }
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(toast);

    const stayBtn = document.getElementById('kwatta-idle-stay');
    if (stayBtn) {
      stayBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        resume();
      });
    }
  }

  function hideWarning() {
    warnShown = false;
    const toast = document.getElementById('kwatta-idle-toast');
    if (toast) toast.remove();
  }

  // ============================================
  // DÉCONNEXION
  // ============================================
  async function doLogout(reason) {
    if (!window.kwatta_db) {
      window.location.href = 'login.html?reason=timeout';
      return;
    }

    try {
      await window.kwatta_db.auth.signOut();
    } catch (e) {
      console.warn('[IDLE] signOut error:', e);
    }

    // Signale aux autres onglets (via storage)
    try {
      localStorage.setItem(CHANNEL_KEY, String(now()));
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}

    // Redirige vers login avec message
    const url = 'login.html?reason=' + (reason || 'timeout');
    window.location.href = url;
  }

  // ============================================
  // RECALCUL DES TIMERS
  // ============================================
  function scheduleTimers() {
    clearTimers();
    const last = getLastActivity();
    if (!last) {
      // Pas de trace → on considère actif maintenant
      touchActivity();
      scheduleTimers();
      return;
    }

    const elapsed = now() - last;
    const remainingToWarn   = WARN_MS - elapsed;
    const remainingToLogout = IDLE_MS - elapsed;

    if (remainingToLogout <= 0) {
      doLogout('timeout');
      return;
    }

    if (remainingToWarn <= 0) {
      // Déjà en zone d'avertissement
      showWarning();
    } else {
      warnTimer = setTimeout(() => {
        // Double-check : personne n'a bougé ?
        const last2 = getLastActivity();
        if (now() - last2 >= WARN_MS) {
          showWarning();
        }
      }, remainingToWarn);
    }

    logoutTimer = setTimeout(() => {
      // Double-check avant de logout
      const last2 = getLastActivity();
      if (now() - last2 >= IDLE_MS) {
        doLogout('timeout');
      } else {
        scheduleTimers();
      }
    }, remainingToLogout);
  }

  // ============================================
  // ACTIVITÉ DÉTECTÉE
  // ============================================
  function onActivity() {
    if (!isRunning) return;

    // Si l'avertissement est affiché, on ne réinitialise PAS
    // tant que l'utilisateur n'a pas cliqué "Rester connecté"
    if (warnShown) return;

    touchActivity();
    scheduleTimers();
  }

  // Bouton "Rester connecté"
  function resume() {
    hideWarning();
    touchActivity();
    scheduleTimers();
  }

  // ============================================
  // INIT
  // ============================================
  async function start() {
    if (isRunning) return;

    // Attend que Supabase soit prêt
    const startTime = Date.now();
    while (!window.kwatta_db && Date.now() - startTime < 5000) {
      await new Promise(r => setTimeout(r, 100));
    }
    if (!window.kwatta_db) {
      console.warn('[IDLE] kwatta_db indisponible — module inactif');
      return;
    }

    // Vérifie qu'il y a bien une session
    const { data: { session } } = await window.kwatta_db.auth.getSession();
    if (!session) return; // Visiteur → rien à faire

    isRunning = true;

    // Trace activité au démarrage
    touchActivity();

    // Enregistre les événements d'activité (throttled)
    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click', 'visibilitychange'];
    let throttle = null;
    events.forEach(ev => {
      document.addEventListener(ev, () => {
        if (throttle) return;
        throttle = setTimeout(() => { throttle = null; }, 2000); // max 1 fois / 2s
        onActivity();
      }, { passive: true });
    });

    // Synchronisation multi-onglets
    window.addEventListener('storage', (e) => {
      if (e.key === CHANNEL_KEY && e.newValue) {
        // Un autre onglet a déclenché un logout
        window.location.href = 'login.html?reason=timeout';
      } else if (e.key === STORAGE_KEY && e.newValue) {
        // Un autre onglet a eu de l'activité → on recale nos timers
        if (!warnShown) scheduleTimers();
      }
    });

    // Quand l'onglet redevient visible, recalcule
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) scheduleTimers();
    });

    // Vérifie aussi la session Supabase (au cas où elle aurait expiré côté serveur)
    setInterval(async () => {
      const { data: { session } } = await window.kwatta_db.auth.getSession();
      if (!session) {
        window.location.href = 'login.html?reason=timeout';
      }
    }, 60 * 1000); // toutes les minutes

    // Démarre les timers
    scheduleTimers();

    console.log('[IDLE] ✅ Auto-logout actif (10 min)');
  }

  // Démarre au chargement
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

  // Expose pour debug
  window.kwattaIdleLogout = {
    trigger: () => doLogout('manual'),
    touch:   () => touchActivity(),
    state:   () => ({ isRunning, warnShown, lastActivity: getLastActivity() })
  };
})();
