import type { LocaleKey } from "./zh-CN";

const enUS: Record<LocaleKey, string> = {
  // Settings
  settings_title: "🕳️ BlackHole Settings",
  preset_relaxed: "Relaxed",
  preset_standard: "Standard",
  preset_strict: "Strict",
  preset_relaxed_desc: "60min/60s",
  preset_standard_desc: "30min/30s",
  preset_strict_desc: "15min/15s",
  custom_settings: "Custom Settings",
  remind_interval: "Sedentary Reminder Interval",
  fill_duration: "Black Hole Fill Duration",
  minutes: "min",
  seconds: "sec",
  work_schedule: "Work Schedule",
  enable_work_time: "Enable Work Hours",
  start_time: "Start Time",
  end_time: "End Time",
  active_days: "Active Days",
  day_mon: "M",
  day_tue: "T",
  day_wed: "W",
  day_thu: "T",
  day_fri: "F",
  day_sat: "S",
  day_sun: "S",
  reset_all: "🗑️ Reset All Data",
  reset_confirm: "Are you sure? This cannot be undone",
  confirm_reset: "Confirm Reset",
  cancel: "Cancel",
  lang_switch: "中文",

  // StatsPanel
  stats_title: "📊 Statistics",
  today_standups: "🔥 Today's Stand-ups",
  streak_days: "⭐ Streak Days",
  weekly_avg: "📊 Weekly Avg (min)",
  seven_day_record: "7-Day Record",
  on_time: "On time",
  overtime: "Overtime",
  no_data: "No data",

  // BlackHoleCanvas
  devoured: "Devoured!",
  click_to_close: "Click to close",
  leave_computer: "Leave your computer for 30s...",
  cooling_down: "Cooling down, {seconds}s remaining",

  // Onboarding
  onboarding_title: "🕳️ Welcome to BlackHole",
  onboarding_desc: "When you sit too long, the black hole\nslowly devours your screen, reminding you to move",
  next_step: "Next →",
  choose_mode: "Choose Your Mode",
  can_change_later: "You can change this anytime in Settings",
  onboarding_relaxed_desc: "Remind every 60min, fill in 60s",
  onboarding_standard_desc: "Remind every 30min, fill in 30s",
  onboarding_strict_desc: "Remind every 15min, fill in 15s",
  start_using: "Get Started",
  all_set: "All Set!",
  all_set_desc: "BlackHole will quietly guard your health in the background\nIt will gently remind you to get up when you sit too long",

  // EscapeGame
  collect_planets: "🪐 Collect planets to slow the black hole ({collected}/3)",
  bonus_cooldown: "✨ Bonus cooldown -{seconds}s",
};

export default enUS;
