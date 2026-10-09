// VirGO Desktop Host - Windows Virtual Gamepad (ViGEm)
// File: DekstopRemoteHost/src-tauri/src/lib.rs (excerpt)

#[cfg(target_os = "windows")]
mod gamepad {
    use vigem_client::{Client, TargetId, Xbox360Wired, XUsb, XButtons};
    use std::error::Error;

    pub struct VirtualGamepad {
        target: Xbox360Wired<Client>,
        report: XUsb,
    }

    impl VirtualGamepad {
        pub fn new() -> Result<Self, String> {
            let client = Client::connect()
                .map_err(|e| format!("Failed to connect to ViGEm: {:?}", e))?;
            let mut target = Xbox360Wired::new(client, TargetId::XBOX360_WIRED);
            target.plugin()
                .map_err(|e| format!("Failed to plugin virtual gamepad: {:?}", e))?;
            target.wait_ready()
                .map_err(|e| format!("Failed to wait for gamepad ready: {:?}", e))?;

            eprintln!("VirGO Virtual Gamepad created (Windows/ViGEm)");
            Ok(Self { target, report: XUsb::default() })
        }

        pub fn set_axis(&mut self, x: i32, y: i32) -> Result<(), String> {
            self.report.thumb_lx = x as i16;
            // Invert Y for XInput convention (up = positive)
            self.report.thumb_ly = -(y as i16);
            self.target.update(&self.report)
                .map_err(|e| format!("Failed to update gamepad: {:?}", e))
        }

        pub fn button(&mut self, name: &str, pressed: bool) -> Result<(), String> {
            let flag = match name.to_lowercase().as_str() {
                "a" | "btn_a" => XButtons::A,
                "b" | "btn_b" => XButtons::B,
                "x" | "btn_x" => XButtons::X,
                "y" | "btn_y" => XButtons::Y,
                "lb" | "l1" | "btn_tl" => XButtons::LB,
                "rb" | "r1" | "btn_tr" => XButtons::RB,
                "select" | "back" => XButtons::BACK,
                "start" => XButtons::START,
                "ls" | "l3" => XButtons::LTHUMB,
                "rs" | "r3" => XButtons::RTHUMB,
                _ => return Err(format!("Unknown gamepad button: {}", name)),
            };
            if pressed {
                self.report.buttons |= flag;
            } else {
                self.report.buttons &= !flag;
            }
            self.target.update(&self.report)
                .map_err(|e| format!("Failed to update gamepad: {:?}", e))
        }
    }
}