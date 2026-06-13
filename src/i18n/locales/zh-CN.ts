const zhCN = {
  // Settings
  settings_title: "🕳️ BlackHole 设置",
  preset_relaxed: "佛系",
  preset_standard: "标准",
  preset_strict: "严格",
  preset_relaxed_desc: "60分钟/60秒",
  preset_standard_desc: "30分钟/30秒",
  preset_strict_desc: "15分钟/15秒",
  custom_settings: "自定义设置",
  remind_interval: "久坐提醒间隔",
  fill_duration: "黑洞铺满时间",
  minutes: "分钟",
  seconds: "秒",
  work_schedule: "工作时间表",
  enable_work_time: "启用工作时间",
  start_time: "开始时间",
  end_time: "结束时间",
  active_days: "活跃日期",
  day_mon: "一",
  day_tue: "二",
  day_wed: "三",
  day_thu: "四",
  day_fri: "五",
  day_sat: "六",
  day_sun: "日",
  reset_all: "🗑️ 重置所有数据",
  reset_confirm: "确定要重置所有数据？此操作不可撤销",
  confirm_reset: "确认重置",
  cancel: "取消",
  lang_switch: "EN",

  // StatsPanel
  stats_title: "📊 统计数据",
  today_standups: "🔥 今日起身",
  streak_days: "⭐ 连续达标",
  weekly_avg: "📊 本周平均(分)",
  seven_day_record: "7 天记录",
  on_time: "按时起身",
  overtime: "有超时",
  no_data: "无数据",

  // BlackHoleCanvas
  devoured: "已被吞噬！",
  click_to_close: "点击关闭",
  leave_computer: "请离开电脑 30 秒...",
  cooling_down: "冷却中，还需等待 {seconds} 秒",

  // Onboarding
  onboarding_title: "🕳️ 欢迎来到 BlackHole",
  onboarding_desc: "久坐时黑洞会慢慢吞噬你的屏幕，\n提醒你起来活动一下",
  next_step: "下一步 →",
  choose_mode: "选择你的模式",
  can_change_later: "随时可以在设置中修改",
  onboarding_relaxed_desc: "每60分钟提醒，60秒铺满",
  onboarding_standard_desc: "每30分钟提醒，30秒铺满",
  onboarding_strict_desc: "每15分钟提醒，15秒铺满",
  start_using: "开始使用",
  all_set: "一切就绪！",
  all_set_desc: "BlackHole 会在后台默默守护你的健康\n久坐时它会温柔地提醒你起身活动",

  // EscapeGame
  collect_planets: "🪐 收集星球延缓黑洞 ({collected}/3)",
  bonus_cooldown: "✨ 奖励冷却 -{seconds}s",

  // Navigation
  nav_dashboard: "仪表盘",
  nav_settings: "设置",
  nav_stats: "统计",

  // Dashboard
  dashboard_title: "久坐计时",
  dashboard_status_safe: "状态安全",
  dashboard_status_warning: "注意久坐",
  dashboard_status_danger: "即将触发",
  dashboard_status_active: "黑洞已启动",
  dashboard_next_remind: "下次提醒",
  dashboard_elapsed: "已坐时长",
  dashboard_progress: "进度",
  dashboard_alert_green: "安全",
  dashboard_alert_yellow: "预警",
  dashboard_alert_red: "危险",
  dashboard_alert_blackhole: "黑洞",
  dashboard_no_activity: "暂无活动",
  dashboard_minute_short: "分",
  dashboard_second_short: "秒",
};

export default zhCN;
export type LocaleKey = keyof typeof zhCN;
