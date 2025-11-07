import * as idbKeyval from "idb-keyval";
import * as nanoId from "nanoid";
import cryptoHelper from "./crypto-helper.js";
import * as tldts from "tldts";
import { setMEK, getMEK, clearMEK } from "./mek-store.js";

class StateManager {
  constructor() {
    this.vaultCache = null;
    this.notesCache = null;
  }

  async getVaultCache() {
    if (!this.vaultCache) this.vaultCache = await idbKeyval.get("vault");
    return this.vaultCache;
  }

  async getNotesCache() {
    if (!this.notesCache) this.notesCache = await idbKeyval.get("notes");
    return this.notesCache;
  }

  async decryptItem(item) {
    const MEK = await getMEK();
    if (!MEK) throw new Error("Locked");
    const data = await cryptoHelper.aesGcmDecrypt(
      MEK,
      item.iv,
      item.ciphertext
    );
    return data;
  }

  async setMaster(master) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const MEK = await cryptoHelper.deriveKeyPBKDF2(master, salt);
    const verifier = await cryptoHelper.hmacVerify(MEK, "verify");
    this.vaultCache = {
      kdf: { salt: btoa(String.fromCharCode(...salt)), iter: 200000 },
      verifier: btoa(String.fromCharCode(...new Uint8Array(verifier))),
      items: [],
    };
    this.notesCache = [];
    await idbKeyval.set("vault", this.vaultCache);
    await idbKeyval.set("notes", this.notesCache);
    await idbKeyval.set("autofillSetting", true);
    await idbKeyval.set("timeoutLock", 5);
    await setMEK(MEK);
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
      await setMEK(key);
      this.vaultCache = vault;
      this.notesCache = (await idbKeyval.get("notes")) || [];
      return { ok: true };
    } else {
      return { ok: false };
    }
  }

  async addLogin(item) {
    const MEK = await getMEK();
    if (!MEK || !this.vaultCache) return { ok: false };
    const { domain, title, username, password } = item;
    const { iv, ciphertext } = await cryptoHelper.aesGcmEncrypt(MEK, {
      u: username,
      p: password,
    });
    const dateAdded = new Date().toISOString();
    const newItem = {
      id: nanoId.nanoid(),
      title,
      domain,
      iv,
      ciphertext,
      dateAdded,
    };
    this.vaultCache.items.push(newItem);
    await idbKeyval.set("vault", this.vaultCache);
    return { ok: true, dateAdded };
  }

  async match(domain) {
    const MEK = await getMEK();
    if (!MEK || !(await this.getVaultCache())) return null;
    const inputDomain = tldts.getDomain(domain);
    const matches = this.vaultCache.items.filter((it) => {
      const vaultDomain = tldts.getDomain(it.domain);
      return vaultDomain === inputDomain;
    });
    if (!matches.length) return [];
    const result = await Promise.all(
      matches.map(async (item) => {
        try {
          const data = await cryptoHelper.aesGcmDecrypt(
            MEK,
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

  async lock() {
    await clearMEK();
    this.vaultCache = null;
    return { ok: true };
  }

  async getLockState() {
    const MEK = await getMEK();
    return { locked: !MEK };
  }

  async getVault() {
    const vault = await this.getVaultCache();
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
      const MEK = await getMEK();
      const { iv, ciphertext } = await cryptoHelper.aesGcmEncrypt(MEK, {
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

  generatePassword({
    length = 12,
    uppercase = true,
    lowercase = true,
    digits = false,
    special = false,
    avoidSimilar = true,
    requireEachSelected = true,
  } = {}) {
    const { generatePassword } = require("./password-generator.js");
    return generatePassword({
      length,
      uppercase,
      lowercase,
      digits,
      special,
      avoidSimilar,
      requireEachSelected,
    });
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

    const newKeyTest = await cryptoHelper.deriveKeyPBKDF2(
      newMaster,
      salt,
      vault.kdf.iter
    );
    const newVerifierTest = await cryptoHelper.hmacVerify(newKeyTest, "verify");
    const newVerifierTest_b64 = btoa(
      String.fromCharCode(...new Uint8Array(newVerifierTest))
    );
    if (newVerifierTest_b64 === vault.verifier) {
      return {
        ok: false,
        error: "New master must be different from old master",
      };
    }

    const newSalt = crypto.getRandomValues(new Uint8Array(16));
    const newKey = await cryptoHelper.deriveKeyPBKDF2(
      newMaster,
      newSalt,
      vault.kdf.iter
    );
    const newVerifier = await cryptoHelper.hmacVerify(newKey, "verify");
    vault.kdf.salt = btoa(String.fromCharCode(...newSalt));
    vault.verifier = btoa(String.fromCharCode(...new Uint8Array(newVerifier)));

    for (let i = 0; i < vault.items.length; i++) {
      let decrypted;
      try {
        decrypted = await cryptoHelper.aesGcmDecrypt(
          key,
          vault.items[i].iv,
          vault.items[i].ciphertext
        );
      } catch {
        return {
          ok: false,
          error: "Failed to decrypt item during password change",
        };
      }
      const { iv, ciphertext } = await cryptoHelper.aesGcmEncrypt(
        newKey,
        decrypted
      );
      vault.items[i].iv = iv;
      vault.items[i].ciphertext = ciphertext;
    }

    let notes = (await idbKeyval.get("notes")) || [];
    for (let i = 0; i < notes.length; i++) {
      let decrypted;
      try {
        decrypted = await cryptoHelper.aesGcmDecrypt(
          key,
          notes[i].iv,
          notes[i].ciphertext
        );
      } catch {
        return {
          ok: false,
          error: "Failed to decrypt note during password change",
        };
      }
      const { iv, ciphertext } = await cryptoHelper.aesGcmEncrypt(
        newKey,
        decrypted
      );
      notes[i].iv = iv;
      notes[i].ciphertext = ciphertext;
    }
    await idbKeyval.set("notes", notes);

    await idbKeyval.set("vault", vault);
    await setMEK(newKey);
    this.vaultCache = vault;
    this.notesCache = notes;

    return { ok: true };
  }

  async getAutofillSetting() {
    const setting = await idbKeyval.get("autofillSetting");
    return { ok: !!setting };
  }

  async toggleAutofillSetting() {
    const current = await idbKeyval.get("autofillSetting");
    await idbKeyval.set("autofillSetting", !current);
    return { ok: true, value: !current };
  }

  async getTimeoutLock() {
    const timeout = await idbKeyval.get("timeoutLock");
    return { ok: true, timeout };
  }

  async setTimeoutLock(timeout) {
    await idbKeyval.set("timeoutLock", timeout);
    return { ok: true };
  }

  async getAllNotes() {
    const MEK = await getMEK();
    if (!MEK) return [];
    const notes = await this.getNotesCache();
    return notes.map((n) => ({ id: n.id, title: n.title }));
  }

  async getNote(id) {
    const MEK = await getMEK();
    if (!MEK) return { ok: false };
    const notes = (await idbKeyval.get("notes")) || [];
    const note = notes.find((n) => n.id === id);
    if (!note) return { ok: false };
    let data;
    try {
      data = await cryptoHelper.aesGcmDecrypt(MEK, note.iv, note.ciphertext);
    } catch {
      return { ok: false };
    }
    return {
      ok: true,
      item: {
        id: note.id,
        title: note.title,
        content: data.content,
      },
    };
  }

  async setNote(noteData) {
    const MEK = await getMEK();
    if (!MEK) return { ok: false };
    let notes = (await idbKeyval.get("notes")) || [];
    const idx = notes.findIndex((n) => n.id === noteData.id);
    if (idx === -1) return { ok: false };
    const { iv, ciphertext } = await cryptoHelper.aesGcmEncrypt(MEK, {
      content: noteData.content,
    });
    notes[idx] = {
      ...notes[idx],
      title: noteData.title,
      iv,
      ciphertext,
    };
    await idbKeyval.set("notes", notes);
    this.notesCache = notes;
    return { ok: true };
  }

  async deleteNote(id) {
    const MEK = await getMEK();
    if (!MEK) return { ok: false };
    let notes = (await idbKeyval.get("notes")) || [];
    const newNotes = notes.filter((n) => n.id !== id);
    if (newNotes.length === notes.length) return { ok: false };
    await idbKeyval.set("notes", newNotes);
    this.notesCache = newNotes;
    return { ok: true };
  }

  async addNote({ title, content }) {
    const MEK = await getMEK();
    if (!MEK) return { ok: false };
    const { iv, ciphertext } = await cryptoHelper.aesGcmEncrypt(MEK, {
      content,
    });
    const newNote = { id: nanoId.nanoid(), title, iv, ciphertext };
    let notes = (await idbKeyval.get("notes")) || [];
    notes.push(newNote);
    await idbKeyval.set("notes", notes);
    this.notesCache = notes;
    return { ok: true, id: newNote.id };
  }

  async checkNewLogin(domain, username, password) {
    const MEK = await getMEK();
    if (!MEK || !this.vaultCache) return { msg: "NEW" };
    const inputDomain = tldts.getDomain(domain);
    const found = this.vaultCache.items.find((item) => {
      const vaultDomain = tldts.getDomain(item.domain);
      return vaultDomain === inputDomain;
    });
    if (!found) return { msg: "NEW" };
    let data;
    try {
      data = await cryptoHelper.aesGcmDecrypt(MEK, found.iv, found.ciphertext);
    } catch {
      return { msg: "NEW" };
    }
    if (data.u === username && data.p === password) {
      return { msg: "UNCHANGED" };
    } else if (data.u === username) {
      return { msg: "UPDATE", id: found.id };
    } else {
      return { msg: "NEW" };
    }
  }
}

export { StateManager };
