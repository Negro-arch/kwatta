// ============================================
// KWATTA — Composant étoiles
// ============================================

/**
 * Génère le HTML d'affichage d'une note (lecture seule)
 * @param {number} note - Note de 0 à 5
 * @param {number} size - Taille en px (défaut: 16)
 * @param {boolean} showNumber - Afficher la note chiffrée
 * @returns {string} HTML
 */
function renderStars(note, size = 16, showNumber = true) {
  const noteArrondie = Math.round(note * 2) / 2; // Arrondi à 0.5
  let html = '<div class="stars-display" style="display:inline-flex;align-items:center;gap:2px;">';
  
  for (let i = 1; i <= 5; i++) {
    let fill = 'none';
    let color = '#D1D5DB'; // gris clair
    
    if (i <= noteArrondie) {
      fill = '#F59E0B'; // or plein
      color = '#F59E0B';
    } else if (i - 0.5 === noteArrondie) {
      fill = 'url(#half-star)'; // demi-étoile
      color = '#F59E0B';
    }
    
    html += `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${fill}" stroke="${color}" stroke-width="1.5">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>`;
  }
  
  if (showNumber) {
    html += `<span style="margin-left:4px;font-size:${size * 0.75}px;color:#7A7A7A;">${note.toFixed(1)}</span>`;
  }
  
  html += '</div>';
  return html;
}

/**
 * Génère un input de sélection de note (interactif)
 * @param {number} noteInitiale - Note initiale (0-5)
 * @param {string} inputId - ID de l'input hidden
 * @returns {string} HTML
 */
function renderStarInput(noteInitiale = 0, inputId = 'note-input') {
  let html = `<div class="stars-input" data-input-id="${inputId}" style="display:inline-flex;gap:4px;cursor:pointer;">`;
  
  for (let i = 1; i <= 5; i++) {
    html += `<button type="button" class="star-btn" data-value="${i}" 
      style="background:none;border:none;cursor:pointer;padding:2px;transition:transform 0.1s;"
      onmouseover="this.style.transform='scale(1.2)'"
      onmouseout="this.style.transform='scale(1)'">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="${i <= noteInitiale ? '#F59E0B' : 'none'}" stroke="#F59E0B" stroke-width="1.5">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    </button>`;
  }
  
  html += `</div>
  <input type="hidden" id="${inputId}" value="${noteInitiale}">`;
  
  return html;
}

// Initialise les étoiles interactives
function setupStarInput() {
  document.querySelectorAll('.stars-input').forEach(container => {
    const inputId = container.dataset.inputId;
    const input = document.getElementById(inputId);
    if (!input) return;
    
    const buttons = container.querySelectorAll('.star-btn');
    
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const value = parseInt(btn.dataset.value);
        input.value = value;
        
        buttons.forEach((b, i) => {
          const svg = b.querySelector('svg');
          svg.setAttribute('fill', i < value ? '#F59E0B' : 'none');
        });
      });
      
      btn.addEventListener('mouseenter', () => {
        const value = parseInt(btn.dataset.value);
        buttons.forEach((b, i) => {
          const svg = b.querySelector('svg');
          svg.setAttribute('fill', i < value ? '#F59E0B' : 'none');
        });
      });
    });
    
    container.addEventListener('mouseleave', () => {
      const value = parseInt(input.value) || 0;
      buttons.forEach((b, i) => {
        const svg = b.querySelector('svg');
        svg.setAttribute('fill', i < value ? '#F59E0B' : 'none');
      });
    });
  });
}

window.renderStars = renderStars;
window.renderStarInput = renderStarInput;
window.setupStarInput = setupStarInput;
