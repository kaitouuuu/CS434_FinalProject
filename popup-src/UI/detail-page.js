import { send } from '../messaging.js';
import editItemHtml from './edit-item-ui.html';
import editNoteHtml from './edit-note-ui.html';

async function renderItemDetailUI(id) {
    const app = document.getElementById('app');
    app.innerHTML = `<div class="container"><p>Loading item...</p></div>`;

    // 1. Fetch Data
    const res = await send({ type: 'GET_ITEM', id });
    if (!res || !res.ok) {
        alert('Could not load item details.');
        window.renderUnlockedUI(); // Assumes renderUnlockedUI is globally available
        return;
    }
    const item = res.item;

    renderEditItemView(app, item);
    setupEditItemEventListeners(app, item);
}

/**
 * Injects the static HTML and populates the form fields.
 * @param {HTMLElement} app - The main app container.
 * @param {Object} item - The item data to display.
 */
function renderEditItemView(app, item) {
    // 1. Inject the static HTML from the imported file
    app.innerHTML = editItemHtml;

    // 2. Populate the dynamic values
    // (We query *within* the 'app' container for safety)
    app.querySelector('#title').value = item.title || '';
    app.querySelector('#domain').value = item.domain;
    app.querySelector('#username').value = item.username;
    app.querySelector('#password').value = item.password;
}

/**
 * Attaches all event listeners for the edit item view.
 * @param {HTMLElement} app - The main app container (which now contains the edit UI).
 * @param {Object} item - The item data (needed for the submit handler).
 */
function setupEditItemEventListeners(app, item) {
    // Back button
    app.querySelector('#back-btn').addEventListener('click', () => {
        window.renderUnlockedUI(); // Assumes global
    });

    // Toggle password visibility
    app.querySelector('#toggle-password').addEventListener('click', () => {
        const passInput = app.querySelector('#password');
        const isPassword = passInput.type === 'password';
        passInput.type = isPassword ? 'text' : 'password';
    });

    // All "Copy" buttons
    app.querySelectorAll('.copy-btn').forEach((btn) => {
        btn.addEventListener('click', (e) => {
            const targetId = e.target.dataset.copyTarget;
            const textToCopy = app.querySelector(`#${targetId}`).value;
            navigator.clipboard
                .writeText(textToCopy)
                .then(() => {
                    e.target.textContent = 'Copied!';
                    setTimeout(() => (e.target.textContent = 'Copy'), 1500);
                })
                .catch((err) => {
                    console.error('Failed to copy: ', err);
                    alert('Failed to copy to clipboard.');
                });
        });
    });

    // Form submit
    app.querySelector('#edit-item-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;
        const updatedItem = {
            id: item.id,
            title: form.title.value,
            domain: form.domain.value,
            username: form.username.value,
            password: form.password.value,
        };

        const setRes = await send({ type: 'SET_ITEM', item: updatedItem });
        if (setRes && setRes.ok) {
            alert('Item updated successfully!');
            window.renderUnlockedUI(); // Assumes global
        } else {
            alert('Failed to update item.');
        }
    });
}

async function renderNoteDetailUI(id) {
    const app = document.getElementById('app');
    app.innerHTML = `<div class="container"><p>Loading item...</p></div>`;

    // 1. Fetch Data
    const res = await send({ type: 'GET_NOTE', id });
    if (!res || !res.ok) {
        alert('Could not load item details.');
        window.renderUnlockedUI(); // Assumes renderUnlockedUI is globally available
        return;
    }
    const item = res.item;

    // 2. Render View
    renderEditNoteView(app, item);

    // 3. Attach Listeners
    setupEditNoteEventListeners(app, item);
}

/**
 * Injects the static HTML and populates the form fields.
 * @param {HTMLElement} app - The main app container.
 * @param {Object} item - The note data to display.
 */
function renderEditNoteView(app, item) {
    // 1. Inject the static HTML from the imported file
    app.innerHTML = editNoteHtml;

    // 2. Populate the dynamic values
    app.querySelector('#title').value = item.title;
    app.querySelector('#content').innerHTML = item.content; // Use .innerHTML to preserve formatting
}

/**
 * Attaches all event listeners for the edit note view.
 * @param {HTMLElement} app - The main app container (which now contains the edit UI).
 * @param {Object} item - The note data (needed for the submit handler).
 */
function setupEditNoteEventListeners(app, item) {
    // Back button
    app.querySelector('#back-btn').addEventListener('click', () => {
        window.renderUnlockedUI(); // Assumes global
    });

    // All "Copy" buttons
    app.querySelectorAll('.copy-btn').forEach((btn) => {
        btn.addEventListener('click', (e) => {
            const targetId = e.target.dataset.copyTarget;
            const targetElement = app.querySelector(`#${targetId}`);

            // **FIX:** Use .textContent for divs/contenteditable, .value for inputs
            const textToCopy = (targetId === 'content')
                ? targetElement.textContent
                : targetElement.value;

            navigator.clipboard
                .writeText(textToCopy)
                .then(() => {
                    e.target.textContent = 'Copied!';
                    setTimeout(() => (e.target.textContent = 'Copy'), 1500);
                })
                .catch((err) => {
                    console.error('Failed to copy: ', err);
                    alert('Failed to copy to clipboard.');
                });
        });
    });

    // Form submit
    app.querySelector('#edit-item-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;
        const updatedItem = {
            id: item.id,
            title: form.title.value,
            content: form.querySelector('#content').innerHTML, // Use .innerHTML to save formatting
        };

        const setRes = await send({ type: 'SET_NOTE', item: updatedItem });
        if (setRes && setRes.ok) {
            alert('Note updated successfully!');
            window.renderUnlockedUI(); // Assumes global
        } else {
            alert('Failed to update Note.');
        }
    });
}
export {
    renderItemDetailUI,
    renderNoteDetailUI
};