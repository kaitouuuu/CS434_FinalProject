import { send, queryTabs } from './messaging.js';
import { parse } from 'tldts';

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
      if (res.ok) window.init();
      else alert('Error creating vault.');
    });
}

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
      if (res && res.ok) window.init();
      else alert('Incorrect Master Password!');
    });
}

async function renderAddLoginUI() {
  const app = document.getElementById('app');

  const [tab] = await queryTabs({ active: true, currentWindow: true });
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
    .addEventListener('click', () => window.renderUnlockedUI());

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
        window.renderUnlockedUI();
      } else alert('Failed to add login.');
    });
}

async function renderAddNoteUI() {
  const app = document.getElementById('app');

  app.innerHTML = `
    <div class="container">
        <div class="header">
            <button id="back-btn" class="back-button">← Back</button>
            <h3>Add New Note</h3>
        </div>
        <form id="add-login-form" class="add-login-form">
            <input type="text" id="title" placeholder="Title (e.g., My birthday)" />
            <div id="content" contenteditable="true" data-placeholder="1/1/1970"></div>
            <button type="submit" class="save-button">Save Note</button>
        </form>
    </div>
  `;

  document
    .getElementById('back-btn')
    .addEventListener('click', () => window.renderUnlockedUI());

  document
    .getElementById('add-login-form')
    .addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target;
      const item = {
        title: form.title.value,
        content: form.querySelector('#content').innerHTML
      };
      const res = await send({ type: 'ADD_NOTE', item });
      if (res && res.ok) {
        alert('Note added successfully!');
        window.renderUnlockedUI();
      } else alert('Failed to add note.');
    });
}

function renderChangePasswordUI() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="container full-screen">
        <div class="header">
            <button id="back-btn" class="back-button">← Back</button>
            <h3>Change Master Password</h3>
        </div>
        <form id="change-password-form" class="change-password-form">
            <label for="current-password">Current Password</label>
            <input type="password" id="current-password" required />

            <label for="new-password">New Password</label>
            <input type="password" id="new-password" required />

            <label for="confirm-password">Confirm New Password</label>
            <input type="password" id="confirm-password" required />

            <button type="submit" class="save-button">Save Changes</button>
        </form>
    </div>
  `;

  document
    .getElementById('back-btn')
    .addEventListener('click', () => window.renderUnlockedUI());

  document
    .getElementById('change-password-form')
    .addEventListener('submit', async (e) => {
      e.preventDefault();
      const oldMaster = document.getElementById('current-password').value;
      const newMaster = document.getElementById('new-password').value;
      const confirmMaster = document.getElementById('confirm-password').value;

      if (newMaster !== confirmMaster) {
        alert('New passwords do not match.');
        return;
      }

      const res = await send({
        type: 'CHANGE_MASTER_PASSWORD',
        oldMaster,
        newMaster
      });
      if (res.ok) {
        alert('Master password changed successfully!');
        window.renderUnlockedUI();
      } else alert(res.error);
    });
}

export {
  renderFirstRunUI,
  renderLockedUI,
  renderAddLoginUI,
  renderAddNoteUI,
  renderChangePasswordUI
};
