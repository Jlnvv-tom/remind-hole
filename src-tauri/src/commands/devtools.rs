use tauri::Manager;

/// Toggle DevTools on the currently focused window (dev mode only)
#[tauri::command]
pub fn toggle_devtools(app: tauri::AppHandle) {
    // Try settings window first, then any visible window
    for label in &["settings", "blackhole", "preview"] {
        if let Some(window) = app.get_webview_window(label) {
            if window.is_devtools_open() {
                window.close_devtools();
            } else {
                window.open_devtools();
            }
            return;
        }
    }
}
