const toast = document.querySelector('.toast');
let toastTimer;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2800);
}

document.querySelectorAll('a[href="#ucet"]').forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    showToast('Registrácia bude čoskoro pripravená.');
  });
});

document.querySelector('.search-button').addEventListener('click', () => {
  showToast('Vyhľadávanie SkillMatch bude dostupné v Matching Hube.');
});

const menuButton = document.querySelector('.menu-button');
const navLinks = document.querySelector('.nav-links');

menuButton.addEventListener('click', () => {
  const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!isOpen));
  navLinks.classList.toggle('is-open', !isOpen);
});

navLinks.addEventListener('click', () => {
  menuButton.setAttribute('aria-expanded', 'false');
  navLinks.classList.remove('is-open');
});

const profileCards = [...document.querySelectorAll('.profile-card')];
const profileSearch = document.querySelector('#profile-search');
const sortSelect = document.querySelector('.sort-select');
const filterReset = document.querySelector('.filter-reset');
const filterChecks = [...document.querySelectorAll('.filter-option input')];

function updateProfiles() {
  const searchTerm = profileSearch.value.trim().toLowerCase();
  const selectedCategories = filterChecks.filter((checkbox) => checkbox.checked).map((checkbox) => checkbox.parentElement.textContent.trim().split(/\s+/)[0].toLowerCase());

  profileCards.forEach((card) => {
    const category = card.querySelector('.category').textContent.toLowerCase();
    const searchableText = `${card.dataset.name} ${card.dataset.skills} ${category}`.toLowerCase();
    const matchesSearch = !searchTerm || searchableText.includes(searchTerm);
    const allSkillsChecked = filterChecks[0]?.checked;
    const matchesCategory = allSkillsChecked || selectedCategories.some((selected) => category.includes(selected));
    card.hidden = !(matchesSearch && matchesCategory);
  });
}

if (profileSearch) profileSearch.addEventListener('input', updateProfiles);
filterChecks.forEach((checkbox) => checkbox.addEventListener('change', updateProfiles));
filterReset?.addEventListener('click', () => {
  filterChecks.forEach((checkbox, index) => { checkbox.checked = index === 0; });
  updateProfiles();
});

sortSelect?.addEventListener('change', () => {
  const grid = document.querySelector('.profile-grid');
  const cards = [...grid.children];
  if (sortSelect.value.includes('Najlepšie')) cards.sort((a, b) => b.querySelector('.profile-rating').textContent.localeCompare(a.querySelector('.profile-rating').textContent));
  if (sortSelect.value.includes('Najnovšie')) cards.reverse();
  cards.forEach((card) => grid.append(card));
});

document.querySelectorAll('.exchange-button').forEach((button) => {
  button.addEventListener('click', () => showToast('Žiadosť o výmenu bola pripravená.'));
});