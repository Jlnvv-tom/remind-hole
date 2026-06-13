use crate::services::timer_service::{Preset, TimerService, WorkSchedule};
use crate::services::stats_service::StatsService;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tauri::State;

#[derive(Serialize)]
pub struct SettingsResponse {
    pub remind_interval_minutes: u64,
    pub fill_duration_seconds: u64,
    pub preset: String,
    pub work_schedule: WorkSchedule,
}

#[derive(Deserialize)]
pub struct UpdateSettingsRequest {
    pub remind_interval_minutes: Option<u64>,
    pub fill_duration_seconds: Option<u64>,
    pub preset: Option<String>,
    pub work_schedule: Option<WorkSchedule>,
}

#[tauri::command]
pub fn get_settings(timer: State<'_, Arc<TimerService>>) -> SettingsResponse {
    let (remind_interval, fill_duration, preset, work_schedule) = timer.get_settings();
    SettingsResponse {
        remind_interval_minutes: remind_interval / 60,
        fill_duration_seconds: fill_duration,
        preset: format!("{:?}", preset).to_lowercase(),
        work_schedule,
    }
}

#[tauri::command]
pub fn update_settings(
    timer: State<'_, Arc<TimerService>>,
    request: UpdateSettingsRequest,
) -> Result<(), String> {
    let (current_interval, current_fill, current_preset, current_schedule) = timer.get_settings();

    let preset = match request.preset.as_deref() {
        Some("relaxed") => Preset::Relaxed,
        Some("standard") => Preset::Standard,
        Some("strict") => Preset::Strict,
        Some("custom") => Preset::Custom,
        Some(other) => return Err(format!("Unknown preset: {}", other)),
        None => current_preset,
    };

    let new_interval = request
        .remind_interval_minutes
        .map(|m| m * 60)
        .unwrap_or(current_interval);
    let new_fill = request
        .fill_duration_seconds
        .unwrap_or(current_fill);
    let new_schedule = request.work_schedule.unwrap_or(current_schedule);

    // 如果指定了非 custom 的 preset，使用 preset 的默认值
    let (final_interval, final_fill) = if request.preset.is_some() && preset != Preset::Custom {
        (preset.interval_seconds(), preset.fill_seconds())
    } else {
        (new_interval, new_fill)
    };

    timer.update_settings(final_interval, final_fill, preset, new_schedule);
    Ok(())
}

#[tauri::command]
pub fn apply_preset(timer: State<'_, Arc<TimerService>>, preset: String) -> Result<(), String> {
    let preset = match preset.as_str() {
        "relaxed" => Preset::Relaxed,
        "standard" => Preset::Standard,
        "strict" => Preset::Strict,
        _ => return Err(format!("Unknown preset: {}", preset)),
    };
    timer.apply_preset(preset);
    Ok(())
}

// --- Stats commands ---

#[tauri::command]
pub fn get_stats(stats: State<'_, Arc<StatsService>>) -> crate::services::stats_service::StatsState {
    stats.get_stats()
}

#[tauri::command]
pub fn record_stand_up(
    timer: State<'_, Arc<TimerService>>,
    stats: State<'_, Arc<StatsService>>,
) -> Result<(), String> {
    timer.reset();
    stats.record_stand_up();
    Ok(())
}

// --- First run ---

#[tauri::command]
pub fn is_first_run(app: tauri::AppHandle) -> Result<bool, String> {
    use tauri::Manager;
    let store = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;
    let store_path = store.join("app-store.json");

    if store_path.exists() {
        // 文件存在，尝试读取
        if let Ok(data) = std::fs::read_to_string(&store_path) {
            if data.contains("first_run_done") {
                return Ok(false);
            }
        }
    }
    Ok(true)
}

#[tauri::command]
pub fn complete_onboarding(app: tauri::AppHandle) -> Result<(), String> {
    use tauri_plugin_store::StoreExt;
    let store = app
        .store("app-store.json")
        .map_err(|e| e.to_string())?;
    store.set("first_run_done", true);
    store.save().map_err(|e| e.to_string())?;
    Ok(())
}
