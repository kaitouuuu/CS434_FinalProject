// content.js — manual & auto flows, fixed and consistent (no imports)

init();

function init() {
  // Start in manual mode by default (popup triggers fill).
  startManual();

  // If you want auto mode via a setting, uncomment:
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
  tryFillAuto();                           // on initial load
  watchUrlChanges(() => tryFillAuto());    // on SPA navigations
}

function tryFillAuto() {
  const domain = normalizeDomain(location.hostname);
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

    // Otherwise, ask background to match this page.
    tryFillManual();
  });
}

function tryFillManual() {
  const domain = normalizeDomain(location.hostname);
  requestAndFill(domain);
}

/* ------------------------------- Core helpers ------------------------------- */

function requestAndFill(domain) {
  chrome.runtime.sendMessage({ type: "MATCH", domain }, (creds) => {
    if (chrome.runtime.lastError) {
      console.warn("content.js: sendMessage error:", chrome.runtime.lastError.message);
      return;
    }
    if (!creds) return; // no match

    fillWithObserver(creds);
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

function normalizeDomain(hostname) {
  // Keep consistent with how you store/query in bg.js / popup.js.
  // Using raw hostname here (e.g., "www.example.com").
  return hostname;
}

function isSafeContext() {
  return (
    location.protocol === "https:" ||
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1"
  );
}

function applyCreds(creds) {
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

  // Remember current focus
  const prev = document.activeElement;

  // Use the native setter so frameworks detect the change
  const proto = el.constructor === HTMLTextAreaElement
    ? HTMLTextAreaElement.prototype
    : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
  if (setter) setter.call(el, value);
  else el.value = value; // fallback

  // Dispatch an input-like event (what typing would do)
  el.dispatchEvent(new Event('input', { bubbles: true, composed: true }));

  // Only send change if a site needs it (rare; can hide eye icons on some UIs)
  if (fireChange) {
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  // Restore previous focus if desired
  if (keepFocus && prev && prev !== el) prev.focus();
}


function isVisible(element) {
  const r = element.getBoundingClientRect();
  const cs = getComputedStyle(element);
  return r.width > 0 && r.height > 0 && cs.display !== "none" && cs.visibility !== "hidden";
}

/* ---------------------- SPA URL change detector ---------------------- */

function watchUrlChanges(onChange) {
  if (window.__watchUrlChangesInstalled) return;
  window.__watchUrlChangesInstalled = true;

  let last = location.href;
  const fire = () => {
    const now = location.href;
    if (now !== last) { last = now; onChange(); }
  };

  const wrap = (type) => {
    const orig = history[type];
    history[type] = function (...args) {
      const ret = orig.apply(this, args);
      window.dispatchEvent(new Event("locationchange"));
      return ret;
    };
  };

  wrap("pushState");
  wrap("replaceState");

  window.addEventListener("popstate", () => window.dispatchEvent(new Event("locationchange")));
  window.addEventListener("hashchange", () => window.dispatchEvent(new Event("locationchange")));
  window.addEventListener("locationchange", fire);
}
