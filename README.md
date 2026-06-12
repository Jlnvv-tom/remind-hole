# 🕳️ BlackHole — 久坐黑洞

> 你的屏幕正在被黑洞吞噬——除非你站起来。

一个用 **Tauri 2 + React 19 + Canvas API** 构建的桌面久坐提醒应用。核心机制是一个悬浮在桌面最前方的透明黑洞窗口，它会随着你的久坐时间不断膨胀，直到吞噬整个屏幕，强迫你起身活动。

![Tauri](https://img.shields.io/badge/Tauri-2.0-blue?logo=tauri)
![React](https://img.shields.io/badge/React-19-61dafb?logo=react)
![Rust](https://img.shields.io/badge/Rust-1.96+-orange?logo=rust)
![License](https://img.shields.io/badge/License-MIT-green)

## ✨ 特性

- **🕳️ 实时黑洞渲染** — Canvas 2D 五层渲染引擎（星空 → 引力透镜 → 吸积盘 → 事件视界 → 光环）
- **⏱️ 精确计时** — Rust 后端 `Instant` 高精度计时，不受系统休眠影响
- **🔄 渐进式提醒** — 黑洞半径随时间线性增长，从视觉上施加心理压力
- **💥 坍缩动画** — 点击黑洞触发坍缩效果，重置计时器
- **⚙️ 自定义设置** — 提醒间隔（1-120 分钟）和铺满时长（10-300 秒）可调
- **🖥️ 透明置顶窗口** — 始终悬浮在最前方，无法忽视
- **📦 极致包体** — Release 构建仅 ~10 MB，远小于 Electron 方案

## 🎬 工作流程

```
启动应用 → 设置窗口可见 → 后台计时开始
                ↓
        达到提醒间隔（默认 1 分钟）
                ↓
    黑洞窗口出现，从小圆点开始膨胀
                ↓
        黑洞持续扩大，覆盖屏幕
                ↓
        黑洞铺满，显示"起来活动一下！"
                ↓
      用户点击 → 坍缩动画 → 计时器重置
                ↓
            回到后台计时...
```

## 🛠️ 技术栈

| 层 | 技术 | 说明 |
|---|---|---|
| 桌面框架 | **Tauri 2.0** | Rust 后端 + WebView 前端，包体极小 |
| 前端 | **React 19** + **TypeScript** | 组件化 UI |
| 渲染引擎 | **Canvas 2D API** | 五层黑洞视觉，60fps 动画 |
| 构建 | **Vite 6** | 极速 HMR 开发体验 |
| 后端 | **Rust** | 精确计时、状态管理、窗口控制 |
| 持久化 | **tauri-plugin-store** | 轻量键值存储 |

## 📁 项目结构

```
remind-hole/
├── index.html                    # 入口 HTML
├── package.json                  # 前端依赖 & 脚本
├── vite.config.ts                # Vite 配置
├── tsconfig.json                 # TypeScript 配置
├── src/
│   ├── main.tsx                  # React 入口
│   ├── App.tsx                   # 路由分发（黑洞/设置页面）
│   ├── components/
│   │   ├── BlackHoleCanvas.tsx   # 黑洞画布组件
│   │   └── Settings.tsx          # 设置面板组件
│   ├── services/
│   │   └── tauri-api.ts          # Tauri invoke 封装
│   └── utils/
│       └── blackhole-renderer.ts # Canvas 渲染引擎（五层渲染）
└── src-tauri/
    ├── Cargo.toml                # Rust 依赖
    ├── tauri.conf.json           # Tauri 应用配置（双窗口 + 透明置顶）
    ├── build.rs                  # Tauri 构建脚本
    ├── capabilities/
    │   └── default.json          # 权限声明
    ├── icons/                    # 应用图标（PNG/ICNS/ICO）
    └── src/
        ├── main.rs               # Rust 入口
        ├── lib.rs                # 应用初始化（插件注册 + 后台计时线程）
        ├── commands/
        │   ├── mod.rs
        │   ├── timer.rs          # 计时器命令（进度查询/关闭黑洞/状态）
        │   └── settings.rs       # 设置命令（读取/更新）
        └── services/
            ├── mod.rs
            └── timer_service.rs  # 计时器核心逻辑（Mutex 状态管理）
```

## 🚀 快速开始

### 前置要求

- [Node.js](https://nodejs.org/) ≥ 18
- [Rust](https://www.rust-lang.org/tools/install) ≥ 1.96
- [Tauri 2 CLI](https://v2.tauri.app/start/prerequisites/)

### 安装

```bash
# 克隆项目
git clone <repo-url>
cd remind-hole

# 安装前端依赖
npm install

# 开发模式（热重载）
npm run tauri dev

# 生产构建
npm run tauri build
```

### 开发

```bash
# 仅前端开发（浏览器预览，无 Tauri API）
npm run dev

# 完整开发（Tauri 窗口 + Vite HMR）
npm run tauri dev

# 类型检查
npx tsc --noEmit
```

## 🎨 黑洞渲染引擎

`blackhole-renderer.ts` 实现了五层 Canvas 渲染管线，每帧按顺序绘制：

| 层级 | 名称 | 效果 |
|---|---|---|
| 1 | **星空背景** | 200 颗星星，带闪烁和引力扭曲（靠近黑洞的星星被拉向中心） |
| 2 | **引力透镜** | 紫色径向渐变，模拟光线弯曲 |
| 3 | **吸积盘** | 橙色倾斜椭圆，持续旋转，模拟物质螺旋落入 |
| 4 | **事件视界** | 纯黑径向渐变，边缘微紫，黑洞核心 |
| 5 | **光环** | 橙色发光圆环，脉动呼吸效果 |

黑洞半径使用 `easeInQuad` 缓动函数（`progress²`），前期增长缓慢、后期加速，营造吞噬感。

### 坍缩动画

用户点击黑洞时触发递归收缩动画，`progress` 每帧递减 0.04（约 25 帧 / 0.4 秒完成），收缩至零后隐藏窗口并重置计时器。

## ⚙️ 配置说明

### Tauri 双窗口

| 窗口 | Label | 说明 |
|---|---|---|
| 黑洞窗口 | `blackhole` | 透明、无边框、置顶、初始隐藏 |
| 设置窗口 | `settings` | 标准窗口、可装饰、启动时可见 |

### Rust 后端命令

| 命令 | 参数 | 返回值 | 说明 |
|---|---|---|---|
| `get_blackhole_progress` | — | `f64` (0.0~1.0) | 当前黑洞膨胀进度 |
| `dismiss_blackhole` | — | — | 坍缩并重置计时器 |
| `get_timer_status` | — | `{elapsed, should_show, progress}` | 完整计时器状态 |
| `get_settings` | — | `{remind_interval_minutes, fill_duration_seconds}` | 当前设置 |
| `update_settings` | `remindInterval`, `fillDuration` | — | 更新设置 |

### macOS 透明窗口

macOS 的透明窗口需要启用 `macOSPrivateApi`（已在 `tauri.conf.json` 中配置）。这是 Tauri 的已知限制，不影响功能，但意味着应用无法通过 Mac App Store 分发（可通过 Homebrew / 直接下载分发）。

## 🗺️ 开发路线

- [x] Phase 1: 核心功能（计时 + 黑洞渲染 + 坍缩）
- [x] Phase 2: 设置面板（提醒间隔 + 铺满时长）
- [ ] Phase 3: 系统托盘（菜单控制 + 状态指示）
- [ ] Phase 4: 打包分发（DMG / 跨平台支持）
- [ ] Phase 5: 增强体验（音效、统计、多语言）

## ⚠️ 已知问题

- **系统托盘暂时不可用** — 图标创建存在兼容性问题，将在 Phase 3 修复
- **DMG 打包需签名** — `tauri build` 生成的 .app 正常，但 DMG 打包需要开发者签名
- **仅 macOS 测试** — Windows/Linux 的透明窗口配置可能需要调整

## 📄 License

MIT
