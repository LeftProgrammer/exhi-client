# exhi-client · 智慧展厅展示端 Runtime

> Electron 33 + Vue 3 + TypeScript，面向 Windows 展厅大屏/触摸/拼接/滑轨屏。
> 采用 **Runtime + Project Package** 双层架构：代码一次写好，项目通过更换配置和内容包交付。

---

## 当前阶段：M5 · 项目包双槽与远程更新

**M1-M4 已完成**：工程骨架、多屏窗口、IPC、项目包加载、四种 Renderer、AdaptiveStage、双缓冲 SceneStage、WebSocket、本地 HTTP、Standalone、Mock Hub、exhibitBridge、CommandDispatcher、bindings 引擎、系统 Action。

**M5 新增**：
- ✅ 项目包双槽 + 原子指针切换 + 启动失败自动回滚
- ✅ Manifest `files[]` + 整包 `checksum`：每文件 size + sha256，支持完整性校验
- ✅ `ContentSync`：HTTP 拉取远端 manifest → 比对本地 → 增量下载缺失/不一致文件 → 删除孤儿 → 校验
- ✅ `cmd.package.update {url, version?, applyAt}` 指令：后台同步 + 按 applyAt 调度切换
  - `applyAt: "now"` 立即重启切换
  - `applyAt: "idle"` 凌晨 4 点切换（默认）
  - `applyAt: "2026-05-15T03:00:00Z"` 指定时间
- ✅ `cmd.package.cancel` 取消挂起的切换计划
- ✅ 上行事件：`evt.packageProgress` / `evt.packageReady` / `evt.packageChanged`
- ✅ `tools/pack-cli`：项目包构建与校验 CLI（生成 files + checksum 写回 manifest）
- ✅ `tools/content-server`：开发期静态内容服务器（生产用 nginx 代替）

**尚未做**：M6 watchdog + Guardian Service · M7 Runtime OTA + 诊断面板

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

## 项目包远程更新（M5）

完整流程示例——演示把 `demo-hall` 项目包"远程"推到运行中的客户端：

### 1. 构建项目包（生成 manifest.files + checksum + 输出到 dist 目录）

```bash
npm run pkg:build packages/demo-hall -- --out=build/packages
```

输出：
```
build/packages/demo-hall-0.1.0/
  ├─ manifest.json   ← files[] + checksum 已自动写入
  ├─ scenes.json
  ├─ contents/...
  └─ ...
```

### 2. 启动开发期内容服务器

```bash
npm run content-server
# [content] 监听 http://127.0.0.1:18090/
# [content] 可用包：
#   - http://127.0.0.1:18090/demo-hall-0.1.0/
```

### 3. 让客户端拉这个包

终端 1: hub  · 终端 2: dev:online · 终端 3 发指令：

```bash
# 立即同步并切换（会重启客户端）
npm run hub:send -- cmd.package.update --url=http://127.0.0.1:18090/demo-hall-0.1.0/ --applyAt=now

# 或后台同步、凌晨 4 点切（默认 idle）
npm run hub:send -- cmd.package.update --url=http://127.0.0.1:18090/demo-hall-0.1.0/

# 取消挂起的切换
npm run hub:send -- cmd.package.cancel
```

观察 hub 终端可看到：
```
[evt] evt.packageProgress {phase:"fetch-manifest"}
[evt] evt.packageProgress {phase:"download", current:1, total:5, file:"contents/..."}
...
[evt] evt.packageProgress {phase:"verify-final"}
[evt] evt.packageReady {slot:"slot-b", version:"0.1.0", ...}
[evt] evt.packageChanged {slot:"slot-b", version:"0.1.0"}    ← 切换后
```

### 4. 校验本地包完整性

```bash
npm run pkg:verify build/packages/demo-hall-0.1.0
# [pack-cli] verify OK (5 files)
```

### 双槽与回滚说明

```
%APPDATA%/exhi-client/packages/
  ├─ slot-a/   ← 当前激活
  ├─ slot-b/   ← content-sync 写入到这里
  └─ current.txt   "slot-a"
```

- 切槽流程：下载到 slot-b → 校验 → 写 current.txt 指向 slot-b → 重启
- 启动若发现激活槽校验失败，自动回滚到另一槽并写指针
- 双槽都失败 → dev 用工程内 fallback / prod 用种子包

---

## 下一步（M6）

- 渲染进程崩溃看门狗 + 重建窗口
- Windows Service Guardian（独立进程守护客户端进程）
- 反复崩溃熔断 → 安全模式
- 远程日志上报 + CPU/内存/GPU 指标采集
