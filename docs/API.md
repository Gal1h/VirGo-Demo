# VirGO TCP Protocol Specification

## Overview

The mobile client communicates with the desktop host via a raw TCP connection on port 8000. Messages are **newline-delimited JSON** (NDJSON) — each line is a complete, independent event.

```
Client                          Server
  │                                │
  │──── TCP Connect ─────────────►│
  │                                │
  │──── {"key":"w","action":"press","type":"key"}\n ────►│
  │                                │
  │◄─── ACK (optional) ────────────│
  │                                │
```

---

## Connection

| Parameter | Value |
|-----------|-------|
| Host | `127.0.0.1` (via `adb reverse tcp:8000 tcp:8000`) |
| Port | `8000` |
| Protocol | Raw TCP (no TLS in current version) |
| Encoding | UTF-8 |
| Delimiter | `\n` (LF) |

---

## Message Format

### Base Structure
```json
{
  "key": "string",
  "action": "string",
  "type": "key" | "mouse" | "joystick" | "gamepad_button"
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `key` | Yes | Input identifier (key name, mouse button, or coordinate string) |
| `action` | Yes | Action type (press, release, drag, joystick) |
| `type` | No | Event category (defaults to `"key"`) |

---

## Event Types

### 1. Keyboard Events (`type: "key"`)

```json
{"key":"w","action":"press","type":"key"}
{"key":"shift","action":"release","type":"key"}
{"key":"f1","action":"press","type":"key"}
{"key":"arrowup","action":"press","type":"key"}
{"key":"あ","action":"press","type":"key"}
```

**Supported Keys:**
| Category | Keys |
|----------|------|
| Modifiers | `shift`, `control`/`ctrl`, `alt`, `meta`/`super`/`command`/`cmd`/`win`, `capslock` |
| Whitespace | `enter`/`return`, `tab`, `space`, `backspace`, `delete`, `escape`/`esc` |
| Arrows | `arrowup`/`up`, `arrowdown`/`down`, `arrowleft`/`left`, `arrowright`/`right` |
| Navigation | `home`, `end`, `pageup`, `pagedown` |
| Function | `f1`–`f12` |
| Unicode | Any single character (e.g., `"a"`, `"1"`, `"@"`, `"あ"`) |

**Actions:**
- `"press"` / `"pressed"` → Key down
- `"release"` / `"released"` → Key up

---

### 2. Mouse Events (`type: "mouse"`)

#### Relative Movement (Drag)
```json
{"key":"10.5,-5.2","action":"drag","type":"mouse"}
```
- `key`: `"dx,dy"` — relative coordinates as floats
- `action`: `"drag"` (only supported action for movement)
- Sensitivity multiplier: **1.8x** (applied server-side)

#### Button Events
```json
{"key":"left","action":"press","type":"mouse"}
{"key":"right","action":"release","type":"mouse"}
{"key":"middle","action":"press","type":"mouse"}
```
- `key`: `"left"`, `"right"`, `"middle"`
- `action`: `"press"`/`"pressed"` or `"release"`/`"released"`

---

### 3. Joystick Events (`type: "joystick"`)

```json
{"key":"0.5,0.5","action":"joystick","type":"joystick"}
{"key":"0.2,0.8","action":"joystick","type":"joystick"}
{"key":"0.0,1.0","action":"joystick","type":"joystick"}
```

- `key`: `"x,y"` — normalized coordinates (0.0 to 1.0)
  - `0.5, 0.5` = center (neutral)
  - `0.0, 0.5` = full left
  - `1.0, 0.5` = full right
  - `0.5, 0.0` = full up
  - `0.5, 1.0` = full down
- `action`: `"joystick"` (constant)
- **Conversion**: `normalized_to_axis(value)` maps 0.0–1.0 → -32768..32767

---

### 4. Gamepad Button Events (`type: "gamepad_button"`)

```json
{"key":"a","action":"press","type":"gamepad_button"}
{"key":"lb","action":"release","type":"gamepad_button"}
{"key":"start","action":"press","type":"gamepad_button"}
```

**Supported Buttons:**
| Alias | Standard | Description |
|-------|----------|-------------|
| `a` / `btn_a` | `A` | South face button |
| `b` / `btn_b` | `B` | East face button |
| `x` / `btn_x` | `X` | North face button |
| `y` / `btn_y` | `Y` | West face button |
| `lb` / `l1` / `btn_tl` | `LB` | Left bumper |
| `rb` / `r1` / `btn_tr` | `RB` | Right bumper |
| `select` / `back` | `Back` | Select/Back |
| `start` | `Start` | Start button |
| `ls` / `l3` | `LThumb` | Left stick click |
| `rs` / `r3` | `RThumb` | Right stick click |

**Actions:**
- `"press"` / `"pressed"` → Button down
- `"release"` / `"released"` → Button up

---

## Error Handling

### Client-Side
- Auto-reconnect on disconnect (exponential backoff)
- Queue events during disconnect, flush on reconnect
- Show "Device Disconnected" toast with "Try Again" button

### Server-Side
- Invalid JSON → Log error, continue
- Unknown key/action/type → Log warning, ignore event
- Enigo/Gamepad errors → Log error, continue processing
- Client disconnect → Clean up connection task, keep server running

---

## Example Session

```
# Client connects
# User presses 'W' key
{"key":"w","action":"press","type":"key"}

# User drags mouse (right 10, down 5)
{"key":"10,-5","action":"drag","type":"mouse"}

# User moves joystick (up-right)
{"key":"0.7,0.3","action":"joystick","type":"joystick"}

# User presses gamepad A button
{"key":"a","action":"press","type":"gamepad_button"}

# User releases 'W'
{"key":"w","action":"release","type":"key"}

# User releases gamepad A
{"key":"a","action":"release","type":"gamepad_button"}

# Client disconnects (TCP FIN)
```

---

## Implementation Notes

### Mobile Client (TypeScript)
```typescript
// tcp-socket write with newline delimiter
const sendEvent = (event: KeyEvent) => {
  const data = JSON.stringify(event) + '\n';
  socket.write(data);
};
```

### Desktop Host (Rust)
```rust
// Reading with newline framing
let mut buf = [0; 1024];
let mut leftover = String::new();
loop {
    let n = socket.read(&mut buf).await?;
    if n == 0 { return; }
    leftover.push_str(&String::from_utf8_lossy(&buf[..n]));
    while let Some(pos) = leftover.find('\n') {
        let line = leftover[..pos].trim().to_string();
        leftover = leftover[pos + 1..].to_string();
        if !line.is_empty() {
            tx.send(line)?;  // Forward to worker thread
        }
    }
}
```

---

## Version History

| Version | Changes |
|---------|---------|
| 1.0 | Initial protocol: key, mouse, joystick, gamepad_button |
| 1.1 | Added Unicode key support, sensitivity config |

---

## Future Extensions

- **Acknowledgment packets** for reliable delivery
- **Batch events** for lower overhead
- **Heartbeat/ping** for connection health
- **Capability negotiation** on connect
- **Compression** for high-frequency joystick updates