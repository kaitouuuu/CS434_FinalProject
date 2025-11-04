import { send, queryTabs } from './messaging.js';
import { parse } from 'tldts';
import { registerUI, loginUI } from './UI/lock/authentication-ui.js';
import { addNoteUI } from './UI/add-ui.js';
import { setHostname } from './state.js';
import { set } from 'idb-keyval';
function renderFirstRunUI() {
  const app = document.getElementById('app');
  app.innerHTML = registerUI;

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
  app.innerHTML = loginUI;

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
  <style>
  /* --- Add Login Screen Container --- */
.add-login-container {
  width: 340px;
  padding: 10px;
  margin: 10px 0;
  height: 440px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  border-radius: 16px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  animation: fadeIn 0.5s ease forwards;
  display: flex;
  flex-direction: column;
}

/* --- Header --- */
.add-login-container .header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.add-login-container .header h3 {
  margin: 0;
  font-size: 1.4em;
  color: #1e293b;
}

.add-login-container .back-button {
  background: transparent;
  border: none;
  color: #4f46e5;
  font-size: 1em;
  font-weight: 600;
  cursor: pointer;
  padding: 6px 10px;
  border-radius: 8px;
  transition: background 0.2s ease;
}

.add-login-container .back-button:hover {
  background: rgba(99, 102, 241, 0.1);
}

/* --- Form --- */
.add-login-container .add-login-form {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

/* Inputs (inherit same glass style as global) */
.add-login-container .add-login-form input[type="text"],
.add-login-container .add-login-form input[type="password"] {
  width: 100%;
  box-sizing: border-box;
  padding: 12px;
  margin: 8px 0 12px;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  font-size: 0.95em;
  outline: none;
  background-color: rgba(255, 255, 255, 0.9);
  transition: border 0.2s, box-shadow 0.2s;
}

.add-login-container .add-login-form input:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
}

/* Save button — consistent with global button style */
.add-login-container .save-button {
  margin-top: auto;
  width: 100%;
  padding: 12px;
  background: linear-gradient(90deg, #6366f1, #3b82f6);
  border: none;
  border-radius: 10px;
  color: white;
  font-size: 1em;
  font-weight: 600;
  letter-spacing: 0.3px;
  cursor: pointer;
  transition: all 0.25s ease;
}

.add-login-container .save-button:hover {
  background: linear-gradient(90deg, #4f46e5, #2563eb);
  animation: glow 0.4s alternate infinite;
}

.add-login-container .save-button:active {
  transform: scale(0.97);
}
</style>
<div class="add-login-container">
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

  app.innerHTML = addNoteUI;

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
