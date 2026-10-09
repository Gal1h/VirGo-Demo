# VirGO Setup & Run Instructions

> **Note**: This is documentation for the full project. The `VirGO-Demo` folder contains only documentation and code snippets for portfolio purposes.

---

## Prerequisites

### Desktop Host (Tauri + Rust)
| Tool | Version | Install |
|------|---------|---------|
| Rust | 1.75+ | `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \| sh` |
| Node.js | 20+ | `fnm install 20` or `nvm install 20` |
| pnpm/npm | 9+ | `corepack enable` |
| Android SDK | API 34 | Android Studio or `sdkmanager` |
| adb | Latest | Included in Android SDK platform-tools |
| ViGEm (Windows) | 1.22+ | [ViGEmBus](https://github.com/ViGEm/ViGEmBus/releases) |
| uinput (Linux) | Kernel 4.0+ | `sudo usermod -a -G input $USER` |

### Mobile Client (Expo React Native)
| Tool | Version | Install |
|------|---------|---------|
| Node.js | 20+ | Same as above |
| Expo CLI | 56+ | `npm install -g @expo/cli` |
| EAS CLI | Latest | `npm install -g eas-cli` |
| Android Studio / Xcode | Latest | For device builds |
| Expo Go | Latest | App Store / Play Store |

---

## Quick Start

### 1. Clone & Install Desktop Host
```bash
cd DekstopRemoteHost
npm install
# Install Rust dependencies (auto on first build)
```

### 2. Clone & Install Mobile Client
```bash
cd RemoteApp
npm install
```

### 3. Connect Android Device (USB)
```bash
# Enable USB debugging on phone
# Verify connection
adb devices
# Should show: <serial>    device
```

### 4. Start Desktop Host
```bash
cd DekstopRemoteHost
npm run tauri dev
# Tauri window opens
# Click "Start" button → Server runs on 127.0.0.1:8000
# adb reverse tcp:8000 tcp:8000 runs automatically
```

### 5. Start Mobile Client
```bash
cd RemoteApp
npx expo start
# Scan QR with Expo Go (same WiFi)
# OR: npx expo start --android (USB with adb)
```

### 6. Create Controller Profile
1. Mobile app opens → Home screen
2. Tap **Menu** (☰) → **+** (Add)
3. Add buttons: **Key** (WASD), **Mouse** (drag area), **Joystick**
4. Drag to position → Long-press to customize
5. Tap **✓** → Enter name → **Save**

### 7. Test Connection
1. Home screen → Tap your profile
2. Controller screen opens (landscape)
3. Press buttons → Desktop receives input!

---

## Platform-Specific Setup

### Windows: ViGEm Driver (Required for Gamepad)
1. Download [ViGEmBus_Setup_1.22.0.exe](https://github.com/ViGEm/ViGEmBus/releases)
2. Run installer → Restart
3. Verify: `sc query vigembus` → STATE: RUNNING

### Linux: uinput Permissions
```bash
# Add user to input group
sudo usermod -a -G input $USER
# Log out/in or reboot
# Verify: ls -la /dev/uinput → crw-rw---- root input
```

### Android: USB Debugging
1. Settings → About Phone → Tap Build Number 7×
2. Settings → Developer Options → USB Debugging ON
3. Connect USB → Allow debugging prompt on phone

---

## Building for Production

### Desktop Host (Tauri)
```bash
cd DekstopRemoteHost
npm run tauri build
# Output: src-tauri/target/release/bundle/
# - .msi (Windows)
# - .AppImage / .deb (Linux)
```

### Mobile Client (Expo/EAS)
```bash
cd RemoteApp
# Development build (required for TCP socket)
eas build --platform android --profile development
eas build --platform ios --profile development

# Production
eas build --platform all --profile production
# Output: .apk/.aab (Android), .ipa (iOS)
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `adb reverse` fails | Ensure phone connected, USB debugging ON, `adb devices` shows device |
| "Server already running" | Click Stop in Tauri app, or `pkill -f dekstopremotehost` |
| Gamepad not detected (Windows) | Install ViGEmBus, reboot, check Device Manager → "Xbox 360 Controller" |
| Gamepad not detected (Linux) | Add user to `input` group, logout/login, check `ls /dev/input/js*` |
| Mobile can't connect | Same WiFi? Firewall blocking 8000? Try USB with `adb reverse` |
| Reanimated gestures lag | Reduce button count, enable `enableExperimentalProfiling: false` in metro |
| MMKV data lost on reload | Use `npx expo start --clear` to reset Metro cache |

---

## Project Scripts Reference

### DekstopRemoteHost/package.json
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "tauri": "tauri"
  }
}
```

### RemoteApp/package.json
```json
{
  "scripts": {
    "start": "expo start",
    "reset-project": "node ./scripts/reset-project.js",
    "android": "expo run:android",
    "ios": "expo run:ios",
    "web": "expo start --web",
    "lint": "expo lint"
  }
}
```

---

## Environment Variables

### Desktop Host
```bash
# Optional: Custom server port (default 8000)
export VIRGO_PORT=8000

# Optional: Custom adb path
export ADB_PATH=/usr/local/bin/adb
```

### Mobile Client
```bash
# Optional: Custom host IP (default 127.0.0.1 via adb reverse)
export VIRGO_HOST=192.168.1.100
export VIRGO_PORT=8000
```

---

## Development Tips

### Hot Reload
- **Desktop**: `npm run tauri dev` → React hot reload + Rust rebuild on change
- **Mobile**: `npx expo start` → Fast refresh on save

### Debugging
- **Rust**: `cargo build` in `src-tauri/` → Check `target/debug/deps/`
- **React Native**: React Native Debugger / Flipper / `console.log` in Metro
- **TCP Traffic**: `nc -l 8000` or Wireshark filter `tcp.port == 8000`

### Logging
```rust
// Rust: env_logger
env_logger::try_init().ok();
eprintln!("Debug: {:?}", event);
```

```typescript
// TypeScript: React Native Logs
console.log("Event sent:", data);
// Enable remote JS debugging for console in browser
```

---

## CI/CD Pipeline (GitHub Actions Example)

```yaml
# .github/workflows/build.yml
name: Build
on: [push, pull_request]
jobs:
  desktop:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: cd DekstopRemoteHost && npm ci && npm run tauri build
      - uses: actions/upload-artifact@v4
        with: { name: virgo-windows, path: DekstopRemoteHost/src-tauri/target/release/bundle/** }

  mobile:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - uses: expo/expo-github-action@v8
      - run: cd RemoteApp && npm ci && npx eas build --platform android --profile preview --non-interactive
```

---

## Support

- **Issues**: GitHub Issues (private repo)
- **Architecture**: See `docs/ARCHITECTURE.md`
- **Protocol**: See `docs/API.md`
- **Controls**: See `docs/CONTROLS.md`