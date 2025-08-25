import * as idbKeyval from 'idb-keyval';

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
      } else {
        resolve(response);
      }
    });
  });
}

// Main initialization function
async function init() {
  const app = document.getElementById('app');
  app.innerHTML = '<p>Loading...</p>'; // Show loading indicator

  const vault = await idbKeyval.get('vault');

  if (!vault) {
    renderFirstRunUI();
  } else {
    const state = await send({ type: 'GET_LOCK_STATE' });
    if (!state.ok) {
      renderUnlockedUI();
    } else {
      renderLockedUI();
    }
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
      if (res.ok) {
        init();
      } else {
        alert('Error creating vault.');
      }
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
      if (res && res.ok) {
        init(); // Re-initialize to show the unlocked view
      } else {
        alert('Incorrect Master Password!');
      }
    });
}

// Renders the UI for the unlocked state
function renderUnlockedUI() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="container">
        <div class="header">
            <h3>My vault</h3>
            <button id="lock-btn">Lock</button>
        </div>
        <div class="card">
            <h4>Add New Login</h4>
            <form id="add-login-form">
                <input type="text" id="title" placeholder="Title (e.g., Google)" />
                <input type="text" id="domain" placeholder="Domain (e.g., google.com)" required />
                <input type="text" id="username" placeholder="Username/Email" required />
                <input type="password" id="password" placeholder="Password" required />
                <button type="submit">Save</button>
            </form>
        </div>
        <div class="card" id="current-url">
            <h4>Current URL Logins</h4>
            <div id="item-list"><p>No items yet.</p></div>
        </div>
        <div class="card" id="all-logins">
            <h4>All Logins</h4>
            <div id="item-list"><p>No items yet.</p></div>
        </div>
    </div>
  `;

  document.getElementById('lock-btn').addEventListener('click', async () => {
    const r = await send({ type: 'LOCK' });
    if (r.ok) {
      init();
    }
  });

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
        alert('Login added!');
        form.reset();
      } else {
        alert('Failed to add login.');
      }
    });
}

// Start the app
init();
