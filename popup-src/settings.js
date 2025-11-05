import { send, queryTabs } from './messaging.js';
import { parse } from 'tldts';

async function renderChangePasswordUI() {
    const app = document.getElementById('app');
    app.innerHTML = `
    <div class="container full-screen" style="max-width:400px; margin:auto; font-family:sans-serif;">
      <div class="header" style="display:flex; align-items:center; gap:10px;">
        <button id="back-btn" class="back-button" style="padding:5px 10px;">← Back</button>
        <h3 style="margin:0;">Change Master Password</h3>
      </div>

      <form id="change-password-form" class="change-password-form" style="margin-top:15px;">
        <label for="current-password">Current Password</label>
        <input type="password" id="current-password" required style="width:100%; padding:8px; margin:5px 0;" />

        <label for="new-password">New Password</label>
        <input type="password" id="new-password" required style="width:100%; padding:8px; margin:5px 0;" />

        <div id="checklist" style="font-size:0.9em; margin-bottom:10px;">
          <div id="len" style="color:red;">❌ At least 8 characters</div>
          <div id="upper" style="color:red;">❌ Has uppercase letter</div>
          <div id="special" style="color:red;">❌ Has special character</div>
        </div>

        <label for="confirm-password">Confirm New Password</label>
        <input type="password" id="confirm-password" required style="width:100%; padding:8px; margin:5px 0;" />
        <div id="match" style="font-size:0.9em; color:red; height:18px;"></div>

        <button type="submit" class="save-button" style="width:100%; padding:10px; margin-top:10px;">Save Changes</button>
      </form>
    </div>
  `;

    // Go back button
    document
        .getElementById('back-btn')
        .addEventListener('click', () => window.renderUnlockedUI());

    const newPassword = document.getElementById('new-password');
    const confirmPassword = document.getElementById('confirm-password');
    const len = document.getElementById('len');
    const upper = document.getElementById('upper');
    const special = document.getElementById('special');
    const match = document.getElementById('match');

    // Live update of checklist
    function updateChecklist() {
        const val = newPassword.value;

        // Length check
        if (val.length >= 8) {
            len.style.color = 'green';
            len.textContent = '✔ At least 8 characters';
        } else {
            len.style.color = 'red';
            len.textContent = '❌ At least 8 characters';
        }

        // Uppercase check
        if (/[A-Z]/.test(val)) {
            upper.style.color = 'green';
            upper.textContent = '✔ Has uppercase letter';
        } else {
            upper.style.color = 'red';
            upper.textContent = '❌ Has uppercase letter';
        }

        // Special character check
        if (/[!@#$%^&*(),.?":{}|<>]/.test(val)) {
            special.style.color = 'green';
            special.textContent = '✔ Has special character';
        } else {
            special.style.color = 'red';
            special.textContent = '❌ Has special character';
        }

        updateMatch();
    }

    // Live password match check
    function updateMatch() {
        if (confirmPassword.value === '') {
            match.textContent = '';
            return;
        }
        if (newPassword.value === confirmPassword.value) {
            match.style.color = 'green';
            match.textContent = '✔ Passwords match';
        } else {
            match.style.color = 'red';
            match.textContent = '❌ Passwords do not match';
        }
    }

    newPassword.addEventListener('input', updateChecklist);
    confirmPassword.addEventListener('input', updateMatch);

    document
        .getElementById('change-password-form')
        .addEventListener('submit', async (e) => {
            e.preventDefault();
            const oldMaster = document.getElementById('current-password').value;
            const newMaster = newPassword.value;
            const confirmMaster = confirmPassword.value;

            const valid =
                newMaster.length >= 8 &&
                /[A-Z]/.test(newMaster) &&
                /[!@#$%^&*(),.?":{}|<>]/.test(newMaster);

            if (!valid) {
                alert('New password does not meet all requirements.');
                return;
            }

            if (newMaster !== confirmMaster) {
                alert('New passwords do not match.');
                return;
            }

            console.log('Changing master password...');
            const res = await send({
                type: 'CHANGE_MASTER_PASSWORD',
                oldMaster,
                newMaster,
            });

            if (res.ok) {
                alert('Master password changed successfully!');
                window.renderUnlockedUI();
            } else alert(res.error || 'Error changing password.');
        });
}

export {
    renderChangePasswordUI
}