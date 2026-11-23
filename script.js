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

  // 2. Мобільне меню (тільки Home / Matching Hub / Chat для мобільної версії)
  function initMobileMenu() {
    const header = document.querySelector('header');
    if (!header) return;

    // Видаляємо лише старі неробочі кнопки гамбургера
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

  // 3. Вихід із акаунта для десктопної та мобільної навігації
  document.querySelectorAll('a, button').forEach((el) => {
    if (el.textContent && el.textContent.trim() === 'Odhlásiť sa') {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem(LOGGED_KEY);
        window.location.href = 'index.html';
      });
    }
  });

  // 4. Реєстрація з завантаженням фото (registracia.html)
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
        const textInputs = regForm.querySelectorAll('input[type="text"]');
        const emailInput = regForm.querySelector('input[type="email"]');
        const passInput = regForm.querySelector('input[type="password"]');

        const name = textInputs[0] ? textInputs[0].value.trim() : 'Študent SkillMatch';
        const email = emailInput ? emailInput.value.trim() : '';
        const password = passInput ? passInput.value : '';

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
        let errorEl = document.getElementById('login-error-msg');
        if (!errorEl) {
          errorEl = document.createElement('p');
          errorEl.id = 'login-error-msg';
          errorEl.style.color = '#dc2626';
          errorEl.style.fontSize = '0.88rem';
          errorEl.style.marginTop = '10px';
          loginForm.appendChild(errorEl);
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
    if (user && user.name) {
      const h1 = document.querySelector('h1');
      if (h1 && h1.textContent.toLowerCase().includes('vitaj')) {
        h1.textContent = `Vitaj späť, ${user.name}!`;
      }
    }
  }

  // 7. Профіль користувача: відображення фото + модальне вікно редагування (moj-profil.html)
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

    // Знаходимо контейнер фото профілю (.profile-photo або інший аватар)
    function ensureAvatarContainer() {
      let box =
        document.getElementById('sm-dynamic-avatar') ||
        document.querySelector('.profile-photo, #profile-avatar, .profile-avatar, .user-avatar, .avatar-box');

      if (!box) {
        const greetingHeading = Array.from(document.querySelectorAll('h2, h3')).find((h) =>
          h.textContent.trim().startsWith('Ahoj, som')
        );
        if (greetingHeading) {
          let card = greetingHeading.parentElement;
          while (card && card !== document.body) {
            const media = card.querySelector('.profile-photo, img, svg, [class*="avatar"]');
            if (media) {
              box = media;
              break;
            }
            card = card.parentElement;
          }
        }
      }

      if (box) {
        box.id = 'sm-dynamic-avatar';
        box.title = 'Klikni pre zmenu profilovej fotky';
        box.style.cursor = 'pointer';
      }

      return box;
    }

    function ensureEditModal() {
      let modal = document.getElementById('edit-profile-modal');
      if (modal) return modal;

      modal = document.createElement('div');
      modal.id = 'edit-profile-modal';
      modal.style.cssText =
        'position:fixed; inset:0; background:rgba(15,23,42,0.5); display:none; align-items:center; justify-content:center; z-index:2000; padding:16px;';

      modal.innerHTML = `
        <div style="background:#ffffff; border-radius:20px; width:100%; max-width:520px; max-height:90vh; overflow-y:auto; padding:28px; box-shadow:0 20px 40px rgba(15,23,42,0.18);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
            <h3 style="margin:0; font-size:1.25rem; font-weight:800; color:#0f172a;">Upraviť profil</h3>
            <button type="button" id="close-edit-modal-x" style="background:none; border:none; font-size:1.3rem; cursor:pointer; color:#64748b;">✕</button>
          </div>

          <form id="sm-dynamic-edit-form">
            <div style="margin-bottom:16px; padding:12px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px;">
              <label for="edit-avatar" style="display:block; font-weight:600; font-size:0.88rem; margin-bottom:8px; color:#0f172a;">
                Profilová fotka
              </label>
              <div style="display:flex; align-items:center; gap:14px; flex-wrap:wrap;">
                <div id="edit-avatar-preview" style="width:64px; height:64px; border-radius:14px; overflow:hidden; background:#1e293b; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:1.2rem; flex-shrink:0;">
                  SM
                </div>
                <div style="flex:1; min-width:180px;">
                  <input type="file" id="edit-avatar" accept="image/*" style="font-size:0.85rem; width:100%; margin-bottom:6px;">
                  <label style="display:inline-flex; align-items:center; gap:6px; font-size:0.8rem; color:#dc2626; cursor:pointer;">
                    <input type="checkbox" id="remove-avatar"> Odstrániť fotku (použiť iniciály)
                  </label>
                </div>
              </div>
            </div>

            <div style="margin-bottom:12px;">
              <label for="edit-name" style="display:block; font-weight:600; font-size:0.85rem; margin-bottom:4px;">Meno a priezvisko</label>
              <input type="text" id="edit-name" required style="width:100%; box-sizing:border-box; padding:10px 12px; border:1px solid #cbd5e1; border-radius:10px; font-family:inherit;">
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:12px;">
              <div>
                <label for="edit-role" style="display:block; font-weight:600; font-size:0.85rem; margin-bottom:4px;">Pozícia / odbor</label>
                <input type="text" id="edit-role" placeholder="Napr. Študent IT" style="width:100%; box-sizing:border-box; padding:10px 12px; border:1px solid #cbd5e1; border-radius:10px; font-family:inherit;">
              </div>
              <div>
                <label for="edit-location" style="display:block; font-weight:600; font-size:0.85rem; margin-bottom:4px;">Lokalita</label>
                <input type="text" id="edit-location" placeholder="Napr. Bratislava, Slovensko" style="width:100%; box-sizing:border-box; padding:10px 12px; border:1px solid #cbd5e1; border-radius:10px; font-family:inherit;">
              </div>
            </div>

            <div style="margin-bottom:12px;">
              <label for="edit-bio" style="display:block; font-weight:600; font-size:0.85rem; margin-bottom:4px;">O mne (Bio)</label>
              <textarea id="edit-bio" rows="3" placeholder="Napíš krátko o sebe a svojich projektoch..." style="width:100%; box-sizing:border-box; padding:10px 12px; border:1px solid #cbd5e1; border-radius:10px; font-family:inherit; resize:vertical;"></textarea>
            </div>

            <div style="margin-bottom:12px;">
              <label for="edit-offers" style="display:block; font-weight:600; font-size:0.85rem; margin-bottom:4px;">Čo ponúkam (oddelené čiarkou)</label>
              <input type="text" id="edit-offers" placeholder="HTML/CSS, Python, Angličtina" style="width:100%; box-sizing:border-box; padding:10px 12px; border:1px solid #cbd5e1; border-radius:10px; font-family:inherit;">
            </div>

            <div style="margin-bottom:12px;">
              <label for="edit-seeks" style="display:block; font-weight:600; font-size:0.85rem; margin-bottom:4px;">Čo hľadám (oddelené čiarkou)</label>
              <input type="text" id="edit-seeks" placeholder="UX/UI dizajn, JavaScript" style="width:100%; box-sizing:border-box; padding:10px 12px; border:1px solid #cbd5e1; border-radius:10px; font-family:inherit;">
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; margin-bottom:18px;">
              <div>
                <label for="edit-github" style="display:block; font-weight:600; font-size:0.8rem; margin-bottom:4px;">GitHub</label>
                <input type="text" id="edit-github" placeholder="github.com/meno" style="width:100%; box-sizing:border-box; padding:8px 10px; border:1px solid #cbd5e1; border-radius:8px; font-size:0.82rem;">
              </div>
              <div>
                <label for="edit-figma" style="display:block; font-weight:600; font-size:0.8rem; margin-bottom:4px;">Figma</label>
                <input type="text" id="edit-figma" placeholder="figma.com/@meno" style="width:100%; box-sizing:border-box; padding:8px 10px; border:1px solid #cbd5e1; border-radius:8px; font-size:0.82rem;">
              </div>
              <div>
                <label for="edit-linkedin" style="display:block; font-weight:600; font-size:0.8rem; margin-bottom:4px;">LinkedIn</label>
                <input type="text" id="edit-linkedin" placeholder="linkedin.com/in/..." style="width:100%; box-sizing:border-box; padding:8px 10px; border:1px solid #cbd5e1; border-radius:8px; font-size:0.82rem;">
              </div>
            </div>

            <div style="display:flex; justify-content:flex-end; gap:10px;">
              <button type="button" id="cancel-edit-modal" style="padding:10px 18px; border-radius:10px; border:1px solid #cbd5e1; background:#ffffff; font-weight:600; cursor:pointer;">Zrušiť</button>
              <button type="submit" style="padding:10px 20px; border-radius:10px; border:none; background:#2563eb; color:#ffffff; font-weight:600; cursor:pointer;">Uložiť zmeny</button>
            </div>
          </form>
        </div>
      `;

      document.body.appendChild(modal);
      return modal;
    }

    function renderProfile() {
      const mainH1 = document.querySelector('main h1, .profile-header h1, h1');
      if (mainH1) mainH1.textContent = user.name;

      const locEl = document.getElementById('profile-location');
      if (locEl) locEl.textContent = user.location || 'Slovensko';

      const roleEl = document.getElementById('profile-role');
      if (roleEl) roleEl.textContent = user.role || 'Nový člen';

      document.querySelectorAll('h2, h3').forEach((heading) => {
        if (heading.textContent.trim().startsWith('Ahoj, som')) {
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
        if (avatarBox.tagName === 'IMG') {
          if (user.avatar) avatarBox.src = user.avatar;
        } else if (user.avatar) {
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
          avatarBox.innerHTML = `<span>${getInitials(user.name)}</span>`;
        }
      }

      const offersEl = document.getElementById('profile-offers');
      if (offersEl) {
        offersEl.innerHTML =
          Array.isArray(user.offers) && user.offers.length > 0
            ? user.offers.map((s) => `<li style="margin-bottom:6px;">✓ ${s}</li>`).join('')
            : '<li style="color:#94a3b8;">Zatiaľ nepridané žiadne zručnosti.</li>';
      }

      const seeksEl = document.getElementById('profile-seeks');
      if (seeksEl) {
        seeksEl.innerHTML =
          Array.isArray(user.seeks) && user.seeks.length > 0
            ? user.seeks.map((s) => `<li style="margin-bottom:6px;">✦ ${s}</li>`).join('')
            : '<li style="color:#94a3b8;">Zatiaľ nepridané žiadne zručnosti.</li>';
      }

      const portfolioEl = document.getElementById('profile-portfolio');
      if (portfolioEl) {
        const links = [
          { label: 'GitHub', val: user.github },
          { label: 'Figma', val: user.figma },
          { label: 'LinkedIn', val: user.linkedin }
        ].filter((item) => item.val && item.val.trim() !== '');

        if (links.length > 0) {
          portfolioEl.innerHTML = links
            .map((item) => {
              const href = item.val.startsWith('http') ? item.val : `https://${item.val}`;
              return `<a href="${href}" target="_blank" rel="noopener" style="display:flex; justify-content:space-between; align-items:center; padding:10px 14px; margin-bottom:8px; border-radius:10px; background:rgba(255,255,255,0.08); color:#ffffff; text-decoration:none; font-size:0.88rem;">
                <strong>${item.label}</strong>
                <span style="color:#93c5fd;">${item.val} ↗</span>
              </a>`;
            })
            .join('');
        } else {
          portfolioEl.innerHTML =
            '<p style="color:#94a3b8; font-size:0.88rem; margin:0;">Zatiaľ nepridané žiadne odkazy na portfólio.</p>';
        }
      }
    }

    renderProfile();

    const modal = ensureEditModal();
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
      if (document.getElementById('edit-github')) {
        document.getElementById('edit-github').value = user.github || '';
      }
      if (document.getElementById('edit-figma')) {
        document.getElementById('edit-figma').value = user.figma || '';
      }
      if (document.getElementById('edit-linkedin')) {
        document.getElementById('edit-linkedin').value = user.linkedin || '';
      }

      if (removeAvatarCheck) removeAvatarCheck.checked = false;
      if (editAvatarInput) editAvatarInput.value = '';

      if (editAvatarPreview) {
        if (user.avatar) {
          editAvatarPreview.innerHTML = `<img src="${user.avatar}" alt="Avatar" style="width:100%; height:100%; object-fit:cover;">`;
        } else {
          editAvatarPreview.textContent = getInitials(user.name);
        }
      }

      modal.style.display = 'flex';
    }

    document.querySelectorAll('button, a').forEach((btn) => {
      if (btn.textContent && btn.textContent.trim().includes('Upraviť profil')) {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          openEditModal();
        });
      }
    });

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

    const closeBtn1 = document.getElementById('cancel-edit-modal');
    const closeBtn2 = document.getElementById('close-edit-modal-x');
    if (closeBtn1) closeBtn1.addEventListener('click', () => (modal.style.display = 'none'));
    if (closeBtn2) closeBtn2.addEventListener('click', () => (modal.style.display = 'none'));
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

        if (document.getElementById('edit-github')) {
          user.github = document.getElementById('edit-github').value.trim();
        }
        if (document.getElementById('edit-figma')) {
          user.figma = document.getElementById('edit-figma').value.trim();
        }
        if (document.getElementById('edit-linkedin')) {
          user.linkedin = document.getElementById('edit-linkedin').value.trim();
        }

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

  // 8. Робочий фільтр у matching-hub.html
  if (currentPage === 'matching-hub.html') {
    const searchInput = document.querySelector('main input[type="text"], main input[type="search"]');
    const sortSelect = document.querySelector('main select');
    const checkboxes = Array.from(document.querySelectorAll('main input[type="checkbox"]'));
    const levelSlider = document.querySelector('main input[type="range"]');

    const cardLinks = Array.from(document.querySelectorAll('main a')).filter((a) =>
      a.textContent.toLowerCase().includes('zobraziť profil')
    );
    const cards = cardLinks
      .map(
        (a) =>
          a.closest('article, .card, .profile-card, .hub-card, div[class*="card"]') ||
          a.parentElement
      )
      .filter(Boolean);

    if (cards.length > 0) {
      const cardsParent = cards[0].parentElement;

      const cardMeta = cards.map((card, index) => {
        const text = card.textContent.toLowerCase();
        const nameEl = card.querySelector('h2, h3, h4');
        const name = nameEl ? nameEl.textContent.trim() : `Profil ${index + 1}`;
        const category = text.includes('dizajn') ? 'dizajn' : 'technologie';
        let level = 2;
        if (text.includes('jakub')) level = 3;
        if (text.includes('petr')) level = 1;
        return { card, name, text, category, level, defaultOrder: index };
      });

      const allCheckbox = checkboxes.find((cb) => {
        const labelText = (
          cb.closest('label')?.textContent ||
          cb.parentElement?.textContent ||
          ''
        ).toLowerCase();
        return labelText.includes('všetky');
      });
      const categoryCheckboxes = checkboxes.filter((cb) => cb !== allCheckbox);

      if (levelSlider) {
        levelSlider.min = '0';
        levelSlider.max = '3';
        levelSlider.step = '1';
        levelSlider.value = '0';
      }

      function updateActiveCounter(visibleCount) {
        document.querySelectorAll('main *').forEach((el) => {
          if (el.children.length === 0 && /\d+\s*aktívne profily/i.test(el.textContent)) {
            el.textContent = `${visibleCount} aktívne profily`;
          }
        });
      }

      function applyHubFilters() {
        const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
        const selectedLevel = levelSlider ? parseInt(levelSlider.value, 10) : 0;

        const activeCats = categoryCheckboxes
          .filter((cb) => cb.checked)
          .map((cb) => {
            const lbl = (
              cb.closest('label')?.textContent ||
              cb.parentElement?.textContent ||
              ''
            ).toLowerCase();
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
            if (sortVal.includes('a-z') || sortVal.includes('mena'))
              return a.name.localeCompare(b.name, 'sk');
            if (sortVal.includes('z-a')) return b.name.localeCompare(a.name, 'sk');
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

      document.querySelectorAll('main button').forEach((btn) => {
        const label = btn.textContent.trim().toLowerCase();
        if (label === 'vyčistiť') {
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            if (searchInput) searchInput.value = '';
            if (allCheckbox) allCheckbox.checked = true;
            categoryCheckboxes.forEach((cb) => (cb.checked = false));
            if (levelSlider) levelSlider.value = '0';
            if (sortSelect) sortSelect.selectedIndex = 0;
            applyHubFilters();
          });
        }
        if (label === 'všetky' && levelSlider) {
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            levelSlider.value = '0';
            applyHubFilters();
          });
        }
      });
    }
  }
});