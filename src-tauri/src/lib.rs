mod commands;
mod services;

use services::stats_service::StatsService;
use services::timer_service::TimerService;
use std::sync::Arc;
use std::time::Duration;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let timer_service = Arc::new(TimerService::new());
    let stats_service = Arc::new(StatsService::new());

    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .manage(timer_service.clone())
        .manage(stats_service.clone())
        .setup(move |app| {
            // Auto-open DevTools in debug builds for the settings window
            #[cfg(debug_assertions)]
            {
                if let Some(window) = app.get_webview_window("settings") {
                    window.open_devtools();
                }
            }

            // 启动后台计时线程
            let timer_for_thread = timer_service.clone();
            let stats_for_thread = stats_service.clone();
            let handle = app.handle().clone();

            std::thread::spawn(move || {
                let mut was_showing = false;
                loop {
                    std::thread::sleep(Duration::from_secs(1));

                    // Skip if timer not running
                    if !timer_for_thread.is_running() {
                        if was_showing {
                            // Hide blackhole window if timer stopped
                            if let Some(window) = handle.get_webview_window("blackhole") {
                                let _ = window.hide();
                            }
                            was_showing = false;
                        }
                        continue;
                    }

                    // 更新今日久坐时长
                    let elapsed_min = timer_for_thread.elapsed_seconds() / 60;
                    stats_for_thread.update_today_sitting(elapsed_min);

                    if timer_for_thread.should_show_blackhole() {
                        timer_for_thread.mark_blackhole_appeared();
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
            commands::timer::get_timer_status,
            commands::timer::get_blackhole_progress,
            commands::timer::dismiss_blackhole,
            commands::timer::report_activity,
            commands::timer::can_dismiss,
            commands::timer::get_alert_level,
            commands::timer::get_countdown,
            commands::timer::get_cooldown,
            commands::timer::start_timer,
            commands::timer::pause_timer,
            commands::timer::reset_timer,
            commands::devtools::toggle_devtools,
            commands::settings::get_settings,
            commands::settings::update_settings,
            commands::settings::apply_preset,
            commands::settings::get_stats,
            commands::settings::record_stand_up,
            commands::settings::is_first_run,
            commands::settings::complete_onboarding,
        ])
        .run(tauri::generate_context!())
        .expect("error while building tauri application");
}
