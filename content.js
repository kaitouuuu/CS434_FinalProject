import { get } from 'idb-keyval';
import * as tldts from 'tldts';

init();

function init() {
  chrome.runtime.sendMessage({ type: "GET_AUTOFILL_SETTING" }, (resp) => {
    const enabled = !!(resp && resp.enabled);
    if (enabled) {
      if(!isSafeContext()) return;
      startAuto(); // Autofill enabled in setting
    }
    else startManual(); // Press the pop-up thing
  });
}

function startAuto() {
  tryFill();
  watchUrlChanges(() => tryFill());
}

function startManual() {
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === "REQUEST_FILL") {
      tryFill();
    }
  });
}

function normalizeDomain(hostname, tldtsApi) {
  const parsed = tldtsApi.parse(hostname);
  return parsed.domain || hostname;
}

function isSafeContext() {
  return location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1";
}

function findPasswordField() {
  const nodes = Array.from(document.querySelectorAll('input[type="password"]:not([disabled]):not([readonly])')).filter(isVisible);
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
    root.querySelectorAll(`:is(${sel}):not([disabled]):not([readonly])`).filter(isVisible)
  );

  return nodes.length > 0 ? nodes[0] : null;
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

function isVisible(element) {
  const r = element.getBoundingClientRect();
  const cs = getComputedStyle(element);
  return r.width > 0 && r.height > 0 && cs.display !== "none" && cs.visibility !== "hidden";
}

function fill(element, value) {
  if (element.value === value) return;
  element.focus();
  element.value = value;
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
}

function tryFill() {
  const domain = normalizeDomain(location.hostname, tldts);
  chrome.runtime.sendMessage({ type: "MATCH", domain }, (creds) => {
    if (!creds || chrome.runtime.lastError) return;
    if(!applyCreds(creds)) {
      const observer = new MutationObserver(() => {
        if (applyCreds(creds)) observer.disconnect();
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }
  });
}

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
      window.dispatchEvent(new Event('locationchange'));
      return ret;
    };
  };

  wrap('pushState');
  wrap('replaceState');

  window.addEventListener('popstate', () => window.dispatchEvent(new Event('locationchange')));
  window.addEventListener('hashchange', () => window.dispatchEvent(new Event('locationchange')));
  window.addEventListener('locationchange', fire);
}

// chrome.runtime.sendMessage(
//   { type: "MATCH", domain: tldts.parse(window.location.hostname).domain },
//   (creds) => {
//     if (!creds) return;
//     const pass = document.querySelector(
//       'input[type="password"]:not([disabled])'
//     );
//     if (!pass) return;
//     const form = pass.form || document;
//     const user = form.querySelector('input[type="text"], input[type="email"]');
//     if (user) {
//       user.value = creds.u;
//       user.dispatchEvent(new Event("input", { bubbles: true }));
//       user.dispatchEvent(new Event("change", { bubbles: true }));
//     }
//     pass.value = creds.p;
//     pass.dispatchEvent(new Event("input", { bubbles: true }));
//     pass.dispatchEvent(new Event("change", { bubbles: true }));
//   }
// );
