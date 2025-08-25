import { StateManager } from "./state-manager.js";
const stateManager = new StateManager();

async function handleSetMaster(msg, sendResponse) {
  const result = await stateManager.setMaster(msg.master);
  sendResponse(result);
}

async function handleUnlock(msg, sendResponse) {
  const result = await stateManager.unlock(msg.master);
  sendResponse(result);
}

async function handleAddLogin(msg, sendResponse) {
  const result = await stateManager.addLogin(msg.item);
  sendResponse(result);
}

async function handleMatch(msg, sendResponse) {
  const result = await stateManager.match(msg.domain);
  sendResponse(result);
}

function handleLock(msg, sendResponse) {
  const result = stateManager.lock();
  sendResponse(result);
}

function handleGetLockState(msg, sendResponse) {
  const result = stateManager.getLockState();
  sendResponse(result);
}

async function handleGetVault(msg, sendResponse) {
  const result = await stateManager.getVault();
  sendResponse(result);
}

function handleGetItem(msg, sendResponse) {
  const result = stateManager.getItem(msg.id);
  sendResponse(result);
}

async function handleSetItem(msg, sendResponse) {
  const result = await stateManager.setItem(msg.id, msg.newData);
  sendResponse(result);
}

async function handleDeleteItem(msg, sendResponse) {
  const result = await stateManager.deleteItem(msg.id);
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
    default:
      sendResponse(null);
  }
  return true; // keep channel alive
});
