import { invoke } from "@tauri-apps/api/core";

export interface AppSettings {
  remind_interval_minutes: number;
  fill_duration_seconds: number;
  work_schedule?: WorkSchedule;
}

export interface TimerStatus {
  elapsed: number;
  should_show: boolean;
  progress: number;
  alert_level: string;
  seconds_until_full: number;
  can_dismiss: boolean;
  cooldown_remaining: number;
  ignore_count: number;
  running: boolean;
  user_started: boolean;
}

export interface Stats {
  today_standups: number;
  streak_days: number;
  weekly_data: number[]; // 7 days in minutes
  total_ignores: number;
}

export interface WorkSchedule {
  enabled: boolean;
  work_start: string; // "HH:MM"
  work_end: string;
  enabled_days: number[]; // 1-7
}

// ---- Existing APIs ----

export async function getBlackholeProgress(): Promise<number> {
  return invoke<number>("get_blackhole_progress");
}

export async function dismissBlackhole(): Promise<void> {
  return invoke("dismiss_blackhole");
}

export async function getTimerStatus(): Promise<TimerStatus> {
  return invoke<TimerStatus>("get_timer_status");
}

export async function getSettings(): Promise<AppSettings> {
  return invoke<AppSettings>("get_settings");
}

export async function updateSettings(
  remindInterval: number,
  fillDuration: number
): Promise<void> {
  return invoke("update_settings", {
    remindInterval,
    fillDuration,
  });
}

// ---- New APIs ----

export async function reportActivity(): Promise<void> {
  return invoke("report_activity");
}

export async function canDismiss(): Promise<boolean> {
  return invoke<boolean>("can_dismiss");
}

export async function getAlertLevel(): Promise<string> {
  return invoke<string>("get_alert_level");
}

export async function getCountdown(): Promise<number> {
  return invoke<number>("get_countdown");
}

export async function getCooldown(): Promise<number> {
  return invoke<number>("get_cooldown");
}

export async function getStats(): Promise<Stats> {
  return invoke<Stats>("get_stats");
}

export async function recordStandUp(): Promise<void> {
  return invoke("record_stand_up");
}

export async function isFirstRun(): Promise<boolean> {
  return invoke<boolean>("is_first_run");
}

export async function completeOnboarding(): Promise<void> {
  return invoke("complete_onboarding");
}

// ---- Timer Control ----

export async function startTimer(): Promise<void> {
  return invoke("start_timer");
}

export async function pauseTimer(): Promise<void> {
  return invoke("pause_timer");
}

export async function resetTimer(): Promise<void> {
  return invoke("reset_timer");
}
