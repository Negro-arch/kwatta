// ============================================
// KWATTA — Changement / vérification d'email
// ============================================

(function() {
  'use strict';

  function $(id) { return document.getElementById(id); }

  // ============================================
  // OUVRIR LA MODALE
  // ============================================
  window.ouvrirVerifEmail = async function() {
    const { data: { session } } = await window.kwatta_db.auth.getSession();
    if (!session) {
      alert('Tu dois être connecté.');
      return;
    }

    // Pré-remplit si l'email n'est pas un email fictif
    const currentEmail = session.user.email || '';
    const input = $('email-input');
    if (input) {
      if (currentEmail.includes('@kwatta-phone.cm') || currentEmail.includes('@kwatta-user.local') || currentEmail.includes('@phone.kwatta.app')) {
        input.value = '';
      } else {
        input.value = currentEmail;
      }
      input.classList.remove('border-red-500');
    }

    // Reset erreurs
    const errEl = $('email-error');
    if (errEl) errEl.classList.add('hidden');

    const submitBtn = $('email-submit');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = '📧 Envoyer le lien de confirmation';
    }

    $('email-modal').classList.remove('hidden');
  };

  // ============================================
  // VALIDATION EMAIL
  // ============================================
  function isValidEmail(email) {
    // Regex simple mais efficace
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // ============================================
  // SOUMISSION
  // ============================================
  async function submitEmail() {
    const input = $('email-input');
    const errEl = $('email-error');
    const submitBtn = $('email-submit');

    if (!input || !errEl || !submitBtn) return;

    const email = input.value.trim().toLowerCase();
    errEl.classList.add('hidden');
    input.classList.remove('border-red-500');

    // Validation
    if (!email) {
      errEl.textContent = 'Entre ton adresse email.';
      errEl.classList.remove('hidden');
      input.classList.add('border-red-500');
      return;
    }

    if (!isValidEmail(email)) {
      errEl.textContent = 'Adresse email invalide.';
      errEl.classList.remove('hidden');
      input.classList.add('border-red-500');
      return;
    }

    if (email.endsWith('@kwatta-user.local')) {
      errEl.textContent = 'Cette adresse est réservée. Utilise une vraie adresse.';
      errEl.classList.remove('hidden');
      input.classList.add('border-red-500');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Envoi en cours...';

    // Appel Supabase
    const { data, error } = await window.kwatta_db.auth.updateUser({
      email: email,
    });

    if (error) {
      console.error('[EMAIL] Erreur:', error);
      errEl.textContent = '❌ ' + (error.message || 'Erreur inconnue');
      errEl.classList.remove('hidden');
      submitBtn.disabled = false;
      submitBtn.textContent = '📧 Envoyer le lien de confirmation';
      return;
    }

    console.log('[EMAIL] ✅ Demande envoyée pour', email);

    // Succès
    submitBtn.textContent = '✅ Email envoyé !';

    setTimeout(() => {
      $('email-modal').classList.add('hidden');
      alert(
        '✅ Un email de confirmation a été envoyé à :\n\n' + email + '\n\n' +
        'Clique sur le lien dans cet email pour confirmer ton adresse.\n\n' +
        'Une fois confirmé, reviens sur ton profil et recharge la page pour activer la vérification.'
      );
    }, 800);
  }

  // ============================================
  // SYNC AU CHARGEMENT : si email déjà confirmé côté Supabase
  // ============================================
  async function syncEmailStatus() {
    try {
      const { data, error } = await window.kwatta_db.rpc('sync_email_verification');

      if (error) {
        console.warn('[EMAIL-SYNC] Erreur:', error);
        return;
      }

      if (data && data.updated) {
        console.log('[EMAIL-SYNC] ✅ Statut mis à jour automatiquement');
        // Recharge la page pour rafraîchir le bandeau
        window.location.reload();
      } else if (data) {
        console.log('[EMAIL-SYNC] Aucun changement. Email confirmé:', data.email_confirmed);
      }
    } catch (err) {
      console.warn('[EMAIL-SYNC] Erreur:', err);
    }
  }

  // ============================================
  // ÉVÉNEMENTS
  // ============================================
  document.addEventListener('DOMContentLoaded', () => {
    // Fermer la modale
    const closeBtn = $('email-close');
    const modal = $('email-modal');
    if (closeBtn && modal) {
      closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
    }
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.add('hidden');
      });
    }

    // Submit
    const submitBtn = $('email-submit');
    if (submitBtn) {
      submitBtn.addEventListener('click', submitEmail);
    }

    // Entrée pour soumettre
    const input = $('email-input');
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          submitEmail();
        }
      });
    }
  });

  // Au chargement de la page : sync avec auth.users
  window.addEventListener('load', syncEmailStatus);

  console.log('[EMAIL] Module chargé');
})();
