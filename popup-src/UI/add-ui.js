const addNoteUI = `
  <style>
  /* --- Add Note Screen Container --- */
.add-note-container {
  width: 340px;
  padding: 10px;
  margin: 10px 0;
  height: 440px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  border-radius: 16px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  animation: fadeIn 0.5s ease forwards;
  display: flex;
  flex-direction: column;
}

/* --- Header --- */
.add-note-container .header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.add-note-container .header h3 {
  margin: 0;
  font-size: 1.4em;
  color: #1e293b;
}

.add-note-container .back-button {
  background: transparent;
  border: none;
  color: #4f46e5;
  font-size: 1em;
  font-weight: 600;
  cursor: pointer;
  padding: 6px 10px;
  border-radius: 8px;
  transition: background 0.2s ease;
}

.add-note-container .back-button:hover {
  background: rgba(99, 102, 241, 0.1);
}

/* --- Form --- */
.add-note-container .add-login-form {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

/* Text input */
.add-note-container .add-login-form input[type="text"] {
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

.add-note-container .add-login-form input:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
}

/* --- Editable Note Area --- */
.add-note-container #content {
  flex: 1;
  min-height: 180px;
  max-height: 240px;
  overflow-y: auto;
  padding: 12px;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  background-color: rgba(255, 255, 255, 0.9);
  font-size: 0.95em;
  color: #334155;
  outline: none;
  transition: border 0.2s, box-shadow 0.2s;
}

/* Placeholder styling for empty note */
.add-note-container #content:empty::before {
  content: attr(data-placeholder);
  color: #94a3b8;
  pointer-events: none;
}

.add-note-container #content:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
}

/* --- Save Button --- */
.add-note-container .save-button {
  margin-top: 12px;
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

.add-note-container .save-button:hover {
  background: linear-gradient(90deg, #4f46e5, #2563eb);
  animation: glow 0.4s alternate infinite;
}

.add-note-container .save-button:active {
  transform: scale(0.97);
}
  </style>
<div class="add-note-container">
  <div class="header">
    <button id="back-btn" class="back-button">← Back</button>
    <h3>Add New Note</h3>
  </div>

  <form id="add-login-form" class="add-login-form">
    <input type="text" id="title" placeholder="Title (e.g., My birthday)" />
    <div id="content" contenteditable="true" data-placeholder="1/1/1970"></div>
    <button type="submit" class="save-button">Save Note</button>
  </form>
</div>

  `;
export { addNoteUI };