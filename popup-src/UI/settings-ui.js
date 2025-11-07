const settingsUI = `
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
export { settingsUI };