import * as idbKeyval from "idb-keyval";
import * as nanoId from "nanoid";
import cryptoHelper from "./crypto-helper.js";

class StateManager {
  constructor() {
    this.MEK = null;
    this.vaultCache = null;
  }

  async setMaster(master) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    this.MEK = await cryptoHelper.deriveKeyPBKDF2(master, salt);
    const verifier = await cryptoHelper.hmacVerify(this.MEK, "verify");
    this.vaultCache = {
      kdf: { salt: btoa(String.fromCharCode(...salt)), iter: 200000 },
      verifier: btoa(String.fromCharCode(...new Uint8Array(verifier))),
      items: [],
    };
    await idbKeyval.set("vault", this.vaultCache);
    return { ok: true };
  }

  async unlock(master) {
    const vault = await idbKeyval.get("vault");
    if (!vault) return { ok: false };
    const salt = Uint8Array.from(atob(vault.kdf.salt), (c) => c.charCodeAt(0));
    const key = await cryptoHelper.deriveKeyPBKDF2(
      master,
      salt,
      vault.kdf.iter
    );
    const v2 = await cryptoHelper.hmacVerify(key, "verify");
    const v2_b64 = btoa(String.fromCharCode(...new Uint8Array(v2)));
    if (v2_b64 === vault.verifier) {
      this.MEK = key;
      this.vaultCache = vault;
      return { ok: true };
    } else {
      return { ok: false };
    }
  }

  async addLogin(item) {
    if (!this.MEK || !this.vaultCache) return { ok: false };
    const { domain, title, u, p } = item;
    const { iv, ciphertext } = await cryptoHelper.aesGcmEncrypt(this.MEK, {
      u,
      p,
    });
    const newItem = { id: nanoId.nanoid(), title, domain, iv, ciphertext };
    this.vaultCache.items.push(newItem);
    await idbKeyval.set("vault", this.vaultCache);
    return { ok: true };
  }

  async match(domain) {
    if (!this.MEK || !this.vaultCache) return null;
    const matches = this.vaultCache.items.filter((it) => it.domain === domain);
    if (matches.length === 1) {
      const data = await cryptoHelper.aesGcmDecrypt(
        this.MEK,
        matches[0].iv,
        matches[0].ciphertext
      );
      return data;
    } else {
      return null;
    }
  }

  lock() {
    this.MEK = null;
    this.vaultCache = null;
    return { ok: true };
  }
}

export { StateManager };
