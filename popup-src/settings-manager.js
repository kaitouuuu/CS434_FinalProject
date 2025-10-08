import { send } from './messaging.js';

async function loadAutofillSetting() {
  const res = await send({ type: 'GET_AUTOFILL_SETTING' });
  if (res && res.ok)
    document.getElementById('autofill-setting').checked = res.ok;
}

async function loadTimeoutLockSetting() {
  const res = await send({ type: 'GET_TIMEOUT_LOCK' });
  if (res && res.ok)
    document.getElementById('timeout-lock').value = res.timeout || 5;
}

export { loadAutofillSetting, loadTimeoutLockSetting };
