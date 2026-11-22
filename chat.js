document.addEventListener('DOMContentLoaded', () => {
  const STORAGE_PERSONAS_KEY = 'skillmatch_ai_personas_v1';
  const STORAGE_HISTORY_KEY = 'skillmatch_chat_history_v1';
  const STORAGE_API_KEY = 'skillmatch_gemini_key';

  const defaultPersonas = {
    jakub: {
      id: 'jakub',
      name: 'Jakub',
      role: 'Študent IT & AI',
      avatar: 'img/jakub.png',
      profileUrl: 'profil-jakub.html',
      skills: ['Programovanie', 'Python', 'AI', 'Algoritmy'],
      initialMessage: 'Ahoj! Som Jakub. Zaujímam sa o programovanie, Python a umelú inteligenciu. S čím ti môžem dnes pomôcť alebo čo si vymeníme za zručnosti?'
    },
    timea: {
      id: 'timea',
      name: 'Timea',
      role: 'Študentka IT',
      avatar: 'img/timea.png',
      profileUrl: 'profil-timea.html',
      skills: ['Web development', 'HTML/CSS', 'JavaScript', 'Počítačové siete'],
      initialMessage: 'Ahoj! Som Timea. Venujem sa tvorbe webov, responzívnemu CSS a sieťam. Chceš prebrať nejaký webový projekt?'
    },
    petr: {
      id: 'petr',
      name: 'Petr',
      role: 'Študent / UX & UI dizajnér',
      avatar: 'img/petr.png',
      profileUrl: 'profil-petr.html',
      skills: ['UX/UI dizajn', 'Figma', 'Tvorba webov', 'Typografia'],
      initialMessage: 'Čau! Som Petr, riešim UX/UI dizajn vo Figme a čistú typografiu. Potrebuješ spätnú väzbu na dizajn alebo výmenu zručností?'
    }
  };

  function loadPersonas() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_PERSONAS_KEY));
      if (saved && saved.jakub && saved.timea && saved.petr) {
        // Vždy zabezpečíme správne cesty k obrázkom
        saved.jakub.avatar = 'img/jakub.png';
        saved.timea.avatar = 'img/timea.png';
        saved.petr.avatar = 'img/petr.png';
        return saved;
      }
    } catch (e) {
      console.warn('Nepodarilo sa načítať postavy z localStorage:', e);
    }
    return JSON.parse(JSON.stringify(defaultPersonas));
  }

  function loadHistory() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_HISTORY_KEY));
      if (saved && typeof saved === 'object') return saved;
    } catch (e) {
      console.warn('Nepodarilo sa načítať históriu chatu:', e);
    }
    return {};
  }

  let personas = loadPersonas();
  let chatHistory = loadHistory();
  let activeId = 'jakub';

  // DOM elementy
  const chatItems = document.querySelectorAll('.chat-item');
  const searchInput = document.getElementById('chat-search-input');
  const activeAvatarEl = document.getElementById('active-chat-avatar');
  const activeNameEl = document.getElementById('active-chat-name');
  const activeRoleEl = document.getElementById('active-chat-role');
  const activeProfileLink = document.getElementById('active-profile-link');
  const skillsBarEl = document.getElementById('persona-skills-bar');
  const messagesContainer = document.getElementById('chat-messages');
  const chatForm = document.getElementById('chat-form');
  const chatInput = document.getElementById('chat-input');

  // Modálne okno
  const modalOverlay = document.getElementById('ai-settings-modal');
  const openSettingsBtn = document.getElementById('open-ai-settings');
  const closeSettingsBtn = document.getElementById('close-ai-settings');
  const clearHistoryBtn = document.getElementById('clear-history-btn');
  const settingsForm = document.getElementById('ai-settings-form');
  const modalTitleEl = document.getElementById('modal-persona-title');
  const roleInput = document.getElementById('persona-role-input');
  const skillsInput = document.getElementById('persona-skills-input');
  const apiKeyInput = document.getElementById('gemini-key-input');

  function getCurrentTime() {
    const now = new Date();
    return now.toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' });
  }

  function getPersonaMessages(personaId) {
    if (!Array.isArray(chatHistory[personaId]) || chatHistory[personaId].length === 0) {
      chatHistory[personaId] = [
        {
          sender: 'model',
          text: personas[personaId].initialMessage,
          time: 'Dnes'
        }
      ];
      localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(chatHistory));
    }
    return chatHistory[personaId];
  }

  function renderSkillsBar(persona) {
    if (!skillsBarEl) return;
    skillsBarEl.innerHTML = '<span class="skills-bar-label">Zručnosti postavy:</span>';
    persona.skills.forEach(skill => {
      const pill = document.createElement('span');
      pill.className = 'chat-skill-pill';
      pill.textContent = skill;
      skillsBarEl.appendChild(pill);
    });
  }

  function renderMessages(personaId) {
    if (!messagesContainer) return;
    const messages = getPersonaMessages(personaId);
    messagesContainer.innerHTML = '<div class="chat-date-divider">Dnes</div>';

    messages.forEach(msg => {
      const row = document.createElement('div');
      row.className = `message-row ${msg.sender === 'user' ? 'outgoing' : 'incoming'}`;

      const bubble = document.createElement('div');
      bubble.className = 'message-bubble';
      bubble.textContent = msg.text;

      const time = document.createElement('div');
      time.className = 'message-time';
      time.textContent = msg.time || '';

      row.appendChild(bubble);
      row.appendChild(time);
      messagesContainer.appendChild(row);
    });

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function selectPersona(personaId) {
    if (!personas[personaId]) return;
    activeId = personaId;
    const p = personas[personaId];

    // Aktualizácia aktívnej položky v zozname vľavo
    chatItems.forEach(item => {
      item.classList.toggle('active', item.dataset.persona === personaId);
    });

    // Aktualizácia hornej lišty chatu (vrátane fotky!)
    if (activeAvatarEl) {
      activeAvatarEl.src = p.avatar;
      activeAvatarEl.alt = p.name;
    }
    if (activeNameEl) activeNameEl.textContent = p.name;
    if (activeRoleEl) activeRoleEl.textContent = `${p.role} · Online`;
    if (activeProfileLink) activeProfileLink.href = p.profileUrl;
    if (chatInput) chatInput.placeholder = `Napíš správu postave ${p.name}...`;

    renderSkillsBar(p);
    renderMessages(personaId);
  }

  // Kliknutie na konverzáciu v ľavom paneli
  chatItems.forEach(item => {
    item.addEventListener('click', () => {
      const id = item.dataset.persona;
      if (id) selectPersona(id);
    });
  });

  // Vyhľadávanie v zozname konverzácií
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const q = searchInput.value.trim().toLowerCase();
      chatItems.forEach(item => {
        const id = item.dataset.persona;
        const p = personas[id];
        const match = p.name.toLowerCase().includes(q) || p.skills.join(' ').toLowerCase().includes(q);
        item.style.display = match ? 'flex' : 'none';
      });
    });
  }

  // Modálne okno: otvorenie a uloženie skillov + API kľúča
  if (openSettingsBtn && modalOverlay) {
    openSettingsBtn.addEventListener('click', () => {
      const p = personas[activeId];
      modalTitleEl.textContent = `Nastavenie AI postavy: ${p.name}`;
      roleInput.value = p.role;
      skillsInput.value = p.skills.join(', ');
      apiKeyInput.value = localStorage.getItem(STORAGE_API_KEY) || '';
      modalOverlay.style.display = 'flex';
    });
  }

  if (closeSettingsBtn && modalOverlay) {
    closeSettingsBtn.addEventListener('click', () => {
      modalOverlay.style.display = 'none';
    });
  }

  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) modalOverlay.style.display = 'none';
    });
  }

  if (settingsForm) {
    settingsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const newRole = roleInput.value.trim();
      const newSkills = skillsInput.value
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
      const apiKey = apiKeyInput.value.trim();

      if (newRole) personas[activeId].role = newRole;
      if (newSkills.length > 0) personas[activeId].skills = newSkills;

      localStorage.setItem(STORAGE_PERSONAS_KEY, JSON.stringify(personas));

      if (apiKey) {
        localStorage.setItem(STORAGE_API_KEY, apiKey);
      } else {
        localStorage.removeItem(STORAGE_API_KEY);
      }

      modalOverlay.style.display = 'none';
      selectPersona(activeId);
    });
  }

  if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener('click', () => {
      delete chatHistory[activeId];
      localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(chatHistory));
      modalOverlay.style.display = 'none';
      renderMessages(activeId);
    });
  }

  // Volanie Gemini API (alebo lokálneho fallbacku)
  async function generateAIReply(persona, historyMessages) {
    const apiKey = localStorage.getItem(STORAGE_API_KEY);

    let currentUserName = 'Študent';
    try {
      const savedUser = JSON.parse(localStorage.getItem('skillmatch_user'));
      if (savedUser && savedUser.name) currentUserName = savedUser.name;
    } catch (_) {}

    const systemPrompt = `Si ${persona.name}, ${persona.role} na študentskej platforme SkillMatch. Tvoje hlavné zručnosti (skilly) sú: ${persona.skills.join(', ')}. Komunikuj prirodzene po slovensky ako študent a partner na výmenu zručností s používateľom ${currentUserName}. Odpovedaj vecne, priateľsky (2 až 4 vety) a opieraj sa o svoje zadané zručnosti.`;

    if (!apiKey) {
      return `Pre reálne AI odpovede klikni vpravo hore na „⚙️ Zručnosti & AI“ a vlož svoj Google Gemini API kľúč. (Aktuálne moje skilly: ${persona.skills.join(', ')}).`;
    }

    const contents = historyMessages.slice(-10).map(m => ({
      role: m.sender === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }]
    }));

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents
        })
      }
    );

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errMsg = errData?.error?.message || `Chyba API (${response.status})`;
      throw new Error(errMsg);
    }

    const data = await response.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!reply) throw new Error('Prázdna odpoveď z Gemini API.');
    return reply.trim();
  }

  // Odoslanie správy
  if (chatForm) {
    chatForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const text = chatInput.value.trim();
      if (!text) return;

      const persona = personas[activeId];
      const history = getPersonaMessages(activeId);

      // 1. Pridanie správy používateľa
      history.push({
        sender: 'user',
        text,
        time: getCurrentTime()
      });
      localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(chatHistory));

      const previewEl = document.getElementById(`preview-${activeId}`);
      if (previewEl) previewEl.textContent = text;

      chatInput.value = '';
      renderMessages(activeId);

      // 2. Indikátor písania
      const typingRow = document.createElement('div');
      typingRow.className = 'message-row incoming';
      typingRow.innerHTML = `<div class="message-bubble" style="color: #64748b; font-style: italic;">${persona.name} píše...</div>`;
      messagesContainer.appendChild(typingRow);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;

      // 3. Odpoveď AI
      try {
        const replyText = await generateAIReply(persona, history);
        typingRow.remove();

        history.push({
          sender: 'model',
          text: replyText,
          time: getCurrentTime()
        });
        localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(chatHistory));
        if (previewEl) previewEl.textContent = replyText;
        renderMessages(activeId);
      } catch (err) {
        typingRow.remove();
        history.push({
          sender: 'model',
          text: `⚠️ Nepodarilo sa spojiť s Gemini API: ${err.message}`,
          time: getCurrentTime()
        });
        renderMessages(activeId);
      }
    });
  }

  // Inicializácia hneď po načítaní stránky
  selectPersona('jakub');
});