# PARADOX
### *Every move becomes part of your next problem.*

A single-player 3D tactical puzzle game built with **React 19**, **TypeScript**, **Three.js**, and **Tailwind CSS**. Packaged for standalone distribution on **Windows (.exe)**, **Android (.apk)**, and **Modern Web Browsers**.

---

## 🎮 The Premise & Mechanics

You are trapped inside an experimental chrono-spatial research facility. The facility's automated observation matrix records your every step.

When you restart a room, your previous attempt materializes as a translucent **Echo** that faithfully mirrors your past timeline. 

- **Your Past Is Your Present Ally:** Stand on pressure plates in attempt 1 so your Echo holds doors open for you in attempt 2.
- **Causality & Paradoxes:** Lasers that blocked you previously can be redirected or shielded by past selves.
- **Turn-Based Determinism:** Every move (WASD / D-Pad), wait, interaction, or camera turn consumes one logical turn. Replays are 100% deterministic.
- **Optical Laser System:** Real-time beam tracing reflecting off rotatable 45° mirrors and triggering optical photoreceptors.

---

## 🕹️ Controls

| Action | Keyboard / Mouse | Touch / Mobile |
| :--- | :--- | :--- |
| **Move North / South / East / West** | `W` `A` `S` `D` / Arrow Keys | On-Screen Tactical D-Pad |
| **Interact / Toggle Mirror / Switch** | `Spacebar` / Mouse Click | `ACT` / Interact Button |
| **Record Attempt as Echo** | `R` | `REWIND & RECORD ECHO` |
| **Undo Last Step** | `U` or `Z` | `UNDO STEP` |
| **Wait Turn (Skip move)** | `X` | `WAIT` Button |
| **Tactical Hints** | `H` | `HINTS` Button |
| **Rotate Camera** | `Q` / `E` or Drag Canvas | Camera Controls / Drag |
| **Pause Menu** | `Escape` | `PAUSE` Button / Android Back Button |

---

## 📦 Multi-Platform Releases & Distribution

PARADOX is engineered for cross-platform distribution without remote runtime dependencies:

- **Windows Desktop:** Standalone NSIS installer `release/windows/PARADOX-Setup.exe` built with Electron and electron-builder.
- **Android Native:** Immersive fullscreen APKs `release/android/PARADOX-debug.apk` and `release/android/PARADOX-release.apk` built with Capacitor.
- **Web Browser:** Lightweight static bundle in `dist/` with relative asset addressing (`base: './'`).

For installation instructions, SmartScreen guidance, Android sideloading, and signing keys, see [`release/README.md`](release/README.md).

---

## 🚀 Developer Quickstart

### Prerequisites
- Node.js 20+ (Node 22 recommended)
- npm 10+

### Installation & Development
```bash
# Clone the repository
git clone https://github.com/your-username/paradox.git
cd paradox

# Install all dependencies
npm install

# Start local development server (port 3000)
npm run dev
```

### Run Automated Simulation Tests
PARADOX features a headless unit-test suite executing real multi-step puzzle solutions against all 5 campaign chambers:
```bash
npm test
```

### Build Web Production Bundle
```bash
npm run build
```

### Build Windows Desktop Installer
```bash
# Compiles Electron main & preload with esbuild, then packages NSIS installer
npm run electron:dist
```

### Sync & Build Android
```bash
npm run cap:sync
cd android && ./gradlew assembleDebug
```

---

## 🛠️ Technology Stack

- **Framework:** React 19, TypeScript
- **3D Engine:** Three.js (procedural geometry, custom shaders, software WebGL fallback safe)
- **Audio:** Web Audio API procedural synthesizer (zero external sound files, 100% offline)
- **Styling:** Tailwind CSS v4, Chakra Petch & JetBrains Mono typography
- **Desktop Wrapper:** Electron 45, electron-builder
- **Mobile Engine:** Capacitor 8
- **Testing:** Node.js native test runner (`node:test`, `node:assert/strict`)

---

## 📜 License
Apache-2.0 License.
