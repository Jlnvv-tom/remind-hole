mod commands;
mod services;

use services::timer_service::TimerService;
use std::sync::Arc;
use std::time::Duration;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let timer_service = Arc::new(TimerService::new());

    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .manage(timer_service.clone())
        .setup(move |app| {
            // 启动后台计时线程
            let timer_for_thread = timer_service.clone();
            let handle = app.handle().clone();

            std::thread::spawn(move || {
                let mut was_showing = false;
                loop {
                    std::thread::sleep(Duration::from_secs(1));

                    if timer_for_thread.should_show_blackhole() {
                        if !was_showing {
                            was_showing = true;
                            if let Some(window) = handle.get_webview_window("blackhole") {
                                let _ = window.show();
                                let _ = window.set_always_on_top(true);
                                let _ = window.set_focus();
                            }
                        }
                    } else {
                        was_showing = false;
                    }
                }
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::timer::get_blackhole_progress,
            commands::timer::dismiss_blackhole,
            commands::timer::get_timer_status,
            commands::settings::get_settings,
            commands::settings::update_settings,
        ])
        .run(tauri::generate_context!())
        .expect("error while building tauri application");
}
