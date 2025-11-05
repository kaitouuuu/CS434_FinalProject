import * as idbKeyval from 'idb-keyval';
import '../popup.css';
import { send } from './messaging.js';
import { renderFirstRunUI, renderLockedUI } from './ui-renderer.js';
import { renderBySelection } from './UI/vault-manager.js';
import { setupUnlockedUIEventListeners } from './event-handlers.js';
import { globalState } from './state.js';

// *** 1. IMPORT THE HTML FILE AS A STRING ***
import unlockedHtml from './UI/unlocked-ui.html';

let lockState = (await send({ type: 'GET_LOCK_STATE' })).ok;
setInterval(async () => {
  const newLockState = (await send({ type: 'GET_LOCK_STATE' })).ok;
  if (!lockState && newLockState) renderLockedUI();
  lockState = newLockState;
}, 1000);

async function init() {
  const app = document.getElementById('app');
  app.innerHTML = '<p>Loading...</p>';

  const vault = await idbKeyval.get('vault');

  if (!vault) renderFirstRunUI();
  else {
    const state = await send({ type: 'GET_LOCK_STATE' });
    if (!state.ok) renderUnlockedUI();
    else renderLockedUI();
  }
}

// *** 2. UPDATED FUNCTION ***
function renderUnlockedUI() {
  const app = document.getElementById('app');

  // Set the innerHTML from the imported file
  app.innerHTML = unlockedHtml;

  // Now, manually set the dynamic value that was a template literal
  const sBtnText = app.querySelector('.sBtn-text');
  if (sBtnText) {
    sBtnText.textContent = globalState;
  }

  // Run the rest of your setup logic
  setupUnlockedUIEventListeners();
  renderBySelection(globalState);
}

window.init = init;
window.renderUnlockedUI = renderUnlockedUI;

init();