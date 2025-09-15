# Aegis Vault - Secure Password Manager Chrome Extension

<div align="center">
  <img src="icons/icon128.png" alt="Aegis Vault Logo" width="128" height="128">
  
  [![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](manifest.json)
  
  **A quantum-resistant, military-grade password manager that transforms your browser into an impenetrable digital fortress**
</div>

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Security Architecture](#-security-architecture)
- [Installation](#-installation)
- [Development Setup](#-development-setup)
- [Usage Guide](#-usage-guide)
- [Project Structure](#-project-structure)
- [Technical Details](#-technical-details)
- [API Reference](#-api-reference)
- [Configuration](#-configuration)
- [Testing](#-testing)
- [Contributing](#-contributing)
- [Troubleshooting](#-troubleshooting)
- [License](#-license)
- [Acknowledgments](#-acknowledgments)

## 🔐 Overview

**Aegis Vault** is a state-of-the-art Chrome extension that provides uncompromising password management with local-only storage and military-grade encryption. Built as the final project for CS434, this extension demonstrates advanced cryptographic implementations and secure browser extension development practices.

Unlike cloud-based password managers, Aegis Vault stores all your credentials locally, encrypted with AES-256-GCM encryption and protected by PBKDF2-SHA-256 key derivation. Your master password never leaves your device, ensuring complete privacy and security.

### Key Differentiators

- **Zero-Knowledge Architecture**: Your passwords never touch external servers
- **Quantum-Resistant Cryptography**: Future-proof security implementation
- **Automatic Form Detection**: Intelligent credential capture and autofill
- **Session-Based Memory**: Secure key management with automatic locking
- **Domain-Smart Matching**: Intelligent TLD-based credential matching

## ✨ Features

### Core Functionality

#### 🔑 Password Management

- **Secure Vault Storage**: Store unlimited passwords with AES-256-GCM encryption
- **Password Generator**: Create cryptographically secure passwords with customizable parameters
  - Length configuration (16-200000 characters)
  - Character set selection (uppercase, lowercase, digits, special characters)
  - Similar character avoidance option
  - Required character group enforcement
- **Smart Organization**: Automatic domain-based credential organization
- **Quick Search**: Instant credential search and filtering

#### 🤖 Intelligent Autofill

- **Automatic Detection**: Identifies login forms on HTTPS websites
- **Smart Field Mapping**: Intelligently matches username and password fields
- **One-Click Fill**: Manual trigger option for enhanced control
- **SPA Support**: Works seamlessly with single-page applications
- **Submit Detection**: Captures credentials on form submission for saving/updating

#### 🔒 Security Features

- **Master Password Protection**: Single master password secures entire vault
- **Auto-Lock Timer**: Configurable automatic vault locking
- **Session-Based Encryption**: Keys stored only in browser session memory
- **Password Change Detection**: Automatic prompt to update changed passwords
- **Secure Random Generation**: Cryptographically secure random number generation

## 🛡️ Security Architecture

### Encryption Stack

```
┌─────────────────────────────────────┐
│         Master Password             │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│    PBKDF2-SHA-256 (200,000 iter)    │
│         Key Derivation              │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│     Master Encryption Key (MEK)     │
│         256-bit AES Key             │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│      AES-256-GCM Encryption         │
│    (Individual Credential Items)    │
└─────────────────────────────────────┘
```

### Security Measures

1. **Key Derivation**

   - PBKDF2-SHA-256 with 200,000 iterations
   - Random 128-bit salt per vault
   - Resistant to rainbow table attacks

2. **Encryption**

   - AES-256-GCM authenticated encryption
   - Unique IV for each encrypted item
   - Protection against tampering

3. **Memory Security**

   - Keys stored only in Chrome session storage
   - Automatic clearing on browser close
   - No persistent key storage

4. **Authentication**
   - HMAC-SHA-256 master password verification
   - Constant-time comparison to prevent timing attacks

## 📦 Installation

### From Source (Development)

1. **Clone the repository**

   ```bash
   git clone https://github.com/kaitouuuu/CS434_FinalProject.git
   cd CS434_FinalProject
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Build the extension**

   ```bash
   npm run build
   ```

4. **Load in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (top right)
   - Click "Load unpacked"
   - Select the project directory

### From Chrome Web Store (Production)

_Coming soon - Extension pending review_

## 🔧 Development Setup

### Prerequisites

- Node.js 14+ and npm 6+
- Chrome/Chromium browser (version 88+)
- Git for version control

### Environment Setup

1. **Install development dependencies**

   ```bash
   npm install --save-dev
   ```

2. **Development build with watch mode**
   ```bash
   npm run build -- --watch
   ```

### Build Configuration

The project uses Webpack for bundling:

```javascript
// webpack.config.js
module.exports = {
  entry: {
    popup: './popup.js',
    content: './content.js',
    bg: './bg.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].bundle.js'
  }
  // ... additional configuration
};
```

## 📖 Usage Guide

### Initial Setup

1. **First Run**

   - Click the Aegis Vault icon in Chrome toolbar
   - Create a strong master password
   - Confirm the password
   - Your vault is now initialized

2. **Adding Credentials**
   - Unlock your vault with master password
   - Click "Add New" button
   - Enter website, username, and password
   - Optional: Use password generator
   - Save the credential

### Daily Usage

#### Automatic Password Capture

1. Visit any HTTPS website
2. Log in normally
3. Aegis Vault detects the submission
4. Choose to save or update credentials

#### Manual Password Fill

1. Navigate to a login page
2. Click Aegis Vault icon
3. Select the credential
4. Click "Fill" button

#### Auto-fill (When Enabled)

1. Enable auto-fill in settings
2. Visit saved websites
3. Credentials fill automatically

### Advanced Features

#### Password Generation

```javascript
// Configuration options
{
  length: 16,           // Password length
  uppercase: true,      // Include A-Z
  lowercase: true,      // Include a-z
  digits: true,         // Include 0-9
  special: false,       // Include symbols
  avoidSimilar: true,   // Avoid O0Il1
  requireEach: true     // Ensure all selected types
}
```

#### Secure Notes

- Store sensitive information
- Full encryption like passwords
- Rich text support

## 📁 Project Structure

```
CS434_FinalProject/
├── dist/                      # Webpack build output
├── icons/                     # Extension icons
├── node_modules/              # NPM dependencies
├── .gitignore                 # Git ignore rules
├── README.md                  # This file
├── manifest.json              # Extension manifest
├── package.json               # NPM configuration
├── package-lock.json          # Dependency lock file
├── webpack.config.js          # Webpack configuration
├── bg.js                      # Background service worker
├── content.js                 # Content script for page interaction
├── popup.html                 # Popup UI HTML
├── popup.js                   # Popup UI logic
├── popup.css                  # Popup styling
├── state-manager.js           # Core state management
├── crypto-helper.js           # Cryptographic utilities
├── password-generator.js      # Secure password generation
└── mek-store.js               # Master key session storage
```

### File Descriptions

#### Core Components

- **`bg.js`**: Background service worker handling all secure operations, message routing, and auto-lock functionality
- **`content.js`**: Injected into web pages for form detection, autofill, and credential capture
- **`popup.js`**: Main UI controller
- **`state-manager.js`**: Centralized state management with encryption/decryption logic

#### Security Modules

- **`crypto-helper.js`**: Web Crypto API wrapper for AES-GCM and PBKDF2 operations
- **`password-generator.js`**: Cryptographically secure password generation with extensive options
- **`mek-store.js`**: Secure session-based storage for Master Encryption Key

#### Configuration Files

- **`manifest.json`**: Chrome extension manifest (Manifest V3)
- **`webpack.config.js`**: Build configuration for module bundling
- **`package.json`**: Project dependencies and scripts

## 🔬 Technical Details

### Dependencies

#### Production Dependencies

- **`idb-keyval`** (v6.2.2): IndexedDB wrapper for vault storage
- **`nanoid`** (v5.1.5): Secure unique ID generation
- **`tldts`** (v7.0.12): Domain parsing and TLD extraction

#### Development Dependencies

- **`webpack`** (v5.101.3): Module bundler
- **`webpack-cli`** (v6.0.1): Webpack command line interface
- **`css-loader`** (v7.1.2): CSS file loader
- **`style-loader`** (v4.0.0): Style injection

### Chrome APIs Used

- **`chrome.storage.session`**: Secure session storage for MEK
- **`chrome.runtime`**: Message passing between components
- **`chrome.tabs`**: Tab information and script injection
- **`chrome.alarms`**: Auto-lock timer implementation

### Cryptographic Implementation

#### Key Derivation

```javascript
async function deriveKeyPBKDF2(master, salt, iter = 200000) {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(master),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: iter,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}
```

#### Encryption Process

```javascript
async function aesGcmEncrypt(key, data) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(JSON.stringify(data));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  );
  return {
    iv: btoa(String.fromCharCode(...iv)),
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(ciphertext)))
  };
}
```

## 📡 API Reference

### Complete Message API Documentation

All communication between extension components (popup, background, content scripts) uses Chrome's message passing API. Below is the complete documentation for every message type.

---

### 🔐 Vault Management Messages

#### `SET_MASTER`

Initialize a new vault with master password

```javascript
// Request
chrome.runtime.sendMessage({
  type: 'SET_MASTER',
  master: 'user_password' // Master password for vault encryption
});

// Response
{
  ok: true;
} // Success
{
  ok: false;
} // Failure
```

#### `UNLOCK`

Unlock existing vault with master password

```javascript
// Request
chrome.runtime.sendMessage({
  type: 'UNLOCK',
  master: 'user_password' // Master password to decrypt vault
});

// Response
{
  ok: true;
} // Password correct, vault unlocked
{
  ok: false;
} // Incorrect password
```

#### `LOCK`

Lock the vault and clear session keys

```javascript
// Request
chrome.runtime.sendMessage({
  type: 'LOCK'
});

// Response
{
  ok: true;
} // Vault locked successfully
```

#### `GET_LOCK_STATE`

Check if vault is currently locked

```javascript
// Request
chrome.runtime.sendMessage({
  type: 'GET_LOCK_STATE'
});

// Response
{
  ok: true;
} // Vault is locked
{
  ok: false;
} // Vault is unlocked
```

#### `CHANGE_MASTER_PASSWORD`

Change the master password and re-encrypt vault

```javascript
// Request
chrome.runtime.sendMessage({
  type: 'CHANGE_MASTER_PASSWORD',
  oldMaster: 'current_password',
  newMaster: 'new_password'
});

// Response
{
  ok: true;
} // Password changed successfully
{
  ok: false;
} // Old password incorrect or operation failed
```

---

### 📝 Credential Management Messages

#### `ADD_LOGIN`

Save new credential to vault

```javascript
// Request
chrome.runtime.sendMessage({
  type: 'ADD_LOGIN',
  item: {
    domain: 'example.com', // Website domain
    title: 'Example Site', // Display name
    username: 'user@example.com', // Username/email
    password: 'secure_password' // Password to encrypt and store
  }
});

// Response
{
  ok: true;
} // Credential saved
{
  ok: false;
} // Save failed (vault locked or error)
```

#### `GET_VAULT`

Retrieve all credentials (decrypted if unlocked)

```javascript
// Request
chrome.runtime.sendMessage({
  type: 'GET_VAULT'
});

// Response (array of items)
[
  {
    id: 'unique-id-123',
    title: 'Example Site',
    domain: 'example.com',
    username: 'user@example.com'
    // Note: passwords not included in list view
  }
  // ... more items
];
// Returns empty array if locked or no items
```

#### `GET_ITEM`

Retrieve specific credential with password

```javascript
// Request
chrome.runtime.sendMessage({
  type: 'GET_ITEM',
  id: 'unique-id-123'  // Credential ID
});

// Response
{
  ok: true,
  item: {
    id: 'unique-id-123',
    title: 'Example Site',
    domain: 'example.com',
    username: 'user@example.com',
    password: 'decrypted_password'  // Full password included
  }
}
// Or { ok: false } if not found or locked
```

#### `SET_ITEM`

Update existing credential

```javascript
// Request
chrome.runtime.sendMessage({
  type: 'SET_ITEM',
  item: {
    id: 'unique-id-123', // Required: existing ID
    title: 'Updated Site Name',
    domain: 'newdomain.com',
    username: 'newuser@example.com',
    password: 'new_password'
  }
});

// Response
{
  ok: true;
} // Update successful
{
  ok: false;
} // Update failed
```

#### `DELETE_ITEM`

Remove credential from vault

```javascript
// Request
chrome.runtime.sendMessage({
  type: 'DELETE_ITEM',
  id: 'unique-id-123' // Credential ID to delete
});

// Response
{
  ok: true;
} // Deletion successful
{
  ok: false;
} // Deletion failed
```

#### `MATCH`

Find credentials matching a domain

```javascript
// Request
chrome.runtime.sendMessage({
  type: 'MATCH',
  domain: 'example.com' // Domain to search (supports subdomains)
});

// Response (array of matching items)
[
  {
    id: 'unique-id-123',
    title: 'Example Site',
    domain: 'example.com',
    username: 'user@example.com',
    password: 'decrypted_password'
  }
];
// Returns empty array if no matches
```

#### `CHECK_NEW_LOGIN`

Check if credentials are new, changed, or unchanged

```javascript
// Request
chrome.runtime.sendMessage({
  type: 'CHECK_NEW_LOGIN',
  domain: 'example.com',
  username: 'user@example.com',
  password: 'password123'
});

// Response
{ msg: 'NEW' }        // New credentials, not in vault
{ msg: 'UPDATE', id: 'unique-id-123' } // Password changed
{ msg: 'UNCHANGED' }  // Credentials already saved
```

---

### 🔑 Password Generator Messages

#### `GENERATE_PASSWORD`

Generate cryptographically secure password

```javascript
// Request
chrome.runtime.sendMessage({
  type: 'GENERATE_PASSWORD',
  options: {
    length: 16, // Password length (16-200000)
    uppercase: true, // Include A-Z
    lowercase: true, // Include a-z
    digits: true, // Include 0-9
    special: false, // Include symbols
    avoidSimilar: true, // Avoid O0Il1 etc
    requireEachSelected: true // Ensure all selected types present
  }
});

// Response
{
  password: 'GeneratedP@ssw0rd123';
}
```

---

### 📔 Note Management Messages

#### `ADD_NOTE`

Create encrypted note

```javascript
// Request
chrome.runtime.sendMessage({
  type: 'ADD_NOTE',
  item: {
    title: 'Secure Note Title',
    content: 'Encrypted note content...'
  }
});

// Response
{ ok: true, id: 'note-id-123' }  // Note created
{ ok: false }                     // Creation failed
```

#### `GET_ALL_NOTE`

Retrieve all notes (decrypted)

```javascript
// Request
chrome.runtime.sendMessage({
  type: 'GET_ALL_NOTE'
});

// Response (array)
[
  {
    id: 'note-id-123',
    title: 'Secure Note',
    content: 'Decrypted content...'
  }
];
// Returns empty array if locked
```

#### `GET_NOTE`

Retrieve specific note

```javascript
// Request
chrome.runtime.sendMessage({
  type: 'GET_NOTE',
  id: 'note-id-123'
});

// Response
{
  ok: true,
  note: {
    id: 'note-id-123',
    title: 'Secure Note',
    content: 'Decrypted content...'
  }
}
// Or { ok: false } if not found
```

#### `SET_NOTE`

Update existing note

```javascript
// Request
chrome.runtime.sendMessage({
  type: 'SET_NOTE',
  item: {
    id: 'note-id-123',
    title: 'Updated Title',
    content: 'Updated content...'
  }
});

// Response
{
  ok: true;
} // Update successful
{
  ok: false;
} // Update failed
```

#### `DELETE_NOTE`

Remove note from vault

```javascript
// Request
chrome.runtime.sendMessage({
  type: 'DELETE_NOTE',
  id: 'note-id-123'
});

// Response
{
  ok: true;
} // Deletion successful
{
  ok: false;
} // Deletion failed
```

---

### ⚙️ Settings Messages

#### `GET_AUTOFILL_SETTING`

Get autofill enabled status

```javascript
// Request
chrome.runtime.sendMessage({
  type: 'GET_AUTOFILL_SETTING'
});

// Response
{
  ok: true;
} // Autofill enabled
{
  ok: false;
} // Autofill disabled
```

#### `TOGGLE_AUTOFILL_SETTING`

Toggle autofill on/off

```javascript
// Request
chrome.runtime.sendMessage({
  type: 'TOGGLE_AUTOFILL_SETTING'
});

// Response
{ ok: true, enabled: true }  // Now enabled
{ ok: true, enabled: false } // Now disabled
```

#### `GET_TIMEOUT_LOCK`

Get auto-lock timeout setting

```javascript
// Request
chrome.runtime.sendMessage({
  type: 'GET_TIMEOUT_LOCK'
});

// Response
{
  timeout: 5;
} // Timeout in minutes
```

#### `SET_TIMEOUT_LOCK`

Set auto-lock timeout

```javascript
// Request
chrome.runtime.sendMessage({
  type: 'SET_TIMEOUT_LOCK',
  timeout: 15 // Minutes (>=1)
});

// Response
{
  ok: true;
} // Setting updated
{
  ok: false;
} // Update failed
```

---

### 🌐 Content Script Messages

#### `REQUEST_FILL`

Request credential fill from popup to content script

```javascript
// From popup/background to content script
chrome.tabs.sendMessage(tabId, {
  type: 'REQUEST_FILL',
  username: 'user@example.com', // Optional: specific credentials
  password: 'password' // Optional: specific password
});
```

## ⚙️ Configuration

### Auto-Lock Settings

Configure in popup settings

### Autofill Settings

- **Enable/Disable**: Toggle automatic form filling
- **Secure Context Only**: HTTPS only

### Password Generator Defaults

Configurable in `password-generator.js`:

```javascript
const defaults = {
  length: 16,
  uppercase: true,
  lowercase: true,
  digits: true,
  special: false,
  avoidSimilar: true,
  requireEachSelected: true
};
```

## 🙏 Acknowledgments

### Technologies & Libraries

- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API) - Browser cryptography
- [Chrome Extensions API](https://developer.chrome.com/docs/extensions/) - Extension framework
- [Webpack](https://webpack.js.org/) - Module bundling
- [Bootstrap Icons](https://icons.getbootstrap.com/) - UI icons
- [Font Awesome](https://fontawesome.com/) - Additional icons

### Special Thanks

- CS434 Course Instructors and TAs
- Open source community contributors
- Beta testers and security reviewers

---

<div align="center">
  <strong>Built with 🔐 for CS434 Final Project</strong>
  <br>
  <sub>Secure today, quantum-ready tomorrow</sub>
</div>
