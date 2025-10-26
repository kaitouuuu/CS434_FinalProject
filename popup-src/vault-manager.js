import { send, queryTabs } from './messaging.js';
import { parse } from 'tldts';
import { globalState } from './state.js';
function getFaviconUrl(domain) {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
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
    let title = '';
    const faviconUrl = getFaviconUrl(item.domain);
    if (item.title) title = item.title;
    else title = item.domain;
    if (title.length > 10) title = title.substring(0, 10) + '...';
    let username = item.username;
    if (username.length > 10) username = username.substring(0, 10) + '...';
    const li = document.createElement('li');
    li.className = 'item-entry';
    li.innerHTML = `
      <div class="item-main">
        <img src="${faviconUrl}" class="favicon" alt=""
             onerror="this.src='default-lock.svg'">
        <div class="item-info">
          <span class="item-title">${title}</span>
          <span class="item-username">${username}</span>
        </div>
      </div>
      <div class="item-actions">
        <button class="icon-button fill-btn" data-id="${item.id}" title="Fill">Fill</button>
        <button class="icon-button view-btn" data-id="${item.id}" title="View/Edit">👁️</button>
        <button class="icon-button delete-btn" data-id="${item.id}" title="Delete">🗑️</button>
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

async function displayVaultItems() {
  const vaultRes = await send({ type: 'GET_VAULT' });
  const allItems = vaultRes ? vaultRes : [];

  renderItemsToList('#all-item-list', allItems, 'Your vault is empty.');
}

async function displayNoteItems() {
  const notesRes = await send({ type: 'GET_ALL_NOTE' });
  const noteItems = notesRes ? notesRes : [];
  const container = document.querySelector('#all-note-list');
  if (!container) return;
  if (noteItems.length === 0) {
    container.innerHTML = `<p class="empty-state">No notes</p>`;
    return;
  }
  container.innerHTML = '';
  const list = document.createElement('ul');
  list.className = 'item-list-ul';
  noteItems.forEach((item) => {
    let title = item.title;
    if (title.length > 15) title = title.substring(0, 15) + '...';
    const li = document.createElement('li');
    li.className = 'item-entry';
    li.innerHTML = `
      <div class="item-info">
        <span class="item-title">${title}</span>
      </div>
      <div class="item-actions">
        <button class="icon-button view-btnx" data-id="${item.id}" title="View/Edit">👁️</button>
        <button class="icon-button delete-btnx" data-id="${item.id}" title="Delete">🗑️</button>
      </div>
    `;
    list.appendChild(li);
  });

  container.appendChild(list);
  container.replaceWith(container.cloneNode(true));
  document.querySelector('#all-note-list').addEventListener('click', (e) => {
    const target = e.target.closest('.icon-button');
    if (!target) return;

    const id = target.dataset.id;
    if (target.classList.contains('view-btnx')) renderNoteDetailUI(id);
    else if (target.classList.contains('delete-btnx')) handleDeleteNote(id);
  });
}

async function renderBySelection(selection) {
  const vaultContainer = document.querySelector('#all-item-list');
  const noteContainer = document.querySelector('#all-note-list');

  vaultContainer.innerHTML = '';
  noteContainer.innerHTML = '';

  const [tab] = await queryTabs({ active: true, currentWindow: true });
  const currentHostname = tab ? parse(tab.url).hostname : '';
  const matchRes = await send({ type: 'MATCH', domain: currentHostname });
  const matchingItems = matchRes ? matchRes : [];

  renderItemsToList(
    '#current-item-list',
    matchingItems,
    'No logins for this site.'
  );
  if (selection === 'All') {
    await displayAllItems();
  } else if (selection === 'Password') {
    await displayVaultItems();
  } else if (selection === 'Note') {
    await displayNoteItems();
  }
}
async function displayAllItems() {
  const container = document.querySelector('#all-item-list');
  if (!container) return;

  // Fetch vault items and notes
  const vaultRes = await send({ type: 'GET_VAULT' });
  const allVaultItems = vaultRes ? vaultRes : [];

  const notesRes = await send({ type: 'GET_ALL_NOTE' });
  const noteItems = notesRes ? notesRes : [];

  // Combine all vault items and notes
  const combinedItems = [
    ...allVaultItems.map(item => ({ ...item, kind: 'vault' })),
    ...noteItems.map(item => ({ ...item, kind: 'note' }))
  ];

  // Sort by time (descending)
  combinedItems.sort((a, b) => new Date(b.time) - new Date(a.time));

  // Handle empty state
  if (combinedItems.length === 0) {
    container.innerHTML = `<p class="empty-state">Your vault is empty.</p>`;
    return;
  }

  // Build list
  container.innerHTML = '';
  const list = document.createElement('ul');
  list.className = 'item-list-ul';

  combinedItems.forEach((item) => {
    const li = document.createElement('li');
    li.className = 'item-entry';

    if (item.kind === 'vault') {
      // vault item
      let title = item.title || item.domain;
      if (title.length > 10) title = title.substring(0, 10) + '...';
      let username = item.username;
      if (username.length > 10) username = username.substring(0, 10) + '...';
      const faviconUrl = getFaviconUrl(item.domain);
      li.innerHTML = `
        <div class="item-main">
          <img src="${faviconUrl}" class="favicon" alt=""
               onerror="this.src='default-lock.svg'">
          <div class="item-info">
            <span class="item-title">${title}</span>
            <span class="item-username">${username}</span>
          </div>
        </div>
        <div class="item-actions">
          <button class="icon-button fill-btn" data-id="${item.id}" title="Fill">Fill</button>
          <button class="icon-button view-btn" data-id="${item.id}" title="View/Edit">👁️</button>
          <button class="icon-button delete-btn" data-id="${item.id}" title="Delete">🗑️</button>
        </div>
      `;
    } else {
      // note item
      let title = item.title;
      if (title.length > 15) title = title.substring(0, 15) + '...';
      li.innerHTML = `
        <div class="item-info">
          <span class="item-title">${title}</span>
        </div>
        <div class="item-actions">
          <button class="icon-button view-btnx" data-id="${item.id}" title="View/Edit">👁️</button>
          <button class="icon-button delete-btnx" data-id="${item.id}" title="Delete">🗑️</button>
        </div>
      `;
    }

    list.appendChild(li);
  });

  container.appendChild(list);

  // Refresh and bind click handlers
  container.replaceWith(container.cloneNode(true));
  document.querySelector('#all-item-list').addEventListener('click', (e) => {
    const target = e.target.closest('.icon-button');
    if (!target) return;
    const id = target.dataset.id;

    if (target.classList.contains('fill-btn')) handleFillItem(id);
    else if (target.classList.contains('view-btn')) renderItemDetailUI(id);
    else if (target.classList.contains('delete-btn')) handleDeleteItem(id);
    else if (target.classList.contains('view-btnx')) renderNoteDetailUI(id);
    else if (target.classList.contains('delete-btnx')) handleDeleteNote(id);
  });
}

async function handleDeleteItem(id) {
  if (!confirm('Are you sure you want to delete this item?')) return;

  const res = await send({ type: 'DELETE_ITEM', id });
  if (res && res.ok) renderBySelection(globalState);
  else alert('Failed to delete item.');
}

async function handleDeleteNote(id) {
  console.log('click');
  if (!confirm('Are you sure you want to delete this note?')) return;

  const res = await send({ type: 'DELETE_NOTE', id });
  if (res && res.ok) renderBySelection(globalState);
  else alert('Failed to delete note.');
}

async function handleFillItem(id) {
  const res = await send({ type: 'GET_ITEM', id });
  if (!res || !res.ok) {
    alert('Could not retrieve item details to fill.');
    return;
  }

  const { username, password } = res.item;

  const [tab] = await queryTabs({ active: true, currentWindow: true });
  if (tab && tab.id) {
    const r = chrome.tabs.sendMessage(tab.id, {
      type: 'REQUEST_FILL',
      username,
      password
    });

    if (r && !r.ok) alert("There's no active form to fill.");
    window.close();
  } else alert('Could not find an active tab to fill.');
}

async function renderItemDetailUI(id) {
  const app = document.getElementById('app');
  app.innerHTML = `<div class="container"><p>Loading item...</p></div>`;

  const res = await send({ type: 'GET_ITEM', id });
  if (!res || !res.ok) {
    alert('Could not load item details.');
    window.renderUnlockedUI();
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

  document.querySelectorAll('.copy-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const targetId = e.target.dataset.copyTarget;
      const textToCopy = document.getElementById(targetId).value;
      navigator.clipboard
        .writeText(textToCopy)
        .then(() => {
          e.target.textContent = 'Copied!';
          setTimeout(() => (e.target.textContent = 'Copy'), 1500);
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
        window.renderUnlockedUI();
      } else alert('Failed to update item.');
    });
}

async function renderNoteDetailUI(id) {
  const app = document.getElementById('app');
  app.innerHTML = `<div class="container"><p>Loading item...</p></div>`;

  const res = await send({ type: 'GET_NOTE', id });
  if (!res || !res.ok) {
    alert('Could not load item details.');
    window.renderUnlockedUI();
    return;
  }

  const item = res.item;

  app.innerHTML = `
    <div class="container full-screen">
        <div class="header">
            <button id="back-btn" class="back-button">← Back</button>
            <h3>Edit Note</h3>
        </div>
        <form id="edit-item-form" class="edit-item-form">
            <label for="title">Title</label>
            <div class="input-group">
                <input type="text" id="title" value="${item.title}" required />
                <button type="button" class="copy-btn" data-copy-target="title">Copy</button>
            </div>

            <label for="content">Content</label>
            <div class="input-group">
                <div id="content" contenteditable="true">${item.content}</div>
                <button type="button" class="copy-btn copy-btn-right" data-copy-target="content">Copy</button>
            </div>

            <button type="submit" class="save-button">Save Changes</button>
        </form>
    </div>
  `;

  document
    .getElementById('back-btn')
    .addEventListener('click', () => window.renderUnlockedUI());

  document.querySelectorAll('.copy-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const targetId = e.target.dataset.copyTarget;
      const textToCopy = document.getElementById(targetId).value;
      navigator.clipboard
        .writeText(textToCopy)
        .then(() => {
          e.target.textContent = 'Copied!';
          setTimeout(() => (e.target.textContent = 'Copy'), 1500);
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
        content: form.querySelector('#content').innerHTML
      };

      const setRes = await send({ type: 'SET_NOTE', item: updatedItem });
      if (setRes && setRes.ok) {
        alert('Note updated successfully!');
        window.renderUnlockedUI();
      } else alert('Failed to update Note.');
    });
}

export {
  displayVaultItems,
  displayNoteItems,
  renderBySelection,
  handleDeleteItem,
  handleDeleteNote,
  handleFillItem,
  renderItemDetailUI,
  renderNoteDetailUI
};
