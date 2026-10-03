/* ──────────────────────────────────────────────────────────
   Sphere Browser – Renderer Process (index.js)
   Full tab management, webview routing, AI assistant chat
   ────────────────────────────────────────────────────────── */

'use strict';

// ─── State ──────────────────────────────────────────────────
const state = {
  tabs: [],          // { id, url, title, favicon, loading, webview, history, historyIdx }
  activeTabId: null,
  assistantOpen: false,
  sidebarOpen: true,
  chatMessages: [],
  settings: {
    engine: 'google',
    home: 'sphere'
  },
  bookmarks: [],
  frequentSites: [
    { label: 'GitHub',    url: 'https://github.com',        icon: 'terminal',   color: '#181d1a', bg: '#e5e9e4' },
    { label: 'Figma',     url: 'https://figma.com',         icon: 'draw',       color: '#9e4229', bg: '#ffdbd2' },
    { label: 'Notion',    url: 'https://notion.so',         icon: 'menu_book',  color: '#412a23', bg: '#ffdbd0' },
    { label: 'YouTube',   url: 'https://youtube.com',       icon: 'play_circle', color: '#ba1a1a', bg: '#ffdad6' },
    { label: 'Hacker News', url: 'https://news.ycombinator.com', icon: 'newspaper', color: '#003638', bg: '#bbebed' },
    { label: 'Wikipedia', url: 'https://wikipedia.org',     icon: 'book',       color: '#404848', bg: '#ebefea' },
  ]
};

let tabCounter = 0;

// ─── Search engine helpers ───────────────────────────────────
const SEARCH_ENGINES = {
  google:     q => `https://www.google.com/search?q=${encodeURIComponent(q)}`,
  duckduckgo: q => `https://duckduckgo.com/?q=${encodeURIComponent(q)}`,
  bing:       q => `https://www.bing.com/search?q=${encodeURIComponent(q)}`,
  brave:      q => `https://search.brave.com/search?q=${encodeURIComponent(q)}`,
  ecosia:     q => `https://www.ecosia.org/search?q=${encodeURIComponent(q)}`
};

function resolveUrl(input) {
  input = input.trim();
  if (!input) return null;
  // Full URL
  if (/^https?:\/\//i.test(input)) return input;
  // Bare domain
  if (/^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}/i.test(input) && !input.includes(' ')) {
    return 'https://' + input;
  }
  // Search
  const engine = state.settings.engine;
  return SEARCH_ENGINES[engine] ? SEARCH_ENGINES[engine](input) : SEARCH_ENGINES.google(input);
}

// ─── Progress bar ────────────────────────────────────────────
const progressBar = document.getElementById('progress-bar');
let progressTimer = null;
function showProgress(pct) {
  progressBar.style.width = pct + '%';
  progressBar.style.opacity = '1';
}
function hideProgress() {
  progressBar.style.width = '100%';
  setTimeout(() => { progressBar.style.opacity = '0'; progressBar.style.width = '0%'; }, 300);
}

// ─── Toast ───────────────────────────────────────────────────
const toastEl = document.getElementById('toast');
let toastTimer;
function showToast(msg, duration = 2500) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), duration);
}

// ─── Tab management ──────────────────────────────────────────
function addTab(url = null, activate = true) {
  const id = ++tabCounter;
  const isHome = !url;
  const tab = {
    id,
    url: url || '',
    title: isHome ? 'New Tab' : 'Loading…',
    favicon: null,
    loading: !isHome,
    webview: null,
    history: url ? [url] : [],
    historyIdx: url ? 0 : -1,
    entering: true
  };
  state.tabs.push(tab);
  if (activate) switchTab(id);
  renderTabStrip();
  updateContextPill();
  setTimeout(() => { tab.entering = false; }, 250);

  if (url) navigateTab(id, url);
  return id;
}

function closeTab(id, event) {
  if (event) { event.stopPropagation(); }
  const idx = state.tabs.findIndex(t => t.id === id);
  if (idx === -1) return;

  const tabEl = document.querySelector(`[data-tabid="${id}"]`);
  const doRemove = () => {
    const tab = state.tabs.find(t => t.id === id);
    if (!tab) return;
    if (tab.webview) tab.webview.remove();
    const currentIdx = state.tabs.findIndex(t => t.id === id);
    state.tabs.splice(currentIdx, 1);

    if (state.tabs.length === 0) {
      state.activeTabId = null;
      showHomePage();
    } else {
      const newIdx = Math.min(currentIdx, state.tabs.length - 1);
      switchTab(state.tabs[newIdx].id);
    }
    renderTabStrip();
    updateContextPill();
  };

  if (tabEl) {
    tabEl.classList.add('exiting');
    tabEl.addEventListener('animationend', doRemove, { once: true });
    // Fallback if animation doesn't fire
    setTimeout(doRemove, 250);
  } else {
    doRemove();
  }
}

function switchTab(id) {
  const tab = state.tabs.find(t => t.id === id);
  if (!tab) return;

  // Fade out previous webview
  if (state.activeTabId && state.activeTabId !== id) {
    const prev = state.tabs.find(t => t.id === state.activeTabId);
    if (prev && prev.webview) {
      prev.webview.style.opacity = '0';
      prev.webview.style.transition = 'opacity 120ms ease';
      setTimeout(() => { if (prev.webview) prev.webview.style.display = 'none'; }, 120);
    }
  }

  state.activeTabId = id;

  if (tab.url) {
    showWebviewArea();
    if (!tab.webview) {
      createWebview(tab);
    } else {
      tab.webview.style.display = 'flex';
      tab.webview.style.opacity = '0';
      requestAnimationFrame(() => {
        tab.webview.style.transition = 'opacity 150ms ease';
        tab.webview.style.opacity = '1';
      });
    }
    updateUrlBar(tab.url);
  } else {
    showHomePage();
    document.getElementById('url-bar').value = '';
  }

  updateNavButtons(tab);
  renderTabStrip();
}

function createWebview(tab) {
  const container = document.getElementById('webview-container');
  const wv = document.createElement('webview');
  wv.src = tab.url;
  wv.setAttribute('allowpopups', 'true');
  wv.style.cssText = 'width:100%;height:100%;display:flex;';
  wv.partition = 'persist:sphere';

  // Events
  wv.addEventListener('did-start-loading', () => {
    tab.loading = true;
    showProgress(20);
    renderTabStrip();
    document.getElementById('reload-icon').textContent = 'close';
  });
  wv.addEventListener('did-stop-loading', () => {
    tab.loading = false;
    hideProgress();
    renderTabStrip();
    document.getElementById('reload-icon').textContent = 'refresh';
  });
  wv.addEventListener('did-finish-load', () => {
    tab.url = wv.getURL();
    if (state.activeTabId === tab.id) updateUrlBar(tab.url);
    updateNavButtons(tab);
    wv.getTitle().then ? null : null; // just reference
  });
  wv.addEventListener('page-title-updated', (e) => {
    tab.title = e.title || tab.url;
    if (state.activeTabId === tab.id) {
      // no-op UI-wise; tab strip re-renders
    }
    renderTabStrip();
  });
  wv.addEventListener('page-favicon-updated', (e) => {
    if (e.favicons && e.favicons.length) tab.favicon = e.favicons[0];
    renderTabStrip();
  });
  wv.addEventListener('did-navigate', (e) => {
    tab.url = e.url;
    if (state.activeTabId === tab.id) {
      updateUrlBar(e.url);
      updateNavButtons(tab);
    }
    // Update history
    if (tab.historyIdx < tab.history.length - 1) {
      tab.history.splice(tab.historyIdx + 1);
    }
    if (tab.history[tab.historyIdx] !== e.url) {
      tab.history.push(e.url);
      tab.historyIdx = tab.history.length - 1;
    }
  });
  wv.addEventListener('did-navigate-in-page', (e) => {
    if (e.isMainFrame) {
      tab.url = e.url;
      if (state.activeTabId === tab.id) updateUrlBar(e.url);
    }
  });
  wv.addEventListener('new-window', (e) => {
    e.preventDefault();
    addTab(e.url, true);
  });
  wv.addEventListener('load-commit', (e) => {
    if (e.isMainFrame) showProgress(60);
  });

  container.appendChild(wv);
  tab.webview = wv;
}

function navigateTab(id, url) {
  const tab = state.tabs.find(t => t.id === id);
  if (!tab) return;
  tab.url = url;

  if (tab.webview) {
    tab.webview.loadURL(url);
  } else if (state.activeTabId === id) {
    showWebviewArea();
    createWebview(tab);
  }

  if (state.activeTabId === id) updateUrlBar(url);
}

// ─── Home page ───────────────────────────────────────────────
function showHomePage() {
  document.getElementById('home-page').classList.remove('hidden');
  document.getElementById('webview-container').classList.add('hidden');
  document.getElementById('url-bar').value = '';
  document.getElementById('secure-icon').classList.add('hidden');
  document.getElementById('reload-icon').textContent = 'refresh';
}

function showWebviewArea() {
  document.getElementById('home-page').classList.add('hidden');
  document.getElementById('webview-container').classList.remove('hidden');
}

// ─── URL bar ─────────────────────────────────────────────────
function updateUrlBar(url) {
  const bar = document.getElementById('url-bar');
  bar.value = url;
  const secureIcon = document.getElementById('secure-icon');
  if (url.startsWith('https://')) {
    secureIcon.classList.remove('hidden');
    secureIcon.style.color = '#003638';
  } else {
    secureIcon.classList.add('hidden');
  }
}

function focusUrlBar() {
  const bar = document.getElementById('url-bar');
  bar.focus();
  bar.select();
}

function handleUrlKeydown(e) {
  if (e.key === 'Enter') {
    const input = e.target.value.trim();
    if (!input) return;
    const url = resolveUrl(input);
    if (!url) return;
    if (state.activeTabId) {
      navigateTab(state.activeTabId, url);
      showWebviewArea();
      const tab = state.tabs.find(t => t.id === state.activeTabId);
      if (tab && !tab.webview) createWebview(tab);
    } else {
      addTab(url);
    }
    e.target.blur();
  }
  if (e.key === 'Escape') {
    e.target.blur();
    const tab = state.tabs.find(t => t.id === state.activeTabId);
    if (tab) updateUrlBar(tab.url);
  }
}

// ─── Nav controls ────────────────────────────────────────────
function goBack() {
  const tab = state.tabs.find(t => t.id === state.activeTabId);
  if (tab && tab.webview && tab.webview.canGoBack()) tab.webview.goBack();
}
function goForward() {
  const tab = state.tabs.find(t => t.id === state.activeTabId);
  if (tab && tab.webview && tab.webview.canGoForward()) tab.webview.goForward();
}
function reloadPage() {
  const tab = state.tabs.find(t => t.id === state.activeTabId);
  if (!tab) return;
  if (tab.loading && tab.webview) {
    tab.webview.stop();
  } else if (tab.webview) {
    tab.webview.reload();
  }
}

function updateNavButtons(tab) {
  const btnBack = document.getElementById('btn-back');
  const btnFwd = document.getElementById('btn-forward');
  if (tab && tab.webview) {
    btnBack.disabled = !tab.webview.canGoBack();
    btnFwd.disabled = !tab.webview.canGoForward();
  } else {
    btnBack.disabled = true;
    btnFwd.disabled = true;
  }
}

// ─── Tab strip rendering ─────────────────────────────────────
// Drag state for tab reordering
// ─── Tab strip – pointer-event drag (smooth, no HTML5 jank) ────
let drag = {
  active: false, tabId: null, srcIdx: null,
  ghost: null, startX: 0, currentX: 0, dropIdx: null
};

function renderTabStrip() {
  const strip = document.getElementById('tab-strip');
  strip.innerHTML = '';

  state.tabs.forEach((tab, idx) => {
    const div = document.createElement('div');
    div.dataset.tabid = tab.id;
    div.dataset.idx   = idx;
    div.className = [
      'tab-item',
      tab.id === state.activeTabId ? 'active'   : '',
      tab.entering                 ? 'entering' : ''
    ].filter(Boolean).join(' ');

    // ── Click to switch ──
    div.onclick = (e) => {
      if (drag.active) return;
      if (e.target.closest('.tab-close')) return;
      switchTab(tab.id);
    };

    // ── Middle-click to close ──
    div.onauxclick = (e) => {
      if (e.button === 1) { e.preventDefault(); closeTab(tab.id, e); }
    };

    // ── Pointer drag to reorder ──
    div.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      if (e.target.closest('.tab-close')) return;
      e.preventDefault();

      drag.tabId  = tab.id;
      drag.srcIdx = idx;
      drag.startX = e.clientX;
      drag.currentX = e.clientX;
      drag.active = false; // becomes true after threshold

      // Ghost element
      const rect  = div.getBoundingClientRect();
      const ghost = div.cloneNode(true);
      ghost.id    = 'tab-drag-ghost';
      ghost.style.cssText = `
        position: fixed;
        top: ${rect.top}px;
        left: ${rect.left}px;
        width: ${rect.width}px;
        height: ${rect.height}px;
        pointer-events: none;
        z-index: 9999;
        opacity: 0;
        transform: scale(1);
        border-radius: 8px 8px 0 0;
        background: #ffffff;
        box-shadow: 0 8px 24px rgba(31,36,33,0.18);
        transition: box-shadow 150ms ease, transform 150ms ease;
      `;
      document.body.appendChild(ghost);
      drag.ghost = ghost;

      const onMove = (me) => {
        const dx = me.clientX - drag.startX;

        // Activate drag after 4px threshold
        if (!drag.active && Math.abs(dx) > 4) {
          drag.active = true;
          div.classList.add('dragging');
          ghost.style.opacity = '0.92';
          ghost.style.transform = 'scale(1.04)';
        }
        if (!drag.active) return;

        drag.currentX = me.clientX;
        ghost.style.left = (rect.left + dx) + 'px';

        // Find drop index from pointer position
        const items = [...strip.querySelectorAll('.tab-item:not(.dragging)')];
        let newDropIdx = drag.srcIdx;
        for (let i = 0; i < items.length; i++) {
          const r = items[i].getBoundingClientRect();
          if (me.clientX < r.left + r.width / 2) { newDropIdx = i < drag.srcIdx ? i : i; break; }
          else { newDropIdx = i < drag.srcIdx ? i + 1 : i + 1; }
        }

        if (newDropIdx !== drag.dropIdx) {
          drag.dropIdx = newDropIdx;
          // Visual indicator: add CSS class to the target slot
          items.forEach((el, i) => {
            el.classList.remove('drop-left', 'drop-right');
            const elRealIdx = parseInt(el.dataset.idx);
            if (i === newDropIdx && newDropIdx <= drag.srcIdx) el.classList.add('drop-left');
            else if (i === newDropIdx - 1 && newDropIdx > drag.srcIdx) el.classList.add('drop-right');
          });
        }
      };

      const onUp = () => {
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup',   onUp);

        if (drag.ghost) { drag.ghost.remove(); drag.ghost = null; }

        if (drag.active && drag.dropIdx !== null && drag.dropIdx !== drag.srcIdx) {
          // Reorder state
          const [moved] = state.tabs.splice(drag.srcIdx, 1);
          const dest = drag.dropIdx > drag.srcIdx ? drag.dropIdx - 1 : drag.dropIdx;
          state.tabs.splice(dest, 0, moved);
        }

        drag.active = false; drag.tabId = null; drag.srcIdx = null; drag.dropIdx = null;
        renderTabStrip();
      };

      document.addEventListener('pointermove', onMove, { passive: true });
      document.addEventListener('pointerup',   onUp);
    });

    // ── Favicon / spinner / icon ──
    if (tab.loading) {
      const spinner = document.createElement('div');
      spinner.className = 'tab-spinner';
      div.appendChild(spinner);
    } else if (tab.favicon) {
      const img = document.createElement('img');
      img.className = 'tab-favicon';
      img.src = tab.favicon;
      img.onerror = () => { img.style.display = 'none'; };
      div.appendChild(img);
    } else {
      const icon = document.createElement('span');
      icon.className = 'material-symbols-outlined';
      icon.style.cssText = 'font-size:14px;flex-shrink:0;';
      icon.textContent = tab.url ? 'public' : 'add';
      div.appendChild(icon);
    }

    // ── Title ──
    const title = document.createElement('span');
    title.className = 'tab-title';
    title.textContent = tab.title || 'New Tab';
    div.appendChild(title);

    // ── Close button ──
    const closeBtn = document.createElement('button');
    closeBtn.className = 'tab-close';
    closeBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size:13px;">close</span>';
    closeBtn.onclick = (e) => closeTab(tab.id, e);
    div.appendChild(closeBtn);

    strip.appendChild(div);
  });

  // ── Scroll wheel cycles tabs ──
  strip.onwheel = (e) => {
    e.preventDefault();
    const idx = state.tabs.findIndex(t => t.id === state.activeTabId);
    if (idx === -1) return;
    const next = idx + (e.deltaY > 0 ? 1 : -1);
    if (next >= 0 && next < state.tabs.length) switchTab(state.tabs[next].id);
  };
}

// ─── Context pill ─────────────────────────────────────────────
function updateContextPill() {
  const tab = state.tabs.find(t => t.id === state.activeTabId);
  document.getElementById('context-title').textContent = tab ? (tab.title || 'Loading…') : 'New Session';
  document.getElementById('context-tabs').textContent =
    `${state.tabs.length} tab${state.tabs.length !== 1 ? 's' : ''} open`;
}

// ─── Frequent spaces ──────────────────────────────────────────
function renderFrequentSpaces() {
  const grid = document.getElementById('frequent-spaces');
  grid.innerHTML = '';
  state.frequentSites.forEach(site => {
    const a = document.createElement('a');
    a.className = 'space-card';
    a.href = '#';
    a.onclick = (e) => { e.preventDefault(); addTab(site.url); };
    a.innerHTML = `
      <div class="flex items-center justify-between">
        <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background:${site.bg};color:${site.color}">
          <span class="material-symbols-outlined text-[18px]">${site.icon}</span>
        </div>
      </div>
      <div>
        <p class="text-label-md font-semibold text-on-surface truncate">${site.label}</p>
        <p class="text-label-sm text-on-surface-variant truncate">${new URL(site.url).hostname}</p>
      </div>
    `;
    grid.appendChild(a);
  });
}

// ─── Omnibar (home page) ──────────────────────────────────────
let omniMode = 'search';

function setOmniMode(mode) {
  omniMode = mode;
  document.querySelectorAll('.omni-mode-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });
}

function handleOmniKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    submitOmni();
  }
}

function submitOmni() {
  const input = document.getElementById('omni-input').value.trim();
  if (!input) return;
  const url = resolveUrl(input);
  if (url) {
    if (state.activeTabId) {
      navigateTab(state.activeTabId, url);
      showWebviewArea();
      const tab = state.tabs.find(t => t.id === state.activeTabId);
      if (tab && !tab.webview) createWebview(tab);
    } else {
      addTab(url);
    }
    document.getElementById('omni-input').value = '';
  }
}

// Suggestion chips
document.addEventListener('click', (e) => {
  const chip = e.target.closest('.suggestion-chip');
  if (chip) {
    const text = chip.dataset.text;
    document.getElementById('omni-input').value = text;
    submitOmni();
  }
});

// ─── Assistant panel ─────────────────────────────────────────
function toggleAssistant() {
  const panel = document.getElementById('assistant-panel');
  if (!state.assistantOpen) {
    // Slide in
    state.assistantOpen = true;
    panel.classList.remove('hidden');
    panel.classList.add('flex', 'sliding-in');
    panel.classList.remove('sliding-out');
    setTimeout(() => panel.classList.remove('sliding-in'), 350);
    setTimeout(() => document.getElementById('chat-input').focus(), 100);
  } else {
    // Slide out
    state.assistantOpen = false;
    panel.classList.add('sliding-out');
    panel.classList.remove('sliding-in');
    setTimeout(() => {
      panel.classList.add('hidden');
      panel.classList.remove('flex', 'sliding-out');
    }, 220);
  }
}

function clearChat() {
  const container = document.getElementById('chat-messages');
  container.innerHTML = '';
  state.chatMessages = [];
  appendAssistantMessage("Chat cleared. How can I help you?");
}

function handleChatKeydown(e) {
  if (e.key === 'Enter') sendChat();
}

function sendChat() {
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';

  appendUserMessage(text);
  simulateAssistantReply(text);
}

function appendUserMessage(text) {
  const container = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = 'chat-user animate-fade-in';
  div.innerHTML = `
    <div class="bubble">${escapeHtml(text)}</div>
    <span class="text-label-sm text-on-surface-variant px-1">${timeNow()}</span>
  `;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function appendAssistantMessage(text, isTyping = false) {
  const container = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = 'chat-assistant animate-fade-in';
  div.innerHTML = `
    <div class="w-7 h-7 rounded-full bg-primary-container text-on-primary flex items-center justify-center shrink-0 mt-1">
      <span class="material-symbols-outlined text-[16px]">auto_awesome</span>
    </div>
    <div class="flex-1 flex flex-col gap-1">
      <div class="flex items-center gap-2">
        <span class="text-label-md font-semibold text-on-surface">Sphere Co-Pilot</span>
        <span class="text-label-sm text-on-surface-variant">${timeNow()}</span>
      </div>
      <div class="bubble">${isTyping ? '<span class="typing-indicator">Thinking…</span>' : escapeHtml(text)}</div>
    </div>
  `;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  return div;
}

function simulateAssistantReply(userText) {
  // Show typing indicator
  const typingEl = appendAssistantMessage('', true);
  const bubbleEl = typingEl.querySelector('.bubble');

  const activeTab = state.tabs.find(t => t.id === state.activeTabId);
  const url = activeTab ? activeTab.url : null;
  const title = activeTab ? activeTab.title : null;

  const reply = generateReply(userText, url, title);

  setTimeout(() => {
    bubbleEl.innerHTML = reply;
    typingEl.querySelector('.typing-indicator') && (bubbleEl.textContent = '');
    bubbleEl.innerHTML = reply;
    const container = document.getElementById('chat-messages');
    container.scrollTop = container.scrollHeight;
  }, 600 + Math.random() * 400);
}

function generateReply(text, url, title) {
  const lower = text.toLowerCase();

  if (lower.includes('@tab') || lower.includes('current page') || lower.includes('this page')) {
    if (url) return `I can see you're on <strong>${escapeHtml(title || url)}</strong>.<br><br>The page is at <code style="font-size:11px;background:#ebefea;padding:2px 5px;border-radius:4px;">${escapeHtml(url)}</code>.<br><br>I can summarize the content, extract key information, or help you interact with it. What would you like to do?`;
    return "No active tab detected. Open a page first and I'll help you with it.";
  }
  if (lower.includes('search') || lower.includes('find') || lower.includes('look up')) {
    const query = text.replace(/search|find|look up|for/gi, '').trim();
    return `Searching for <strong>"${escapeHtml(query)}"</strong>…<br><br>Opening results in a new tab for you.`;
  }
  if (lower.includes('open') || lower.includes('go to') || lower.includes('navigate')) {
    return `Sure! I can open that for you. Type a URL or site name in the address bar, or let me know a specific address and I'll navigate to it.`;
  }
  if (lower.includes('summarize') || lower.includes('summary')) {
    if (url) return `I'd summarize <strong>${escapeHtml(title || url)}</strong> for you. In a real integration this would extract the page's text content via the webview's <code>executeJavaScript</code> API and pass it to a language model.<br><br>Want me to open a summarization task?`;
    return 'Please open a page first so I can summarize it for you.';
  }
  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
    return "Hi there! I'm your Sphere Co-Pilot. I can help you browse smarter — search the web, summarize pages, compare tabs, or run multi-step research tasks. What's on your mind?";
  }
  if (lower.includes('help')) {
    return `Here's what I can do:<br><ul style="margin-top:8px;padding-left:16px;list-style:disc;display:flex;flex-direction:column;gap:4px;">
      <li>Search the web and open results</li>
      <li>Summarize the current page (<code>@tab</code>)</li>
      <li>Compare information across tabs</li>
      <li>Run multi-step research tasks</li>
      <li>Translate, explain, or rewrite page content</li>
    </ul>`;
  }
  return `Understood! In a full AI integration, this would route your query — <em>"${escapeHtml(text)}"</em> — to a language model with live web access and tab context.<br><br>For now, try typing a URL in the address bar, or ask me to "open [site]" or "search for [topic]".`;
}

// ─── Bookmarks ───────────────────────────────────────────────
function bookmarkCurrent() {
  const tab = state.tabs.find(t => t.id === state.activeTabId);
  if (!tab || !tab.url) { showToast('Nothing to bookmark'); return; }
  const exists = state.bookmarks.find(b => b.url === tab.url);
  if (exists) {
    state.bookmarks = state.bookmarks.filter(b => b.url !== tab.url);
    document.getElementById('bookmark-btn').style.color = '';
    showToast('Bookmark removed');
  } else {
    state.bookmarks.push({ url: tab.url, title: tab.title });
    document.getElementById('bookmark-btn').style.color = '#9e4229';
    showToast('Bookmarked!');
  }
}

// ─── Sidebar toggle ──────────────────────────────────────────
function toggleSidebar() {
  state.sidebarOpen = !state.sidebarOpen;
  const sidebar = document.getElementById('sidebar');
  sidebar.style.width = state.sidebarOpen ? '256px' : '0';
  sidebar.style.overflow = state.sidebarOpen ? '' : 'hidden';
}

// ─── Split view (stub) ───────────────────────────────────────
function toggleSplitView() {
  showToast('Split view — coming soon!');
}

// ─── Downloads (stub) ────────────────────────────────────────
function openDownloads() {
  showToast('Downloads panel — coming soon!');
}

// ─── Settings modal ──────────────────────────────────────────
function openSettings() {
  document.getElementById('settings-modal').classList.remove('hidden');
  document.getElementById('pref-engine').value = state.settings.engine;
  document.getElementById('pref-home').value = state.settings.home;
}
function closeSettings() {
  document.getElementById('settings-modal').classList.add('hidden');
}
function saveSettings() {
  state.settings.engine = document.getElementById('pref-engine').value;
  state.settings.home = document.getElementById('pref-home').value;
  closeSettings();
  showToast('Preferences saved');
}

// ─── Sidebar nav click ────────────────────────────────────────
document.getElementById('sidebar-nav').addEventListener('click', (e) => {
  const link = e.target.closest('a.nav-item');
  if (!link) return;
  e.preventDefault();
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  link.classList.add('active');
  const view = link.dataset.view;
  if (view === 'canvas') {
    if (state.tabs.length === 0) showHomePage();
    else switchTab(state.activeTabId || state.tabs[0].id);
  } else if (view === 'copilot') {
    if (!state.assistantOpen) toggleAssistant();
  } else if (view === 'history') {
    showToast('History & Logs — coming soon!');
  } else if (view === 'research') {
    showToast('Research Vault — coming soon!');
  } else if (view === 'collections') {
    showToast('Collections — coming soon!');
  }
});

// ─── macOS window controls (Electron) ────────────────────────
function minimizeWindow() {
  // Electron will handle via OS; for renderer we just trigger via ipcRenderer
  // These calls work if contextBridge exposes shell commands; otherwise OS handles traffic lights natively
}
function maximizeWindow() {}

// ─── Keyboard shortcuts ──────────────────────────────────────
document.addEventListener('keydown', (e) => {
  const mod = e.metaKey || e.ctrlKey;
  if (mod && e.key === 't') { e.preventDefault(); addTab(); }
  if (mod && e.key === 'w') { e.preventDefault(); if (state.activeTabId) closeTab(state.activeTabId); }
  if (mod && e.key === 'l') { e.preventDefault(); focusUrlBar(); }
  if (mod && e.key === 'r') { e.preventDefault(); reloadPage(); }
  if (mod && e.key === '[') { e.preventDefault(); goBack(); }
  if (mod && e.key === ']') { e.preventDefault(); goForward(); }
  if (mod && e.key === 'k') { e.preventDefault(); if (!state.assistantOpen) toggleAssistant(); document.getElementById('chat-input').focus(); }
  // Tab switch with Cmd+1-9
  if (mod && /^[1-9]$/.test(e.key)) {
    const idx = parseInt(e.key) - 1;
    if (state.tabs[idx]) { e.preventDefault(); switchTab(state.tabs[idx].id); }
  }
});

// ─── Electron IPC listeners ───────────────────────────────────
if (window.electronAPI) {
  window.electronAPI.onMenuNewTab(() => addTab());
  window.electronAPI.onMenuCloseTab(() => { if (state.activeTabId) closeTab(state.activeTabId); });
  window.electronAPI.onMenuGoBack(() => goBack());
  window.electronAPI.onMenuGoForward(() => goForward());
  window.electronAPI.onMenuReload(() => reloadPage());
  window.electronAPI.onMenuFocusUrl(() => focusUrlBar());
  window.electronAPI.onOpenUrlInNewTab((url) => addTab(url));
}

// ─── Utility helpers ─────────────────────────────────────────
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function timeNow() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ─── Init ────────────────────────────────────────────────────
function init() {
  renderFrequentSpaces();
  showHomePage();

  // Start with a blank home tab slot (no webview yet)
  const id = ++tabCounter;
  state.tabs.push({ id, url: '', title: 'New Tab', favicon: null, loading: false, webview: null, history: [], historyIdx: -1 });
  state.activeTabId = id;
  renderTabStrip();
  updateContextPill();

  console.log('[Sphere] Browser initialized');
}

init();
