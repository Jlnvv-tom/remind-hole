use std::sync::Mutex;
use std::time::{Duration, Instant};

use serde::{Deserialize, Serialize};

/// 三级预警等级
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum AlertLevel {
    Green,
    Yellow,
    Red,
    Blackhole,
}

/// 场景预设
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Preset {
    Relaxed,
    Standard,
    Strict,
    Custom,
}

impl Preset {
    pub fn interval_seconds(&self) -> u64 {
        match self {
            Preset::Relaxed => 60 * 60,
            Preset::Standard => 45 * 60,
            Preset::Strict => 15 * 60,
            Preset::Custom => 0, // custom uses explicit values
        }
    }

    pub fn fill_seconds(&self) -> u64 {
        match self {
            Preset::Relaxed => 60,
            Preset::Standard => 30,
            Preset::Strict => 15,
            Preset::Custom => 0,
        }
    }
}

/// 工作时间表
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkSchedule {
    pub work_start: String, // "HH:MM"
    pub work_end: String,   // "HH:MM"
    pub enabled_days: Vec<u8>, // 1=Mon..7=Sun
    pub enabled: bool,
}

impl Default for WorkSchedule {
    fn default() -> Self {
        Self {
            work_start: "09:00".to_string(),
            work_end: "18:00".to_string(),
            enabled_days: vec![1, 2, 3, 4, 5],
            enabled: false,
        }
    }
}

struct TimerState {
    running: bool,
    started_at: Option<Instant>,
    paused_duration: Duration,
    /// 提醒间隔（秒）
    remind_interval: u64,
    /// 黑洞铺满时间（秒）
    fill_duration: u64,
    /// 当前预设
    preset: Preset,
    /// 工作时间表
    work_schedule: WorkSchedule,
    /// 最后活跃时间
    last_activity: Option<Instant>,
    /// 黑洞出现的时刻（用于判断 can_dismiss 的 30 秒无输入）
    blackhole_appeared_at: Option<Instant>,
    /// 忽略次数
    ignore_count: u32,
    /// 上次忽略时间
    last_ignore_time: Option<Instant>,
    /// 用户是否手动启动过计时器
    user_started: bool,
}

pub struct TimerService {
    state: Mutex<TimerState>,
}

impl TimerService {
    pub fn new() -> Self {
        Self {
            state: Mutex::new(TimerState {
                running: false,
                started_at: None,
                paused_duration: Duration::ZERO,
                remind_interval: 45 * 60,
                fill_duration: 30,
                preset: Preset::Standard,
                work_schedule: WorkSchedule::default(),
                last_activity: None,
                blackhole_appeared_at: None,
                ignore_count: 0,
                last_ignore_time: None,
                user_started: false,
            }),
        }
    }

    pub fn elapsed_seconds(&self) -> u64 {
        let state = self.state.lock().unwrap();
        if !state.running {
            return state.paused_duration.as_secs();
        }
        match state.started_at {
            Some(started) => {
                let total = started.elapsed() + state.paused_duration;
                total.as_secs()
            }
            None => state.paused_duration.as_secs(),
        }
    }

    /// Start or resume the timer
    pub fn start(&self) {
        let mut state = self.state.lock().unwrap();
        if state.running {
            return; // already running
        }
        state.running = true;
        state.started_at = Some(Instant::now());
        state.user_started = true;
    }

    /// Pause the timer
    pub fn pause(&self) {
        let mut state = self.state.lock().unwrap();
        if !state.running {
            return; // already paused
        }
        // Accumulate elapsed time into paused_duration
        if let Some(started) = state.started_at {
            state.paused_duration += started.elapsed();
        }
        state.running = false;
        state.started_at = None;
    }

    /// Is the timer currently running?
    pub fn is_running(&self) -> bool {
        let state = self.state.lock().unwrap();
        state.running
    }

    /// Has the user ever started the timer?
    pub fn is_user_started(&self) -> bool {
        let state = self.state.lock().unwrap();
        state.user_started
    }

    pub fn should_show_blackhole(&self) -> bool {
        let state = self.state.lock().unwrap();
        let remind_interval = state.remind_interval;
        drop(state);

        if !self.is_work_time() {
            return false;
        }

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
        state.blackhole_appeared_at = None;
        // Keep running state — reset just restarts the counter
    }

    // --- P0: 活跃检测 ---

    pub fn report_activity(&self) {
        let mut state = self.state.lock().unwrap();
        state.last_activity = Some(Instant::now());
    }

    pub fn can_dismiss(&self) -> bool {
        let state = self.state.lock().unwrap();
        // 只有黑洞出现时才检查
        if state.blackhole_appeared_at.is_none() {
            return true;
        }
        // 必须连续 30 秒无任何输入才允许关闭
        match state.last_activity {
            Some(last) => last.elapsed() >= Duration::from_secs(30),
            None => {
                // 如果从未记录活跃，检查黑洞出现后是否已过 30 秒
                match state.blackhole_appeared_at {
                    Some(appear) => appear.elapsed() >= Duration::from_secs(30),
                    None => true,
                }
            }
        }
    }

    // --- P0: 三级预警 ---

    pub fn get_alert_level(&self) -> AlertLevel {
        let state = self.state.lock().unwrap();
        let remind_interval = state.remind_interval;
        drop(state);

        let elapsed = self.elapsed_seconds();

        if elapsed >= remind_interval {
            return AlertLevel::Blackhole;
        }

        let ratio = elapsed as f64 / remind_interval as f64;
        if ratio >= 0.9 {
            AlertLevel::Red
        } else if ratio >= 0.6 {
            AlertLevel::Yellow
        } else {
            AlertLevel::Green
        }
    }

    // --- P1: 场景预设 ---

    pub fn apply_preset(&self, preset: Preset) {
        let mut state = self.state.lock().unwrap();
        if preset != Preset::Custom {
            state.remind_interval = preset.interval_seconds();
            state.fill_duration = preset.fill_seconds();
        }
        state.preset = preset;
    }

    // --- P1: 黑洞内倒计时 ---

    pub fn seconds_until_full(&self) -> u64 {
        let state = self.state.lock().unwrap();
        let remind_interval = state.remind_interval;
        let fill_duration = state.fill_duration;
        drop(state);

        let elapsed = self.elapsed_seconds();
        if elapsed < remind_interval {
            // 还没到黑洞，返回距黑洞出现的秒数
            remind_interval - elapsed
        } else {
            // 黑洞已出现，返回铺满剩余秒数
            let full_at = remind_interval + fill_duration;
            full_at.saturating_sub(elapsed)
        }
    }

    // --- P2: 弹性阻力 ---

    pub fn dismiss_with_ignore(&self) {
        let mut state = self.state.lock().unwrap();
        // 衰减：连续 2 小时未忽略则 ignore_count 减半
        if let Some(last) = state.last_ignore_time {
            if last.elapsed() >= Duration::from_secs(2 * 3600) {
                state.ignore_count /= 2;
            }
        }

        state.ignore_count += 1;
        state.last_ignore_time = Some(Instant::now());
        state.started_at = Some(Instant::now());
        state.paused_duration = Duration::ZERO;
        state.blackhole_appeared_at = None;
    }

    pub fn get_cooldown_seconds(&self) -> u64 {
        let state = self.state.lock().unwrap();

        // 衰减检查
        let count = {
            if let Some(last) = state.last_ignore_time {
                if last.elapsed() >= Duration::from_secs(2 * 3600) {
                    state.ignore_count / 2
                } else {
                    state.ignore_count
                }
            } else {
                state.ignore_count
            }
        };

        match count {
            0..=3 => 0,
            4..=6 => 30,
            _ => 60,
        }
    }

    pub fn get_ignore_count(&self) -> u32 {
        let state = self.state.lock().unwrap();
        state.ignore_count
    }

    pub fn get_cooldown_remaining(&self) -> u64 {
        let state = self.state.lock().unwrap();
        let cooldown = match state.ignore_count {
            0..=3 => 0u64,
            4..=6 => 30,
            _ => 60,
        };
        if cooldown == 0 {
            return 0;
        }
        match state.last_ignore_time {
            Some(last) => cooldown.saturating_sub(last.elapsed().as_secs()),
            None => 0,
        }
    }

    // --- P3: 工作时间表 ---

    pub fn is_work_time(&self) -> bool {
        let state = self.state.lock().unwrap();
        let schedule = &state.work_schedule;
        if !schedule.enabled {
            return true; // 未启用则始终是工作时间
        }

        let now = chrono_now();
        let weekday = now.weekday; // 1=Mon..7=Sun
        if !schedule.enabled_days.contains(&weekday) {
            return false;
        }

        let now_minutes = now.hour * 60 + now.minute;
        let start_minutes = parse_hhmm(&schedule.work_start);
        let end_minutes = parse_hhmm(&schedule.work_end);

        now_minutes >= start_minutes && now_minutes < end_minutes
    }

    // --- Settings ---

    pub fn get_settings(&self) -> (u64, u64, Preset, WorkSchedule) {
        let state = self.state.lock().unwrap();
        (
            state.remind_interval,
            state.fill_duration,
            state.preset,
            state.work_schedule.clone(),
        )
    }

    pub fn update_settings(
        &self,
        remind_interval: u64,
        fill_duration: u64,
        preset: Preset,
        work_schedule: WorkSchedule,
    ) {
        let mut state = self.state.lock().unwrap();
        state.remind_interval = remind_interval;
        state.fill_duration = fill_duration;
        state.preset = preset;
        state.work_schedule = work_schedule;
    }

    /// 标记黑洞已出现（在后台线程检测到黑洞时调用）
    pub fn mark_blackhole_appeared(&self) {
        let mut state = self.state.lock().unwrap();
        if state.blackhole_appeared_at.is_none() {
            state.blackhole_appeared_at = Some(Instant::now());
        }
    }
}

/// 简单的当前时间结构
struct NowTime {
    weekday: u8, // 1=Mon..7=Sun
    hour: u32,
    minute: u32,
}

fn chrono_now() -> NowTime {
    use std::time::SystemTime;
    let dur = SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH)
        .unwrap();
    let secs = dur.as_secs();
    // 简单计算：天数 * 86400，然后算星期
    let days_since_epoch = secs / 86400;
    // 1970-01-01 是周四(4)，转换到 1=Mon..7=Sun
    let weekday = ((days_since_epoch + 3) % 7 + 1) as u8;
    let secs_of_day = secs % 86400;
    let hour = (secs_of_day / 3600) as u32;
    let minute = ((secs_of_day % 3600) / 60) as u32;
    NowTime {
        weekday,
        hour,
        minute,
    }
}

fn parse_hhmm(s: &str) -> u32 {
    let parts: Vec<&str> = s.split(':').collect();
    if parts.len() == 2 {
        let h: u32 = parts[0].parse().unwrap_or(0);
        let m: u32 = parts[1].parse().unwrap_or(0);
        h * 60 + m
    } else {
        0
    }
}
