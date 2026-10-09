# Screenshots & Media

Add your demo media files here for the portfolio README.

## Recommended Files

| File | Description | Suggested Size |
|------|-------------|----------------|
| `desktop-host.png` | Tauri app with server status | 1280×720 |
| `mobile-home.png` | Profile list screen | 1080×1920 |
| `mobile-editor.png` | Drag-and-drop layout editor | 1080×1920 |
| `mobile-controller.png` | Active controller (landscape) | 1920×1080 |
| `demo.gif` | End-to-end demo recording | 1280×720, <10MB |
| `architecture.png` | Architecture diagram export | 1280×720 |

## Capturing Screenshots

### Desktop (Tauri)
```bash
# Windows: Win+Shift+S
# Linux: Flameshot / GNOME Screenshot
# macOS: Cmd+Shift+4
```

### Mobile (Expo)
```bash
# Expo Go: Shake device → "Save Screenshot"
# Android: adb exec-out screencap -p > screenshot.png
# iOS: Simulator → File → New Screenshot
```

### GIF Recording
```bash
# Linux: peek / byzanz
# Windows: ScreenToGif
# macOS: Kap / Gifox
# Cross-platform: ffmpeg
ffmpeg -f x11grab -r 15 -s 1280x720 -i :0.0 -vf "fps=10,scale=640:-1:flags=lanczos" demo.gif
```

## Placeholder

> Replace this folder's contents with actual screenshots before publishing to GitHub.