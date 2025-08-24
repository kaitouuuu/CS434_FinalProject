import * as idbKeyval from 'idb-keyval';
import * as nanoId from 'nanoid';
import cryptoHelper from './crypto-helper.js';

let MEK = null;
let vaultCache = null;

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    if (msg.type === "SET_MASTER") {
      const salt = crypto.getRandomValues(new Uint8Array(16));
            MEK = await cryptoHelper.deriveKeyPBKDF2(msg.master, salt);
            const verifier = await cryptoHelper.hmacVerify(MEK, "verify");
      vaultCache = {
        kdf: { salt: btoa(String.fromCharCode(...salt)), iter: 200000 },
        verifier: btoa(String.fromCharCode(...new Uint8Array(verifier))),
        items: [],
      };
      await idbKeyval.set("vault", vaultCache);
      sendResponse({ ok: true });
    } else if (msg.type === "UNLOCK") {
      const vault = await idbKeyval.get("vault");
      if (!vault) return sendResponse({ ok: false });
      const salt = Uint8Array.from(atob(vault.kdf.salt), (c) =>
        c.charCodeAt(0)
      );
            const key = await cryptoHelper.deriveKeyPBKDF2(msg.master, salt, vault.kdf.iter);
            const v2 = await cryptoHelper.hmacVerify(key, "verify");
      const v2_b64 = btoa(String.fromCharCode(...new Uint8Array(v2)));
      if (v2_b64 === vault.verifier) {
        MEK = key;
        vaultCache = vault;
        sendResponse({ ok: true });
      } else sendResponse({ ok: false });
    } else if (msg.type === "ADD_LOGIN") {
      if (!MEK || !vaultCache) return sendResponse({ ok: false });
      const { domain, title, u, p } = msg.item;
            const { iv, ciphertext } = await cryptoHelper.aesGcmEncrypt(MEK, { u, p });
      const item = { id: nanoId.nanoid(), title, domain, iv, ciphertext };
      vaultCache.items.push(item);
      await idbKeyval.set("vault", vaultCache);
      sendResponse({ ok: true });
    } else if (msg.type === "MATCH") {
      if (!MEK || !vaultCache) return sendResponse(null);
      const matches = vaultCache.items.filter((it) => it.domain === msg.domain);
      if (matches.length === 1) {
                const data = await cryptoHelper.aesGcmDecrypt(
          MEK,
          matches[0].iv,
          matches[0].ciphertext
        );
        sendResponse(data);
      } else {
        sendResponse(null);
      }
    } else if (msg.type === "LOCK") {
      MEK = null;
      vaultCache = null;
      sendResponse({ ok: true });
    }
  })();
  return true; // keep channel alive
});
