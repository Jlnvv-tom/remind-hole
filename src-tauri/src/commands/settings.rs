use crate::services::timer_service::TimerService;
use serde::Serialize;
use tauri::State;

#[tauri::command]
pub fn get_settings(timer: State<'_, TimerService>) -> SettingsResponse {
    let (remind_interval, fill_duration) = timer.get_settings();
    SettingsResponse {
        remind_interval_minutes: remind_interval / 60,
        fill_duration_seconds: fill_duration,
    }
}

#[tauri::command]
pub fn update_settings(
    timer: State<'_, TimerService>,
    remind_interval: u64,
    fill_duration: u64,
) -> Result<(), String> {
    timer.update_settings(remind_interval * 60, fill_duration);
    Ok(())
}

#[derive(Serialize)]
pub struct SettingsResponse {
    pub remind_interval_minutes: u64,
    pub fill_duration_seconds: u64,
}
