// Автоматичне додавання іконки (favicon) на всі сторінки сайту
(function setSiteFavicon() {
  if (document.querySelector('link[rel*="icon"]')) return;
  const link = document.createElement('link');
  link.rel = 'icon';
  link.type = 'image/svg+xml';
  link.href =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect x='4' y='6' width='56' height='52' rx='12' fill='%23ffffff' stroke='%232161f5' stroke-width='6'/%3E%3Crect x='15' y='21' width='34' height='6.5' rx='3' fill='%232161f5'/%3E%3Crect x='15' y='36' width='22' height='6.5' rx='3' fill='%232161f5'/%3E%3C/svg%3E";
  document.head.appendChild(link);
})();

document.addEventListener('DOMContentLoaded', () => {
  const USER_KEY = 'skillmatch_user';
  const LOGGED_KEY = 'skillmatch_logged_in';

  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const protectedPages = [
    'dashboard.html',
    'moj-profil.html',
    'matching-hub.html',
    'chat.html',
    'profil-jakub.html',
    'profil-timea.html',
    'profil-petr.html'
  ];

  const isLoggedIn = localStorage.getItem(LOGGED_KEY) === 'true';

  // 1. Захист закритих сторінок
  if (protectedPages.includes(currentPage) && !isLoggedIn) {
    window.location.href = 'prihlasenie.html';
    return;
  }

  function getUser() {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY));
    } catch {
      return null;
    }
  }

  function saveUser(userObj) {
    localStorage.setItem(USER_KEY, JSON.stringify(userObj));
  }

  function getInitials(name) {
    if (!name) return 'SM';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  // <--- ДОДАНО (1/3): Перевірка формату e-mail
  function isValidEmail(email) {
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email.trim());
  }

  function compressImageToBase64(file, maxSize = 320) {
    return new Promise((resolve, reject) => {
      if (!file) {
        resolve(null);
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxSize) {
              height = Math.round((height * maxSize) / width);
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = Math.round((width * maxSize) / height);
              height = maxSize;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.onerror = () => reject(new Error('Nepodarilo sa spracovať obrázok.'));
        img.src = event.target.result;
      };
      reader.onerror = () => reject(new Error('Nepodarilo sa načítať súbor.'));
      reader.readAsDataURL(file);
    });
  }

  // 2. Мобільне меню
  function initMobileMenu() {
    const header = document.querySelector('header');
    if (!header) return;

    header.querySelectorAll('.menu-button, .hamburger, .mobile-menu-btn').forEach((btn) => {
      btn.remove();
    });

    if (document.getElementById('sm-mobile-toggle')) return;

    const container =
      header.querySelector('.nav-container, .sm-topbar-inner, .container') || header;

    const burgerBtn = document.createElement('button');
    burgerBtn.type = 'button';
    burgerBtn.id = 'sm-mobile-toggle';
    burgerBtn.className = 'sm-mobile-toggle';
    burgerBtn.setAttribute('aria-label', 'Otvoriť navigáciu');
    burgerBtn.innerHTML = '☰';
    container.appendChild(burgerBtn);

    const links = isLoggedIn
      ? [
          { href: 'dashboard.html', label: 'Home' },
          { href: 'matching-hub.html', label: 'Matching Hub' },
          { href: 'chat.html', label: 'Chat' }
        ]
      : [
          { href: 'index.html', label: 'Home' }
        ];

    const drawer = document.createElement('nav');
    drawer.id = 'sm-mobile-drawer';
    drawer.className = 'sm-mobile-drawer';

    links.forEach((item) => {
      const a = document.createElement('a');
      a.href = item.href;
      a.textContent = item.label;
      if (currentPage === item.href) a.classList.add('active');
      drawer.appendChild(a);
    });

    header.appendChild(drawer);

    burgerBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = drawer.classList.toggle('open');
      burgerBtn.innerHTML = isOpen ? '✕' : '☰';
    });

    document.addEventListener('click', (e) => {
      if (!header.contains(e.target) && drawer.classList.contains('open')) {
        drawer.classList.remove('open');
        burgerBtn.innerHTML = '☰';
      }
    });
  }

  initMobileMenu();

  // 3. Вихід із акаунта
  document.querySelectorAll('a, button').forEach((el) => {
    if (el.textContent && el.textContent.trim() === 'Odhlásiť sa') {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem(LOGGED_KEY);
        window.location.href = 'index.html';
      });
    }
  });

  // 4. Реєстрація з ім'ям, прізвищем, перевіркою пароля та фото (registracia.html)
  if (currentPage === 'registracia.html') {
    const regForm = document.querySelector('form');
    if (regForm) {
      let fileInput = regForm.querySelector('input[type="file"]');

      if (!fileInput) {
        const photoGroup = document.createElement('div');
        photoGroup.className = 'form-group sm-reg-photo-group';
        photoGroup.style.marginBottom = '16px';
        photoGroup.innerHTML = `
          <label for="reg-avatar-input" style="display:block; font-weight:600; font-size:0.9rem; margin-bottom:6px;">
            Profilová fotka (voliteľné)
          </label>
          <div style="display:flex; align-items:center; gap:12px;">
            <div id="reg-avatar-preview" style="width:52px; height:52px; border-radius:50%; background:#e2e8f0; display:flex; align-items:center; justify-content:center; font-weight:700; color:#334155; overflow:hidden; flex-shrink:0; border:1px solid #cbd5e1;">
              SM
            </div>
            <input type="file" id="reg-avatar-input" accept="image/*" style="font-size:0.85rem; max-width:100%;">
          </div>
        `;
        const submitBtn = regForm.querySelector('button[type="submit"], input[type="submit"]');
        if (submitBtn && submitBtn.parentElement) {
          regForm.insertBefore(
            photoGroup,
            submitBtn.parentElement === regForm ? submitBtn : submitBtn.parentElement
          );
        } else {
          regForm.appendChild(photoGroup);
        }
        fileInput = document.getElementById('reg-avatar-input');
      }

      const previewBox = document.getElementById('reg-avatar-preview');
      if (fileInput && previewBox) {
        fileInput.addEventListener('change', async () => {
          const file = fileInput.files && fileInput.files[0];
          if (!file) return;
          try {
            const base64 = await compressImageToBase64(file, 200);
            previewBox.innerHTML = `<img src="${base64}" alt="Náhľad" style="width:100%; height:100%; object-fit:cover; display:block;">`;
          } catch (_) {}
        });
      }

      regForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const firstNameInput = document.getElementById('registration-first-name');
        const lastNameInput = document.getElementById('registration-last-name');
        const textInputs = regForm.querySelectorAll('input[type="text"]');
        const emailInput = regForm.querySelector('input[type="email"]');
        const passInputs = regForm.querySelectorAll('input[type="password"]');

        const firstName = firstNameInput
          ? firstNameInput.value.trim()
          : (textInputs[0] ? textInputs[0].value.trim() : '');
        const lastName = lastNameInput
          ? lastNameInput.value.trim()
          : (textInputs[1] ? textInputs[1].value.trim() : '');
        const name = [firstName, lastName].filter(Boolean).join(' ') || 'Študent SkillMatch';

        const email = emailInput ? emailInput.value.trim() : '';
        const password = passInputs[0] ? passInputs[0].value : '';
        const passwordRepeat = passInputs[1] ? passInputs[1].value : password;

        let errorEl = document.getElementById('reg-error-msg');
        if (!errorEl) {
          errorEl = document.createElement('p');
          errorEl.id = 'reg-error-msg';
          errorEl.setAttribute('role', 'alert');
          errorEl.style.color = '#dc2626';
          errorEl.style.fontSize = '0.88rem';
          errorEl.style.marginTop = '10px';
          regForm.appendChild(errorEl);
        }

        // <--- ДОДАНО (2/3): Перевірка e-mail перед звіркою паролів
        if (!isValidEmail(email)) {
          errorEl.textContent = 'Zadaj platnú e-mailovú adresu (napr. meno@student.sk).';
          errorEl.style.display = 'block';
          if (emailInput) emailInput.focus();
          return;
        }

        if (password !== passwordRepeat) {
          errorEl.textContent = 'Heslá sa nezhodujú. Skontroluj obe polia.';
          errorEl.style.display = 'block';
          return;
        }
        errorEl.style.display = 'none';

        let avatarBase64 = null;
        if (fileInput && fileInput.files && fileInput.files[0]) {
          try {
            avatarBase64 = await compressImageToBase64(fileInput.files[0], 320);
          } catch (err) {
            console.warn('Chyba pri spracovaní fotky:', err);
          }
        }

        const newUser = {
          name,
          email,
          password,
          avatar: avatarBase64,
          role: 'Nový člen',
          location: 'Slovensko',
          bio: '',
          offers: [],
          seeks: [],
          github: '',
          figma: '',
          linkedin: ''
        };

        saveUser(newUser);
        localStorage.setItem(LOGGED_KEY, 'true');
        window.location.href = 'dashboard.html';
      });
    }
  }

  // 5. Вхід (prihlasenie.html)
  if (currentPage === 'prihlasenie.html') {
    const loginForm = document.querySelector('form');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const emailInput = loginForm.querySelector('input[type="email"]');
        const passInput = loginForm.querySelector('input[type="password"]');
        const enteredEmail = emailInput ? emailInput.value.trim().toLowerCase() : '';
        const enteredPass = passInput ? passInput.value : '';

        const savedUser = getUser();
        let errorEl = document.getElementById('login-error') || document.getElementById('login-error-msg');
        if (!errorEl) {
          errorEl = document.createElement('p');
          errorEl.id = 'login-error-msg';
          loginForm.appendChild(errorEl);
        }
        errorEl.style.color = '#dc2626';
        errorEl.style.fontSize = '0.88rem';
        errorEl.style.marginTop = '10px';

        // <--- ДОДАНО (3/3): Перевірка e-mail при вході
        if (!isValidEmail(enteredEmail)) {
          errorEl.textContent = 'Zadaj platnú e-mailovú adresu (napr. meno@student.sk).';
          errorEl.style.display = 'block';
          if (emailInput) emailInput.focus();
          return;
        }

        if (
          !savedUser ||
          savedUser.email.toLowerCase() !== enteredEmail ||
          savedUser.password !== enteredPass
        ) {
          errorEl.textContent = 'Nesprávny e-mail alebo heslo, prípadne účet ešte neexistuje.';
          errorEl.style.display = 'block';
          return;
        }

        localStorage.setItem(LOGGED_KEY, 'true');
        window.location.href = 'dashboard.html';
      });
    }
  }

  // 6. Привітання на dashboard.html
  if (currentPage === 'dashboard.html') {
    const user = getUser();
    const h1 = document.getElementById('dashboard-welcome') || document.querySelector('h1');
    if (h1) {
      h1.textContent = user && user.name ? `Vitaj späť, ${user.name}!` : 'Vitaj späť!';
    }
  }

  // 7. Профіль користувача (moj-profil.html)
  if (currentPage === 'moj-profil.html') {
    const user = getUser() || {
      name: 'Študent SkillMatch',
      role: 'Nový člen',
      location: 'Slovensko',
      bio: '',
      offers: [],
      seeks: [],
      github: '',
      figma: '',
      linkedin: '',
      avatar: null
    };

    function ensureAvatarContainer() {
      let box =
        document.getElementById('sm-dynamic-avatar') ||
        document.querySelector('.profile-photo, #profile-avatar, .profile-avatar');

      if (box) {
        box.id = 'sm-dynamic-avatar';
        box.title = 'Klikni pre zmenu profilovej fotky';
        box.style.cursor = 'pointer';
      }
      return box;
    }

    function renderProfile() {
      const mainH1 = document.getElementById('profile-name-display') || document.querySelector('main h1');
      if (mainH1) mainH1.textContent = user.name;

      const locEl = document.getElementById('profile-location');
      if (locEl) locEl.textContent = user.location || 'Slovensko';

      const roleEl = document.getElementById('profile-role');
      if (roleEl) roleEl.textContent = user.role || 'Nový člen';

      document.querySelectorAll('h2, h3').forEach((heading) => {
        if (heading.id === 'profile-greeting' || heading.textContent.trim().startsWith('Ahoj, som')) {
          const firstName = user.name.trim().split(/\s+/)[0];
          heading.textContent = `Ahoj, som ${firstName}`;
        }
      });

      const bioEl = document.getElementById('profile-bio');
      if (bioEl) {
        bioEl.textContent = user.bio
          ? user.bio
          : 'Zatiaľ nemáš vyplnené bio. Klikni na „Upraviť profil“ a napíš niečo o sebe.';
      }

      const avatarBox = ensureAvatarContainer();
      if (avatarBox) {
        if (user.avatar) {
          avatarBox.classList.add('has-image');
          avatarBox.style.width = '76px';
          avatarBox.style.height = '76px';
          avatarBox.style.flex = '0 0 76px';
          avatarBox.style.borderRadius = '12px';
          avatarBox.innerHTML = `<img src="${user.avatar}" alt="${user.name}" class="profile-photo-image" style="width:100%; height:100%; object-fit:cover; display:block;">`;
        } else {
          avatarBox.classList.remove('has-image');
          avatarBox.style.width = '';
          avatarBox.style.height = '';
          avatarBox.style.flex = '';
          avatarBox.style.borderRadius = '';
          avatarBox.innerHTML = `<span id="profile-initials">${getInitials(user.name)}</span>`;
        }
      }

      const offersEl = document.getElementById('profile-offers');
      if (offersEl) {
        offersEl.innerHTML =
          Array.isArray(user.offers) && user.offers.length > 0
            ? user.offers.map((s) => `<li>${s}</li>`).join('')
            : '<li style="color:#94a3b8;">Zatiaľ nepridané žiadne zručnosti.</li>';
      }

      const seeksEl = document.getElementById('profile-seeks');
      if (seeksEl) {
        seeksEl.innerHTML =
          Array.isArray(user.seeks) && user.seeks.length > 0
            ? user.seeks.map((s) => `<li>${s}</li>`).join('')
            : '<li style="color:#94a3b8;">Zatiaľ nepridané žiadne zručnosti.</li>';
      }

      const portfolioEl = document.getElementById('profile-portfolio');
      if (portfolioEl) {
        const linksContainer = portfolioEl.querySelector('.portfolio-links');
        const emptyNotice = portfolioEl.querySelector('.portfolio-empty-text');
        const links = [
          { label: 'GitHub', icon: 'GH', val: user.github },
          { label: 'Figma', icon: 'FG', val: user.figma },
          { label: 'LinkedIn', icon: 'in', val: user.linkedin }
        ].filter((item) => item.val && item.val.trim() !== '');

        if (linksContainer) {
          if (links.length > 0) {
            if (emptyNotice) emptyNotice.style.display = 'none';
            linksContainer.innerHTML = links
              .map((item) => {
                const href = item.val.startsWith('http') ? item.val : `https://${item.val}`;
                return `<a class="portfolio-link" href="${href}" target="_blank" rel="noopener noreferrer">
                  <span class="portfolio-icon">${item.icon}</span>
                  <strong>${item.label}</strong>
                  <small>Otvoriť profil</small>
                  <span>↗</span>
                </a>`;
              })
              .join('');
          } else {
            if (emptyNotice) emptyNotice.style.display = '';
            linksContainer.innerHTML = '';
          }
        }
      }
    }

    renderProfile();

    const modal = document.getElementById('edit-profile-modal');
    if (modal) {
      const editForm = modal.querySelector('form');
      const editAvatarInput = document.getElementById('edit-avatar');
      const editAvatarPreview = document.getElementById('edit-avatar-preview');
      const removeAvatarCheck = document.getElementById('remove-avatar');

      function openEditModal() {
        document.getElementById('edit-name').value = user.name || '';
        document.getElementById('edit-role').value = user.role || '';
        document.getElementById('edit-location').value = user.location || '';
        document.getElementById('edit-bio').value = user.bio || '';
        document.getElementById('edit-offers').value = (user.offers || []).join(', ');
        document.getElementById('edit-seeks').value = (user.seeks || []).join(', ');
        if (document.getElementById('edit-github')) document.getElementById('edit-github').value = user.github || '';
        if (document.getElementById('edit-figma')) document.getElementById('edit-figma').value = user.figma || '';
        if (document.getElementById('edit-linkedin')) document.getElementById('edit-linkedin').value = user.linkedin || '';

        if (removeAvatarCheck) removeAvatarCheck.checked = false;
        if (editAvatarInput) editAvatarInput.value = '';

        if (editAvatarPreview) {
          if (user.avatar) {
            editAvatarPreview.innerHTML = `<img src="${user.avatar}" alt="Avatar" style="width:100%; height:100%; object-fit:cover;">`;
          } else {
            editAvatarPreview.textContent = getInitials(user.name);
          }
        }

        modal.style.display = 'grid';
      }

      const editTriggerBtn = document.getElementById('edit-profile-button');
      if (editTriggerBtn) {
        editTriggerBtn.addEventListener('click', (e) => {
          e.preventDefault();
          openEditModal();
        });
      }

      const avatarTrigger = document.getElementById('sm-dynamic-avatar');
      if (avatarTrigger) {
        avatarTrigger.addEventListener('click', openEditModal);
      }

      if (editAvatarInput && editAvatarPreview) {
        editAvatarInput.addEventListener('change', async () => {
          const file = editAvatarInput.files && editAvatarInput.files[0];
          if (!file) return;
          if (removeAvatarCheck) removeAvatarCheck.checked = false;
          try {
            const previewBase64 = await compressImageToBase64(file, 200);
            editAvatarPreview.innerHTML = `<img src="${previewBase64}" alt="Náhľad" style="width:100%; height:100%; object-fit:cover;">`;
          } catch (_) {}
        });
      }

      ['cancel-profile-edit', 'cancel-edit-modal', 'close-edit-modal-x'].forEach((id) => {
        const btn = document.getElementById(id);
        if (btn) btn.addEventListener('click', () => (modal.style.display = 'none'));
      });

      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
      });

      if (editForm) {
        editForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          const newName = document.getElementById('edit-name').value.trim();
          if (newName) user.name = newName;

          user.role = document.getElementById('edit-role').value.trim() || 'Nový člen';
          user.location = document.getElementById('edit-location').value.trim() || 'Slovensko';
          user.bio = document.getElementById('edit-bio').value.trim();
          user.offers = document
            .getElementById('edit-offers')
            .value.split(',')
            .map((s) => s.trim())
            .filter(Boolean);
          user.seeks = document
            .getElementById('edit-seeks')
            .value.split(',')
            .map((s) => s.trim())
            .filter(Boolean);

          if (document.getElementById('edit-github')) user.github = document.getElementById('edit-github').value.trim();
          if (document.getElementById('edit-figma')) user.figma = document.getElementById('edit-figma').value.trim();
          if (document.getElementById('edit-linkedin')) user.linkedin = document.getElementById('edit-linkedin').value.trim();

          if (removeAvatarCheck && removeAvatarCheck.checked) {
            user.avatar = null;
          } else if (editAvatarInput && editAvatarInput.files && editAvatarInput.files[0]) {
            try {
              user.avatar = await compressImageToBase64(editAvatarInput.files[0], 320);
            } catch (err) {
              alert('Nepodarilo sa uložiť novú fotku.');
            }
          }

          saveUser(user);
          renderProfile();
          modal.style.display = 'none';
        });
      }
    }
  }

  // 8. Робочий фільтр, рівень і сортування у matching-hub.html
  if (currentPage === 'matching-hub.html') {
    const searchInput = document.getElementById('profile-search') || document.querySelector('main input[type="search"]');
    const sortSelect = document.querySelector('.sort-select');
    const checkboxes = Array.from(document.querySelectorAll('.filter-panel input[type="checkbox"]'));
    const levelSlider = document.getElementById('level-slider') || document.querySelector('main input[type="range"]');
    const levelBadge = document.getElementById('level-badge');

    const levelNames = {
      0: 'Všetky',
      1: 'Začiatočník',
      2: 'Pokročilý',
      3: 'Expert'
    };

    const cards = Array.from(document.querySelectorAll('.matching-grid .profile-card'));

    if (cards.length > 0) {
      const cardsParent = cards[0].parentElement;

      const cardMeta = cards.map((card, index) => {
        const text = card.textContent.toLowerCase();
        const nameEl = card.querySelector('.profile-name strong, h2, h3');
        const name = nameEl ? nameEl.textContent.trim() : `Profil ${index + 1}`;
        const category = text.includes('dizajn') ? 'dizajn' : 'technologie';
        const level = Number(card.dataset.level) || (text.includes('jakub') ? 3 : text.includes('petr') ? 1 : 2);
        return { card, name, text, category, level, defaultOrder: index };
      });

      const allCheckbox = checkboxes.find((cb) =>
        (cb.closest('label')?.textContent || '').toLowerCase().includes('všetky')
      );
      const categoryCheckboxes = checkboxes.filter((cb) => cb !== allCheckbox);

      function updateActiveCounter(visibleCount) {
        const countEl = document.querySelector('.matching-count strong');
        if (countEl) {
          countEl.textContent = `${visibleCount} ${visibleCount === 1 ? 'aktívny profil' : 'aktívne profily'}`;
        }
      }

      function applyHubFilters() {
        const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
        const selectedLevel = levelSlider ? parseInt(levelSlider.value, 10) : 0;

        if (levelBadge) {
          levelBadge.textContent = levelNames[selectedLevel] || 'Všetky';
        }

        const activeCats = categoryCheckboxes
          .filter((cb) => cb.checked)
          .map((cb) => {
            const lbl = (cb.closest('label')?.textContent || '').toLowerCase();
            return lbl.includes('dizajn') ? 'dizajn' : 'technologie';
          });

        const filterByCat = !(allCheckbox && allCheckbox.checked) && activeCats.length > 0;

        const visibleItems = cardMeta.filter((item) => {
          const matchesQuery = !query || item.text.includes(query);
          const matchesCat = !filterByCat || activeCats.includes(item.category);
          const matchesLevel = !selectedLevel || selectedLevel === 0 || item.level === selectedLevel;
          return matchesQuery && matchesCat && matchesLevel;
        });

        if (sortSelect && cardsParent) {
          const sortVal = sortSelect.value.toLowerCase();
          const sorted = [...cardMeta].sort((a, b) => {
            if (sortVal.includes('a–z') || sortVal.includes('a-z') || sortVal.includes('mena')) {
              return a.name.localeCompare(b.name, 'sk');
            }
            if (sortVal.includes('najnovšie')) {
              return b.defaultOrder - a.defaultOrder;
            }
            return a.defaultOrder - b.defaultOrder;
          });
          sorted.forEach((item) => cardsParent.appendChild(item.card));
        }

        const visibleSet = new Set(visibleItems.map((i) => i.card));
        cardMeta.forEach((item) => {
          item.card.style.display = visibleSet.has(item.card) ? '' : 'none';
        });

        updateActiveCounter(visibleItems.length);
      }

      if (searchInput) searchInput.addEventListener('input', applyHubFilters);
      if (sortSelect) sortSelect.addEventListener('change', applyHubFilters);
      if (levelSlider) levelSlider.addEventListener('input', applyHubFilters);

      if (allCheckbox) {
        allCheckbox.addEventListener('change', () => {
          if (allCheckbox.checked) {
            categoryCheckboxes.forEach((cb) => (cb.checked = false));
          }
          applyHubFilters();
        });
      }

      categoryCheckboxes.forEach((cb) => {
        cb.addEventListener('change', () => {
          if (cb.checked && allCheckbox) {
            allCheckbox.checked = false;
          } else if (!categoryCheckboxes.some((c) => c.checked) && allCheckbox) {
            allCheckbox.checked = true;
          }
          applyHubFilters();
        });
      });

      const resetBtn = document.querySelector('.filter-reset');
      if (resetBtn) {
        resetBtn.addEventListener('click', (e) => {
          e.preventDefault();
          if (searchInput) searchInput.value = '';
          if (allCheckbox) allCheckbox.checked = true;
          categoryCheckboxes.forEach((cb) => (cb.checked = false));
          if (levelSlider) levelSlider.value = '0';
          if (sortSelect) sortSelect.selectedIndex = 0;
          applyHubFilters();
        });
      }
    }
  }
});