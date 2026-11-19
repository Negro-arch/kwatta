// ============================================
// KWATTA — Auth Modal + Session
// ============================================
(function() {
  let currentUser = null;
  let currentProfile = null;
  let authMode = 'login'; // 'login' ou 'signup'

  const $ = (id) => document.getElementById(id);

  // ============================================
  // DÉTECTE LA SESSION
  // ============================================
  // Attend que window.kwatta_db soit prêt (chargement async du CDN Supabase)
  async function waitForDb(maxWaitMs = 5000) {
    const start = Date.now();
    while (!window.kwatta_db && Date.now() - start < maxWaitMs) {
      await new Promise(r => setTimeout(r, 100));
    }
    return !!window.kwatta_db;
  }

  async function checkSession() {
    const ready = await waitForDb();
    if (!ready) {
      console.warn('[AUTH] kwatta_db indisponible après 5s — checkSession abandonnée');
      return;
    }
    const { data: { session } } = await window.kwatta_db.auth.getSession();
    
    if (session) {
      currentUser = session.user;
      // Charge le profil
      const { data: profile } = await window.kwatta_db
        .from('profiles')
        .select('username, display_name, role, avatar_url')
        .eq('id', session.user.id)
        .single();
      currentProfile = profile;
      updateHeaderLoggedIn();
    } else {
      currentUser = null;
      currentProfile = null;
      updateHeaderLoggedOut();
    }
  }

  function updateHeaderLoggedIn() {
    const loginBtn = $('header-auth-btn');
    const profileBtn = $('header-profile-btn');
    
    // Cache complètement le bouton login (retire aussi sm:flex)
    if (loginBtn) {
      loginBtn.classList.add('hidden');
      loginBtn.classList.remove('sm:flex');
      loginBtn.style.display = 'none';
    }
    // Affiche le bouton profil (retire hidden)
    if (profileBtn) {
      profileBtn.classList.remove('hidden');
      profileBtn.classList.add('flex');
      profileBtn.style.display = 'flex';
    }
    
    const avatar = $('header-avatar');
    if (avatar && currentProfile) {
      if (currentProfile.avatar_url) {
        avatar.innerHTML = '<img src="' + currentProfile.avatar_url + '" class="w-full h-full object-cover" alt="Avatar">';
      } else {
        const name = currentProfile.display_name || currentProfile.username || '?';
        avatar.textContent = name[0].toUpperCase();
      }
    }

    // Toggle les éléments guest-only / user-only
    document.querySelectorAll('.guest-only').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.user-only').forEach(el => el.classList.remove('hidden'));
  }

  function updateHeaderLoggedOut() {
    const loginBtn = $('header-auth-btn');
    const profileBtn = $('header-profile-btn');
    
    if (loginBtn) {
      loginBtn.classList.remove('hidden');
      loginBtn.classList.add('sm:flex');
      loginBtn.style.display = '';
    }
    if (profileBtn) {
      profileBtn.classList.add('hidden');
      profileBtn.classList.remove('flex');
      profileBtn.style.display = 'none';
    }

    // Toggle les éléments guest-only / user-only
    document.querySelectorAll('.guest-only').forEach(el => el.classList.remove('hidden'));
    document.querySelectorAll('.user-only').forEach(el => el.classList.add('hidden'));
  }

  // ============================================
  // HELPERS TÉLÉPHONE
  // ============================================
  function normalizePhone(raw) {
    if (!raw) return '';
    // Enlève espaces, tirets, parenthèses, points
    let cleaned = raw.replace(/[\s\-().]/g, '');

    // Enlève le + au début
    cleaned = cleaned.replace(/^\+/, '');

    // Si commence par 237 → garde
    if (cleaned.startsWith('237')) {
      return cleaned;
    }

    // Si 10 chiffres (format Cameroun local) → préfixe 237
    if (/^\d{9,10}$/.test(cleaned)) {
      // Si 10 chiffres et commence par 0, enlève le 0 initial
      if (cleaned.length === 10 && cleaned.startsWith('0')) {
        cleaned = cleaned.substring(1);
      }
      return '237' + cleaned;
    }

    // Sinon retourne tel quel
    return cleaned;
  }

  function phoneToFakeEmail(phone) {
    return phone + '@kwatta-phone.cm';
  }

  function isValidPhone(normalized) {
    // Après normalisation, doit faire 11 chiffres (237 + 8 chiffres)
    return /^237\d{8,9}$/.test(normalized);
  }

  // ============================================
  // MODALE AUTH
  // ============================================
  function openAuthModal(mode = 'login') {
    authMode = mode;
    const modal = $('auth-modal');
    if (!modal) return;
    
    modal.classList.remove('hidden');
    updateAuthMode();
  }

  function closeAuthModal() {
    const modal = $('auth-modal');
    if (modal) modal.classList.add('hidden');
  }

  function updateAuthMode() {
    const isLogin = authMode === 'login';
    const isSignup = authMode === 'signup';
    const isPhoneSignup = authMode === 'signup_phone';

    const isAnySignup = isSignup || isPhoneSignup;

    // Champs
    $('auth-name-field').classList.toggle('hidden', !isAnySignup);
    $('auth-username-field').classList.toggle('hidden', !isAnySignup);
    $('auth-terms-field').classList.toggle('hidden', !isAnySignup);
    $('auth-phone-field').classList.toggle('hidden', !isPhoneSignup);
    $('auth-phone-banner').classList.toggle('hidden', !isPhoneSignup);
    $('auth-whatsapp-field').classList.toggle('hidden', !isSignup); // seulement en signup email

    // En mode téléphone, le champ email est caché
    const emailField = $('auth-email')?.closest('div');
    if (emailField) {
      emailField.classList.toggle('hidden', isPhoneSignup);
    }

    // Rend le champ email non-required en mode téléphone
    if ($('auth-email')) {
      $('auth-email').required = !isPhoneSignup;
    }

    // Rend le champ téléphone required en mode signup_phone
    if ($('auth-phone')) {
      $('auth-phone').required = isPhoneSignup;
    }

    // Titres
    if (isPhoneSignup) {
      $('auth-title').textContent = 'Créer un compte';
      $('auth-subtitle').textContent = 'Inscris-toi avec ton numéro de téléphone.';
    } else if (isSignup) {
      $('auth-title').textContent = 'Créer un compte';
      $('auth-subtitle').textContent = 'Rejoignez la communauté KWATTA.';
    } else {
      $('auth-title').textContent = 'Bienvenue sur KWATTA';
      $('auth-subtitle').textContent = 'Connectez-vous pour continuer.';
    }

    // Bouton submit
    $('auth-submit').textContent = isAnySignup ? 'Créer mon compte' : 'Se connecter';

    // Lien switch (masqué en mode signup_phone)
    const switchBtn = $('auth-switch');
    if (switchBtn) {
      switchBtn.textContent = isAnySignup
        ? 'Déjà un compte ? Se connecter'
        : 'Pas de compte ? Créer un compte';
    }

    // Erreur
    $('auth-error').classList.add('hidden');
  }

  // ============================================
  // SUBMIT
  // ============================================
  document.addEventListener('DOMContentLoaded', () => {
    const form = $('auth-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const errEl = $('auth-error');
      errEl.classList.add('hidden');

      const email = $('auth-email').value.trim();
      const password = $('auth-password').value;

      if (authMode === 'login') {
        const { data, error } = await window.kwatta_db.auth.signInWithPassword({ email, password });
        if (error) {
          errEl.textContent = error.message;
          errEl.classList.remove('hidden');
          return;
        }
        
        // Redirection selon rôle
        const { data: profile } = await window.kwatta_db
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();
        
        closeAuthModal();
        if (profile?.role === 'admin') {
          window.location.href = 'admin/index.html';
        } else {
          window.location.reload();
        }
      } else {
        // Signup (email OU téléphone)
        const name = $('auth-name').value.trim();
        const username = $('auth-username').value.trim().toLowerCase();
        const terms = $('auth-terms').checked;

        // ============================================
        // VALIDATIONS COMMUNES
        // ============================================
        if (!terms) {
          errEl.textContent = 'Vous devez accepter les conditions.';
          errEl.classList.remove('hidden');
          return;
        }
        if (!/^[a-z0-9_]{3,20}$/.test(username)) {
          errEl.textContent = 'Nom d\'utilisateur invalide (3-20 caractères).';
          errEl.classList.remove('hidden');
          return;
        }
        if (!name || name.length < 2) {
          errEl.textContent = 'Entre ton nom complet.';
          errEl.classList.remove('hidden');
          return;
        }

        let signupEmail = email;
        let extraMeta = {};

        // ============================================
        // SIGNUP PAR TÉLÉPHONE
        // ============================================
        if (authMode === 'signup_phone') {
          const phoneRaw = $('auth-phone').value.trim();
          if (!phoneRaw) {
            errEl.textContent = 'Entre ton numéro de téléphone.';
            errEl.classList.remove('hidden');
            return;
          }

          const phoneNorm = normalizePhone(phoneRaw);
          if (!isValidPhone(phoneNorm)) {
            errEl.textContent = 'Numéro invalide. Format : 6XX XXX XXX ou +237 6XX XXX XXX';
            errEl.classList.remove('hidden');
            return;
          }

          signupEmail = phoneToFakeEmail(phoneNorm);
          extraMeta = {
            phone_original: phoneNorm,
            temp_email: true,
          };

          console.log('[AUTH] Signup téléphone → email fictif:', signupEmail);
        }
        // ============================================
        // SIGNUP PAR EMAIL (classique)
        // ============================================
        else {
          if (!email) {
            errEl.textContent = 'Entre ton email.';
            errEl.classList.remove('hidden');
            return;
          }
          extraMeta = {
            whatsapp: $('auth-whatsapp').value.trim() || null,
            temp_email: false,
          };
        }

        // ============================================
        // CRÉATION DU COMPTE
        // ============================================
        const { data, error } = await window.kwatta_db.auth.signUp({
          email: signupEmail,
          password,
          options: {
            data: {
              username,
              display_name: name,
              ...extraMeta,
            }
          }
        });

        if (error) {
          // Détection doublon
          if (error.message.includes('already registered') || error.message.includes('already been registered')) {
            errEl.textContent = 'Ce compte existe déjà. Connecte-toi.';
          } else {
            errEl.textContent = error.message;
          }
          errEl.classList.remove('hidden');
          return;
        }

        // Détection doublon par email vide (Supabase renvoie souvent data.user sans session)
        if (data.user && !data.session) {
          // En mode téléphone, si c'est un doublon, data.user.identities sera vide
          if (authMode === 'signup_phone' && data.user.identities && data.user.identities.length === 0) {
            errEl.textContent = 'Ce numéro est déjà utilisé. Connecte-toi avec ton mot de passe.';
            errEl.classList.remove('hidden');
            return;
          }

          errEl.textContent = 'Vérifiez votre email pour confirmer.';
          errEl.classList.add('text-green-600');
          errEl.classList.remove('hidden');
          return;
        }

        // Succès : recharge
        console.log('[AUTH] ✅ Inscription réussie, rechargement...');
        closeAuthModal();
        window.location.reload();
      }
    });

    // Switch mode
    $('auth-switch').addEventListener('click', () => {
      authMode = authMode === 'login' ? 'signup' : 'login';
      updateAuthMode();
    });

    // Fermer
    $('auth-close').addEventListener('click', closeAuthModal);
    $('auth-modal').addEventListener('click', (e) => {
      if (e.target === $('auth-modal')) closeAuthModal();
    });

    // Bouton auth header
    $('header-auth-btn')?.addEventListener('click', () => openAuthModal('login'));

    // ============================================
    // BOUTON "S'inscrire avec mon numéro"
    // ============================================
    $('phone-signup-btn')?.addEventListener('click', () => {
      authMode = 'signup_phone';
      updateAuthMode();
    });

    // Bouton "Annuler" du bandeau téléphone
    $('cancel-phone-signup')?.addEventListener('click', () => {
      authMode = 'signup';
      // Vide le champ téléphone
      if ($('auth-phone')) $('auth-phone').value = '';
      updateAuthMode();
    });
  });

  // Expose globalement
  window.kwattaOpenAuth = openAuthModal;
  window.kwattaCloseAuth = closeAuthModal;
  window.kwattaCheckSession = checkSession;
  window.kwattaCurrentUser = () => currentUser;
  window.kwattaCurrentProfile = () => currentProfile;

  // Check au chargement
  document.addEventListener('DOMContentLoaded', checkSession);
})();

// ============================================
// PROTECTION DES PAGES (visiteurs)
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  // Liens protégés
  const protectedLinks = ['sell.html', 'messages.html', 'profile.html', 'chat.html'];
  
  document.querySelectorAll('a').forEach(link => {
    const href = link.getAttribute('href');
    if (!href) return;
    
    const isProtected = protectedLinks.some(p => href.includes(p));
    if (!isProtected) return;
    
    link.addEventListener('click', (e) => {
      if (!window.kwattaCurrentUser()) {
        e.preventDefault();
        window.kwattaOpenAuth('login');
      }
    });
  });

  // Bouton "Vendre un article" du hero
  document.querySelectorAll('a[href="sell.html"]').forEach(link => {
    link.addEventListener('click', (e) => {
      if (!window.kwattaCurrentUser()) {
        e.preventDefault();
        window.kwattaOpenAuth('signup');
      }
    });
  });
});

// ============================================
// OAUTH GOOGLE
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  const googleBtn = document.getElementById('google-auth-btn');
  if (!googleBtn) return;

  googleBtn.addEventListener('click', async () => {
    const { error } = await window.kwatta_db.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/index.html',
        queryParams: {
          prompt: 'select_account'
        }
      }
    });
    if (error) alert('Erreur: ' + error.message);
  });
});
