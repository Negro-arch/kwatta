// ============================================
// KWATTA — Upload CNI (vérification identité)
// ============================================

(function() {
  'use strict';

  const MAX_SIZE = 2 * 1024 * 1024; // 2 MB
  const ACCEPTED_TYPES = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  const ACCEPTED_EXT = ['jpg', 'jpeg', 'png', 'webp', 'pdf', 'doc', 'docx'];

  let selectedFile = null;
  let currentUser = null;

  function $ (id) { return document.getElementById(id); }

  function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  // ============================================
  // OUVRIR LA MODALE
  // ============================================
  window.ouvrirVerifCNI = async function() {
    // Récupère l'user
    const { data: { session } } = await window.kwatta_db.auth.getSession();
    if (!session) {
      alert('Tu dois être connecté.');
      return;
    }
    currentUser = session.user;

    // Reset
    selectedFile = null;
    resetPreview();

    // Affiche la modale
    $('cni-modal').classList.remove('hidden');
  };

  function resetPreview() {
    const preview = $('cni-preview');
    const empty = $('cni-empty');
    const fileInput = $('cni-file-input');
    const cameraInput = $('cni-camera-input');

    if (preview) preview.classList.add('hidden');
    if (empty) empty.classList.remove('hidden');
    if (fileInput) fileInput.value = '';
    if (cameraInput) cameraInput.value = '';

    const errEl = $('cni-error');
    if (errEl) errEl.classList.add('hidden');

    const submitBtn = $('cni-submit');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = '📤 Envoyer ma CNI';
    }
  }

  // ============================================
  // SÉLECTION DE FICHIER
  // ============================================
  function handleFile(file) {
    if (!file) return;

    const errEl = $('cni-error');
    if (errEl) errEl.classList.add('hidden');

    // Vérif taille
    if (file.size > MAX_SIZE) {
      showError('Fichier trop lourd (' + formatBytes(file.size) + '). Maximum 2 MB.');
      return;
    }

    // Vérif type
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    if (!ACCEPTED_TYPES.includes(file.type) && !ACCEPTED_EXT.includes(ext)) {
      showError('Format non accepté. Utilise JPG, PNG, PDF ou Word.');
      return;
    }

    selectedFile = file;
    showPreview(file);
  }

  function showError(msg) {
    const errEl = $('cni-error');
    if (errEl) {
      errEl.textContent = '❌ ' + msg;
      errEl.classList.remove('hidden');
    }
    selectedFile = null;
    const submitBtn = $('cni-submit');
    if (submitBtn) submitBtn.disabled = true;
  }

  function showPreview(file) {
    const preview = $('cni-preview');
    const empty = $('cni-empty');
    if (!preview || !empty) return;

    empty.classList.add('hidden');
    preview.classList.remove('hidden');

    // Détecte le type
    const isImage = file.type.startsWith('image/');
    const ext = (file.name.split('.').pop() || '').toLowerCase();

    let icon = '📄';
    if (isImage) icon = '🖼️';
    else if (ext === 'pdf') icon = '📕';
    else if (ext === 'doc' || ext === 'docx') icon = '📘';

    // Nom + taille + icône
    $('cni-preview-name').textContent = file.name;
    $('cni-preview-size').textContent = formatBytes(file.size);
    $('cni-preview-icon').textContent = icon;

    // Aperçu image si c'est une image
    const imgPreview = $('cni-preview-img');
    if (imgPreview) {
      if (isImage) {
        const reader = new FileReader();
        reader.onload = (e) => {
          imgPreview.src = e.target.result;
          imgPreview.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
      } else {
        imgPreview.classList.add('hidden');
        imgPreview.src = '';
      }
    }

    // Active le bouton
    const submitBtn = $('cni-submit');
    if (submitBtn) submitBtn.disabled = false;
  }

  // ============================================
  // UPLOAD
  // ============================================
  async function uploadCNI() {
    if (!selectedFile || !currentUser) return;

    const submitBtn = $('cni-submit');
    const errEl = $('cni-error');
    if (errEl) errEl.classList.add('hidden');

    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Envoi en cours...';

    try {
      const ext = (selectedFile.name.split('.').pop() || 'jpg').toLowerCase();
      const timestamp = Date.now();
      const filePath = currentUser.id + '/cni-' + timestamp + '.' + ext;

      // 1) Upload vers Storage
      const { error: uploadError } = await window.kwatta_db.storage
        .from('cni')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false,
          contentType: selectedFile.type
        });

      if (uploadError) {
        console.error('[CNI] Upload error:', uploadError);
        throw new Error('Erreur upload : ' + uploadError.message);
      }

      console.log('[CNI] ✅ Fichier uploadé :', filePath);

      // 2) Appel de la fonction SQL
      const { data, error: sqlError } = await window.kwatta_db.rpc('soumettre_cni', {
        p_file_path: filePath,
        p_file_name: selectedFile.name,
        p_file_type: selectedFile.type,
        p_file_size: selectedFile.size
      });

      if (sqlError) {
        console.error('[CNI] SQL error:', sqlError);
        throw new Error('Erreur enregistrement : ' + sqlError.message);
      }

      if (data && !data.success) {
        throw new Error(data.error || 'Erreur inconnue');
      }

      console.log('[CNI] ✅ CNI soumise, ID:', data.cni_id);

      // 3) Succès
      submitBtn.textContent = '✅ Envoyée !';
      
      setTimeout(() => {
        $('cni-modal').classList.add('hidden');
        alert('✅ Ta CNI a été envoyée !\n\nUn administrateur va l\'examiner sous 24-48h. Tu recevras une notification dès qu\'elle sera traitée.');
        // Recharge la page pour rafraîchir le bandeau
        window.location.reload();
      }, 800);

    } catch (err) {
      console.error('[CNI] Erreur:', err);
      if (errEl) {
        errEl.textContent = '❌ ' + err.message;
        errEl.classList.remove('hidden');
      }
      submitBtn.disabled = false;
      submitBtn.textContent = '📤 Envoyer ma CNI';
    }
  }

  // ============================================
  // EVENT LISTENERS (au chargement du DOM)
  // ============================================
  document.addEventListener('DOMContentLoaded', () => {
    // Fermer la modale
    const closeBtn = $('cni-close');
    const modal = $('cni-modal');
    if (closeBtn) closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.add('hidden');
      });
    }

    // Bouton caméra
    const cameraBtn = $('cni-camera-btn');
    const cameraInput = $('cni-camera-input');
    if (cameraBtn && cameraInput) {
      cameraBtn.addEventListener('click', () => cameraInput.click());
      cameraInput.addEventListener('change', (e) => {
        if (e.target.files[0]) handleFile(e.target.files[0]);
      });
    }

    // Bouton fichier
    const fileBtn = $('cni-file-btn');
    const fileInput = $('cni-file-input');
    if (fileBtn && fileInput) {
      fileBtn.addEventListener('click', () => fileInput.click());
      fileInput.addEventListener('change', (e) => {
        if (e.target.files[0]) handleFile(e.target.files[0]);
      });
    }

    // Zone drag & drop (clic sur la zone vide ouvre le fichier)
    const empty = $('cni-empty');
    if (empty && fileInput) {
      empty.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        fileInput.click();
      });
    }

    // Bouton submit
    const submitBtn = $('cni-submit');
    if (submitBtn) {
      submitBtn.addEventListener('click', uploadCNI);
    }

    // Bouton "Changer de fichier"
    const changeBtn = $('cni-change-btn');
    if (changeBtn && fileInput) {
      changeBtn.addEventListener('click', () => fileInput.click());
    }
  });

  console.log('[CNI] Module chargé');
})();
