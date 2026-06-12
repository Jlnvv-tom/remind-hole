import { invoke } from "@tauri-apps/api/core";

export interface AppSettings {
  remind_interval_minutes: number;
  fill_duration_seconds: number;
}

export interface TimerStatus {
  elapsed: number;
  should_show: boolean;
  progress: number;
}

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
