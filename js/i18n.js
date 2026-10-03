// ============================================
// KWATTA — i18n (FR + EN)
// ============================================
const KWATTA_TRANSLATIONS = {
  fr: {
    'hero.badge': 'Nouveau sur KWATTA ?',
    'hero.title': 'Le marché de <span class="text-honey">tout le monde</span>.',
    'hero.subtitle': 'Achetez et vendez près de chez vous — mode, électronique, artisanat, et plus encore.',
    'hero.cta_sell': 'Vendre un article',
    'hero.cta_browse': 'Explorer',
    'cat.all': 'Tout',
    'sort.label': 'Trier',
    'sort.recent': 'Plus récents',
    'sort.price_asc': 'Prix croissant',
    'sort.price_desc': 'Prix décroissant',
    'empty.title': 'Aucun article trouvé',
    'empty.subtitle': 'Essayez une autre recherche',
    'nav.home': 'Accueil',
    'nav.search': 'Rechercher',
    'nav.sell': 'Vendre',
    'nav.messages': 'Messages',
    'nav.profile': 'Profil',
    'results': 'articles',
    'loading': 'Chargement...',
  },
  en: {
    'hero.badge': 'New to KWATTA?',
    'hero.title': 'Everyone\'s <span class="text-honey">marketplace</span>.',
    'hero.subtitle': 'Buy and sell near you — fashion, electronics, crafts, and more.',
    'hero.cta_sell': 'Sell an item',
    'hero.cta_browse': 'Explore',
    'cat.all': 'All',
    'sort.label': 'Sort',
    'sort.recent': 'Most recent',
    'sort.price_asc': 'Price low to high',
    'sort.price_desc': 'Price high to low',
    'empty.title': 'No items found',
    'empty.subtitle': 'Try a different search',
    'nav.home': 'Home',
    'nav.search': 'Search',
    'nav.sell': 'Sell',
    'nav.messages': 'Messages',
    'nav.profile': 'Profile',
    'results': 'items',
    'loading': 'Loading...',
  }
};

let KWATTA_LANG = localStorage.getItem('kwatta_lang') || 'fr';

function kwattaT(key) {
  return KWATTA_TRANSLATIONS[KWATTA_LANG][key] || key;
}

function kwattaApplyLang() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.innerHTML = kwattaT(key);
  });
  document.documentElement.lang = KWATTA_LANG;
  const langLabel = document.getElementById('current-lang');
  if (langLabel) langLabel.textContent = KWATTA_LANG.toUpperCase();
}

function kwattaToggleLang() {
  KWATTA_LANG = KWATTA_LANG === 'fr' ? 'en' : 'fr';
  localStorage.setItem('kwatta_lang', KWATTA_LANG);
  kwattaApplyLang();
  if (window.kwattaReRenderProducts) window.kwattaReRenderProducts();
}

window.kwattaT = kwattaT;
window.kwattaApplyLang = kwattaApplyLang;
window.kwattaToggleLang = kwattaToggleLang;
window.kwattaGetLang = () => KWATTA_LANG;
