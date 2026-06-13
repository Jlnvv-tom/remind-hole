use crate::services::stats_service::StatsService;
use crate::services::timer_service::TimerService;
use serde::Serialize;
use tauri::State;

#[derive(Serialize)]
pub struct TimerStatus {
    pub elapsed: u64,
    pub should_show: bool,
    pub progress: f64,
    pub alert_level: String,
    pub seconds_until_full: u64,
    pub can_dismiss: bool,
    pub cooldown_remaining: u64,
    pub ignore_count: u32,
}

#[tauri::command]
pub fn get_timer_status(timer: State<'_, TimerService>) -> TimerStatus {
    let alert = timer.get_alert_level();
    TimerStatus {
        elapsed: timer.elapsed_seconds(),
        should_show: timer.should_show_blackhole(),
        progress: if timer.should_show_blackhole() {
            timer.blackhole_progress()
        } else {
            0.0
        },
        alert_level: format!("{:?}", alert).to_lowercase(),
        seconds_until_full: timer.seconds_until_full(),
        can_dismiss: timer.can_dismiss(),
        cooldown_remaining: timer.get_cooldown_remaining(),
        ignore_count: timer.get_ignore_count(),
    }
}

#[tauri::command]
pub fn get_blackhole_progress(timer: State<'_, TimerService>) -> f64 {
    if timer.should_show_blackhole() {
        timer.blackhole_progress()
    } else {
        0.0
    }
}

#[tauri::command]
pub fn dismiss_blackhole(
    timer: State<'_, TimerService>,
    stats: State<'_, StatsService>,
) -> Result<(), String> {
    // 记录忽略
    timer.dismiss_with_ignore();
    stats.record_ignore();
    Ok(())
}

#[tauri::command]
pub fn report_activity(timer: State<'_, TimerService>) {
    timer.report_activity();
}

#[tauri::command]
pub fn can_dismiss(timer: State<'_, TimerService>) -> bool {
    timer.can_dismiss()
}

#[tauri::command]
pub fn get_alert_level(timer: State<'_, TimerService>) -> String {
    let level = timer.get_alert_level();
    format!("{:?}", level).to_lowercase()
}

#[tauri::command]
pub fn get_countdown(timer: State<'_, TimerService>) -> u64 {
    timer.seconds_until_full()
}

#[tauri::command]
pub fn get_cooldown(timer: State<'_, TimerService>) -> u64 {
    timer.get_cooldown_seconds()
}
