const USER_KEY = 'skillmatch_user';
const LOGIN_KEY = 'skillmatch_logged_in';

function readUser() {
  try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); } catch { return null; }
}

function loggedIn() {
  return localStorage.getItem(LOGIN_KEY) === 'true';
}

function splitValues(value) {
  return (value || '').split(',').map((item) => item.trim()).filter(Boolean);
}

function protectPages() {
  const protectedPages = ['dashboard.html', 'moj-profil.html', 'matching-hub.html', 'chat.html', 'profil-jakub.html', 'profil-timea.html', 'profil-petr.html'];
  if (protectedPages.includes(location.pathname.split('/').pop()) && !loggedIn()) location.href = 'prihlasenie.html';
}

function setupLogout() {
  document.querySelectorAll('a, button').forEach((element) => {
    if (element.textContent.trim() !== 'Odhlásiť sa') return;
    element.addEventListener('click', (event) => {
      event.preventDefault();
      localStorage.removeItem(LOGIN_KEY);
      location.href = 'index.html';
    });
  });
}

function setupRegistration() {
  const form = document.querySelector('#registration-form');
  if (!form) return;
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const firstName = form.querySelector('#registration-first-name').value.trim();
    const lastName = form.querySelector('#registration-last-name').value.trim();
    const password = form.querySelector('#registration-password').value;
    const repeat = form.querySelector('#registration-password-repeat').value;
    if (password !== repeat) { alert('Heslá sa nezhodujú.'); return; }
    localStorage.setItem(USER_KEY, JSON.stringify({ name: `${firstName} ${lastName}`, firstName, lastName, email: form.querySelector('#registration-email').value.trim(), password }));
    localStorage.setItem(LOGIN_KEY, 'true');
    location.href = 'dashboard.html';
  });
}

function setupLogin() {
  const form = document.querySelector('#login-form');
  if (!form) return;
  const error = document.querySelector('#login-error') || document.createElement('p');
  error.id = 'login-error';
  error.style.color = '#c92a2a';
  if (!error.parentElement) form.after(error);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const user = readUser();
    const email = form.querySelector('#login-email').value.trim();
    const password = form.querySelector('#login-password').value;
    if (!user || user.email !== email || user.password !== password) {
      error.textContent = 'Nesprávny e-mail alebo heslo, alebo účet ešte nebol vytvorený.';
      return;
    }
    localStorage.setItem(LOGIN_KEY, 'true');
    location.href = 'dashboard.html';
  });
}

function renderProfile() {
  const user = readUser();
  const name = user?.name || '';
  const parts = name.split(/\s+/).filter(Boolean);
  const nameElement = document.querySelector('#profile-name-display');
  if (!nameElement && !document.querySelector('#edit-profile-modal')) return;
  if (nameElement) nameElement.textContent = name;
  const greeting = document.querySelector('#profile-greeting');
  if (greeting) greeting.textContent = parts[0] ? `Ahoj, som ${parts[0]}` : 'Ahoj';
  const locationElement = document.querySelector('#profile-location');
  if (locationElement) locationElement.textContent = user?.location || 'Lokalita neuvedená';
  const roleElement = document.querySelector('#profile-role');
  if (roleElement) roleElement.textContent = user?.role || 'Nový člen';
  const exchanges = document.querySelector('#profile-exchanges');
  if (exchanges) exchanges.textContent = `${user?.exchanges || 0} výmen`;
  const bio = document.querySelector('#profile-bio');
  if (bio) { bio.textContent = user?.bio || 'Zatiaľ nemáš vyplnené bio. Klikni na „Upraviť profil“ a napíš niečo o sebe.'; bio.classList.toggle('empty-hint', !user?.bio); }
  renderList('#profile-offers', user?.offers);
  renderList('#profile-seeks', user?.seeks);
  const photo = document.querySelector('.profile-photo');
  if (photo) { photo.replaceChildren(); if (user?.avatar) { const image = document.createElement('img'); image.src = user.avatar; image.alt = 'Avatar'; photo.append(image); } else { const initials = document.createElement('span'); initials.textContent = parts.map((part) => part[0]).join('').slice(0, 2).toUpperCase(); photo.append(initials); } }
  const links = document.querySelector('#profile-portfolio .portfolio-links');
  if (links) { links.replaceChildren(); [['github', 'GitHub', '◈'], ['figma', 'Figma', '◩'], ['linkedin', 'LinkedIn', 'in']].forEach(([key, label, icon]) => { if (!user?.[key]) return; const link = document.createElement('a'); link.className = 'portfolio-link'; link.href = user[key]; link.target = '_blank'; link.rel = 'noreferrer'; link.innerHTML = `<span class="portfolio-icon">${icon}</span><strong>${label}</strong><small>${user[key]}</small>`; links.append(link); }); }
}

function renderList(selector, values) {
  const list = document.querySelector(selector);
  if (!list) return;
  list.replaceChildren();
  const items = Array.isArray(values) ? values : splitValues(values);
  (items.length ? items : ['Zatiaľ nepridané žiadne zručnosti.']).forEach((value) => { const item = document.createElement('li'); item.textContent = value; list.append(item); });
}

function setupProfileEditor() {
  const modal = document.querySelector('#edit-profile-modal');
  const form = document.querySelector('#edit-profile-form');
  const button = document.querySelector('#edit-profile-button');
  if (!modal || !form || !button) return;
  const close = () => { modal.style.display = 'none'; };
  button.addEventListener('click', () => {
    const user = readUser() || {};
    ['name', 'role', 'location', 'bio', 'offers', 'seeks', 'github', 'figma', 'linkedin'].forEach((key) => { const input = document.querySelector(`#edit-${key}`); if (input) input.value = Array.isArray(user[key]) ? user[key].join(', ') : (user[key] || ''); });
    modal.style.display = 'grid';
  });
  document.querySelector('#cancel-profile-edit')?.addEventListener('click', close);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const current = readUser() || {};
    const updated = { ...current };
    ['name', 'role', 'location', 'bio', 'github', 'figma', 'linkedin'].forEach((key) => { updated[key] = document.querySelector(`#edit-${key}`).value.trim(); });
    updated.offers = splitValues(document.querySelector('#edit-offers').value);
    updated.seeks = splitValues(document.querySelector('#edit-seeks').value);
    if (document.querySelector('#remove-avatar')?.checked) updated.avatar = null;
    const file = document.querySelector('#edit-avatar')?.files[0];
    const save = () => { localStorage.setItem(USER_KEY, JSON.stringify(updated)); renderProfile(); close(); };
    if (!file || updated.avatar === null) { save(); return; }
    const reader = new FileReader();
    reader.onload = () => { const image = new Image(); image.onload = () => { const scale = Math.min(300 / image.width, 300 / image.height, 1); const canvas = document.createElement('canvas'); canvas.width = image.width * scale; canvas.height = image.height * scale; canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height); updated.avatar = canvas.toDataURL('image/jpeg', 0.85); save(); }; image.src = reader.result; };
    reader.readAsDataURL(file);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  protectPages();
  setupLogout();
  setupRegistration();
  setupLogin();
  renderProfile();
  setupProfileEditor();
  const welcome = document.querySelector('#dashboard-welcome');
  const user = readUser();
  if (welcome && user?.name) welcome.textContent = `Vitaj späť, ${user.name}!`;
});