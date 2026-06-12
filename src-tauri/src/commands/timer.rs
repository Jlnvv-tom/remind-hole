use crate::services::timer_service::TimerService;
use serde::Serialize;
use tauri::State;

#[tauri::command]
pub fn get_blackhole_progress(timer: State<'_, TimerService>) -> f64 {
    if timer.should_show_blackhole() {
        timer.blackhole_progress()
    } else {
        0.0
    }
}

#[tauri::command]
pub fn dismiss_blackhole(timer: State<'_, TimerService>) {
    timer.reset();
}

#[tauri::command]
pub fn get_timer_status(timer: State<'_, TimerService>) -> TimerStatus {
    TimerStatus {
        elapsed: timer.elapsed_seconds(),
        should_show: timer.should_show_blackhole(),
        progress: timer.blackhole_progress(),
    }
}

#[derive(Serialize)]
pub struct TimerStatus {
    pub elapsed: u64,
    pub should_show: bool,
    pub progress: f64,
}
