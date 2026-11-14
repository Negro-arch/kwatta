// ============================================
// KWATTA — Point rouge + notif épinglée vérification
// ============================================
(async () => {
  // Attendre que Supabase soit prêt
  const start = Date.now();
  while (!window.kwatta_db && Date.now() - start < 5000) {
    await new Promise(r => setTimeout(r, 100));
  }
  if (!window.kwatta_db) return;

  const { data: { session } } = await window.kwatta_db.auth.getSession();
  if (!session) return;

  const { data: profile } = await window.kwatta_db
    .from('profiles')
    .select('verification_status, role')
    .eq('id', session.user.id)
    .single();

  if (!profile) return;
  if (profile.role === 'admin') return;

  const status = profile.verification_status || 'non_verifie';
  const needsAction = status === 'non_verifie' || status === 'email_ok' || status === 'cni_refuse';

  if (!needsAction) return;

  // Affiche le point rouge
  const dot = document.getElementById('verif-dot');
  if (dot) dot.classList.remove('hidden');

  // Affiche la notif épinglée
  const pinned = document.getElementById('verif-pinned-notif');
  if (!pinned) return;

  let msg = '';
  let emoji = '';
  if (status === 'non_verifie') {
    emoji = '⚠️';
    msg = 'Vérifie ton email pour sécuriser ton compte.';
  } else if (status === 'email_ok') {
    emoji = '🪪';
    msg = 'Upload ta CNI pour obtenir le badge ✓ Vérifié.';
  } else if (status === 'cni_refuse') {
    emoji = '❌';
    msg = 'Ta CNI a été refusée. Réessaie.';
  }

  pinned.innerHTML = `
    <a href="profile.html" class="block px-4 py-3 bg-red-50 border-b-2 border-red-100 hover:bg-red-100 transition">
      <div class="flex items-start gap-3">
        <div class="text-2xl shrink-0">${emoji}</div>
        <div class="flex-1 min-w-0">
          <div class="font-bold text-sm text-red-800">Action requise</div>
          <div class="text-xs text-red-700 mt-0.5">${msg}</div>
        </div>
        <svg width="14" height="14" fill="none" stroke="#991b1b" stroke-width="2" viewBox="0 0 24 24" class="shrink-0 mt-1">
          <path d="m9 18 6-6-6-6"/>
        </svg>
      </div>
    </a>
  `;
  pinned.classList.remove('hidden');

  console.log('[VERIF] Statut:', status, '→ point rouge actif');
})();
