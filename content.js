import * as tldts from 'tldts';
chrome.runtime.sendMessage(
  { type: "MATCH", domain: tldts.parse(window.location.hostname).domain },
  (creds) => {
    if (!creds) return;
    const pass = document.querySelector(
      'input[type="password"]:not([disabled])'
    );
    if (!pass) return;
    const form = pass.form || document;
    const user = form.querySelector('input[type="text"], input[type="email"]');
    if (user) {
      user.value = creds.u;
      user.dispatchEvent(new Event("input", { bubbles: true }));
      user.dispatchEvent(new Event("change", { bubbles: true }));
    }
    pass.value = creds.p;
    pass.dispatchEvent(new Event("input", { bubbles: true }));
    pass.dispatchEvent(new Event("change", { bubbles: true }));
  }
);
