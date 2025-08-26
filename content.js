import { parse } from 'tldts';

init();

function init() {
  // Start auto for your test; switch to setting-gated if you want.
  // startManual();

  chrome.runtime.sendMessage({ type: "GET_AUTOFILL_SETTING" }, (resp) => {
    const enabled = !!(resp && resp.ok);
    if (enabled) {
      if (!isSafeContext()) return; // only on HTTPS / localhost
      startAuto();
    } else {
      startManual();
    }
  });
  installSubmitCapture();
}

function startAuto() {
  console.log("content.js: auto mode ready");
  tryFill();                           // on initial load
  // watchUrlChanges(() => tryFill());    // on SPA navigations
}

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

async function tryFill() {
  const domain = location.hostname;
  console.log("content.js: trying to fill for domain:", domain);
  requestAndFill(domain);
}

function requestAndFill(domain) {
  chrome.runtime.sendMessage({ type: "MATCH", domain }, (matches) => {
    if (chrome.runtime.lastError) {
      console.warn("content.js: MATCH error:", chrome.runtime.lastError.message);
      return;
    }

    if (!Array.isArray(matches) || matches.length < 1) {
      return;
    }

    const match = matches[0];
    if (!match || !match.id) return;

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
  if (applyCreds(creds)) return true;

  const observer = new MutationObserver(() => {
    if (applyCreds(creds)) {
      observer.disconnect();
    }
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });
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

  // Fill username but restore prior focus (so we can move focus to password next)
  if (user) fill(user, creds.u, { keepFocus: true });

  // For the password:
  // 1) Focus FIRST
  // 2) Set value via native setter
  // 3) Dispatch input
  // 4) Send a harmless keydown/keyup to "wake" UI (eye icon)
  fill(pass, creds.p, { keepFocus: false, focusFirst: true, wakeKeys: true });

  return true;
}

function findPasswordField() {
  const nodes = Array.from(
    document.querySelectorAll('input[type="password"]:not([disabled]):not([readonly])')
  ).filter(isVisible);
  return nodes.length > 0 ? nodes[0] : null;
}


function findPasswordFieldIn(root) {
  const scope = root || document;
  const nodes = Array.from(
    scope.querySelectorAll('input[type="password"]:not([disabled]):not([readonly])')
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
  const {
    fireChange = false,
    keepFocus = false,     // default: keep focus on the target (good for password)
    focusFirst = false,    // focus before setting value (mimics real typing better)
    wakeKeys = false       // synthesize keydown/keyup after input
  } = opts;

  const previouslyFocused = document.activeElement;

  if (focusFirst) {
    // Triggers real focus/ focusin handlers the page might rely on
    el.focus();
  }

  // Use the native setter so React/Vue controlled inputs notice
  const proto = el.constructor === HTMLTextAreaElement
    ? HTMLTextAreaElement.prototype
    : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
  if (setter) setter.call(el, value);
  else el.value = value;

  // Dispatch what typing would do
  el.dispatchEvent(new Event("input", { bubbles: true, composed: true }));

  if (wakeKeys) {
    // Some sites toggle UI on key events, even if value already changed.
    wakeKeyboard(el);
  }

  if (fireChange) {
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }

  // Optionally restore focus to whatever had it before
  if (keepFocus && previouslyFocused && previouslyFocused !== el) {
    previouslyFocused.focus();
  }
}

function wakeKeyboard(el) {
  // Focus must be on the element for most listeners to fire
  if (document.activeElement !== el) el.focus();

  const down = new KeyboardEvent("keydown", {
    key: "Alt",
    code: "AltLeft",
    keyCode: 18,
    which: 18,
    bubbles: true
  });
  const up = new KeyboardEvent("keyup", {
    key: "Alt",
    code: "AltLeft",
    keyCode: 18,
    which: 18,
    bubbles: true
  });

  el.dispatchEvent(down);
  el.dispatchEvent(up);
}

function isVisible(el) {
  const r = el.getBoundingClientRect();
  const cs = getComputedStyle(el);
  return r.width > 0 && r.height > 0 && cs.display !== "none" && cs.visibility !== "hidden";
}

function installSubmitCapture() {
  if (window.__submitCaptureInstalled) return;
  window.__submitCaptureInstalled = true;

  // Capture real <form> submissions (use capture phase)
  document.addEventListener("submit", onAnySubmit, true);

  // Also catch click on submit-like buttons that may not fire 'submit'
  document.addEventListener(
    "click",
    (e) => {
      const el = e.target instanceof Element ? e.target.closest('button, input[type="submit"]') : null;
      if (!el) return;
      const form = el.form || el.closest("form");
      if (!form) return;
      // Let page handlers run first, then read values
      queueMicrotask(() => tryCheckForSaveOrUpdate(form));
    },
    true
  );
}

function onAnySubmit(evt) {
  tryCheckForSaveOrUpdate(evt.target);
}

function tryCheckForSaveOrUpdate(scope) {
  // Prefer elements inside the submitted form; fall back to whole doc
  const passEl = findPasswordFieldIn(scope) || findPasswordField();
  if (!passEl) return;

  const root = passEl.form || scope || document;
  const userEl = findUsernameField(root);

  const username = (userEl?.value ?? "").trim();
  const password = passEl.value ?? "";           
  if (!username || !password) return;

  const domain = location.hostname;

  // Ask background what action makes sense
  chrome.runtime.sendMessage(
    { type: "CHECK_NEW_LOGIN", domain, username, password },
    (resp) => {
      if (chrome.runtime.lastError || !resp || !resp.msg) return;

      switch (resp.msg) {
        case "NEW": {
          const title = domain;
          const ok = confirm(`Save new login for ${domain}?\nUsername: ${username}`);
          if (!ok) return;
          chrome.runtime.sendMessage({
            type: "ADD_LOGIN",
            item: { username, password, title, domain }
          }, (r) => {
            if (chrome.runtime.lastError) return;
            // optionally: toast/alert success/failure
          });
          break;
        }
        case "UPDATE": {
          // Fetch existing item so we preserve its title/domain as required by SET_ITEM
          if (!resp.id) return;
          chrome.runtime.sendMessage({ type: "GET_ITEM", id: resp.id }, (r) => {
            if (chrome.runtime.lastError || !r || !r.ok || !r.item) return;
            const item = r.item;
            const ok = confirm(`Update saved password for ${domain}?\nUsername: ${username}`);
            if (!ok) return;
            chrome.runtime.sendMessage({
              type: "SET_ITEM",
              item: {
                id: item.id,
                title: item.title || location.hostname,
                domain: item.domain || location.hostname,
                username,
                password
              }
            }, () => { /* optionally: toast/alert */ });
          });
          break;
        }
        case "UNCHANGED":
        default:
          // Do nothing
          break;
      }
    }
  );
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
