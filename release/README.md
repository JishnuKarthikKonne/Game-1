# PARADOX — Multi-Platform Release Distribution Hub

> **"Every move becomes part of your next problem."**  
> Standalone Windows, Android, and Web releases for PARADOX, the chrono-spatial 3D tactical puzzle game.

---

## 📦 Distribution Packages

| Platform | Target File | Architecture | Packaging Technology |
| :--- | :--- | :--- | :--- |
| **Windows Desktop** | `release/windows/PARADOX-Setup.exe` | x64 (64-bit) | Electron + NSIS Installer |
| **Windows Portable** | `release/windows/win-unpacked/` | x64 (64-bit) | Unpacked Executable |
| **Android (Debug)** | `release/android/PARADOX-debug.apk` | arm64-v8a / armeabi-v7a / x86_64 | Capacitor + Android Gradle |
| **Android (Release)** | `release/android/PARADOX-release.apk` | Universal APK | Signed / Unsigned Gradle Release |
| **Web Offline Bundle**| `release/web/PARADOX-web-v1.0.0.zip` | Cross-Platform | Vite Static Distribution |

---

## 🪟 Windows Desktop Installation Guide

### System Requirements
- **OS:** Windows 10 (1809+) or Windows 11 (64-bit)
- **Processor:** Intel Core i3 / AMD Ryzen 3 or equivalent
- **Memory:** 2 GB RAM (4 GB recommended)
- **Graphics:** DirectX 11 / OpenGL 3.3 compatible GPU
- **Storage:** 250 MB free drive space
- **Network:** None required (100% offline gameplay)

### How to Install
1. Download `PARADOX-Setup.exe` from the GitHub Releases page or build output.
2. Double-click `PARADOX-Setup.exe` to launch the standard Windows Setup Wizard.
3. Select your installation folder (defaults to `C:\Users\<User>\AppData\Local\Programs\PARADOX`).
4. Keep the checkbox **"Create Desktop Shortcut"** checked.
5. Click **Install**.
6. When installation finishes, check **"Run PARADOX"** and click **Finish**.

### ⚠️ Windows Defender SmartScreen Warning Notice
When installing on Windows, you may encounter a blue SmartScreen alert stating:
> **"Windows protected your PC"**  
> *Microsoft Defender SmartScreen prevented an unrecognized app from starting.*

**Why this appears:**  
This notification is standard for newly compiled community applications that do not possess a paid commercial Extended Validation (EV) code-signing certificate (which costs hundreds of dollars annually). It does not mean the application is unsafe.

**How to bypass safely:**
1. Click the text link that says **"More info"** on the dialog.
2. A new button labeled **"Run anyway"** will appear in the bottom-right corner.
3. Click **"Run anyway"** to proceed with installation.

---

## 📱 Android Installation & Sideloading Guide

### System Requirements
- **OS:** Android 8.0 Oreo (API level 26) or higher
- **RAM:** 2 GB or more
- **Graphics:** OpenGL ES 3.0 or Vulkan support
- **Permissions:** Zero special permissions required (no camera, contacts, or storage access needed)

### Sideloading Steps
1. Download `PARADOX-debug.apk` (or `PARADOX-release.apk`) to your Android device or transfer it via USB.
2. Tap the APK file in your notification panel or file manager (Files by Google, Samsung My Files, etc.).
3. If prompted with *"For your security, your phone is not allowed to install unknown apps from this source"*:
   - Tap **Settings**.
   - Enable the toggle **"Allow from this source"**.
   - Tap the Back button to return to the installer.
4. Tap **Install**.
5. Once installed, tap **Open** or launch PARADOX from your app drawer.

### ⚠️ Google Play Protect Dialog Notice
Because this build was packaged directly via Android SDK/Capacitor outside the Google Play Store, Play Protect may display a prompt:
> **"Blocked by Play Protect"** or **"Unrecognized app developer"**

**How to bypass safely:**
1. Tap **"More details"** (or the downward arrow).
2. Tap **"Install anyway"**.

---

## 🌐 Web & Browser Deployment

PARADOX is compiled with relative path routing (`base: './'`), meaning the `dist/` bundle can be served anywhere without path rewriting:

- **Local Preview:**  
  ```bash
  npm run preview
  ```
  Or run any static file server:
  ```bash
  npx serve dist
  ```
- **Static Hosting:** Works directly out-of-the-box on GitHub Pages, Cloudflare Pages, Netlify, Vercel, or an internal intranet server.
- **Offline PWA/Browser Storage:** Once the page loads in Chrome, Firefox, Safari, or Edge, all WebGL shaders, levels, and Web Audio synthesizers operate completely offline with no network connection.

---

## 🔑 Automated Keystore Signing for Android (CI/CD)

To generate a production release keystore and automate signed builds on GitHub:

### 1. Generate Keystore using Java `keytool`
Run this command in your terminal:
```bash
keytool -genkey -v -keystore release.keystore -alias paradox -keyalg RSA -keysize 2048 -validity 10000
```
Enter a secure password when prompted (e.g., for store and key).

### 2. Base64 Encode the Keystore
To store the binary `.keystore` file safely inside GitHub Secrets:

**Linux / macOS:**
```bash
base64 -w 0 release.keystore > keystore_base64.txt
# On macOS if -w 0 is unsupported:
base64 -i release.keystore -o keystore_base64.txt
```

**Windows PowerShell:**
```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("release.keystore")) | Out-File -Encoding ASCII keystore_base64.txt
```

### 3. Add GitHub Repository Secrets
Navigate to your GitHub Repository -> **Settings** -> **Secrets and variables** -> **Actions** -> **New repository secret**:

| Secret Name | Value |
| :--- | :--- |
| `ANDROID_KEYSTORE_BASE64` | Paste the exact string from `keystore_base64.txt` |
| `ANDROID_KEYSTORE_PASSWORD` | The password you entered for the keystore |
| `ANDROID_KEY_ALIAS` | `paradox` (or the alias you specified) |
| `ANDROID_KEY_PASSWORD` | The password for the alias |

Once configured, pushes with release tags (e.g. `git tag v1.0.0 && git push origin v1.0.0`) will automatically build signed APKs attached directly to GitHub Releases!

---

## 🛠️ Local Build Commands Reference

| Command | Action |
| :--- | :--- |
| `npm run dev` | Start development web server on port 3000 |
| `npm test` | Run headless simulation test suite (6 room solutions) |
| `npm run build` | Build production web bundle into `dist/` |
| `npm run electron:compile` | Compile Electron TypeScript files with esbuild into `dist-electron/` |
| `npm run electron:pack` | Build unpacked desktop application for local testing |
| `npm run electron:dist` | Build production Windows NSIS installer (`release/windows/PARADOX-Setup.exe`) |
| `npm run cap:sync` | Sync web bundle and plugins into Android project |
| `npx cap open android` | Open Android Studio project for local debugging |
