import { parse } from 'tldts';

init();

function init() {
  // Start auto for your test; switch to setting-gated if you want.
  startAuto();

  // If you want to gate by a setting, use this instead:
  // chrome.runtime.sendMessage({ type: "GET_AUTOFILL_SETTING" }, (resp) => {
  //   const enabled = !!(resp && resp.enabled);
  //   if (enabled) {
  //     if (!isSafeContext()) return; // only on HTTPS / localhost
  //     startAuto();
  //   } else {
  //     startManual();
  //   }
  // });
}

/* ------------------------- Flow A: Autofill enabled ------------------------- */

function startAuto() {
  console.log("content.js: auto mode ready");
  tryFill();                           // on initial load
  // watchUrlChanges(() => tryFill());    // on SPA navigations
}

async function tryFill() {
  const domain = location.hostname;
  console.log("content.js: trying to fill for domain:", domain);
  requestAndFill(domain);
}

/* ------------------------- Flow B: Manual (popup) --------------------------- */

function startManual() {
  console.log("content.js: manual mode ready");
  chrome.runtime.onMessage.addListener((msg) => {
    if (!msg || msg.type !== "REQUEST_FILL") return;
    console.log("content.js: REQUEST_FILL received");

    // If popup provided explicit creds, use them directly.
    if (msg.username && msg.password) {
      fillWithObserver({ u: msg.username, p: msg.password });
      return;
    }

    // Otherwise, ask background to match this page and then fetch full item.
    tryFill();
  });
}

/* ------------------------------- Core helpers ------------------------------- */

function requestAndFill(domain) {
  // 1) Ask for matches (array of { id, title, domain, username })
  chrome.runtime.sendMessage({ type: "MATCH", domain }, (matches) => {
    if (chrome.runtime.lastError) {
      console.warn("content.js: MATCH error:", chrome.runtime.lastError.message);
      return;
    }

    if (!Array.isArray(matches) || matches.length < 1) {
      // No unambiguous match -> do nothing (or present chooser via popup)
      return;
    }

    const match = matches[0];
    if (!match || !match.id) return;

    // 2) Fetch full item to get the password
    chrome.runtime.sendMessage({ type: "GET_ITEM", id: match.id }, (res) => {
      if (chrome.runtime.lastError) {
        console.warn("content.js: GET_ITEM error:", chrome.runtime.lastError.message);
        return;
      }
      if (!res || !res.ok || !res.item) return;

      const u = res.item.username;
      const p = res.item.password;
      if (typeof u !== "string" || typeof p !== "string") return;

      fillWithObserver({ u, p });
    });
  });
}

function fillWithObserver(creds) {
  // Try immediately; if fields aren't present yet, watch until they appear.
  if (applyCreds(creds)) return true;

  const observer = new MutationObserver(() => {
    if (applyCreds(creds)) {
      observer.disconnect();
    }
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });
  // Safety timeout so we don't observe forever on pages without forms
  setTimeout(() => observer.disconnect(), 15000);
  return false;
}

// function normalizeDomain(hostname) {
//   // Keep consistent with bg/popup: you're using raw hostname (e.g., "www.example.com").
//   return hostname;
// }

function isSafeContext() {
  return (
    location.protocol === "https:" ||
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1"
  );
}

function applyCreds(creds) {
  if (!creds || typeof creds.u !== "string" || typeof creds.p !== "string") return false;

  const pass = findPasswordField();
  if (!pass) return false;

  const form = pass.form || document;
  const user = findUsernameField(form);

  if (user) fill(user, creds.u);
  fill(pass, creds.p);
  return true;
}

function findPasswordField() {
  const nodes = Array.from(
    document.querySelectorAll('input[type="password"]:not([disabled]):not([readonly])')
  ).filter(isVisible);
  return nodes.length > 0 ? nodes[0] : null;
}

function findUsernameField(root) {
  const sel = [
    'input[name*=user i]',
    'input[name*=login i]',
    'input[name*=email i]',
    'input[type="text"]',
    'input[type="email"]'
  ].join(',');

  const nodes = Array.from(
    root.querySelectorAll(`:is(${sel}):not([disabled]):not([readonly])`)
  ).filter(isVisible);

  return nodes.length > 0 ? nodes[0] : null;
}

function fill(el, value, opts = {}) {
  const { fireChange = false, keepFocus = true } = opts;

  const prev = document.activeElement;

  // Use the native value setter so frameworks detect the change
  const proto = el.constructor === HTMLTextAreaElement
    ? HTMLTextAreaElement.prototype
    : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
  if (setter) setter.call(el, value);
  else el.value = value; // fallback

  el.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
  if (fireChange) el.dispatchEvent(new Event('change', { bubbles: true }));

  if (keepFocus && prev && prev !== el) prev.focus();
}

function isVisible(el) {
  const r = el.getBoundingClientRect();
  const cs = getComputedStyle(el);
  return r.width > 0 && r.height > 0 && cs.display !== "none" && cs.visibility !== "hidden";
}

/* ---------------------- SPA URL change detector ---------------------- */

// function watchUrlChanges(onChange) {
//   if (window.__watchUrlChangesInstalled) return;
//   window.__watchUrlChangesInstalled = true;

//   let last = location.href;
//   const fire = () => {
//     const now = location.href;
//     if (now !== last) { last = now; onChange(); }
//   };

//   const wrap = (type) => {
//     const orig = history[type];
//     history[type] = function (...args) {
//       const ret = orig.apply(this, args);
//       window.dispatchEvent(new Event("locationchange"));
//       return ret;
//     };
//   };

//   wrap("pushState");
//   wrap("replaceState");

//   window.addEventListener("popstate", () => window.dispatchEvent(new Event("locationchange")));
//   window.addEventListener("hashchange", () => window.dispatchEvent(new Event("locationchange")));
//   window.addEventListener("locationchange", fire);
// }
