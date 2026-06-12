use std::sync::Mutex;
use std::time::{Duration, Instant};

pub struct TimerService {
    state: Mutex<TimerState>,
}

struct TimerState {
    running: bool,
    started_at: Option<Instant>,
    paused_duration: Duration,
    /// 提醒间隔（秒），默认 1 分钟方便开发测试
    remind_interval: u64,
    /// 黑洞铺满时间（秒）
    fill_duration: u64,
}

impl TimerService {
    pub fn new() -> Self {
        Self {
            state: Mutex::new(TimerState {
                running: true,
                started_at: Some(Instant::now()),
                paused_duration: Duration::ZERO,
                remind_interval: 1 * 60, // 1 分钟（开发测试用，正式改为 45 * 60）
                fill_duration: 30,
            }),
        }
    }

    pub fn elapsed_seconds(&self) -> u64 {
        let state = self.state.lock().unwrap();
        match state.started_at {
            Some(started) => {
                let total = started.elapsed() + state.paused_duration;
                total.as_secs()
            }
            None => state.paused_duration.as_secs(),
        }
    }

    pub fn should_show_blackhole(&self) -> bool {
        let remind_interval = self.state.lock().unwrap().remind_interval;
        self.elapsed_seconds() >= remind_interval
    }

    pub fn blackhole_progress(&self) -> f64 {
        let state = self.state.lock().unwrap();
        let remind_interval = state.remind_interval;
        let fill_duration = state.fill_duration;
        drop(state);

        let elapsed = self.elapsed_seconds();
        let overflow = elapsed.saturating_sub(remind_interval);
        (overflow as f64 / fill_duration as f64).min(1.0)
    }

    pub fn reset(&self) {
        let mut state = self.state.lock().unwrap();
        state.started_at = Some(Instant::now());
        state.paused_duration = Duration::ZERO;
    }

    pub fn get_settings(&self) -> (u64, u64) {
        let state = self.state.lock().unwrap();
        (state.remind_interval, state.fill_duration)
    }

    pub fn update_settings(&self, remind_interval: u64, fill_duration: u64) {
        let mut state = self.state.lock().unwrap();
        state.remind_interval = remind_interval;
        state.fill_duration = fill_duration;
    }
}
