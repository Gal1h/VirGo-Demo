// VirGO Desktop Host - TCP Server & Event Loop
// File: DekstopRemoteHost/src-tauri/src/lib.rs (excerpt)

use tokio::io::AsyncReadExt;
use tokio::net::TcpListener;
use tokio::sync::oneshot;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Mutex;
use std::sync::mpsc;

static SERVER_RUNNING: AtomicBool = AtomicBool::new(false);
static SHUTDOWN_TX: Mutex<Option<oneshot::Sender<()>>> = Mutex::new(None);

#[tauri::command]
async fn start_server() -> Result<String, String> {
    // Prevent multiple server instances
    if SERVER_RUNNING
        .compare_exchange(false, true, Ordering::SeqCst, Ordering::SeqCst)
        .is_err()
    {
        return Err("Server already running".into());
    }

    // Setup adb reverse for USB connectivity
    let _ = setup_adb_reverse(true);

    // Bind TCP listener
    let listener = TcpListener::bind("127.0.0.1:8000").await
        .map_err(|e| format!("Failed to bind: {}", e))?;

    // Shutdown channel for graceful stop
    let (shutdown_tx, mut shutdown_rx) = oneshot::channel::<()>();
    if let Ok(mut guard) = SHUTDOWN_TX.lock() {
        *guard = Some(shutdown_tx);
    }

    // Channel to worker thread (Enigo + Gamepad)
    let (tx, rx) = mpsc::channel::<String>();

    // Spawn dedicated worker thread for blocking input simulation
    std::thread::spawn(move || {
        let mut enigo = Enigo::new(&Settings::default()).expect("Enigo init failed");
        let mut virtual_gamepad = VirtualGamepad::new().ok(); // Optional

        while let Ok(data_string) = rx.recv() {
            let event: KeyEvent = match serde_json::from_str(&data_string) {
                Ok(e) => e,
                Err(e) => { eprintln!("JSON parse error: {}", e); continue; }
            };
            dispatch_event(&mut enigo, &mut virtual_gamepad, event);
        }
    });

    // Async connection acceptor
    tauri::async_runtime::spawn(async move {
        loop {
            tokio::select! {
                _ = &mut shutdown_rx => break,
                res = listener.accept() => {
                    let (mut socket, _) = match res { Ok(c) => c, Err(e) => { eprintln!("Accept error: {}", e); continue; } };
                    let tx = tx.clone();
                    tokio::spawn(async move {
                        let mut buf = [0; 1024];
                        let mut leftover = String::new();
                        loop {
                            let n = match socket.read(&mut buf).await { Ok(0) => return, Ok(n) => n, Err(_) => return };
                            leftover.push_str(&String::from_utf8_lossy(&buf[..n]));
                            while let Some(pos) = leftover.find('\n') {
                                let line = leftover[..pos].trim().to_string();
                                leftover = leftover[pos + 1..].to_string();
                                if !line.is_empty() {
                                    let _ = tx.send(line);
                                }
                            }
                        }
                    });
                }
            }
        }
    });

    Ok("Running".into())
}

#[tauri::command]
async fn stop_server() -> Result<String, String> {
    if let Ok(mut guard) = SHUTDOWN_TX.lock() {
        if let Some(tx) = guard.take() { let _ = tx.send(()); }
    }
    let _ = setup_adb_reverse(false);
    SERVER_RUNNING.store(false, Ordering::SeqCst);
    Ok("Stopped".into())
}

fn setup_adb_reverse(enable: bool) -> Result<(), String> {
    let cmd = if enable { "adb reverse tcp:8000 tcp:8000" } else { "adb reverse --remove tcp:8000" };
    let output = if cfg!(target_os = "windows") {
        Command::new("cmd").args(["/C", cmd]).output()
    } else {
        Command::new("sh").arg("-c").arg(cmd).output()
    }.map_err(|e| format!("adb failed: {}", e))?;
    Ok(())
}