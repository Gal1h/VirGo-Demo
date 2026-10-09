// VirGO Desktop Host - Input Simulation (Keyboard, Mouse, Gamepad)
// File: DekstopRemoteHost/src-tauri/src/lib.rs (excerpt)

use enigo::{Button, Coordinate, Direction::{Press, Release}, Enigo, Key, Keyboard, Mouse, Settings};
use serde::Deserialize;

#[derive(Debug, Deserialize)]
struct KeyEvent {
    #[serde(alias = "input")]
    key: String,
    action: String,
    #[serde(rename = "type", default = "default_event_type")]
    event_type: String,
}

fn default_event_type() -> String { "key".to_string() }

fn dispatch_event(enigo: &mut Enigo, gamepad: &mut Option<VirtualGamepad>, event: KeyEvent) {
    match event.event_type.as_str() {
        "mouse" => handle_mouse(enigo, event),
        "key"   => handle_key(enigo, event),
        "joystick" => handle_joystick(gamepad, event),
        "gamepad_button" => handle_gamepad_button(gamepad, event),
        _ => eprintln!("Unknown event type: {}", event.event_type),
    }
}

fn handle_mouse(enigo: &mut Enigo, event: KeyEvent) {
    if event.action == "drag" {
        // Relative mouse movement with sensitivity
        const SENSITIVITY: f32 = 1.8;
        if let Some((dx_str, dy_str)) = event.key.split_once(',') {
            if let (Ok(dx), Ok(dy)) = (dx_str.parse::<f32>(), dy_str.parse::<f32>()) {
                let final_dx = (dx * SENSITIVITY).round() as i32;
                let final_dy = (dy * SENSITIVITY).round() as i32;
                let _ = enigo.move_mouse(final_dx, final_dy, Coordinate::Rel);
            }
        }
    } else {
        // Mouse button press/release
        let button = match event.key.to_lowercase().as_str() {
            "left"   => Button::Left,
            "right"  => Button::Right,
            "middle" => Button::Middle,
            _ => { eprintln!("Unknown mouse button: {}", event.key); return; }
        };
        let direction = match event.action.as_str() {
            "press" | "pressed"   => Press,
            "release" | "released" => Release,
            _ => { eprintln!("Invalid mouse action: {}", event.action); return; }
        };
        let _ = enigo.button(button, direction);
    }
}

fn handle_key(enigo: &mut Enigo, event: KeyEvent) {
    let Some(key) = str_to_key(&event.key) else { return; };
    let result = match event.action.as_str() {
        "press" | "pressed"   => enigo.key(key, Press),
        "release" | "released" => enigo.key(key, Release),
        _ => { eprintln!("Invalid key action: {}", event.action); return; }
    };
    if let Err(e) = result { eprintln!("Enigo key error: {}", e); }
}

fn handle_joystick(gamepad: &mut Option<VirtualGamepad>, event: KeyEvent) {
    if let Some(gp) = gamepad {
        if let Some((x_str, y_str)) = event.key.split_once(',') {
            if let (Ok(x), Ok(y)) = (x_str.parse::<f32>(), y_str.parse::<f32>()) {
                let axis_x = normalized_to_axis(x);
                let axis_y = normalized_to_axis(y);
                let _ = gp.set_axis(axis_x, axis_y);
            }
        }
    }
}

fn handle_gamepad_button(gamepad: &mut Option<VirtualGamepad>, event: KeyEvent) {
    if let Some(gp) = gamepad {
        let pressed = matches!(event.action.as_str(), "press" | "pressed");
        let _ = gp.button(&event.key, pressed);
    }
}

/// Map key string to enigo Key (supports Unicode single chars)
fn str_to_key(name: &str) -> Option<Key> {
    match name.to_lowercase().as_str() {
        // Modifiers
        "shift" => Some(Key::Shift),
        "control" | "ctrl" => Some(Key::Control),
        "alt" => Some(Key::Alt),
        "meta" | "super" | "command" | "cmd" | "win" => Some(Key::Meta),
        "capslock" => Some(Key::CapsLock),
        // Whitespace / editing
        "enter" | "return" => Some(Key::Return),
        "tab" => Some(Key::Tab),
        "space" | " " => Some(Key::Space),
        "backspace" => Some(Key::Backspace),
        "delete" => Some(Key::Delete),
        "escape" | "esc" => Some(Key::Escape),
        // Arrows
        "arrowup" | "up" => Some(Key::UpArrow),
        "arrowdown" | "down" => Some(Key::DownArrow),
        "arrowleft" | "left" => Some(Key::LeftArrow),
        "arrowright" | "right" => Some(Key::RightArrow),
        // Navigation
        "home" => Some(Key::Home),
        "end" => Some(Key::End),
        "pageup" => Some(Key::PageUp),
        "pagedown" => Some(Key::PageDown),
        // Function keys
        "f1" => Some(Key::F1), "f2" => Some(Key::F2), "f3" => Some(Key::F3),
        "f4" => Some(Key::F4), "f5" => Some(Key::F5), "f6" => Some(Key::F6),
        "f7" => Some(Key::F7), "f8" => Some(Key::F8), "f9" => Some(Key::F9),
        "f10" => Some(Key::F10), "f11" => Some(Key::F11), "f12" => Some(Key::F12),
        // Single Unicode character
        s if s.chars().count() == 1 => Some(Key::Unicode(s.chars().next().unwrap())),
        _ => None,
    }
}

/// Convert normalized 0.0–1.0 to gamepad axis range -32768..32767
fn normalized_to_axis(value: f32) -> i32 {
    let clamped = value.clamp(0.0, 1.0);
    let centered = (clamped - 0.5) * 2.0; // -1.0 .. 1.0
    (centered * 32767.0).round() as i32
}