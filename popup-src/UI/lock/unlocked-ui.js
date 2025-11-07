import { globalState } from './../../state.js';
const unlockedHtml = `
<style>
    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(10px);
        }

        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    @keyframes glow {
        from {
            box-shadow: 0 0 0 rgba(49, 130, 206, 0);
        }

        to {
            box-shadow: 0 0 10px rgba(49, 130, 206, 0.5);
        }
    }

    /* ---
STABILITY: The main page gradient is on the body.
It will always be stable and visible in the blurred-glass areas.
--- */
    body {
        background: linear-gradient(135deg, #c3dafe, #a5b4fc, #93c5fd);
        font-family: "Inter", "Segoe UI", Roboto, sans-serif;
        margin: 0;
        padding: 0;
    }

    /* Centers the app container on the page */
    #app {
        height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    /* --- Main App Window --- */
    .container {
        max-width: 360px;

        height: 440px;
        background: rgba(255, 255, 255, 0.85);
        /* Main "glass" panel */
        backdrop-filter: blur(12px);
        border-radius: 16px;
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        animation: fadeIn 0.5s ease forwards;

        /* This flex layout is key to the stable tab bar */
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }

    .screen {
        flex: 1;
        overflow-y: auto;
        width: 320px;
    }

    /* ---
OPACITY: This is the new "glass" tab bar.
It has a semi-transparent background and a backdrop-filter
to create the opacity/blur effect you wanted.
--- */
    .tab-bar {
        display: flex;
        background: rgba(255, 255, 255, 0.6);
        /* Semi-transparent "glass" */
        backdrop-filter: blur(10px);
        /* This border separates it from the content above */
        border-top: 1px solid rgba(255, 255, 255, 0.8);
    }

    .tab-btn {
        flex: 1;
        padding: 14px 10px;
        background: transparent;
        border: none;
        color: #475569;
        font-size: 0.95em;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s, color 0.2s;
    }

    .tab-btn:hover {
        background: rgba(255, 255, 255, 0.4);
        /* A hover effect */
    }

    .tab-btn.active {
        /* The active button is slightly brighter */
        background: rgba(255, 255, 255, 0.7);
        color: #4f46e5;
    }

    /* --- Shared UI Components --- */
    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
    }

    /* Nested cards inside screens */
    .card {
        background: rgba(255, 255, 255, 0.6);
        /* "Glass" cards */
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 16px;
    }

    h3 {
        color: #1e293b;
        margin: 0;
        font-size: 1.5em;
    }

    h4 {
        color: #334155;
        margin-top: 0;
        margin-bottom: 12px;
    }

    p {
        color: #475569;
        font-size: 0.95em;
        margin-top: 0;
    }

    /* --- Form Elements (Adapted) --- */
    input[type="password"],
    input[type="text"],
    input[type="number"] {
        width: 100%;
        box-sizing: border-box;
        padding: 12px;
        margin: 8px 0 12px;
        border: 1px solid #cbd5e1;
        border-radius: 10px;
        font-size: 0.95em;
        outline: none;
        background-color: rgba(255, 255, 255, 0.9);
        transition: border 0.2s, box-shadow 0.2s;
    }

    input[type="password"]:focus,
    input[type="text"]:focus,
    input[type="number"]:focus {
        border-color: #6366f1;
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
    }

    .checkbox-group {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin: 16px 0;
    }

    .checkbox-group label {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.9em;
        color: #334155;
        cursor: pointer;
    }

    input[type="checkbox"] {
        width: 16px;
        height: 16px;
        accent-color: #6366f1;
    }

    /* --- Button Styles --- */
    /* Default full-width button */
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

    /* --- Button overrides for specific cases --- */
    /* Header icon buttons (Add, Lock) */
    .header button {
        width: auto;
        background: transparent;
        color: #4f46e5;
        font-size: 1.3em;
        padding: 8px;
    }

    .header button:hover {
        background: rgba(99, 102, 241, 0.1);
        animation: none;
        /* No glow */
    }

    /* Password Generator 'Copy' button */
    .input-group {
        display: flex;
    }

    .input-group input {
        flex: 1;
        border-top-right-radius: 0;
        border-bottom-right-radius: 0;
        margin-right: -1px;
    }

    .copy-btn {
        width: auto;
        background: #e0e7ff;
        color: #4f46e5;
        border-top-left-radius: 0;
        border-bottom-left-radius: 0;
        font-size: 0.9em;
    }

    .copy-btn:hover {
        background: #c7d2fe;
        animation: none;
    }

    .copy-btn:disabled {
        background: #eef2ff;
        color: #a5b4fc;
        cursor: not-allowed;
    }

    .copy-btn:active {
        transform: scale(1);
    }

    /* Disable shrink */

    /* --- Settings Screen Specifics --- */
    .setting-item {
        margin-bottom: 12px;
    }

    .setting-item label {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.95em;
        color: #334155;
    }

    .setting-description {
        font-size: 0.85em;
        color: #64748b;
        margin-top: 4px;
        margin-bottom: 0;
        padding-left: 24px;
        /* Aligns with checkbox text */
    }

    #timeout-lock {
        width: 80px;
    }

    #timeout-lock-label-wrapper {
        display: flex;
        align-items: center;
        gap: 10px;
    }

    /* For the "Change Master Password" button */
    .settings-button {
        /* It just uses the default button style, which is perfect. */
    }

    /* --- Dropdown/Select Menu (Basic Styles) --- */
    /* These are complex components; full styling would require more CSS/JS */
    .btn-group {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .menu-item {
        position: relative;
    }

    .dropdown {
        display: none;
        /* JS will need to toggle this */
    }

    .select-menu {
        margin-bottom: 16px;
    }
</style>
 <div class="container">
    <div id="screen-main" class="screen">
        <div class="header">
            <h3>My Vault</h3>
            <div class="btn-group">
                <div class="menu-item">
                    <button id="add-btn">
                        <i class="fa-solid fa-plus"></i>
                    </button>
                    <ul id="dropdown" class="dropdown">
                        <li><button id="add-login-btn">Password</button></li>
                        <li><button id="note-btn">Note</button></li>
                    </ul>
                    <button id="lock-btn">
                        <i class="fa-solid fa-lock"></i>
                    </button>
                </div>
            </div>
        </div>

        <div class="card">
            <h4>Logins for this site</h4>
            <div id="current-item-list">
                <p>Loading...</p>
            </div>
        </div>
        <div class="select-menu">
            <div class="select-btn">
                <span class="sBtn-text">${globalState}</span>
                <i class="bx bx-chevron-down"></i>
            </div>

            <ul class="options">
                <li class="option">
                    <i id="all" class="fa-solid fa-check" style="color: black; font-size: 10px;"></i>
                    <span class="option-text">All</span>
                </li>
                <li class="option">
                    <i id="password" class="bi bi-lock" style="color: black; font-size: 10px;"></i>
                    <span class="option-text">Password</span>
                </li>

                <li class="option">
                    <i id="note" class="fa-regular fa-note-sticky" style="color: black; font-size: 10px;"></i>
                    <span class="option-text">Note</span>
                </li>
            </ul>
        </div>
        <div id="DOMContentLoaded" class="list">
            <div id="all-item-list">
                <p>Loading...</p>
            </div>
            <div id="all-note-list">
                <p>Loading...</p>
            </div>
        </div>
    </div>

    <div id="screen-password" class="screen" style="display:none;">
        <div class="header">
            <h3>Password Generator</h3>
        </div>
        <div class="card">
            <label>Length: <input type="number" id="pw-length" value="16" min="6" max="200000"></label>

            <div class="checkbox-group">
                <label>
                    <input type="checkbox" id="include-lowercase" checked> Include lowercase letters (a-z)
                </label>
                <label>
                    <input type="checkbox" id="include-uppercase" checked> Include uppercase letters (A-Z)
                </label>
                <label>
                    <input type="checkbox" id="include-special" checked> Include special characters (!@#$%^&*)
                </label>
                <label>
                    <input type="checkbox" id="include-digits" checked> Include digits (0-9)
                </label>

                <label>
                    <input type="checkbox" id="include-similar" checked> Avoid similar characters (i.e.
                    O0oIl1|&#96;\'"~;:.,{}[]()&lt;&gt;\/)
                </label>

                <label>
                    <input type="checkbox" id="include-require" checked> Require each selected character type
                </label>
            </div>

            <div class="btn-wrapper">
                <button id="generate-btn">Generate Password</button>
            </div>

            <div class="password-output">
                <div class="input-group">
                    <input type="text" id="generated-password" readonly placeholder="Ex: abc123, Qw3rt!">
                    <button type="button" class="copy-btn" id="copy-password-btn" disabled>Copy</button>
                </div>
            </div>
        </div>
    </div>

    <div id="screen-settings" class="screen" style="display:none;">
        <div class="header">
            <h3>Settings</h3>
        </div>
        <div class="card">
            <div class="setting-item">
                <label>
                    <input type="checkbox" id="autofill-setting"> Enable Autofill
                </label>
                <p class="setting-description">Automatically fill login forms when visiting websites</p>
            </div>
        </div>
        <div class="card">
            <button id="change-password-btn" class="settings-button">Change Master Password</button>
        </div>
        <div class="card" id="timeout-lock-label-wrapper">
            <label for="timeout-lock">Auto-Lock Timeout (minutes):</label>
            <input type="number" id="timeout-lock" min="1" value="5">
        </div>
    </div>

    <div class="tab-bar">
        <button class="tab-btn active" data-screen="screen-main">Vault</button>
        <button class="tab-btn" data-screen="screen-password">Generator</button>
        <button class="tab-btn" data-screen="screen-settings">Settings</button>
    </div>
</div>
`;

export { unlockedHtml };