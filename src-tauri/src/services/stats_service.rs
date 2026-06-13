use serde::{Deserialize, Serialize};
use std::sync::Mutex;

/// 统计数据状态
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StatsState {
    pub today_stand_count: u32,
    pub streak_days: u32,
    pub weekly_sitting_minutes: [u64; 7], // 0=Mon..6=Sun
    pub total_ignore_count: u32,
    /// 上次记录日期 (YYYY-MM-DD)，用于判断是否跨天
    pub last_record_date: String,
}

impl Default for StatsState {
    fn default() -> Self {
        Self {
            today_stand_count: 0,
            streak_days: 0,
            weekly_sitting_minutes: [0; 7],
            total_ignore_count: 0,
            last_record_date: today_string(),
        }
    }
}

pub struct StatsService {
    state: Mutex<StatsState>,
}

impl StatsService {
    pub fn new() -> Self {
        Self {
            state: Mutex::new(StatsState::default()),
        }
    }

    pub fn get_stats(&self) -> StatsState {
        let mut state = self.state.lock().unwrap();
        self.check_day_rollover(&mut state);
        state.clone()
    }

    /// 记录一次起身
    pub fn record_stand_up(&self) {
        let mut state = self.state.lock().unwrap();
        self.check_day_rollover(&mut state);
        state.today_stand_count += 1;
        state.last_record_date = today_string();
    }

    /// 记录一次忽略（dismiss 黑洞但未起身）
    pub fn record_ignore(&self) {
        let mut state = self.state.lock().unwrap();
        self.check_day_rollover(&mut state);
        state.total_ignore_count += 1;
    }

    /// 更新今日久坐时长（分钟）
    pub fn update_today_sitting(&self, minutes: u64) {
        let mut state = self.state.lock().unwrap();
        self.check_day_rollover(&mut state);
        let weekday = current_weekday_index();
        state.weekly_sitting_minutes[weekday] = minutes;
    }

    /// 检查是否跨天，如果是则重置每日计数
    fn check_day_rollover(&self, state: &mut StatsState) {
        let today = today_string();
        if state.last_record_date != today {
            // 简单处理：如果有起身记录则增加 streak
            if state.today_stand_count > 0 {
                state.streak_days += 1;
            } else {
                state.streak_days = 0;
            }
            state.today_stand_count = 0;
            state.last_record_date = today;
        }
    }
}

/// 获取今日日期字符串
fn today_string() -> String {
    use std::time::SystemTime;
    let dur = SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH)
        .unwrap();
    let days = dur.as_secs() / 86400;
    // 简单的日期计算（不含时区偏移，近似）
    // 从 1970-01-01 开始
    let mut year = 1970u32;
    let mut remaining_days = days;
    loop {
        let days_in_year = if is_leap_year(year) { 366 } else { 365 };
        if remaining_days < days_in_year {
            break;
        }
        remaining_days -= days_in_year;
        year += 1;
    }
    let month_days = if is_leap_year(year) {
        [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    } else {
        [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    };
    let mut month = 1u32;
    for &days_in_month in &month_days {
        if remaining_days < days_in_month {
            break;
        }
        remaining_days -= days_in_month;
        month += 1;
    }
    let day = remaining_days + 1;
    format!("{:04}-{:02}-{:02}", year, month, day)
}

fn is_leap_year(year: u32) -> bool {
    (year % 4 == 0 && year % 100 != 0) || year % 400 == 0
}

/// 当前星期几索引 0=Mon..6=Sun
fn current_weekday_index() -> usize {
    use std::time::SystemTime;
    let dur = SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH)
        .unwrap();
    let days = dur.as_secs() / 86400;
    // 1970-01-01 是周四，转换为 Mon=0
    ((days + 3) % 7) as usize
}
