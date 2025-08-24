import * as idbKeyval from 'idb-keyval';

async function send(msg) {
  return new Promise((res) => chrome.runtime.sendMessage(msg, res));
}

async function init() {
  const vault = await idbKeyval.get('vault');
  const app = document.getElementById('app');
  app.innerHTML = '';

  if (!vault) {
    // First run
    const form = document.createElement('form');
    form.innerHTML = `
      <input type=password placeholder="Master" id=m1 required>
      <input type=password placeholder="Repeat" id=m2 required>
      <button>Set Master</button>
    `;
    form.onsubmit = async (e) => {
      e.preventDefault();
      const m1 = form.m1.value,
        m2 = form.m2.value;
      if (m1 !== m2) return alert('Not match');
      const r = await send({ type: 'SET_MASTER', master: m1 });
      if (r.ok) init();
    };
    app.append(form);
    return;
  }

  // Already have vault, need unlock
  const form = document.createElement('form');
  form.innerHTML = `
    <input type=password placeholder="Master" id=mu required>
    <button>Unlock</button>
  `;
  form.onsubmit = async (e) => {
    e.preventDefault();
    const r = await send({ type: 'UNLOCK', master: form.mu.value });
    if (r.ok) showUnlocked();
    else alert('Wrong master');
  };
  app.append(form);
}

function showUnlocked() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <p>Welcome to my app</p>
  `;
}

init();
