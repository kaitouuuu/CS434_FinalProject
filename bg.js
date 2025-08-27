import { StateManager } from "./state-manager.js";
import { getMEK } from "./mek-store.js";
const stateManager = new StateManager();

async function resetAutoLock() {
  const result = await stateManager.getTimeoutLock();
  const minutes = parseInt(result.timeout) || 5;

  await chrome.alarms.clear('autoLock');

  chrome.alarms.create('autoLock', {
    delayInMinutes: minutes
  });
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'autoLock') {
    await stateManager.lock();
  }
});


async function handleSetMaster(msg, sendResponse) {
  const result = await stateManager.setMaster(msg.master);
  if (result.ok) resetAutoLock();
  sendResponse({ ok: !!result.ok });
}

async function handleUnlock(msg, sendResponse) {
  const result = await stateManager.unlock(msg.master);
  if (result.ok) resetAutoLock();
  sendResponse({ ok: !!result.ok });
}

async function handleAddLogin(msg, sendResponse) {
  const result = await stateManager.addLogin(msg.item);
  if (result.ok) resetAutoLock();
  sendResponse({ ok: !!result.ok });
}

async function handleMatch(msg, sendResponse) {
  const items = await stateManager.match(msg.domain);
  // Should return array of decrypted items or null
  sendResponse(Array.isArray(items) ? items : []);
}

async function handleLock(msg, sendResponse) {
  await chrome.alarms.clear("autoLock");
  const result = await stateManager.lock();
  sendResponse({ ok: !!result.ok });
}

async function handleGetLockState(msg, sendResponse) {
  const locked = (await stateManager.getLockState()).locked;
  sendResponse({ ok: !!locked });
}

async function handleGetVault(msg, sendResponse) {
  const vault = await stateManager.getVault();
  if (!vault) return sendResponse([]);
  // Only return decrypted items if unlocked
  const MEK = await getMEK();
  if (!MEK || !stateManager.vaultCache) return sendResponse([]);
  const items = await Promise.all(
    vault.items.map(async (item) => {
      try {
        const data = await stateManager.decryptItem(item);
        return {
          id: item.id,
          title: item.title,
          domain: item.domain,
          username: data.u,
        };
      } catch {
        return null;
      }
    })
  );
  sendResponse(items.filter(Boolean));
}

async function handleGetItem(msg, sendResponse) {
  const MEK = await getMEK();
  if (!MEK || !stateManager.vaultCache) return sendResponse({ ok: false });
  const item = stateManager.getItem(msg.id);
  if (!item) return sendResponse({ ok: false });
  stateManager
    .decryptItem(item)
    .then((data) => {
      sendResponse({
        ok: true,
        item: {
          id: item.id,
          title: item.title,
          domain: item.domain,
          username: data.u,
          password: data.p,
        },
      });
    })
    .catch(() => sendResponse({ ok: false }));
}

async function handleSetItem(msg, sendResponse) {
  const MEK = await getMEK();
  if (!MEK || !stateManager.vaultCache) return sendResponse({ ok: false });
  const result = await stateManager.setItem(msg.item.id, msg.item);
  if (result.ok) resetAutoLock();
  sendResponse({ ok: !!result.ok });
}

async function handleDeleteItem(msg, sendResponse) {
  const MEK = await getMEK();
  if (!MEK || !stateManager.vaultCache) return sendResponse({ ok: false });
  const result = await stateManager.deleteItem(msg.id);
  if (result.ok) resetAutoLock();
  sendResponse({ ok: !!result.ok });
}

function handleGeneratePassword(msg, sendResponse) {
  // msg.options: { length, uppercase, lowercase, digits, special, avoidSimilar, requireEachSelected }
  const password = stateManager.generatePassword(msg.options || {});
  sendResponse({ password });
}

async function handleChangeMasterPassword(msg, sendResponse) {
  // msg.oldMaster, msg.newMaster
  const result = await stateManager.changeMasterPassword(
    msg.oldMaster,
    msg.newMaster
  );
  sendResponse(result);
}

async function handleGetAutofillSetting(msg, sendResponse) {
  const result = await stateManager.getAutofillSetting();
  sendResponse(result);
}

async function handleToggleAutofillSetting(msg, sendResponse) {
  const result = await stateManager.toggleAutofillSetting();
  sendResponse(result);
}

async function handleGetTimeoutLock(msg, sendResponse) {
  const result = await stateManager.getTimeoutLock();
  sendResponse(result);
}

async function handleSetTimeoutLock(msg, sendResponse) {
  const result = await stateManager.setTimeoutLock(msg.timeout);
  if (result.ok) resetAutoLock();
  sendResponse(result);
}

async function handleGetAllNote(msg, sendResponse) {
  const MEK = await getMEK();
  if (!MEK) return sendResponse([]);
  const notes = await stateManager.getAllNotes();
  sendResponse(notes);
}

async function handleGetNote(msg, sendResponse) {
  const MEK = await getMEK();
  if (!MEK) return sendResponse({ ok: false });
  const result = await stateManager.getNote(msg.id);
  sendResponse(result);
}

async function handleSetNote(msg, sendResponse) {
  const MEK = await getMEK();
  if (!MEK) return sendResponse({ ok: false });
  const result = await stateManager.setNote(msg.item);
  sendResponse(result);
}

async function handleDeleteNote(msg, sendResponse) {
  const MEK = await getMEK();
  if (!MEK) return sendResponse({ ok: false });
  const result = await stateManager.deleteNote(msg.id);
  sendResponse(result);
}

async function handleAddNote(msg, sendResponse) {
  const MEK = await getMEK();
  if (!MEK) return sendResponse({ ok: false });
  const result = await stateManager.addNote(msg.item);
  sendResponse(result);
}

async function handleCheckNewLogin(msg, sendResponse) {
  const MEK = await getMEK();
  if (!MEK || !stateManager.vaultCache) return sendResponse({ msg: "NEW" });
  const result = await stateManager.checkNewLogin(
    msg.domain,
    msg.username,
    msg.password
  );
  sendResponse(result);
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  switch (msg.type) {
    case "SET_MASTER":
      handleSetMaster(msg, sendResponse);
      break;
    case "UNLOCK":
      handleUnlock(msg, sendResponse);
      break;
    case "ADD_LOGIN":
      handleAddLogin(msg, sendResponse);
      break;
    case "MATCH":
      handleMatch(msg, sendResponse);
      break;
    case "LOCK":
      handleLock(msg, sendResponse);
      break;
    case "GET_LOCK_STATE":
      handleGetLockState(msg, sendResponse);
      break;
    case "GET_VAULT":
      handleGetVault(msg, sendResponse);
      break;
    case "GET_ITEM":
      handleGetItem(msg, sendResponse);
      break;
    case "SET_ITEM":
      handleSetItem(msg, sendResponse);
      break;
    case "DELETE_ITEM":
      handleDeleteItem(msg, sendResponse);
      break;
    case "GENERATE_PASSWORD":
      handleGeneratePassword(msg, sendResponse);
      break;
    case "CHANGE_MASTER_PASSWORD":
      handleChangeMasterPassword(msg, sendResponse);
      break;
    case "GET_AUTOFILL_SETTING":
      handleGetAutofillSetting(msg, sendResponse);
      break;
    case "TOGGLE_AUTOFILL_SETTING":
      handleToggleAutofillSetting(msg, sendResponse);
      break;
    case "GET_TIMEOUT_LOCK":
      handleGetTimeoutLock(msg, sendResponse);
      break;
    case "SET_TIMEOUT_LOCK":
      handleSetTimeoutLock(msg, sendResponse);
      break;
    case "GET_ALL_NOTE":
      handleGetAllNote(msg, sendResponse);
      break;
    case "GET_NOTE":
      handleGetNote(msg, sendResponse);
      break;
    case "SET_NOTE":
      handleSetNote(msg, sendResponse);
      break;
    case "DELETE_NOTE":
      handleDeleteNote(msg, sendResponse);
      break;
    case "ADD_NOTE":
      handleAddNote(msg, sendResponse);
      break;
    case "CHECK_NEW_LOGIN":
      handleCheckNewLogin(msg, sendResponse);
      break;
    default:
      sendResponse(null);
  }
  return true; // keep channel alive
});
