# VirGO - Remote Control Application

> A cross-platform remote control system that turns your phone into a customizable controller for your computer. Built with **Tauri (Rust + React)** for the desktop host and **Expo React Native** for the mobile client.

[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20Linux-blue)]()
[![Mobile](https://img.shields.io/badge/mobile-iOS%20%7C%20Android-green)]()
[![License](https://img.shields.io/badge/license-MIT-orange)]()

---

## 🎯 Project Overview

VirGO enables remote control of a desktop computer from a mobile device over a local network. The desktop host runs a TCP server that receives input events (keyboard, mouse, gamepad) from the mobile client and simulates them natively on the OS.

### Key Features

| Feature | Description |
|---------|-------------|
| **Keyboard Control** | Send any key press/release (modifiers, arrows, function keys, Unicode) |
| **Mouse Control** | Relative mouse movement, left/right/middle click |
| **Virtual Gamepad** | Xbox-compatible virtual controller (ViGEm on Windows, uinput on Linux) |
| **Joystick Input** | Analog stick emulation for games |
| **Custom Layouts** | Drag-and-drop button editor with live preview |
| **Multi-profile** | Save/load/import/export controller configurations |
| **Cross-platform** | Windows & Linux desktop host, iOS & Android client |

---

## 🏗 Architecture

```
┌─────────────────────┐     TCP/8000      ┌─────────────────────┐
│   Mobile Client     │ ◄──────────────► │   Desktop Host      │
│  (Expo React Native)│   JSON Events    │   (Tauri + Rust)    │
└─────────────────────┘                   └─────────────────────┘
        │                                        │
        │                                        ▼
        │                              ┌─────────────────────┐
        │                              │  Input Simulation   │
        │                              │  • enigo (keys/mouse)│
        │                              │  • ViGEm (Windows)   │
        │                              │  • uinput (Linux)    │
        │                              └─────────────────────┘
        │
        ▼
┌─────────────────────┐
│  Controller Editor  │
│  • Drag-to-position │
│  • 3 button types   │
│  • Live preview     │
└─────────────────────┘
```

### Data Flow

```
User Touch → Gesture Handler → JSON Event → TCP Socket
                                                 │
                                    ┌────────────┴────────────┐
                                    ▼                         ▼
                            ┌───────────────┐         ┌───────────────┐
                            │  Key Event    │         │ Mouse Event   │
                            │  enigo.key()  │         │ enigo.move()  │
                            └───────────────┘         └───────────────┘
                                    │
                                    ▼
                            ┌───────────────┐
                            │ Joystick Event│
                            │ normalized_to_│
                            │ axis() →      │
                            │ VirtualGamepad│
                            └───────────────┘
```

---

## 🛠 Tech Stack

### Desktop Host (`DekstopRemoteHost/`)
| Layer | Technology |
|-------|------------|
| Framework | Tauri 2.x |
| Frontend | React 19 + TypeScript + Vite |
| Backend | Rust (async Tokio) |
| Input Sim | enigo, ViGEm (Windows), evdev/uinput (Linux) |
| Network | Tokio TcpListener |
| Mobile Bridge | adb reverse (USB debugging) |

### Mobile Client (`RemoteApp/`)
| Layer | Technology |
|-------|------------|
| Framework | Expo Router 56 (React Native 0.85) |
| UI | gluestack-ui + NativeWind (Tailwind) |
| Animations | react-native-reanimated 4, react-native-gesture-handler |
| Gestures | @fustaro/react-native-axis-pad (joystick) |
| Storage | react-native-mmkv |
| Network | react-native-tcp-socket |

---

## 📁 Project Structure (Demo)

```
VirGO-Demo/
├── README.md                 # This file
├── docs/
│   ├── ARCHITECTURE.md       # Detailed architecture docs
│   ├── API.md                # TCP protocol specification
│   └── CONTROLS.md           # Controller configuration guide
├── code-snippets/
│   ├── host/
│   │   ├── tcp-server.rs     # Rust TCP server + event loop
│   │   ├── input-sim.rs      # Keyboard/mouse/gamepad simulation
│   │   └── gamepad/          # Cross-platform virtual gamepad
│   │       ├── windows.rs    # ViGEm implementation
│   │       └── linux.rs      # uinput implementation
│   └── client/
│       ├── controller.tsx    # Main controller screen
│       ├── editor.tsx        # Drag-and-drop layout editor
│       ├── gestures.ts       # Reanimated gesture handlers
│       └── storage.ts        # MMKV config persistence
├── screenshots/              # Placeholder for demo media
└── .gitignore
```

---

## 🚀 Quick Start (Full Project)

> **Note**: This demo folder contains documentation and code snippets only. The full runnable project is in the private repository.

### Prerequisites
- **Desktop**: Rust 1.75+, Node 20+, Android device with USB debugging
- **Mobile**: Expo Go app or development build

### Desktop Host
```bash
cd DekstopRemoteHost
npm install
npm run tauri dev
# Click "Start" to launch TCP server on 127.0.0.1:8000
# Uses `adb reverse tcp:8000 tcp:8000` for phone connectivity
```

### Mobile Client
```bash
cd RemoteApp
npm install
npx expo start
# Scan QR with Expo Go (same WiFi) or USB with adb reverse
```

---

## 🎮 Controller Configuration

The mobile app includes a **visual layout editor**:

1. **Add Buttons** → Choose type: Key / Mouse / Joystick
2. **Drag to Position** → Real-time preview with gesture handlers
3. **Customize** → Size, border, radius, opacity, label
4. **Save Profile** → Stored locally via MMKV, exportable as JSON

### Button Types

| Type | Input Examples | Use Case |
|------|----------------|----------|
| `key` | `"a"`, `"shift"`, `"f1"`, `"arrowup"` | Gaming, shortcuts, typing |
| `mouse` | `"left"`, `"right"`, `"middle"`, `"mouse"` (drag) | FPS aim, UI navigation |
| `joystick` | Analog `x,y` (0.0–1.0) | Racing, platformers, 3D movement |

---

## 🔧 Technical Highlights

### Cross-Platform Virtual Gamepad
```rust
// Unified API, platform-specific impl
#[cfg(target_os = "windows")]
mod gamepad { /* ViGEm Xbox 360 emulation */ }

#[cfg(target_os = "linux")]
mod gamepad { /* evdev/uinput kernel device */ }

impl VirtualGamepad {
    fn set_axis(&mut self, x: i32, y: i32) -> Result<(), String>;
    fn button(&mut self, name: &str, pressed: bool) -> Result<(), String>;
}
```

### Reanimated 4 Gestures (60fps UI thread)
```typescript
const panGesture = Gesture.Pan()
  .onUpdate((e) => {
    tempX.value = savedX.value + e.translationX;
    tempY.value = savedY.value + e.translationY;
  })
  .onEnd(() => runOnJS(updatePositions)(id, tempX.value, tempY.value));
```

### TCP Protocol (Newline-delimited JSON)
```json
{"key":"a","action":"press","type":"key"}
{"key":"0.5,0.5","action":"drag","type":"mouse"}
{"key":"0.2,0.8","action":"joystick","type":"joystick"}
{"key":"a","action":"press","type":"gamepad_button"}
```

---

## 📸 Screenshots

> Add screenshots/GIFs to `screenshots/` folder:
- `desktop-host.png` - Tauri app with server status
- `mobile-home.png` - Profile list screen
- `mobile-editor.png` - Drag-and-drop layout editor
- `mobile-controller.png` - Active controller in landscape
- `demo.gif` - End-to-end demo

---

## 📄 License

MIT License - Feel free to use for learning or portfolio purposes.

---

## 👨‍💻 Author

**Your Name**  
[GitHub](https://github.com/yourusername) • [LinkedIn](https://linkedin.com/in/yourprofile) • [Portfolio](https://yourportfolio.dev)

> Built as a demonstration of full-stack systems programming: Rust async networking, cross-platform native APIs, React Native gesture systems, and Tauri desktop development.