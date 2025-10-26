const textarea = document.getElementById('markdown');
const output = document.getElementById('output');
const copyBtn = document.getElementById('copyBtn');
const drawer = document.getElementById('drawer');
const drawerToggle = document.getElementById('drawerToggle');
const savedList = document.getElementById('savedList');

marked.setOptions({
  gfm: true,
  breaks: true,
  highlight: (code, lang) => {
    const language = hljs.getLanguage(lang) ? lang : 'plaintext';
    return hljs.highlight(code, { language }).value;
  }
});

marked.use({
  renderer: {
    link(token) {
      return `<a href="${token.href}" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:underline">${token.text}</a>`;
    },
    image(token) {
      return `<a target="_blank" href="${token.href}"><img src="${token.href}" alt="${token.text}" loading="lazy" class="rounded-lg my-3"></a>`;
    }
  }
});

function renderMarkdown() {
  const rawHtml = marked.parse(textarea.value);
  const cleanHtml = DOMPurify.sanitize(rawHtml, { USE_PROFILES: { html: true } });
  output.innerHTML = cleanHtml;
}

// Copy button (JSON friendly)
copyBtn.addEventListener('click', () => {
  const minimizedMarkdown = textarea.value
    .split('\n')
    .map(line => line.replace(/\s+$/g, ''))
    .join('\\n'); 
  navigator.clipboard.writeText(minimizedMarkdown);
  copyBtn.textContent = "Copied!";
  setTimeout(() => copyBtn.textContent = "Copy", 1000);
});

// Persistent storage logic
const STORAGE_KEY = 'markdown_entries';
let currentEntryId = null; // track currently edited entry

function generateId() {
  return '_' + Math.random().toString(36).substr(2, 9);
}

function loadEntries() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}

function saveCurrentEntry(content) {
  if (!content.trim()) return;

  let entries = loadEntries();

  if (currentEntryId) {
    entries = entries.map(e => e.id === currentEntryId ? { ...e, content, time: new Date().toLocaleString() } : e);
  } else {
    currentEntryId = generateId();
    entries.push({ id: currentEntryId, content, time: new Date().toLocaleString() });
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  refreshSavedList();
}

function refreshSavedList() {
  const entries = loadEntries();
  savedList.innerHTML = '';
  entries.forEach(entry => {
    const div = document.createElement('div');
    div.className = 'drawer-item';
    div.innerHTML = `
      <span>${entry.time}</span>
      <button data-id="${entry.id}">Delete</button>
    `;

    // Click to load into editor
    div.querySelector('span').onclick = () => {
      textarea.value = entry.content;
      currentEntryId = entry.id;
      renderMarkdown();
    };

    // Delete button
    div.querySelector('button').onclick = (e) => {
      e.stopPropagation();
      deleteEntry(entry.id);
    };

    savedList.appendChild(div);
  });
}

function deleteEntry(id) {
  let entries = loadEntries().filter(e => e.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));

  if (currentEntryId === id) {
    textarea.value = '';
    currentEntryId = null;
    renderMarkdown();
  }

  refreshSavedList();
}

// Debounce typing auto-save (single entry update)
let typingTimer;
textarea.addEventListener('input', () => {
  renderMarkdown();
  clearTimeout(typingTimer);
  typingTimer = setTimeout(() => saveCurrentEntry(textarea.value), 1000);
});

// Do NOT auto-load anything on refresh
textarea.value = '';
renderMarkdown();
refreshSavedList();

// Drawer toggle
drawerToggle.addEventListener('click', () => drawer.classList.toggle('show'));
    