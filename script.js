const toast = document.querySelector('.toast');
let toastTimer;

function getStoredUser() {
  const storedUser = localStorage.getItem('skillmatch_user');
  if (!storedUser) return null;

  try {
    const user = JSON.parse(storedUser);
    return typeof user === 'object' && user !== null ? user : { name: storedUser };
  } catch {
    return { name: storedUser };
  }
}

function getDisplayName(user) {
  const registeredName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return registeredName || user.name || '';
}

function updateNavigation() {
  const navLoginButton = document.querySelector('#nav-login-btn');
  const navRegisterButton = document.querySelector('#nav-register-btn');
  const navProfileButton = document.querySelector('#nav-profile-btn');
  const navLogoutButton = document.querySelector('#nav-logout-btn');
  const user = getStoredUser();
  const isLoggedIn = user?.isLoggedIn === true;
  const isLoginPage = Boolean(document.querySelector('#login-form'));

  if (navLoginButton) navLoginButton.style.display = isLoggedIn || isLoginPage ? 'none' : '';
  if (navRegisterButton) navRegisterButton.style.display = isLoggedIn ? 'none' : '';
  if (navProfileButton) navProfileButton.style.display = isLoggedIn ? '' : 'none';
  if (navLogoutButton) navLogoutButton.style.display = isLoggedIn ? '' : 'none';
}

document.addEventListener('DOMContentLoaded', () => {
  updateNavigation();

  document.querySelector('#nav-logout-btn')?.addEventListener('click', (event) => {
    event.preventDefault();
    const user = getStoredUser();
    if (user) {
      user.isLoggedIn = false;
      localStorage.setItem('skillmatch_user', JSON.stringify(user));
    }
    window.location.href = 'index.html';
  });

  initializeProfile();
});

const registrationForm = document.querySelector('#registration-form');
const loginForm = document.querySelector('#login-form');

registrationForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const firstName = registrationForm.querySelector('#registration-first-name').value.trim();
  const lastName = registrationForm.querySelector('#registration-last-name').value.trim();
  const email = registrationForm.querySelector('#registration-email').value.trim();
  const password = registrationForm.querySelector('#registration-password').value;
  const repeatedPassword = registrationForm.querySelector('#registration-password-repeat').value;

  if (password !== repeatedPassword) {
    showToast('Heslá sa nezhodujú.');
    return;
  }

  localStorage.setItem('skillmatch_user', JSON.stringify({ firstName, lastName, email, isLoggedIn: true }));
  window.location.href = 'moj-profil.html';
});

loginForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const enteredEmail = loginForm.querySelector('#login-email').value.trim().toLowerCase();
  const user = getStoredUser();
  const storedEmail = user?.email?.trim().toLowerCase();

  if (user && storedEmail && storedEmail === enteredEmail) {
    user.isLoggedIn = true;
    localStorage.setItem('skillmatch_user', JSON.stringify(user));
    window.location.href = 'moj-profil.html';
    return;
  }

  alert('Účet neexistuje alebo zlý e-mail.');
});

function renderProfileList(list, value) {
  list.replaceChildren();
  const items = (value || '').split(/[\n,]+/).map((item) => item.trim()).filter(Boolean);
  (items.length ? items : ['Zatiaľ neuvedené']).forEach((item) => {
    const listItem = document.createElement('li');
    listItem.textContent = item;
    list.append(listItem);
  });
}

function updateSocialLinks(user) {
  const socialLinks = [
    ['#link-github', user.github],
    ['#link-figma', user.figma],
    ['#link-linkedin', user.linkedin]
  ];

  socialLinks.forEach(([selector, url]) => {
    const link = document.querySelector(selector);
    if (!link) return;
    link.href = url || '#';
    link.style.display = url ? '' : 'none';
  });
}

function renderProfile(user) {
  const profileTitle = document.querySelector('#profile-name-display');
  const profileLocation = document.querySelector('#profile-location');
  const profileEmail = document.querySelector('#profile-email');
  const profileGreeting = document.querySelector('#profile-greeting');
  const profileBio = document.querySelector('#profile-bio');
  const profilePhoto = document.querySelector('#profile-photo');
  const offerList = document.querySelector('#profile-offer-list');
  const lookingList = document.querySelector('#profile-looking-list');
  const displayName = getDisplayName(user);
  const firstName = displayName ? displayName.trim().split(/\s+/)[0] : '';

  if (profileTitle) profileTitle.textContent = displayName;
  if (profileLocation) profileLocation.textContent = user.location || 'Lokalita zatiaľ nie je uvedená';
  if (profileEmail) profileEmail.textContent = user.email ? `E-mail: ${user.email}` : 'E-mail zatiaľ nie je uvedený';
  if (profileGreeting) profileGreeting.textContent = firstName ? `Ahoj, som ${firstName}` : '';
  if (profileBio) profileBio.textContent = user.offer ? `Ponúkam: ${user.offer}` : 'Vyplň si profil a predstav svoje zručnosti komunite.';
  if (offerList) renderProfileList(offerList, user.offer);
  if (lookingList) renderProfileList(lookingList, user.looking);
  updateSocialLinks(user);
  if (profilePhoto) {
    profilePhoto.classList.toggle('has-image', Boolean(user.photo));
    profilePhoto.replaceChildren();
    if (user.photo) {
      const image = document.createElement('img');
      image.className = 'profile-photo-image';
      image.src = user.photo;
      image.alt = `Profilová fotografia používateľa ${displayName}`;
      profilePhoto.append(image);
    } else {
      const initials = document.createElement('span');
      initials.textContent = displayName.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
      profilePhoto.append(initials);
    }
  }
}

function initializeProfile() {
  const profileTitle = document.querySelector('#profile-name-display');
  const editButton = document.querySelector('#profile-edit-button');
  const user = getStoredUser();

  if (!profileTitle || !editButton) return;
  if (!user || user.isLoggedIn !== true) {
    window.location.href = 'index.html';
    return;
  }

  renderProfile(user);
  editButton.hidden = false;
  let isEditing = false;

  editButton.addEventListener('click', () => {
    if (isEditing) {
      const updatedUser = {
        ...getStoredUser(),
        name: document.querySelector('#profile-name-input').value.trim(),
        firstName: '',
        lastName: '',
        photo: document.querySelector('#profile-photo-input').value.trim(),
        location: document.querySelector('#profile-location-input').value.trim(),
        offer: document.querySelector('#profile-offer-input').value.trim(),
        looking: document.querySelector('#profile-looking-input').value.trim(),
        github: document.querySelector('#profile-github-input').value.trim(),
        figma: document.querySelector('#profile-figma-input').value.trim(),
        linkedin: document.querySelector('#profile-linkedin-input').value.trim()
      };

      if (!updatedUser.name) return;
      localStorage.setItem('skillmatch_user', JSON.stringify(updatedUser));
      window.location.reload();
      return;
    }

    const currentUser = getStoredUser();
    const profilePhoto = document.querySelector('#profile-photo');
    const photoInput = document.createElement('input');
    photoInput.id = 'profile-photo-input';
    photoInput.className = 'profile-input profile-photo-input';
    photoInput.type = 'text';
    photoInput.placeholder = 'URL profilovej fotky';
    photoInput.value = currentUser.photo || '';
    profilePhoto.replaceWith(photoInput);

    const nameInput = document.createElement('input');
    nameInput.id = 'profile-name-input';
    nameInput.className = 'profile-input profile-name-input';
    nameInput.type = 'text';
    nameInput.value = getDisplayName(currentUser);
    profileTitle.replaceWith(nameInput);

    const profileLocation = document.querySelector('#profile-location');
    const locationInput = document.createElement('input');
    locationInput.id = 'profile-location-input';
    locationInput.className = 'profile-input profile-location-input';
    locationInput.type = 'text';
    locationInput.placeholder = 'Mesto alebo lokalita';
    locationInput.value = currentUser.location || '';
    profileLocation.replaceWith(locationInput);

    const offerList = document.querySelector('#profile-offer-list');
    const offerInput = document.createElement('textarea');
    offerInput.id = 'profile-offer-input';
    offerInput.className = 'profile-input';
    offerInput.value = currentUser.offer || '';
    offerList.replaceWith(offerInput);

    const lookingList = document.querySelector('#profile-looking-list');
    const lookingInput = document.createElement('textarea');
    lookingInput.id = 'profile-looking-input';
    lookingInput.className = 'profile-input';
    lookingInput.value = currentUser.looking || '';
    lookingList.replaceWith(lookingInput);

    const socialEditFields = document.querySelector('#social-edit-fields');
    const socialFields = [
      ['github', 'GitHub', currentUser.github || ''],
      ['figma', 'Figma', currentUser.figma || ''],
      ['linkedin', 'LinkedIn', currentUser.linkedin || '']
    ];

    socialEditFields.replaceChildren();
    socialFields.forEach(([name, labelText, value]) => {
      const label = document.createElement('label');
      label.textContent = labelText;
      const input = document.createElement('input');
      input.id = `profile-${name}-input`;
      input.className = 'profile-input';
      input.type = 'url';
      input.placeholder = `https://${name}.com/...`;
      input.value = value;
      label.append(input);
      socialEditFields.append(label);
    });
    socialEditFields.hidden = false;

    editButton.textContent = 'Uložiť zmeny';
    isEditing = true;
  });
}

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

if (profileSearch && profileCards.length) {
  function updateProfiles() {
    const searchTerm = profileSearch.value.trim().toLowerCase();
    const selectedCategories = filterChecks
      .slice(1)
      .filter((checkbox) => checkbox.checked)
      .map((checkbox) => checkbox.parentElement.textContent.trim().split(/\s+/)[0].toLowerCase());

    profileCards.forEach((card) => {
      const category = card.querySelector('.category')?.textContent.toLowerCase() || '';
      const searchableText = `${card.dataset.name || ''} ${card.dataset.skills || ''} ${category}`.toLowerCase();
      const matchesSearch = !searchTerm || searchableText.includes(searchTerm);
      const matchesCategory = !selectedCategories.length || selectedCategories.some((selected) => searchableText.includes(selected));
      card.hidden = !(matchesSearch && matchesCategory);
    });
  }

  profileSearch.addEventListener('input', updateProfiles);
  filterChecks.forEach((checkbox) => checkbox.addEventListener('change', updateProfiles));
  filterReset?.addEventListener('click', () => {
    filterChecks.forEach((checkbox, index) => { checkbox.checked = index === 0; });
    updateProfiles();
  });
}

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

const composer = document.querySelector('.message-composer');
const messageInput = composer?.querySelector('input');
const messageHistory = document.querySelector('.message-history');
const conversations = [...document.querySelectorAll('.conversation')];

conversations.forEach((conversation) => {
  conversation.addEventListener('click', () => {
    conversations.forEach((item) => item.classList.remove('is-selected'));
    conversation.classList.add('is-selected');
    const messageTitle = document.querySelector('.message-header h2');
    const messagePanel = document.querySelector('.message-panel');
    if (messageTitle) messageTitle.textContent = conversation.dataset.name;
    if (messagePanel) messagePanel.setAttribute('aria-label', `Konverzácia s ${conversation.dataset.name}`);
  });
});

composer?.addEventListener('submit', (event) => {
  event.preventDefault();
  const messageText = messageInput.value.trim();
  if (!messageText) return;
  const message = document.createElement('div');
  message.className = 'message sent';
  message.textContent = messageText;
  const time = document.createElement('time');
  time.textContent = 'teraz';
  message.append(time);
  messageHistory.append(message);
  messageInput.value = '';
  messageHistory.scrollTop = messageHistory.scrollHeight;
});