import * as idbKeyval from 'idb-keyval';
import { parse } from 'tldts';
import './popup.css';

// Helper to send messages to the background script
async function send(msg) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(msg, (response) => {
      if (chrome.runtime.lastError) {
        console.error(
          'Error sending message:',
          chrome.runtime.lastError.message
        );
        resolve({ ok: false, error: chrome.runtime.lastError.message });
      } else resolve(response);
    });
  });
}

// Main initialization function
async function init() {
  const app = document.getElementById('app');
  app.innerHTML = '<p>Loading...</p>'; // Show loading indicator

  const vault = await idbKeyval.get('vault');

  if (!vault) renderFirstRunUI();
  else {
    const state = await send({ type: 'GET_LOCK_STATE' });
    if (!state.ok) renderUnlockedUI();
    else renderLockedUI();
  }
}

// Renders the UI for the first time setup
function renderFirstRunUI() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="container">
      <h3>Welcome!</h3>
      <p>Create a Master Password to secure your vault.</p>
      <form id="setup-form">
        <input type="password" id="m1" placeholder="Master Password" required />
        <input type="password" id="m2" placeholder="Confirm Password" required />
        <button type="submit">Create Vault</button>
      </form>
    </div>
  `;

  document
    .getElementById('setup-form')
    .addEventListener('submit', async (e) => {
      e.preventDefault();
      const m1 = document.getElementById('m1').value;
      const m2 = document.getElementById('m2').value;
      if (m1 !== m2) {
        alert('Passwords do not match!');
        return;
      }
      const res = await send({ type: 'SET_MASTER', master: m1 });
      if (res.ok) init();
      else alert('Error creating vault.');
    });
}

// Renders the UI for the locked state
function renderLockedUI() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="container">
      <h3>Vault Locked</h3>
      <form id="unlock-form">
        <input type="password" id="master" placeholder="Master Password" required />
        <button type="submit">Unlock</button>
      </form>
    </div>
  `;

  document
    .getElementById('unlock-form')
    .addEventListener('submit', async (e) => {
      e.preventDefault();
      const master = document.getElementById('master').value;
      const res = await send({ type: 'UNLOCK', master });
      if (res && res.ok) init(); // Re-initialize to show the unlocked view
      else alert('Incorrect Master Password!');
    });
}

// Renders the UI for the unlocked state
function renderUnlockedUI() {
  const app = document.getElementById('app');
  app.innerHTML = `
  <div class="container">
    <div id="screen-main" class="screen">
      <div class="header">
        <h3>My Vault</h3>
        <button id="lock-btn">Lock</button>
      </div>
      <div class="card">
        <button id="add-login-btn" class="add-login-button">+ Add New Login</button>
      </div>
      <div class="card">
        <h4>Logins for this site</h4>
        <div id="current-item-list"><p>Loading...</p></div>
      </div>
      <div class="card">
        <h4>All Logins</h4>
        <div id="all-item-list"><p>Loading...</p></div>
      </div>
    </div>

    <div id="screen-password" class="screen" style="display:none;">
      <div class="header">
        <h3>Password Generator</h3>
      </div>
      <div class="card">
        <label>Length: <input type="number" id="pw-length" value="16" min="6" max="64"></label>
        <button id="generate-btn">Generate</button>
        <p id="generated-password"></p>
      </div>
    </div>

    <!-- Tab navigator -->
    <div class="tab-bar">
      <button class="tab-btn active" data-screen="screen-main">Vault</button>
      <button class="tab-btn" data-screen="screen-password">Generator</button>
    </div>
  </div>
`;

  document.getElementById('lock-btn').addEventListener('click', async () => {
    const r = await send({ type: 'LOCK' });
    if (r.ok) init();
  });

  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      // hide all screens
      document.querySelectorAll(".screen").forEach(s => s.style.display = "none");
      // remove active from all tabs
      document.querySelectorAll(".tab-btn").forEach(t => t.classList.remove("active"));
      // show selected
      document.getElementById(btn.dataset.screen).style.display = "block";
      btn.classList.add("active");
    });
  });

  document.getElementById("generate-btn").addEventListener("click", () => {
    const len = parseInt(document.getElementById("pw-length").value);
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";
    let pw = "";
    for (let i = 0; i < len; i++) {
      pw += chars[Math.floor(Math.random() * chars.length)];
    }
    document.getElementById("generated-password").textContent = pw;
  });
  document
    .getElementById('add-login-btn')
    .addEventListener('click', () => renderAddLoginUI());

  displayVaultItems();
}

// Renders the Add Login form UI (full screen)
async function renderAddLoginUI() {
  const app = document.getElementById('app');

  // Get current tab domain for default value
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const currentHostname = tab ? parse(tab.url).hostname : '';

  app.innerHTML = `
    <div class="container">
        <div class="header">
            <button id="back-btn" class="back-button">← Back</button>
            <h3>Add New Login</h3>
        </div>
        <form id="add-login-form" class="add-login-form">
            <input type="text" id="title" placeholder="Title (e.g., Google)" />
            <input type="text" id="domain" placeholder="Domain (e.g., google.com)" value="${currentHostname}" required />
            <input type="text" id="username" placeholder="Username/Email" required />
            <input type="password" id="password" placeholder="Password" required />
            <button type="submit" class="save-button">Save Login</button>
        </form>
    </div>
  `;

  document
    .getElementById('back-btn')
    .addEventListener('click', () => renderUnlockedUI());

  document
    .getElementById('add-login-form')
    .addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target;
      const item = {
        title: form.title.value,
        domain: form.domain.value,
        username: form.username.value,
        password: form.password.value
      };
      const res = await send({ type: 'ADD_LOGIN', item });
      if (res && res.ok) {
        alert('Login added successfully!');
        renderUnlockedUI(); // Go back to main screen
      } else alert('Failed to add login.');
    });
}

async function displayVaultItems() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const currentHostname = tab ? parse(tab.url).hostname : '';

  const vaultRes = await send({ type: 'GET_VAULT' });
  const allItems = vaultRes ? vaultRes : [];

  const matchRes = await send({ type: 'MATCH', domain: currentHostname });
  const matchingItems = matchRes ? matchRes : [];

  renderItemsToList(
    '#current-item-list',
    matchingItems,
    'No logins for this site.'
  );
  renderItemsToList('#all-item-list', allItems, 'Your vault is empty.');
}

function renderItemsToList(selector, items, emptyMessage) {
  const container = document.querySelector(selector);
  if (!container) return;

  if (items.length === 0) {
    container.innerHTML = `<p class="empty-state">${emptyMessage}</p>`;
    return;
  }

  container.innerHTML = '';
  const list = document.createElement('ul');
  list.className = 'item-list-ul';

  items.forEach((item) => {
    const li = document.createElement('li');
    li.className = 'item-entry';
    li.innerHTML = `
      <div class="item-info">
        <span class="item-title">${item.title || item.domain}</span>
        <span class="item-username">${item.username}</span>
      </div>
      <div class="item-actions">
        <button class="icon-button fill-btn" data-id="${item.id
      }" title="Fill">✏️</button>
        <button class="icon-button view-btn" data-id="${item.id
      }" title="View/Edit">👁️</button>
        <button class="icon-button delete-btn" data-id="${item.id
      }" title="Delete">🗑️</button>
      </div>
    `;
    list.appendChild(li);
  });

  container.appendChild(list);
  handleItemActions(container);
}

function handleItemActions(container) {
  container.replaceWith(container.cloneNode(true));
  document
    .querySelector(
      container.id === 'current-item-list'
        ? '#current-item-list'
        : '#all-item-list'
    )
    .addEventListener('click', (e) => {
      const target = e.target.closest('.icon-button');
      if (!target) return;

      const id = target.dataset.id;
      if (target.classList.contains('view-btn')) renderItemDetailUI(id);
      else if (target.classList.contains('delete-btn')) handleDeleteItem(id);
      else if (target.classList.contains('fill-btn')) handleFillItem(id);
    });
}

async function handleDeleteItem(id) {
  if (!confirm('Are you sure you want to delete this item?')) return;

  const res = await send({ type: 'DELETE_ITEM', id });
  if (res && res.ok) displayVaultItems(); // Refresh the list
  else alert('Failed to delete item.');
}

async function handleFillItem(id) {
  const res = await send({ type: 'GET_ITEM', id });
  if (!res || !res.ok) {
    alert('Could not retrieve item details to fill.');
    return;
  }

  const { username, password } = res.item;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab && tab.id) {
    chrome.tabs.sendMessage(tab.id, {
      type: 'REQUEST_FILL',
      username,
      password
    });

    window.close();
  } else alert('Could not find an active tab to fill.');
}

async function renderItemDetailUI(id) {
  const app = document.getElementById('app');
  app.innerHTML = `<div class="container"><p>Loading item...</p></div>`;

  const res = await send({ type: 'GET_ITEM', id });
  if (!res || !res.ok) {
    alert('Could not load item details.');
    renderUnlockedUI(); // Go back
    return;
  }

  const item = res.item;

  app.innerHTML = `
    <div class="container full-screen">
        <div class="header">
            <button id="back-btn" class="back-button">← Back</button>
            <h3>Edit Item</h3>
        </div>
        <form id="edit-item-form" class="edit-item-form">
            <label for="title">Title</label>
            <input type="text" id="title" value="${item.title || ''}" />

            <label for="domain">Domain</label>
            <input type="text" id="domain" value="${item.domain}" required />

            <label for="username">Username</label>
            <div class="input-group">
                <input type="text" id="username" value="${item.username
    }" required />
                <button type="button" class="copy-btn" data-copy-target="username">Copy</button>
            </div>

            <label for="password">Password</label>
            <div class="input-group">
                <input type="password" id="password" value="${item.password
    }" required />
                <button type="button" class="icon-button" id="toggle-password">👁️</button>
                <button type="button" class="copy-btn" data-copy-target="password">Copy</button>
            </div>

            <button type="submit" class="save-button">Save Changes</button>
        </form>
    </div>
  `;

  document
    .getElementById('back-btn')
    .addEventListener('click', () => renderUnlockedUI());

  document.getElementById('toggle-password').addEventListener('click', () => {
    const passInput = document.getElementById('password');
    const isPassword = passInput.type === 'password';
    passInput.type = isPassword ? 'text' : 'password';
  });

  // Handle copy buttons
  document.querySelectorAll('.copy-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const targetId = e.target.dataset.copyTarget;
      const textToCopy = document.getElementById(targetId).value;
      navigator.clipboard
        .writeText(textToCopy)
        .then(() => {
          e.target.textContent = 'Copied!';
          setTimeout(() => {
            e.target.textContent = 'Copy';
          }, 1500);
        })
        .catch((err) => {
          console.error('Failed to copy: ', err);
          alert('Failed to copy to clipboard.');
        });
    });
  });

  document
    .getElementById('edit-item-form')
    .addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target;
      const updatedItem = {
        id: item.id,
        title: form.title.value,
        domain: form.domain.value,
        username: form.username.value,
        password: form.password.value
      };

      const setRes = await send({ type: 'SET_ITEM', item: updatedItem });
      if (setRes && setRes.ok) {
        alert('Item updated successfully!');
        renderUnlockedUI();
      } else alert('Failed to update item.');
    });
}

// Start the app
init();
