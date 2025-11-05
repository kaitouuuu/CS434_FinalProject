import { send } from './messaging.js';
import { renderBySelection } from './UI/vault-manager.js';
import {
  renderAddNoteUI,
  renderAddLoginUI,
} from './ui-renderer.js';
import { renderChangePasswordUI } from './settings.js';
import { handleGeneratePassword } from './password-generator.js';
import {
  loadAutofillSetting,
  loadTimeoutLockSetting
} from './settings-manager.js';
import { globalState, setGlobalState } from './state.js';
function setupUnlockedUIEventListeners() {
  const optionMenu = document.querySelector('.select-menu'),
    selectBtn = optionMenu.querySelector('.select-btn'),
    options = optionMenu.querySelectorAll('.options .option'),
    sBtn_text = optionMenu.querySelector('.sBtn-text');

  selectBtn.addEventListener('click', () =>
    optionMenu.classList.toggle('active')
  );

  options.forEach((option) => {
    option.addEventListener('click', () => {
      let selectedOption = option.querySelector('.option-text').innerText;
      console.log('Selected option:', selectedOption);
      console.log(typeof selectedOption);
      setGlobalState(selectedOption);
      sBtn_text.innerText = selectedOption;
      optionMenu.classList.remove('active');

      renderBySelection(selectedOption);
    });
  });
  const addBtn = document.getElementById('add-btn');
  const dropdown = document.getElementById('dropdown');

  addBtn.addEventListener('click', () => {
    dropdown.style.display =
      dropdown.style.display === 'block' ? 'none' : 'block';
  });
  document
    .getElementById('note-btn')
    .addEventListener('click', () => renderAddNoteUI());

  document
    .getElementById('add-login-btn')
    .addEventListener('click', () => renderAddLoginUI());

  document.getElementById('lock-btn').addEventListener('click', async () => {
    const r = await send({ type: 'LOCK' });
    if (r.ok) window.init();
  });

  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      document
        .querySelectorAll('.screen')
        .forEach((s) => (s.style.display = 'none'));
      document
        .querySelectorAll('.tab-btn')
        .forEach((t) => t.classList.remove('active'));
      document.getElementById(btn.dataset.screen).style.display = 'block';
      btn.classList.add('active');

      if (btn.dataset.screen === 'screen-settings') {
        await loadAutofillSetting();
        await loadTimeoutLockSetting();
      }
    });
  });
  document.addEventListener('DOMContentLoaded', () => {
    renderBySelection(globalState);
  });
  document
    .getElementById('generate-btn')
    .addEventListener('click', async () => handleGeneratePassword());

  document
    .getElementById('copy-password-btn')
    .addEventListener('click', (e) => {
      const passwordInput = document.getElementById('generated-password');
      const password = passwordInput.value;

      if (password) {
        navigator.clipboard
          .writeText(password)
          .then(() => {
            e.target.textContent = 'Copied!';
            setTimeout(() => (e.target.textContent = 'Copy'), 1500);
          })
          .catch((err) => {
            console.error('Failed to copy: ', err);
            alert('Failed to copy to clipboard.');
          });
      }
    });

  document
    .getElementById('change-password-btn')
    .addEventListener('click', renderChangePasswordUI);
  document
    .getElementById('add-login-btn')
    .addEventListener('click', renderAddLoginUI);

  document
    .getElementById('autofill-setting')
    .addEventListener('change', async (e) => {
      const res = await send({ type: 'TOGGLE_AUTOFILL_SETTING' });
      if (!res || !res.ok) {
        e.target.checked = !e.target.checked;
        alert('Failed to update autofill setting.');
      }
    });

  document
    .getElementById('timeout-lock')
    .addEventListener('change', async (e) => {
      const res = await send({
        type: 'SET_TIMEOUT_LOCK',
        timeout: e.target.value
      });
      if (!res || !res.ok) {
        e.target.value = 5;
        alert('Failed to update timeout lock setting.');
      }
    });
}

export { setupUnlockedUIEventListeners };
