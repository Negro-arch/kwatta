// ============================================
// KWATTA — Modale "Faire une offre"
// ============================================
(function() {
  'use strict';

  let currentListing = null;
  let currentSeller = null;
  let isInitialized = false;

  const $ = (id) => document.getElementById(id);

  // ============================================
  // FORMATAGE
  // ============================================
  function formatPrice(p) {
    return new Intl.NumberFormat('fr-FR').format(p) + ' FCFA';
  }

  // ============================================
  // INIT (attend que le DOM soit prêt)
  // ============================================
  function init() {
    if (isInitialized) return;
    isInitialized = true;

    console.log('[OFFRE] Initialisation...');

    const offerBtn = $('offer-btn');
    const offerModal = $('offer-modal');
    const offerClose = $('offer-close');
    const offerSubmit = $('offer-submit');
    const offerAmount = $('offer-amount');
    const offerMessage = $('offer-message');
    const offerError = $('offer-error');
    const pctInput = $('offer-pct');

    if (!offerBtn || !offerModal) {
      console.warn('[OFFRE] Éléments manquants dans le DOM');
      return;
    }

    // ============================================
    // OUVRIR LA MODALE
    // ============================================
    offerBtn.addEventListener('click', async () => {
      console.log('[OFFRE] Bouton cliqué');

      const { data: { session } } = await window.kwatta_db.auth.getSession();

      if (!session) {
        window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.href);
        return;
      }

      // Empêche de faire une offre sur son propre article
      if (currentSeller && currentSeller.id === session.user.id) {
        alert('Vous ne pouvez pas faire une offre sur votre propre article 🙂');
        return;
      }

      // Récupère les infos de l'article
      const urlParams = new URLSearchParams(window.location.search);
      const productId = urlParams.get('id');

      const { data } = await window.kwatta_db
        .from('listings')
        .select('id, title, price_xaf, seller_id')
        .eq('id', productId)
        .single();

      if (!data) {
        alert('Article introuvable');
        return;
      }

      currentListing = data;

      // Remplit la modale
      $('offer-listing-title').textContent = data.title;
      $('offer-listing-price').textContent = formatPrice(data.price_xaf);
      
      // Reset
      offerAmount.value = '';
      offerMessage.value = '';
      offerError.classList.add('hidden');
      if (pctInput) pctInput.value = '';

      // Affiche
      offerModal.classList.remove('hidden');
    });

    // ============================================
    // FERMER LA MODALE
    // ============================================
    offerClose.addEventListener('click', () => {
      offerModal.classList.add('hidden');
    });

    offerModal.addEventListener('click', (e) => {
      if (e.target === offerModal) {
        offerModal.classList.add('hidden');
      }
    });

    // ============================================
    // INPUT POURCENTAGE
    // ============================================
    if (pctInput) {
      pctInput.addEventListener('input', () => {
        if (!currentListing) return;

        const pct = parseFloat(pctInput.value);

        if (isNaN(pct) || pct <= 0) {
          offerAmount.value = '';
          return;
        }

        if (pct >= 100) {
          offerAmount.value = '';
          pctInput.value = 99; // max 99%
          return;
        }

        // Calcule : prix - (prix * pct / 100), arrondi aux 100 FCFA
        const montant = Math.round(currentListing.price_xaf * (1 - pct / 100) / 100) * 100;
        offerAmount.value = montant;
      });
    }

    // ============================================
    // SOUMISSION
    // ============================================
    offerSubmit.addEventListener('click', async () => {
      console.log('[OFFRE] Soumission...');
      offerError.classList.add('hidden');

      if (!currentListing) {
        offerError.textContent = 'Article introuvable.';
        offerError.classList.remove('hidden');
        return;
      }

      const montant = parseFloat(offerAmount.value);
      const message = offerMessage.value.trim();

      if (!montant || montant <= 0) {
        offerError.textContent = 'Entrez un montant valide.';
        offerError.classList.remove('hidden');
        return;
      }

      if (montant >= currentListing.price_xaf) {
        offerError.textContent = 'Votre offre doit être inférieure au prix affiché.';
        offerError.classList.remove('hidden');
        return;
      }

      const btn = offerSubmit;
      btn.disabled = true;
      btn.textContent = 'Envoi...';

      const { data: { session } } = await window.kwatta_db.auth.getSession();

      const { error } = await window.kwatta_db
        .from('offres')
        .insert({
          id_listing: currentListing.id,
          id_acheteur: session.user.id,
          id_vendeur: currentListing.seller_id,
          montant_propose: montant,
          message: message || null
        });

      if (error) {
        console.error(error);
        offerError.textContent = 'Erreur : ' + error.message;
        offerError.classList.remove('hidden');
        btn.disabled = false;
        btn.textContent = 'Envoyer mon offre';
        return;
      }

      // Succès
      offerModal.classList.add('hidden');
      alert('✅ Offre envoyée ! Le vendeur a 48h pour répondre.');
      btn.disabled = false;
      btn.textContent = 'Envoyer mon offre';
    });

    console.log('[OFFRE] ✅ Initialisé');
  }

  // ============================================
  // DÉMARRAGE
  // ============================================
  // Si le DOM est déjà chargé
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose pour le module product.html (pour stocker le vendeur)
  window.setOfferSeller = (seller) => {
    currentSeller = seller;
  };
})();
