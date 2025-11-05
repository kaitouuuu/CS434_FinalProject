import { send, queryTabs } from './messaging.js';
import { parse } from 'tldts';

function renderFirstRunUI() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="container" style="max-width:400px; margin:auto; font-family:sans-serif;">
      <h3>Welcome!</h3>
      <p>Create a Master Password to secure your vault.</p>
      <form id="setup-form">
        <input type="password" id="m1" placeholder="Master Password" required style="width:100%; padding:8px; margin:5px 0;" />
        <div id="checklist" style="font-size:0.9em; margin-bottom:10px;">
          <div id="len" style="color:red;">❌ At least 8 characters</div>
          <div id="upper" style="color:red;">❌ Has uppercase letter</div>
          <div id="special" style="color:red;">❌ Has special character</div>
        </div>
        <input type="password" id="m2" placeholder="Confirm Password" required style="width:100%; padding:8px; margin:5px 0;" />
        <div id="match" style="font-size:0.9em; color:red; height:18px;"></div>
        <button type="submit" style="width:100%; padding:10px; margin-top:10px;">Create Vault</button>
      </form>
    </div>
  `;

  const m1 = document.getElementById('m1');
  const m2 = document.getElementById('m2');
  const len = document.getElementById('len');
  const upper = document.getElementById('upper');
  const special = document.getElementById('special');
  const match = document.getElementById('match');

  function updateChecklist() {
    const val = m1.value;

    // Length check
    if (val.length >= 8) {
      len.style.color = 'green';
      len.textContent = '✔ At least 8 characters';
    } else {
      len.style.color = 'red';
      len.textContent = '❌ At least 8 characters';
    }

    // Uppercase check
    if (/[A-Z]/.test(val)) {
      upper.style.color = 'green';
      upper.textContent = '✔ Has uppercase letter';
    } else {
      upper.style.color = 'red';
      upper.textContent = '❌ Has uppercase letter';
    }

    // Special character check
    if (/[!@#$%^&*(),.?":{}|<>]/.test(val)) {
      special.style.color = 'green';
      special.textContent = '✔ Has special character';
    } else {
      special.style.color = 'red';
      special.textContent = '❌ Has special character';
    }

    updateMatch();
  }

  function updateMatch() {
    if (m2.value === '') {
      match.textContent = '';
      return;
    }
    if (m1.value === m2.value) {
      match.style.color = 'green';
      match.textContent = '✔ Passwords match';
    } else {
      match.style.color = 'red';
      match.textContent = '❌ Passwords do not match';
    }
  }

  m1.addEventListener('input', updateChecklist);
  m2.addEventListener('input', updateMatch);

  document.getElementById('setup-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const val = m1.value;
    const confirm = m2.value;

    const valid =
      val.length >= 8 &&
      /[A-Z]/.test(val) &&
      /[!@#$%^&*(),.?":{}|<>]/.test(val);

    if (!valid) {
      alert('Password does not meet all requirements.');
      return;
    }

    if (val !== confirm) {
      alert('Passwords do not match!');
      return;
    }

    console.log('Creating vault with provided master password');
    const res = await send({ type: 'SET_MASTER', master: val });
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

export {
  renderFirstRunUI,
  renderLockedUI,
  renderAddLoginUI,
  renderAddNoteUI,
};
