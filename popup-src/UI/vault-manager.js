import { send, queryTabs } from '../messaging.js';
import { parse } from 'tldts';
import { globalState } from '../state.js';
import { renderItemDetailUI, renderNoteDetailUI } from './detail-page.js';
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

  // 1. Fetch and process data
  const combinedItems = await fetchAllAndCombinedItems();

  // 2. Render the UI
  renderItemList(container, combinedItems);

  // 3. Set up event listeners *if* the list isn't empty
  if (combinedItems.length > 0) {
    setupItemListEventListeners(container);
  }
}

/**
 * Fetches vault and note items, combines them, and sorts them by time.
 * @returns {Promise<Array<Object>>} A sorted array of combined items.
 */
async function fetchAllAndCombinedItems() {
  // Fetch vault items and notes
  const vaultRes = await send({ type: 'GET_VAULT' });
  const allVaultItems = vaultRes ? vaultRes : [];

  const notesRes = await send({ type: 'GET_ALL_NOTE' });
  const noteItems = notesRes ? notesRes : [];
  // console.log('Notes:', JSON.stringify(noteItems));
  // console.log('Vault Items:', JSON.stringify(allVaultItems));
  // Combine all vault items and notes
  const combinedItems = [
    ...allVaultItems.map(item => ({ ...item, kind: 'vault' })),
    ...noteItems.map(item => ({ ...item, kind: 'note' }))
  ];

  // Sort by time (descending)
  combinedItems.sort((a, b) => new Date(b.time) - new Date(a.time));

  return combinedItems;
}

/**
 * Renders the full list of items or an empty state message.
 * @param {HTMLElement} container - The container element to render into.
 * @param {Array<Object>} items - The array of combined items.
 */
function renderItemList(container, items) {
  // Handle empty state
  if (items.length === 0) {
    container.innerHTML = `<p class="empty-state">Your vault is empty.</p>`;
    return;
  }

  // Build list
  container.innerHTML = '';
  const list = document.createElement('ul');
  list.className = 'item-list-ul';

  items.forEach((item) => {
    // console.log(JSON.stringify(item));
    let li;
    if (item.kind === 'vault') {
      li = createVaultItemElement(item);
    } else {
      li = createNoteItemElement(item);
    }
    list.appendChild(li);
  });

  container.appendChild(list);
}

/**
 * Creates an <li> element for a vault item.
 * @param {Object} item - The vault item data.
 * @returns {HTMLLIElement} The rendered list item.
 */
function createVaultItemElement(item) {
  const li = document.createElement('li');
  li.className = 'item-entry';

  let title = item.title || item.domain;
  if (title.length > 10) title = title.substring(0, 10) + '...';
  let username = item.username;
  if (username.length > 10) username = username.substring(0, 10) + '...';

  const faviconUrl = getFaviconUrl(item.domain); // Assuming getFaviconUrl is available

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
  return li;
}

/**
 * Creates an <li> element for a note item.
 * @param {Object} item - The note item data.
 * @returns {HTMLLIElement} The rendered list item.
 */
function createNoteItemElement(item) {
  const li = document.createElement('li');
  li.className = 'item-entry'; // You might want a different class, e.g., 'note-entry'

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
  return li;
}

/**
 * Sets up the event listener for the item list.
 * Uses the 'cloneNode' trick to remove old listeners.
 * @param {HTMLElement} container - The container element.
 */
function setupItemListEventListeners(container) {
  // Refresh and bind click handlers
  const newContainer = container.cloneNode(true);
  container.replaceWith(newContainer);
  newContainer.addEventListener('click', handleItemListClick);
}

/**
 * Handles all click events delegated from the item list.
 * @param {Event} e - The click event.
 */
function handleItemListClick(e) {
  const target = e.target.closest('.icon-button');
  if (!target) return;
  const id = target.dataset.id;

  if (target.classList.contains('fill-btn')) {
    handleFillItem(id); // Assumed function
  } else if (target.classList.contains('view-btn')) {
    renderItemDetailUI(id); // Assumed function
  } else if (target.classList.contains('delete-btn')) {
    handleDeleteItem(id); // Assumed function
  } else if (target.classList.contains('view-btnx')) {
    renderNoteDetailUI(id); // Assumed function
  } else if (target.classList.contains('delete-btnx')) {
    handleDeleteNote(id); // Assumed function
  }
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


export {
  displayVaultItems,
  displayNoteItems,
  renderBySelection,
  handleDeleteItem,
  handleDeleteNote,
  handleFillItem,
};
