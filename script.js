const STORAGE_USER_KEY = 'skillmatch_user';
const STORAGE_LOGGED_IN_KEY = 'skillmatch_logged_in';

function getStoredUser() {
  const storedUser = localStorage.getItem(STORAGE_USER_KEY);
  if (!storedUser) return null;

  try {
    return JSON.parse(storedUser);
  } catch {
    return null;
  }
}

function isLoggedIn() {
  return localStorage.getItem(STORAGE_LOGGED_IN_KEY) === 'true';
}

function getPageName() {
  return window.location.pathname.split('/').pop().toLowerCase();
}

function protectInternalPages() {
  const protectedPages = [
    'dashboard.html',
    'moj-profil.html',
    'matching-hub.html',
    'chat.html',
    'profil-jakub.html',
    'profil-timea.html',
    'profil-petr.html'
  ];

  if (protectedPages.includes(getPageName()) && !isLoggedIn()) {
    window.location.href = 'prihlasenie.html';
  }
}

function setupLogout() {
  document.querySelectorAll('a, button').forEach((element) => {
    if (element.textContent.trim() !== 'Odhlásiť sa') return;

    element.addEventListener('click', (event) => {
      event.preventDefault();
      localStorage.removeItem(STORAGE_LOGGED_IN_KEY);
      window.location.href = 'index.html';
    });
  });
}

function setupRegistration() {
  const form = document.querySelector('#registration-form');
  if (!form) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const firstName = form.querySelector('#registration-first-name')?.value.trim() || '';
    const lastName = form.querySelector('#registration-last-name')?.value.trim() || '';
    const email = form.querySelector('#registration-email')?.value.trim() || '';
    const password = form.querySelector('#registration-password')?.value || '';
    const repeatedPassword = form.querySelector('#registration-password-repeat')?.value || '';

    if (repeatedPassword && password !== repeatedPassword) {
      alert('Heslá sa nezhodujú.');
      return;
    }

    const user = {
      name: `${firstName} ${lastName}`.trim(),
      firstName,
      lastName,
      email,
      password
    };

    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));
    localStorage.setItem(STORAGE_LOGGED_IN_KEY, 'true');
    window.location.href = 'dashboard.html';
  });
}

function setupLogin() {
  const form = document.querySelector('#login-form');
  if (!form) return;

  let errorMessage = document.querySelector('#login-error');
  if (errorMessage) {
    errorMessage.style.color = '#c92a2a';
    errorMessage.style.margin = '10px 0 0';
    errorMessage.style.fontSize = '13px';
  }
  if (!errorMessage) {
    errorMessage = document.createElement('p');
    errorMessage.id = 'login-error';
    errorMessage.style.color = '#c92a2a';
    errorMessage.style.margin = '10px 0 0';
    errorMessage.style.fontSize = '13px';
    form.after(errorMessage);
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const email = form.querySelector('#login-email')?.value.trim() || '';
    const password = form.querySelector('#login-password')?.value || '';
    const user = getStoredUser();

    if (!user || user.email !== email || user.password !== password) {
      errorMessage.textContent = 'Nesprávny e-mail alebo heslo, alebo účet ešte nebol vytvorený.';
      return;
    }

    errorMessage.textContent = '';
    localStorage.setItem(STORAGE_LOGGED_IN_KEY, 'true');
    window.location.href = 'dashboard.html';
  });
}

function updateDashboardName() {
  const welcome = document.querySelector('#dashboard-welcome');
  if (!welcome) return;

  const user = getStoredUser();
  if (user?.name) welcome.textContent = `Vitaj späť, ${user.name}!`;
}

function splitCommaValues(value) {
  if (!value) return [];
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

function renderSkillList(list, value, looking = false) {
  if (!list) return;
  const items = Array.isArray(value) ? value : splitCommaValues(value);
  list.replaceChildren();

  if (!items.length) {
    const emptyItem = document.createElement('li');
    emptyItem.textContent = 'Zatiaľ nepridané žiadne zručnosti.';
    list.append(emptyItem);
    return;
  }

  items.forEach((item) => {
    const listItem = document.createElement('li');
    listItem.textContent = item;
    list.append(listItem);
  });
}

function renderPortfolio(user) {
  const portfolio = document.querySelector('#profile-portfolio');
  if (!portfolio) return;

  const links = portfolio.querySelector('.portfolio-links');
  if (!links) return;
  links.replaceChildren();

  const hint = portfolio.querySelector(':scope > p:not(.eyebrow)');
  const portfolioLinks = [
    { key: 'github', label: 'GitHub', icon: '◈' },
    { key: 'figma', label: 'Figma', icon: '◩' },
    { key: 'linkedin', label: 'LinkedIn', icon: 'in' }
  ].filter((item) => user[item.key]);

  if (hint) hint.textContent = portfolioLinks.length ? 'Projekty, poznámky a dizajnové experimenty na jednom mieste.' : 'Zatiaľ nepridané žiadne odkazy na portfólio.';

  portfolioLinks.forEach((item) => {
    const link = document.createElement('a');
    link.className = 'portfolio-link';
    link.href = user[item.key];
    link.target = '_blank';
    link.rel = 'noreferrer';

    const icon = document.createElement('span');
    icon.className = 'portfolio-icon';
    icon.textContent = item.icon;
    const label = document.createElement('strong');
    label.textContent = item.label;
    const url = document.createElement('small');
    url.textContent = user[item.key];

    link.append(icon, label, url);
    links.append(link);
  });
}

function updateOwnProfile() {
  const profileName = document.querySelector('#profile-name-display');
  const profileInitials = document.querySelector('#profile-initials');
  const profileGreeting = document.querySelector('#profile-greeting');
  const profileLocation = document.querySelector('#profile-location');
  const profileRole = document.querySelector('#profile-role');
  const profileExchanges = document.querySelector('#profile-exchanges');
  const profileBio = document.querySelector('#profile-bio');

  if (!profileName && !profileInitials && !profileGreeting) return;

  const user = getStoredUser();
  if (!user) return;

  const name = user.name || '';
  const nameParts = name.trim().split(/\s+/).filter(Boolean);
  const initials = nameParts.map((part) => part[0]).join('').slice(0, 2).toUpperCase();

  if (profileName) profileName.textContent = name;

  const profilePhoto = document.querySelector('.profile-photo');
  if (profilePhoto) {
    profilePhoto.replaceChildren();
    if (user.avatar) {
      const avatarImage = document.createElement('img');
      avatarImage.src = user.avatar;
      avatarImage.alt = 'Avatar';
      profilePhoto.append(avatarImage);
      profilePhoto.classList.add('has-image');
    } else {
      const initialsElement = document.createElement('span');
      initialsElement.id = 'profile-initials';
      initialsElement.textContent = initials;
      profilePhoto.append(initialsElement);
      profilePhoto.classList.remove('has-image');
    }
  }
  if (profileGreeting) profileGreeting.textContent = nameParts[0] ? `Ahoj, som ${nameParts[0]}` : 'Ahoj';
  if (profileLocation) profileLocation.textContent = user.location || 'Lokalita neuvedená';
  if (profileRole) profileRole.textContent = user.role || 'Nový člen';
  if (profileExchanges) profileExchanges.textContent = `${user.exchanges || 0} výmen`;

  if (profileBio) {
    profileBio.textContent = user.bio || 'Zatiaľ nemáš vyplnené bio. Klikni na „Upraviť profil“ a napíš niečo o sebe.';
    profileBio.classList.toggle('empty-hint', !user.bio);
  }

  renderSkillList(document.querySelector('#profile-offers'), user.offers);
  renderSkillList(document.querySelector('#profile-seeks'), user.seeks);
  renderPortfolio(user);
}

function setupProfileEditor() {
  const modal = document.querySelector('#edit-profile-modal');
  const openButton = document.querySelector('#edit-profile-button');
  const form = document.querySelector('#edit-profile-form');
  const cancelButton = document.querySelector('#cancel-profile-edit');

  if (!modal || !openButton || !form) return;

  const closeModal = () => {
    modal.style.display = 'none';
  };

  openButton.addEventListener('click', () => {
    const user = getStoredUser() || {};
    document.querySelector('#edit-name').value = user.name || '';
    document.querySelector('#edit-role').value = user.role || '';
    document.querySelector('#edit-location').value = user.location || '';
    document.querySelector('#edit-bio').value = user.bio || '';
    document.querySelector('#edit-offers').value = Array.isArray(user.offers) ? user.offers.join(', ') : (user.offers || '');
    document.querySelector('#edit-seeks').value = Array.isArray(user.seeks) ? user.seeks.join(', ') : (user.seeks || '');
    document.querySelector('#edit-github').value = user.github || '';
    document.querySelector('#edit-figma').value = user.figma || '';
    document.querySelector('#edit-linkedin').value = user.linkedin || '';
    modal.style.display = 'grid';
  });

  cancelButton?.addEventListener('click', closeModal);
  modal.addEventListener('click', (event) => {
    if (event.target === modal) closeModal();
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const currentUser = getStoredUser() || {};
    const name = document.querySelector('#edit-name').value.trim();
    if (!name) return;

    const nameParts = name.split(/\s+/).filter(Boolean);
    const updatedUser = {
      ...currentUser,
      name,
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' '),
      role: document.querySelector('#edit-role').value.trim(),
      location: document.querySelector('#edit-location').value.trim(),
      bio: document.querySelector('#edit-bio').value.trim(),
      offers: splitCommaValues(document.querySelector('#edit-offers').value),
      seeks: splitCommaValues(document.querySelector('#edit-seeks').value),
      github: document.querySelector('#edit-github').value.trim(),
      figma: document.querySelector('#edit-figma').value.trim(),
      linkedin: document.querySelector('#edit-linkedin').value.trim()
    };

    if (document.querySelector('#remove-avatar').checked) {
      updatedUser.avatar = null;
    }

    const avatarFile = document.querySelector('#edit-avatar').files[0];

    const saveAndClose = () => {
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(updatedUser));
      updateOwnProfile();
      closeModal();
    };

    if (avatarFile && !document.querySelector('#remove-avatar').checked) {
      const reader = new FileReader();
      reader.onload = () => {
        const image = new Image();
        image.onload = () => {
          const maxSize = 300;
          const scale = Math.min(maxSize / image.width, maxSize / image.height, 1);
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(image.width * scale);
          canvas.height = Math.round(image.height * scale);
          const context = canvas.getContext('2d');
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          updatedUser.avatar = canvas.toDataURL('image/jpeg', 0.85);
          saveAndClose();
        };
        image.src = reader.result;
      };
      reader.readAsDataURL(avatarFile);
      return;
    }

    saveAndClose();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  protectInternalPages();
  setupLogout();
  setupRegistration();
  setupLogin();
  updateDashboardName();
  updateOwnProfile();
  setupProfileEditor();
});
