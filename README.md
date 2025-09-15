# Aegis Vault - Secure Password Manager Chrome Extension

<div align="center">
  <img src="icons/icon128.png" alt="Aegis Vault Logo" width="128" height="128">
  
  [![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](manifest.json)
  
  **A quantum-resistant, military-grade password manager that transforms your browser into an impenetrable digital fortress**
</div>

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Installation](#-installation)
- [Development Setup](#-development-setup)
- [Usage Guide](#-usage-guide)
- [Project Structure](#-project-structure)
- [Acknowledgments](#-acknowledgments)

## 🔐 Overview

**Aegis Vault** is a Chrome extension that provides uncompromising password management with local-only storage and encryption. Built as the final project for CS434, this extension demonstrates advanced cryptographic implementations and secure browser extension development practices.

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
