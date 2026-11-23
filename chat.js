document.addEventListener('DOMContentLoaded', () => {
  const PROXY_URL = "https://moj-web-gemini-proxy.artem-proxy.workers.dev";
  const STORAGE_HISTORY_KEY = 'skillmatch_chat_history_v2';

  const defaultPersonas = {
    jakub: {
      id: 'jakub', name: 'Jakub', role: 'Študent IT & AI', avatar: 'img/jakub.png', profileUrl: 'profil-jakub.html',
      skills: 'programovanie v Pythone, algoritmy, umelá inteligencia',
      initialMessage: 'Ahoj! Som Jakub. Zaujímam sa o programovanie, Python a umelú inteligenciu. S čím ti môžem dnes pomôcť?'
    },
    timea: {
      id: 'timea', name: 'Timea', role: 'Študentka IT', avatar: 'img/timea.png', profileUrl: 'profil-timea.html',
      skills: 'web development, HTML/CSS, JavaScript, počítačové siete',
      initialMessage: 'Ahoj! Som Timea. Venujem sa tvorbe webov, responzívnemu CSS a sieťam. Chceš prebrať nejaký webový projekt?'
    },
    petr: {
      id: 'petr', name: 'Petr', role: 'Študent / UX & UI dizajnér', avatar: 'img/petr.png', profileUrl: 'profil-petr.html',
      skills: 'UX/UI dizajn, Figma, tvorba webov, typografia',
      initialMessage: 'Čau! Som Petr, riešim UX/UI dizajn vo Figme a čistú typografiu. Potrebuješ spätnú väzbu na dizajn?'
    }
  };

  function loadHistory() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_HISTORY_KEY));
      if (saved && typeof saved === 'object') return saved;
    } catch (e) {}
    return {};
  }

  let chatHistory = loadHistory();
  let activeId = 'jakub';

  const chatListEl = document.getElementById('chat-list');
  const messagesContainer = document.getElementById('chat-messages');
  const chatForm = document.getElementById('chat-form');
  const chatInput = document.getElementById('chat-input');
  const sendBtn = document.getElementById('send-btn');
  
  const activeAvatarEl = document.getElementById('active-chat-avatar');
  const activeNameEl = document.getElementById('active-chat-name');
  const activeRoleEl = document.getElementById('active-chat-role');
  const activeProfileLink = document.getElementById('active-profile-link');
  const searchInput = document.getElementById('chat-search-input');

  function getCurrentTime() {
    return new Date().toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' });
  }

  function getPersonaMessages(personaId) {
    if (!Array.isArray(chatHistory[personaId]) || chatHistory[personaId].length === 0) {
      chatHistory[personaId] = [{ sender: 'model', text: defaultPersonas[personaId].initialMessage, time: 'Dnes' }];
      localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(chatHistory));
    }
    return chatHistory[personaId];
  }

  function renderSidebar() {
    chatListEl.innerHTML = '';
    Object.values(defaultPersonas).forEach(p => {
      const isActive = p.id === activeId;
      const item = document.createElement('div');
      item.className = `chat-item ${isActive ? 'active' : ''}`;
      item.onclick = () => selectPersona(p.id);
      item.innerHTML = `
        <div class="chat-avatar"><img src="${p.avatar}" alt="${p.name}"></div>
        <div class="chat-item-info">
          <div class="chat-item-header">
            <h3>${p.name}</h3>
            <span class="chat-time">Teraz</span>
          </div>
          <p class="chat-preview">${p.role}</p>
        </div>
      `;
      chatListEl.appendChild(item);
    });
  }

  function renderMessages(personaId) {
    const messages = getPersonaMessages(personaId);
    messagesContainer.innerHTML = '<div class="chat-date-divider">Dnes</div>';

    messages.forEach(msg => {
      const row = document.createElement('div');
      row.className = `message-row ${msg.sender === 'user' ? 'outgoing' : 'incoming'}`;
      row.innerHTML = `
        <div class="message-bubble">${msg.text}</div>
        <div class="message-time">${msg.time || ''}</div>
      `;
      messagesContainer.appendChild(row);
    });

    // Прокрутка донизу
    setTimeout(() => {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 10);
  }

  function selectPersona(personaId) {
    activeId = personaId;
    const p = defaultPersonas[personaId];

    activeAvatarEl.src = p.avatar;
    activeNameEl.textContent = p.name;
    activeRoleEl.textContent = `${p.role} · Online`;
    activeProfileLink.href = p.profileUrl;
    chatInput.placeholder = `Napíš správu postave ${p.name}...`;

    renderSidebar();
    renderMessages(personaId);
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      document.querySelectorAll('.chat-item').forEach((item, index) => {
        const p = Object.values(defaultPersonas)[index];
        const match = p.name.toLowerCase().includes(q) || p.role.toLowerCase().includes(q);
        item.style.display = match ? 'flex' : 'none';
      });
    });
  }

  if (!chatForm || !chatInput || !messagesContainer || !sendBtn) return;

  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (!text) return;

    const persona = defaultPersonas[activeId];
    const history = getPersonaMessages(activeId);

    history.push({ sender: 'user', text: text, time: getCurrentTime() });
    localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(chatHistory));
    
    chatInput.value = '';
    renderMessages(activeId);

    sendBtn.disabled = true;
    const typingRow = document.createElement('div');
    typingRow.className = 'message-row incoming';
    typingRow.innerHTML = `<div class="message-bubble" style="color: #64748b; font-style: italic;">${persona.name} píše...</div>`;
    messagesContainer.appendChild(typingRow);
    
    setTimeout(() => { messagesContainer.scrollTop = messagesContainer.scrollHeight; }, 10);

    const systemPrompt = `Si ${persona.name}, ${persona.role}. Tvoje zručnosti: ${persona.skills}. Odpovedaj prirodzene po slovensky, ako študent na platforme SkillMatch. Buď stručný (2-4 vety).`;
    
    const apiContents = history.slice(-10).map(m => ({
      role: m.sender === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }]
    }));

    try {
      const response = await fetch(PROXY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: apiContents
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Chyba API ${response.status}: ${errorText || 'Server nevrátil odpoveď.'}`);
      }
      
      const data = await response.json();
      const replyText = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Prepáč, nerozumel som.';

      typingRow.remove();
      history.push({ sender: 'model', text: replyText, time: getCurrentTime() });
      localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(chatHistory));
      renderMessages(activeId);

    } catch (err) {
      typingRow.remove();
      history.push({ sender: 'model', text: `⚠️ Chyba pripojenia: ${err.message}`, time: getCurrentTime() });
      renderMessages(activeId);
    } finally {
      sendBtn.disabled = false;
      chatInput.focus();
    }
  });

  renderSidebar();
  selectPersona('jakub');
});