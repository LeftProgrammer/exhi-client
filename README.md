# exhi-client · 智慧展厅展示端 Runtime

> Electron 33 + Vue 3 + TypeScript，面向 Windows 展厅大屏/触摸/拼接/滑轨屏。
> 采用 **Runtime + Project Package** 双层架构：代码一次写好，项目通过更换配置和内容包交付。

---

## 当前阶段：M4 · 指令分发引擎 + 系统 Action

**M1/M2/M3 已完成**：工程骨架、多屏窗口、IPC、项目包加载、四种 Renderer、AdaptiveStage、双缓冲 SceneStage、WebSocket 客户端、本地 HTTP、Standalone、Mock Hub、exhibitBridge、Composite 场景。

**M4 新增**：
- ✅ `CommandDispatcher`：完整解析 bindings.json，含变量替换（`$payload.x`、`$args.x`、`$device.x`）
- ✅ Macro：命名步骤序列、嵌套（`do: "macro"`）、带参（`$args.x`）、限深防循环
- ✅ 内置 Action 注册表：`scene.switch / scene.switchAll / scene.reload / renderer.play / pause / seek / setRate`
- ✅ 系统 Action（主进程实现）：`system.setVolume / system.reboot / system.shutdown / system.abortShutdown / system.restartApp`
- ✅ 显式 `cmd.macro` 与隐式 `cmd.scenario.<name>`（语法糖，自动找 `scenario.<name>` macro）
- ✅ demo-hall bindings 完整示例（4 个 scenario macro，含嵌套与带参）

**尚未做**：M5 双槽 + content-sync · M6 watchdog + Guardian · M7 OTA + 诊断面板

---

## exhibitBridge 在项目包里怎么用

任意一个展项 HTML 加一行 script：

```html
<script src="exhi-pkg://pkg/__exhi__/bridge.js"></script>
```

然后就能调：

```js
await window.exhibitBridge.ready

// 切场景（同屏或跨屏）
await window.exhibitBridge.dispatch({
  type: 'cmd.gotoScene',
  payload: { sceneId: 'next', display: 'wall' }
})

// 埋点 / 抛事件给中控
window.exhibitBridge.emit('analytics', { action: 'tap', target: 'btn-1' })

// 订阅客户端事件
window.exhibitBridge.on('scene:changed', (e) => {
  console.log('哪块屏切到了:', e.displayId, e.sceneId)
})

// 拿设备信息
const info = window.exhibitBridge.getInfo()
// { deviceId, displayId, runtimeVersion, packageInfo }
```

**允许调用的指令白名单**（与方案 §13.2 对齐）：
`cmd.gotoScene / cmd.play / cmd.pause / cmd.seek / cmd.setRate / cmd.volume / cmd.reload / cmd.macro`
（`cmd.system.*` / `cmd.package.*` / `cmd.runtime.*` / `cmd.diag.*` 只能中控下发，bridge 拒绝）

---

## 目录结构

```
runtime/
  main/        # 主进程
  preload/     # 预加载
  renderer/    # Vue 3 渲染层
  shared/      # 共享类型/常量
packages/      # 项目包
tools/
  mock-hub/    # 开发期 Mock 中控
out/, build/   # 构建产物
```

---

## 环境要求

- Node.js ≥ 20
- npm ≥ 10
- Windows 10/11 x64

---

## 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. Standalone 模式启动（默认，无中控）
```bash
npm run dev
```
启动后客户端按 `displays.json` 创建多屏窗口、加载 `demo-hall` 项目包、显示默认场景。WebSocket 不会连接（settings.json 不存在 → hub 禁用）。

### 3. 联调模式（Mock Hub + 客户端）

**终端 1**：启动 Mock Hub
```bash
npm run hub
```
看到：
```
[hub] WS  listening on  ws://localhost:18080
[hub] CTL listening on http://127.0.0.1:18081/send
[hub] 等待客户端连接...
```

**终端 2**：以"在线模式"启动客户端
```bash
npm run dev:online
```
（这个脚本等同 `EXHI_HUB_URL=ws://localhost:18080 + npm run dev`）

Mock Hub 终端会出现 `[hub] 客户端上线: deviceId=dev-xxx pkgV=0.1.0`。

**终端 3**：发指令
```bash
# 切场景（不指定 display → 广播到所有屏）
npm run hub:send cmd.gotoScene --sceneId=image-demo

# 切指定屏
npm run hub:send cmd.gotoScene --sceneId=welcome --display=main

# 重载当前场景
npm run hub:send cmd.reload

# 调音量（M2 仅记录日志，M4 接系统音量）
npm run hub:send cmd.volume --value=0.5
```

每条指令在 hub 终端会有 `[cmd→1] cmd.gotoScene ...`，客户端窗口立刻切换场景，hub 终端还会收到上行状态：
```
[evt] evt.cmdResult {"cmdId":"...","ok":true,"delivered":1}
[evt] evt.status {"deviceId":"...","mode":"online",...}
```

### 4. 本地代理通道（直接 HTTP 推指令，无需 hub）

```bash
curl -X POST http://127.0.0.1:17600/cmd ^
  -H "content-type: application/json" ^
  -d "{\"type\":\"cmd.gotoScene\",\"payload\":{\"sceneId\":\"image-demo\"}}"
```

此通道用于：本地代理进程（如滑轨传感器读取程序）就近推送指令，不依赖中控。

---

## settings.json 持久化配置（可选）

环境变量适合 dev 临时切换；正式部署用 `%APPDATA%/exhi-client/settings.json`：

```json
{
  "hubUrl": "wss://hub.example.com/ws",
  "hubToken": "device-token-xxx",
  "hubSecret": "shared-secret-for-hmac",
  "enableSign": false
}
```

- `hubUrl` 缺省/为空 → 进入纯 Standalone
- `enableSign` 为 true 时校验下行指令 HMAC 签名（M2 默认关，简化联调）

环境变量优先级 > settings.json > 默认值。

---

## 项目包工作机制

启动时按以下顺序寻找：
1. `%APPDATA%/exhi-client/packages/current.txt` 指向的 slot
2. `slot-a` / `slot-b`
3. **开发模式 fallback**：`packages/demo-hall/`
4. **生产种子**：`<安装目录>/resources/packages/demo-hall/` 复制到 slot-a

---

## 多屏支持

`demo-hall/displays.json` 已声明两块屏：
- `main`：主屏 → image-demo
- `side`：第二块屏 → welcome

需要测拼接屏？把 `designBase` 改成 `{ "width": 5760, "height": 1080 }`。

---

## 关键脚本

| 命令 | 作用 |
|---|---|
| `npm run dev` | 开发模式启动（Standalone） |
| `npm run dev:online` | 开发模式启动（连本地 Mock Hub） |
| `npm run hub` | 启动 Mock Hub（终端常驻） |
| `npm run hub:send <cmd> --k=v` | 通过 Mock Hub 发指令到客户端 |
| `npm run build` | 构建到 `out/` |
| `npm run pack` | 打包 NSIS 安装包 |
| `npm run pack:dir` | 打包免安装目录 |
| `npm run typecheck` | TypeScript 类型检查 |

---

## 日志与运行数据位置

```
%APPDATA%/exhi-client/
  ├─ logs/main-YYYY-MM-DD.log    # 主进程日志
  ├─ device-id.txt                # 持久化 deviceId
  ├─ settings.json                # 运行配置（可选）
  └─ packages/                    # 项目包双槽（M5 接入）
```

---

## bindings.json 用法

```json
{
  "bindings": [
    { "on": "cmd.gotoScene", "do": "scene.switch",
      "params": { "sceneId": "$payload.sceneId", "display": "$payload.display" } }
  ],
  "macros": {
    "scenario.opening": {
      "steps": [
        { "do": "system.setVolume", "params": { "value": 0.8 } },
        { "do": "scene.switchAll", "params": { "sceneId": "intro-video" } }
      ]
    },
    "scenario.demo-nested": {
      "steps": [
        { "do": "macro", "params": { "name": "scenario.touch-mode" } },
        { "do": "scene.switchAll", "params": { "sceneId": "welcome" } }
      ]
    }
  }
}
```

**触发方式**

```bash
# 直接 binding（demo bindings 的 cmd.gotoScene → scene.switch）
npm run hub:goto -- --sceneId=touch-demo

# 显式 macro
npm run hub:send -- cmd.macro --name=scenario.opening

# 隐式 scenario（语法糖：cmd.scenario.opening 自动找 scenario.opening 宏）
npm run hub:send -- cmd.scenario.opening
npm run hub:send -- cmd.scenario.demo-nested

# 带参 macro
npm run hub:send -- cmd.macro --name=scenario.go-with-args --sceneId=image-demo
```

**变量占位符**

| 占位 | 来源 |
|---|---|
| `$payload.x` | 触发指令的 payload（例如 `--sceneId=xxx` 后变成 `payload.sceneId`） |
| `$args.x` | macro 调用时的 args 字段 |
| `$device.x` | 当前 display 信息（deviceId / displayId / runtimeVersion） |

**内置 Action 一览**

| Action | 实现层 | 说明 |
|---|---|---|
| `scene.switch` | 渲染层 | 切单屏（带 display 检查） |
| `scene.switchAll` | 渲染层 | 切所有屏 |
| `scene.reload` | 渲染层 | 重载当前场景 |
| `renderer.play / pause / seek / setRate` | 渲染层 | 播放控制 |
| `system.setVolume` | 主进程 | PowerShell 调系统音量 |
| `system.reboot / shutdown` | 主进程 | Windows shutdown 命令（默认 10s 倒计时） |
| `system.abortShutdown` | 主进程 | 取消倒计时 |
| `system.restartApp` | 主进程 | 重启 Electron 自身 |
| `macro` | 渲染层 | 调用另一个 macro（支持参数透传） |

---

## 下一步（M5）

- 项目包双槽 + 原子切换 + 自动回滚
- `cmd.package.update`：HTTPS Range 增量下载 + SHA256 校验
- 项目包构建 CLI（`tools/pack-cli`）
