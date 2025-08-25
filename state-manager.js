import * as idbKeyval from "idb-keyval";
import * as nanoId from "nanoid";
import cryptoHelper from "./crypto-helper.js";

class StateManager {
  constructor() {
    this.MEK = null;
    this.vaultCache = null;
  }

  async decryptItem(item) {
    if (!this.MEK) throw new Error("Locked");
    const data = await cryptoHelper.aesGcmDecrypt(
      this.MEK,
      item.iv,
      item.ciphertext
    );
    return data;
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
    const { domain, title, username, password } = item;
    const { iv, ciphertext } = await cryptoHelper.aesGcmEncrypt(this.MEK, {
      u: username,
      p: password,
    });
    const newItem = { id: nanoId.nanoid(), title, domain, iv, ciphertext };
    this.vaultCache.items.push(newItem);
    await idbKeyval.set("vault", this.vaultCache);
    return { ok: true };
  }

  async match(domain) {
    if (!this.MEK || !this.vaultCache) return null;
    const matches = this.vaultCache.items.filter((it) => it.domain === domain);
    if (!matches.length) return [];
    const result = await Promise.all(
      matches.map(async (item) => {
        try {
          const data = await cryptoHelper.aesGcmDecrypt(
            this.MEK,
            item.iv,
            item.ciphertext
          );
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
    return result.filter(Boolean);
  }

  lock() {
    this.MEK = null;
    this.vaultCache = null;
    return { ok: true };
  }

  getLockState() {
    return { locked: !this.MEK };
  }

  async getVault() {
    const vault = await idbKeyval.get("vault");
    return vault || null;
  }

  getItem(id) {
    if (!this.vaultCache) return null;
    return this.vaultCache.items.find((item) => item.id === id) || null;
  }

  async setItem(id, newData) {
    if (!this.vaultCache) return { ok: false };
    const idx = this.vaultCache.items.findIndex((item) => item.id === id);
    if (idx === -1) return { ok: false };
    let updated = { ...this.vaultCache.items[idx] };
    if (newData.username !== undefined && newData.password !== undefined) {
      const { iv, ciphertext } = await cryptoHelper.aesGcmEncrypt(this.MEK, {
        u: newData.username,
        p: newData.password,
      });
      updated = { ...updated, iv, ciphertext };
    }
    updated = { ...updated, ...newData };
    this.vaultCache.items[idx] = updated;
    await idbKeyval.set("vault", this.vaultCache);
    return { ok: true };
  }

  async deleteItem(id) {
    if (!this.vaultCache) return { ok: false };
    const newItems = this.vaultCache.items.filter((item) => item.id !== id);
    if (newItems.length === this.vaultCache.items.length) return { ok: false };
    this.vaultCache.items = newItems;
    await idbKeyval.set("vault", this.vaultCache);
    return { ok: true };
  }

  generatePassword({ length = 12, lowercase = false, special = false } = {}) {
    const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lower = "abcdefghijklmnopqrstuvwxyz";
    const digits = "0123456789";
    const specials = "!@#$%^&*()-_=+[]{}|;:,.<>?";
    let chars = upper + digits;
    let required = [];
    if (lowercase) {
      chars += lower;
      required.push(lower[Math.floor(Math.random() * lower.length)]);
    }
    if (special) {
      chars += specials;
      required.push(specials[Math.floor(Math.random() * specials.length)]);
    }

    let passwordArr = [];
    for (let i = 0; i < length - required.length; i++) {
      const idx = Math.floor(Math.random() * chars.length);
      passwordArr.push(chars[idx]);
    }

    passwordArr = passwordArr.concat(required);
    for (let i = passwordArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [passwordArr[i], passwordArr[j]] = [passwordArr[j], passwordArr[i]];
    }
    return passwordArr.join("");
  }

  async changeMasterPassword(oldMaster, newMaster) {
    const vault = await idbKeyval.get("vault");
    if (!vault) return { ok: false, error: "No vault" };
    const salt = Uint8Array.from(atob(vault.kdf.salt), (c) => c.charCodeAt(0));
    const key = await cryptoHelper.deriveKeyPBKDF2(
      oldMaster,
      salt,
      vault.kdf.iter
    );
    const v2 = await cryptoHelper.hmacVerify(key, "verify");
    const v2_b64 = btoa(String.fromCharCode(...new Uint8Array(v2)));
    if (v2_b64 !== vault.verifier)
      return { ok: false, error: "Old master incorrect" };

    const newSalt = crypto.getRandomValues(new Uint8Array(16));
    const newKey = await cryptoHelper.deriveKeyPBKDF2(
      newMaster,
      newSalt,
      vault.kdf.iter
    );
    const newVerifier = await cryptoHelper.hmacVerify(newKey, "verify");
    vault.kdf.salt = btoa(String.fromCharCode(...newSalt));
    vault.verifier = btoa(String.fromCharCode(...new Uint8Array(newVerifier)));
    await idbKeyval.set("vault", vault);
    this.MEK = newKey;
    this.vaultCache = vault;

    return { ok: true };
  }
}

export { StateManager };
