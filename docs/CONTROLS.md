# VirGO Controller Configuration Guide

## Overview

The mobile app features a **visual drag-and-drop layout editor** for creating custom controller profiles. Each profile defines a set of on-screen controls mapped to input events sent to the desktop host.

---

## Button Types

### 1. Key Button (`type: "key"`)
Standard keyboard key press/release.

| Property | Description |
|----------|-------------|
| `input` | Key identifier (see [Key Reference](#key-reference)) |
| `name` | Optional display label |
| Visual | Rectangular button with key label |

**Use Cases:** WASD movement, ability keys, shortcuts, text input

### 2. Mouse Button (`type: "mouse"`)
Mouse actions including buttons and drag area.

| Property | Description |
|----------|-------------|
| `input` | `"left"`, `"right"`, `"middle"`, or `"mouse"` (drag area) |
| `name` | Optional display label |
| Visual | Button for clicks, large transparent area for drag |

**Use Cases:** FPS camera control (drag area), click actions, RTS selection

### 3. Joystick (`type: "joystick"`)
Virtual analog stick using `@fustaro/react-native-axis-pad`.

| Property | Description |
|----------|-------------|
| `input` | Always `"joystick"` |
| `name` | Optional display label |
| Visual | Circular touch area with centered stick |

**Use Cases:** Racing games, platformers, 3D movement, twin-stick shooters

---

## Key Reference

### Standard Keys
```
Letters:      a b c d e f g h i j k l m n o p q r s t u v w x y z
Numbers:      0 1 2 3 4 5 6 7 8 9
Symbols:      ` - = [ ] \ ; ' , . / (shift variants)
```

### Special Keys
```
Modifiers:    shift, control/ctrl, alt, meta/super/command/cmd/win, capslock
Enter/Edit:   enter/return, tab, space, backspace, delete, escape/esc
Arrows:       arrowup/up, arrowdown/down, arrowleft/left, arrowright/right
Navigation:   home, end, pageup, pagedown
Function:     f1 f2 f3 f4 f5 f6 f7 f8 f9 f10 f11 f12
```

### Unicode
Any single character: `"あ"`, `"@"` `"#"` `"€"` etc.

---

## Visual Customization

Each button supports these style options (`option` object):

| Property | Range | Default | Description |
|----------|-------|---------|-------------|
| `width` | 0–300 | 100 | Button width (dp) |
| `height` | 0–300 | 100 | Button height (dp) |
| `borderWidth` | 0–10 | 0 | Border thickness |
| `borderRadius` | 0–100 | 0 | Corner radius (joystick forces 50%) |
| `borderColor` | CSS color | `"white"` | Border color |
| `opacity` | 0.0–1.0 | 1.0 | Overall opacity |

---

## Creating a Profile

### Step 1: Open Editor
1. Tap **Menu** (☰) on home screen
2. Tap **+** (Add) to create new, or select existing config → **Edit**

### Step 2: Add Controls
1. Tap **+** in editor drawer
2. New button appears at center with default properties
3. Long-press any button to edit

### Step 3: Configure Button
**Long-press a button** to open edit dialog:

| Tab | Settings |
|-----|----------|
| **Type** | Select: Key / Mouse / Joystick |
| **Input** | Key: text field; Mouse: dropdown (left/right/middle/mouse); Joystick: auto |
| **Name** | Optional label for identification |
| **Size** | Width/Height sliders (joystick: linked) |
| **Style** | Border width, radius, color, opacity |

### Step 4: Position
**Drag buttons** to desired screen positions:
- Real-time preview with gesture handlers
- Coordinates stored as `x`, `y` (center-relative, can be negative)

### Step 5: Save
1. Tap **✓** (Check) in editor drawer
2. Enter profile name
3. Tap **Save** → Returns to home screen

---

## Profile Management

| Action | Method |
|--------|--------|
| **Load** | Tap profile card on home screen |
| **Edit** | Long-press profile → Edit, or enter editor → load existing |
| **Copy** | Long-press profile → Copy (JSON to clipboard) |
| **Import** | Menu → ↓ (Download) → Paste JSON → Import |
| **Delete** | Long-press profile → Delete |
| **Export** | Long-press profile → Copy → Paste anywhere |

---

## Example Profiles

### FPS / First-Person Shooter
```json
{
  "name": "FPS Standard",
  "buttons": [
    {"input":"w","type":"key","x":-120,"y":-200,"option":{"width":80,"height":80,"borderRadius":12}},
    {"input":"a","type":"key","x":-210,"y":-110,"option":{"width":80,"height":80,"borderRadius":12}},
    {"input":"s","type":"key","x":-120,"y":-20,"option":{"width":80,"height":80,"borderRadius":12}},
    {"input":"d","type":"key","x":-30,"y":-110,"option":{"width":80,"height":80,"borderRadius":12}},
    {"input":"mouse","type":"mouse","x":150,"y":0,"option":{"width":300,"height":400,"opacity":0.1,"borderWidth":0}},
    {"input":"left","type":"mouse","x":280,"y":150,"option":{"width":80,"height":80,"borderRadius":40}},
    {"input":"shift","type":"key","x":-210,"y":100,"option":{"width":80,"height":50,"borderRadius":8}},
    {"input":"space","type":"key","x":-30,"y":100,"option":{"width":160,"height":50,"borderRadius":8}}
  ]
}
```

### Racing Game
```json
{
  "name": "Racing",
  "buttons": [
    {"input":"joystick","type":"joystick","x":-150,"y":50,"option":{"width":150,"height":150,"borderRadius":75,"borderColor":"#06b6d4"}},
    {"input":"a","type":"gamepad_button","x":150,"y":50,"option":{"width":80,"height":80,"borderRadius":40,"borderColor":"#22c55e"}},
    {"input":"b","type":"gamepad_button","x":240,"y":-20,"option":{"width":60,"height":60,"borderRadius":30,"borderColor":"#ef4444"}},
    {"input":"x","type":"gamepad_button","x":240,"y":120,"option":{"width":60,"height":60,"borderRadius":30,"borderColor":"#3b82f6"}},
    {"input":"y","type":"gamepad_button","x":150,"y":200,"option":{"width":60,"height":60,"borderRadius":30,"borderColor":"#f59e0b"}}
  ]
}
```

### Media / Presentation Remote
```json
{
  "name": "Media Control",
  "buttons": [
    {"input":"space","type":"key","x":0,"y":-100,"option":{"width":120,"height":80,"borderRadius":16}},
    {"input":"arrowleft","type":"key","x":-140,"y":0,"option":{"width":80,"height":80,"borderRadius":12}},
    {"input":"arrowright","type":"key","x":140,"y":0,"option":{"width":80,"height":80,"borderRadius":12}},
    {"input":"arrowup","type":"key","x":0,"y":-200,"option":{"width":80,"height":80,"borderRadius":12}},
    {"input":"arrowdown","type":"key","x":0,"y":200,"option":{"width":80,"height":80,"borderRadius":12}},
    {"input":"f","type":"key","x":-140,"y":100,"option":{"width":80,"height":50,"borderRadius":8}},
    {"input":"m","type":"key","x":140,"y":100,"option":{"width":80,"height":50,"borderRadius":8}}
  ]
}
```

---

## Tips & Best Practices

### Layout Design
- **Thumb zones**: Place primary controls in lower corners (natural thumb reach)
- **Spacing**: Leave gaps between buttons to avoid accidental presses
- **Visual hierarchy**: Larger/more opaque = primary actions
- **Joystick placement**: Left for movement, right for camera/aim

### Performance
- Limit total buttons to ~15 for 60fps gesture handling
- Use `opacity < 1` for large drag areas to see content underneath
- Joystick `borderRadius: 50%` (half width) for proper circle

### Testing
1. Save profile → Tap to load in controller screen
2. Test each button → Verify desktop receives input
3. Adjust positions/sizes as needed
4. Export JSON for backup/sharing

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Button not responding | Check `input` value matches key reference exactly |
| Joystick not centered | Ensure `borderRadius = width/2` |
| Mouse drag too fast/slow | Sensitivity is fixed at 1.8x server-side; adjust drag distance |
| Gamepad not working | Desktop: Windows needs ViGEm driver; Linux needs uinput permissions (`sudo usermod -a -G input $USER`) |
| Profile not saving | Check storage permission; try shorter name |

---

## JSON Schema (Validation)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["id", "name", "buttons"],
  "properties": {
    "id": {"type": "string"},
    "name": {"type": "string", "minLength": 1},
    "buttons": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "input", "type", "x", "y", "option"],
        "properties": {
          "id": {"type": "string"},
          "input": {"type": "string"},
          "name": {"type": "string"},
          "type": {"enum": ["key", "mouse", "joystick"]},
          "x": {"type": "number"},
          "y": {"type": "number"},
          "option": {
            "type": "object",
            "required": ["width", "height", "borderRadius", "borderColor", "opacity"],
            "properties": {
              "width": {"type": "number", "minimum": 0, "maximum": 300},
              "height": {"type": "number", "minimum": 0, "maximum": 300},
              "borderWidth": {"type": "number", "minimum": 0, "maximum": 10, "default": 0},
              "borderRadius": {"type": "number", "minimum": 0, "maximum": 100},
              "borderColor": {"type": "string", "format": "css-color"},
              "opacity": {"type": "number", "minimum": 0, "maximum": 1}
            }
          }
        }
      }
    }
  }
}
```