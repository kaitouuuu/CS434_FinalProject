importScripts("vendor/idb-keyval.min.js", "vendor/nanoid.min.js");

let MEK = null;
let vaultCache = null;

async function deriveKeyPBKDF2(master, salt, iter = 200000) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(master),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: iter, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function hmacVerify(key, text) {
  const raw = await crypto.subtle.exportKey("raw", key);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    raw,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    new TextEncoder().encode(text)
  );
  return sig;
}

async function aesGcmEncrypt(key, data) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder().encode(JSON.stringify(data));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc);
  return {
    iv: btoa(String.fromCharCode(...iv)),
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(ct))),
  };
}

async function aesGcmDecrypt(key, iv_b64, ct_b64) {
  const iv = Uint8Array.from(atob(iv_b64), (c) => c.charCodeAt(0));
  const ct = Uint8Array.from(atob(ct_b64), (c) => c.charCodeAt(0));
  const dec = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
  return JSON.parse(new TextDecoder().decode(dec));
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    if (msg.type === "SET_MASTER") {
      const salt = crypto.getRandomValues(new Uint8Array(16));
      MEK = await deriveKeyPBKDF2(msg.master, salt);
      const verifier = await hmacVerify(MEK, "verify");
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
      const key = await deriveKeyPBKDF2(msg.master, salt, vault.kdf.iter);
      const v2 = await hmacVerify(key, "verify");
      const v2_b64 = btoa(String.fromCharCode(...new Uint8Array(v2)));
      if (v2_b64 === vault.verifier) {
        MEK = key;
        vaultCache = vault;
        sendResponse({ ok: true });
      } else sendResponse({ ok: false });
    } else if (msg.type === "ADD_LOGIN") {
      if (!MEK || !vaultCache) return sendResponse({ ok: false });
      const { domain, title, u, p } = msg.item;
      const { iv, ciphertext } = await aesGcmEncrypt(MEK, { u, p });
      const item = { id: nanoid(), title, domain, iv, ciphertext };
      vaultCache.items.push(item);
      await idbKeyval.set("vault", vaultCache);
      sendResponse({ ok: true });
    } else if (msg.type === "MATCH") {
      if (!MEK || !vaultCache) return sendResponse(null);
      const matches = vaultCache.items.filter((it) => it.domain === msg.domain);
      if (matches.length === 1) {
        const data = await aesGcmDecrypt(
          MEK,
          matches[0].iv,
          matches[0].ciphertext
        );
        sendResponse(data);
      } else {
        sendResponse(null);
      }
    }
  })();
  return true; // keep channel alive
});
