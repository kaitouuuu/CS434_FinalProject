const registerUI = `
  <style>
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes glow {
      from { box-shadow: 0 0 0 rgba(49,130,206,0); }
      to { box-shadow: 0 0 10px rgba(49,130,206,0.5); }
    }

    body {
      background: linear-gradient(135deg, #c3dafe, #a5b4fc, #93c5fd);
      font-family: "Inter", "Segoe UI", Roboto, sans-serif;
      margin: 0;
      padding: 0;
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .container {
      max-width: 360px;
      background: rgba(255, 255, 255, 0.85);
      backdrop-filter: blur(12px);
      border-radius: 16px;
      box-shadow: 0 8px 25px rgba(0,0,0,0.15);
      padding: 20px;
      animation: fadeIn 0.5s ease forwards;
    }

    h3 {
      color: #1e293b;
      margin-bottom: 6px;
      font-size: 1.5em;
    }

    p {
      color: #475569;
      font-size: 0.95em;
      margin-bottom: 20px;
    }

    form {
      text-align: left;
    }

    input[type="password"] {
      width: 100%;
      padding: 12px;
      margin: 8px 0 12px;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      font-size: 0.95em;
      outline: none;
      background-color: rgba(255,255,255,0.9);
      transition: border 0.2s, box-shadow 0.2s;
    }

    input[type="password"]:focus {
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99,102,241,0.2);
    }

    #checklist {
      font-size: 0.9em;
      margin-bottom: 14px;
      transition: all 0.3s ease;
    }

    #checklist div {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 4px;
      transition: color 0.3s ease, transform 0.3s ease;
    }

    #checklist .ok {
      color: #16a34a;
      transform: translateX(4px);
    }

    #checklist .bad {
      color: #dc2626;
    }

    #match {
      font-size: 0.9em;
      height: 18px;
      color: #dc2626;
      margin-top: -6px;
      margin-bottom: 10px;
    }

    button {
      width: 100%;
      padding: 12px;
      background: linear-gradient(90deg, #6366f1, #3b82f6);
      border: none;
      border-radius: 10px;
      color: white;
      font-size: 1em;
      font-weight: 600;
      letter-spacing: 0.3px;
      cursor: pointer;
      transition: all 0.25s ease;
    }

    button:hover {
      background: linear-gradient(90deg, #4f46e5, #2563eb);
      animation: glow 0.4s alternate infinite;
    }

    button:active {
      transform: scale(0.97);
    }

    .vault-icon {
      font-size: 2.2em;
      margin-bottom: 10px;
      color: #4f46e5;
      text-shadow: 0 2px 6px rgba(79,70,229,0.3);
    }
  </style>

  <div class="container">
    <div class="vault-icon">🔒</div>
    <h3>Welcome!</h3>
    <p>Set your <strong>Master Password</strong> to protect your secure vault.</p>

    <form id="setup-form">
      <input type="password" id="m1" placeholder="Master Password" required />
      <div id="checklist">
        <div id="len" class="bad">❌ At least 8 characters</div>
        <div id="upper" class="bad">❌ Has uppercase letter</div>
        <div id="special" class="bad">❌ Has special character</div>
      </div>

      <input type="password" id="m2" placeholder="Confirm Password" required />
      <div id="match"></div>

      <button type="submit">✨ Create Vault</button>
    </form>
  </div>
`;

const loginUI = `<style>
  .lock-screen-container {
  width: 340px;
  padding: 10px;
  margin : 10px 0 10px 0;
  height: 440px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  border-radius: 16px;
  box-shadow: 0 8px 25px rgba(0,0,0,0.15);
  animation: fadeIn 0.5s ease forwards;
  text-align: center; /* Center the icon and text */
}

/* Icon for the lock screen */

.lock-screen-container .vault-icon {
  font-size: 2.2em;
  margin-bottom: 10px;
  color: #4f46e5;
  text-shadow: 0 2px 6px rgba(79,70,229,0.3);
}

/* Headers and text inside the lock screen */
.lock-screen-container h3 {
  text-align: center;
  margin-bottom: 6px;
}
.lock-screen-container p {
  text-align: center;
  font-size: 0.95em;
  margin-bottom: 20px;
}

/* Ensure form elements inside use 100% width */
.lock-screen-container form {
margin-top: 90px;
  width: 100%;
}
  
  </style>
<div class="lock-screen-container">
  <img src="icons/icon128.png" alt="Vault Icon" class="vault-icon-img">
  <h3>Vault Locked</h3>
  <p>Enter your Master Password to unlock.</p>
  <form id="unlock-form">
    <input type="password" id="master" placeholder="Master Password" required />
    <button type="submit">Unlock</button>
  </form>
</div>
  `;
export { registerUI, loginUI };