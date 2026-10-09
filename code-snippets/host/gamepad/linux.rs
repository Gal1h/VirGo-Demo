// VirGO Desktop Host - Linux Virtual Gamepad (evdev/uinput)
// File: DekstopRemoteHost/src-tauri/src/lib.rs (excerpt)

#[cfg(target_os = "linux")]
mod gamepad {
    use evdev::{
        uinput::VirtualDevice, AbsoluteAxisCode, AttributeSet, EventType,
        InputEvent, KeyCode, UinputAbsSetup,
    };

    pub struct VirtualGamepad {
        device: VirtualDevice,
    }

    impl VirtualGamepad {
        pub fn new() -> Result<Self, String> {
            // Define supported buttons (Xbox layout)
            let mut keys = AttributeSet::<KeyCode>::new();
            keys.insert(KeyCode::BTN_SOUTH);   // A
            keys.insert(KeyCode::BTN_EAST);    // B
            keys.insert(KeyCode::BTN_NORTH);   // X
            keys.insert(KeyCode::BTN_WEST);    // Y
            keys.insert(KeyCode::BTN_TL);      // LB
            keys.insert(KeyCode::BTN_TR);      // RB
            keys.insert(KeyCode::BTN_SELECT);  // Select/Back
            keys.insert(KeyCode::BTN_START);   // Start
            keys.insert(KeyCode::BTN_THUMBL);  // Left stick click
            keys.insert(KeyCode::BTN_THUMBR);  // Right stick click

            // Axis setup: standard gamepad range -32768..32767
            let abs_setup = |code: AbsoluteAxisCode| -> UinputAbsSetup {
                UinputAbsSetup::new(
                    code,
                    evdev::AbsInfo::new(0, -32768, 32767, 16, 128, 0),
                )
            };

            let device = VirtualDevice::builder()
                .map_err(|e| format!("VirtualDeviceBuilder error: {}", e))?
                .name("VirGO Virtual Gamepad")
                .with_keys(&keys)
                .map_err(|e| format!("Failed to set keys: {}", e))?
                .with_absolute_axis(&abs_setup(AbsoluteAxisCode::ABS_X))
                .map_err(|e| format!("Failed to set ABS_X: {}", e))?
                .with_absolute_axis(&abs_setup(AbsoluteAxisCode::ABS_Y))
                .map_err(|e| format!("Failed to set ABS_Y: {}", e))?
                .with_absolute_axis(&abs_setup(AbsoluteAxisCode::ABS_RX))
                .map_err(|e| format!("Failed to set ABS_RX: {}", e))?
                .with_absolute_axis(&abs_setup(AbsoluteAxisCode::ABS_RY))
                .map_err(|e| format!("Failed to set ABS_RY: {}", e))?
                .build()
                .map_err(|e| format!("Failed to build virtual device: {}", e))?;

            eprintln!("VirGO Virtual Gamepad created (Linux/uinput)");
            Ok(Self { device })
        }

        pub fn set_axis(&mut self, x: i32, y: i32) -> Result<(), String> {
            let events = [
                InputEvent::new(EventType::ABSOLUTE.0, AbsoluteAxisCode::ABS_X.0, x),
                InputEvent::new(EventType::ABSOLUTE.0, AbsoluteAxisCode::ABS_Y.0, y),
                InputEvent::new(EventType::SYNCHRONIZATION.0, 0, 0), // SYN_REPORT
            ];
            self.device.emit(&events)
                .map_err(|e| format!("Failed to emit axis events: {}", e))
        }

        pub fn button(&mut self, name: &str, pressed: bool) -> Result<(), String> {
            let code = match name.to_lowercase().as_str() {
                "a" | "btn_a" => KeyCode::BTN_SOUTH,
                "b" | "btn_b" => KeyCode::BTN_EAST,
                "x" | "btn_x" => KeyCode::BTN_NORTH,
                "y" | "btn_y" => KeyCode::BTN_WEST,
                "lb" | "l1" | "btn_tl" => KeyCode::BTN_TL,
                "rb" | "r1" | "btn_tr" => KeyCode::BTN_TR,
                "select" | "back" => KeyCode::BTN_SELECT,
                "start" => KeyCode::BTN_START,
                "ls" | "l3" => KeyCode::BTN_THUMBL,
                "rs" | "r3" => KeyCode::BTN_THUMBR,
                _ => return Err(format!("Unknown gamepad button: {}", name)),
            };
            let events = [
                InputEvent::new(EventType::KEY.0, code.0, if pressed { 1 } else { 0 }),
                InputEvent::new(EventType::SYNCHRONIZATION.0, 0, 0),
            ];
            self.device.emit(&events)
                .map_err(|e| format!("Failed to emit button event: {}", e))
        }
    }
}