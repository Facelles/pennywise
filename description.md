# 🚀 Massive Pennywise Update (Modernization & PiP)

This update focuses on a complete overhaul of the project infrastructure, ensuring stable operation on modern **Node.js (v20+)** environments and full native support for **Apple Silicon (M1/M2/M3)**. We have also fundamentally improved YouTube playback, added ad-blocking capabilities, and refined the floating window behavior on macOS.

---

## 🛠 Key Changes

### 1. 🍏 Native Apple Silicon (ARM64) Support
- **Electron Upgrade**: Updated `electron` to `^28.0.0`. The application now runs natively on M-series chips without requiring Rosetta emulation, significantly improving performance and battery life.
- **Dependency Cleanup**: Removed legacy libraries (`spectron`, `mocha`) that were causing `yarn install` failures on `arm64` architectures.
- **Modern APIs**: Migrated from the deprecated `url.parse()` to the modern `new URL()` standard in `public/electron.js`.

### 2. 🎬 True macOS Picture-in-Picture (PiP)
- Window behavior now perfectly aligns with macOS standards. The `mainWindow.setAlwaysOnTop` level has been elevated to `screen-saver`, ensuring the video stays on top of **all applications**, including those in native fullscreen mode.

### 3. ▶️ YouTube Playback & Frameless AdBlock Engine
- **Playback Reliability**: Removed forced `/embed/` URL coercion which frequently caused `150/152/153` errors due to CORS and Referer restrictions.
- **Restriction Bypass**: Implemented dynamic `Referer` header injection and bypassed Chromium's `autoplay-policy` via command-line flags.
- **Frameless Mode & Ad Skipping**: Instead of restricted embeds, we now use standard video pages with a custom JavaScript and CSS payload injected on `dom-ready`. This engine:
    - Hides all YouTube UI elements for a clean "Frameless" look.
    - Forces the video to fill the entire window.
    - **Automatically skips or fast-forwards through in-stream ads.**

### 4. ⚙️ Technical Compatibility (Node.js 20+ & Cross-Platform)
- **CSS Preprocessing**: Replaced `node-sass` (which failed to compile on modern Node versions) with the pure-JS `sass` (Dart Sass).
- **Core Updates**: Upgraded `react-scripts` to `^5.0.1` for Webpack 5 support.
- **OpenSSL 3.0 Fix**: Resolved the `ERR_OSSL_EVP_UNSUPPORTED` error common in Node 17+ by configuring `NODE_OPTIONS=--openssl-legacy-provider`.
- **Environment Cleanliness**: Added `.env` with `SKIP_PREFLIGHT_CHECK=true` and removed `package-lock.json` to ensure consistent Yarn-based dependency resolution.

---

## 🧪 Testing Results
- **Platforms**: macOS (Intel / Apple Silicon) ✅, Windows 10/11 ✅
- **Environments**: Node.js `v20.16.x` and `v22+`
- All commands (`yarn install`, `yarn start`, `yarn build`) are fully functional and error-free.

🚀 *The project is now modernized and ready for open-source contribution!*
