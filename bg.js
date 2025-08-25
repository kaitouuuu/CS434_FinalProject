import { StateManager } from "./state-manager.js";
const stateManager = new StateManager();

let autoLockTimer = null;
const AUTO_LOCK_MS = 5 * 60 * 1000; // 5 minutes

function resetAutoLock() {
  if (autoLockTimer) clearTimeout(autoLockTimer);
  autoLockTimer = setTimeout(() => {
    stateManager.lock();
  }, AUTO_LOCK_MS);
}

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

function handleLock(msg, sendResponse) {
  if (autoLockTimer) clearTimeout(autoLockTimer);
  const result = stateManager.lock();
  sendResponse({ ok: !!result.ok });
}

function handleGetLockState(msg, sendResponse) {
  const locked = stateManager.getLockState().locked;
  sendResponse({ ok: !!locked });
}

async function handleGetVault(msg, sendResponse) {
  const vault = await stateManager.getVault();
  if (!vault) return sendResponse([]);
  // Only return decrypted items if unlocked
  if (!stateManager.MEK || !stateManager.vaultCache) return sendResponse([]);
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

function handleGetItem(msg, sendResponse) {
  if (!stateManager.MEK || !stateManager.vaultCache)
    return sendResponse({ ok: false });
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
  if (!stateManager.MEK || !stateManager.vaultCache)
    return sendResponse({ ok: false });
  const result = await stateManager.setItem(msg.item.id, msg.item);
  if (result.ok) resetAutoLock();
  sendResponse({ ok: !!result.ok });
}

async function handleDeleteItem(msg, sendResponse) {
  if (!stateManager.MEK || !stateManager.vaultCache)
    return sendResponse({ ok: false });
  const result = await stateManager.deleteItem(msg.id);
  if (result.ok) resetAutoLock();
  sendResponse({ ok: !!result.ok });
}

function handleGeneratePassword(msg, sendResponse) {
  // msg.options: { length, lowercase, special }
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
    default:
      sendResponse(null);
  }
  return true; // keep channel alive
});
