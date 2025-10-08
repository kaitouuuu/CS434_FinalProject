const SESSION_KEY = '__MEK__';

function bufToB64(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}
function b64ToBuf(b64) {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

export async function setMEK(mek) {
  if (!(mek instanceof CryptoKey))
    throw new TypeError('setMEK: expected CryptoKey');

  const raw = await crypto.subtle.exportKey('raw', mek);
  const b64 = bufToB64(raw);
  await chrome.storage.session.set({ [SESSION_KEY]: b64 });
}

export async function getMEK() {
  const obj = await chrome.storage.session.get(SESSION_KEY);
  const b64 = obj?.[SESSION_KEY];
  if (!b64) return null;

  const raw = b64ToBuf(b64);
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, true, [
    'encrypt',
    'decrypt'
  ]);
}

export async function clearMEK() {
  await chrome.storage.session.remove(SESSION_KEY);
}
