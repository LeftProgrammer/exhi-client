# exhi-client · 智慧展厅展示端 Runtime

> Electron 33 + Vue 3 + TypeScript，面向 Windows 展厅大屏/触摸/拼接/滑轨屏。
> 采用 **Runtime + Project Package** 双层架构：代码一次写好，项目通过更换配置和内容包交付。

---

## 当前阶段：M3 · 内容系统增强

**M1/M2 已完成**：工程骨架、多屏窗口、CSP、IPC、项目包加载、Video/Image/Web Renderer、AdaptiveStage、WebSocket 客户端、本地 HTTP、Standalone、Mock Hub。

**M3 新增**：
- ✅ exhibitBridge：iframe 内容通过 `window.exhibitBridge` 反向调客户端（dispatch/emit/on/getInfo）
- ✅ Bridge 脚本通过 `exhi-pkg://pkg/__exhi__/bridge.js` 由 Runtime 内置提供（项目包无需打包）
- ✅ `CompositeRenderer`：多层场景合成（stack/row/column/grid 四种布局）
- ✅ `SceneStage` 双缓冲 crossfade：场景切换无黑帧
- ✅ VideoRenderer 事件采集（progress/ended/error）+ 状态精细上报
- ✅ Bridge 事件广播（scene:changed / scene:ended → 所有 iframe）
- ✅ demo-hall 新增 touch-demo 触摸交互页 + composite-demo 合成场景

**尚未做**：M4 CommandDispatcher + bindings 引擎 · M5 双槽 + content-sync · M6 watchdog + Guardian · M7 OTA + 诊断面板

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

## 下一步（M4）

- CommandDispatcher 完整接入 `bindings.json`（含 macro、变量替换、嵌套）
- 系统音量真接入（PowerShell 调系统声卡）
- `cmd.system.reboot/shutdown/restartApp` 接入
- 内置 Action 集合稳定化
