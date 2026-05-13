# exhi-client · 智慧展厅展示端 Runtime

> 基于 Electron 33 + Vue 3 + TypeScript，面向 Windows 展厅大屏/触摸/拼接/滑轨屏的展示端。
> 采用 **Runtime + Project Package** 双层架构：代码一次写好，项目通过更换配置和内容包交付。

详细设计见 `docs/`（或会议方案 v2.0）。

---

## 当前阶段：M1 · Runtime 骨架

本里程碑产出：

- ✅ Electron + Vue + Vite + TypeScript 工程结构
- ✅ 主进程：单实例锁、多屏窗口管理、CSP、IPC、日志、项目包加载
- ✅ 预加载层（contextBridge 暴露受限 API）
- ✅ 渲染层：Pinia store、AdaptiveStage 自适应、Video/Image/Web 三种 ContentRenderer
- ✅ 示例项目包 `packages/demo-hall`（可直接启动验证）
- ✅ electron-builder 打包配置（Windows x64 NSIS）

**尚未做**（后续里程碑）：
- M2：WebSocket 客户端、Standalone 模式、本地 HTTP、Mock Hub
- M3：exhibitBridge、composite 场景、场景预加载/双缓冲
- M4：CommandDispatcher、bindings.json 执行引擎、macro
- M5：项目包双槽切换、content-sync、SHA256 校验
- M6：watchdog、Guardian Windows Service、远程日志、metrics
- M7：electron-updater、诊断面板、Kiosk 部署脚本

---

## 目录结构

```
runtime/
  main/        # 主进程：窗口、IPC、安全、项目包加载、日志
  preload/     # 预加载（contextBridge）
  renderer/    # Vue 3 渲染层
  shared/      # 三处共享的类型 / 常量
packages/      # 项目包（开发期 fallback 用 demo-hall）
out/           # electron-vite 构建产物
build/         # electron-builder 打包产物
```

---

## 环境要求

- Node.js ≥ 20
- npm ≥ 10
- Windows 10/11 x64（最终目标平台；其他平台可开发调试）

---

## 安装与运行

```bash
# 1. 安装依赖（首次较慢，国内已配 npmmirror）
npm install

# 2. 类型检查（可选，确认环境 OK）
npm run typecheck

# 3. 启动开发模式
#    会同时启动 Vite dev server 和 Electron
#    开发模式下窗口非全屏，便于调试；生产打包后自动全屏 kiosk
npm run dev
```

启动后应能看到一个 1920×1080（或更小）的开发窗口，加载 `demo-hall` 项目包的 `welcome` 场景——一段渐变背景 + "智慧展厅客户端" 标题 + 系统信息行。

打开 DevTools（开发模式自动打开），应能看到 `渲染层初始化完成: display=main` 之类日志。

---

## 构建与打包

```bash
# 仅构建 (out/)
npm run build

# 打包为 Windows 安装包（build/）
npm run pack

# 打包为绿色版目录（build/win-unpacked，免安装）
npm run pack:dir
```

打包产物在 `build/`：
- `智慧展厅客户端-1.0.0-x64.exe` —— NSIS 安装包
- `win-unpacked/` —— 免安装目录

---

## 项目包工作机制

启动时，主进程按以下顺序寻找项目包：

1. `%APPDATA%/exhi-client/packages/current.txt` 指向的 slot
2. `%APPDATA%/exhi-client/packages/slot-a` 或 `slot-b`
3. **开发模式 fallback**：工程内 `packages/demo-hall/`
4. **生产模式种子**：`<安装目录>/resources/packages/demo-hall/` 复制到 slot-a

→ 因此 `npm run dev` 直接能跑，不需要手动放项目包。

---

## 多屏支持快速验证

`packages/demo-hall/displays.json` 只声明了主屏。要测多屏：

1. 编辑 `displays.json` 增加一个 `{ "id": "side", "match": { "index": 1 }, ... }`
2. 确保 `scenes.json` 里对应的 `defaultScene` 存在
3. 重启 dev

或者用真实项目（白马项目包）替换。

---

## 关键脚本

| 命令 | 作用 |
|---|---|
| `npm run dev` | 启动开发模式（Vite HMR + Electron） |
| `npm run build` | 构建到 `out/`（不打包安装包） |
| `npm run pack` | 完整打包安装包 |
| `npm run pack:dir` | 打包免安装目录 |
| `npm run typecheck` | TypeScript 类型检查 |
| `npm run format` | Prettier 格式化 |

---

## 已知开发说明

- 开发模式窗口**不全屏**、**不 kiosk**、**带菜单栏**，便于调试
- 生产打包后才会启用 kiosk、热键拦截、置顶
- 鼠标光标在生产模式默认隐藏（CSS `cursor: none`），开发模式同样隐藏
- 日志位置：`%APPDATA%/exhi-client/logs/main-YYYY-MM-DD.log`
- deviceId 位置：`%APPDATA%/exhi-client/device-id.txt`（首次启动自动生成）

---

## 下一步（M2）

启动 WebSocket 客户端 + Mock Hub，让客户端能接收远程 `cmd.gotoScene` 指令切换场景。
