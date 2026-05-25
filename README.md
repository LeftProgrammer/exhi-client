# exhi-client · 智慧展厅展示端 Runtime

> Electron 33 + Vue 3 + TypeScript，面向 Windows 展厅大屏 / 触摸 / 拼接 / 滑轨屏。  
> **Runtime + Project Package 双层架构**：Runtime 负责协议、渲染、稳定性；项目包负责展示内容和配置，独立部署、远程热更新。

---

## 目录结构

```
exhi-client/
├── runtime/
│   ├── main/         # 主进程（协议、包加载、WS、本地HTTP、守护）
│   ├── preload/      # 预加载脚本
│   ├── renderer/     # Vue 3 运行时 UI（HUD、诊断面板）
│   └── shared/       # 共享类型 / 常量
├── packages/
│   ├── project/      # 白马项目工程源码（Vite + Vue，多屏合一）
│   └── test-pkg/     # 框架测试包（纯 HTML，用于调试 Runtime）
├── tools/
│   ├── mock-hub/     # 开发期 Mock 中控（WS + HTTP 控制台）
│   ├── pkg-assemble/ # 组装可部署包（Vite dist + deploy 配置 + 素材）
│   ├── dist-cli/     # 一键打包 exe（pkg-assemble + electron-vite + electron-builder）
│   ├── pack-cli/     # SHA256 清单计算 / 校验
│   ├── content-dev/  # 开发期内容代理（把 exhi-pkg:// 转发到 Vite HMR server）
│   ├── content-server/ # 本地内容 HTTP 服务器（测试包推送用）
│   ├── release-cli/  # OTA 频道目录整理
│   └── dev-helper/   # 开发辅助（查状态 / 重置槽）
├── docs/
│   ├── DEPLOY.md          # 生产部署全流程
│   ├── CONTENT-GUIDE.md   # 项目包内容制作规范
│   └── PROJECT-STRUCTURE.md # 项目包结构约定
├── guardian/         # 进程守护（独立 Node 进程，崩溃后拉起客户端）
├── build/            # 打包产物（gitignore）
└── out/              # electron-vite 编译产物（gitignore）
```

---

## 环境要求

- Node.js ≥ 20
- npm ≥ 10
- Windows 10/11 x64

---

## 快速开始

### 安装依赖

```bash
npm install
```

### 场景一：框架调试（推荐初次运行）

不依赖任何项目构建，直接启动 Electron 加载内置测试包：

```bash
npm run dev:test
```

打开后看到"框架诊断"页面，bridge 状态、场景切换、自定义 action 均可在页面内测试。

### 场景二：白马项目开发

需要两个终端：

**终端 1**（内容页 Vite HMR server，5174 端口）：

```bash
cd packages/project
npm run dev          # 同时服务 baima-yushui-leaders 和 baima-milestone
```

**终端 2**（Electron 客户端，加载指定展区配置）：

```bash
npm run dev:yushui      # 渝水新景 + 领导关怀
# 或
npm run dev:milestone   # 里程碑滑轨
```

Electron 的 `exhi-pkg://` 协议会把内容请求代理到终端 1 的 5174 server，获得 HMR 体验。

### 场景三：联调 Mock Hub

在场景一或二基础上，加一个 Mock Hub 终端进行指令测试：

**新增终端**：

```bash
npm run hub     # WS 监听 18080，HTTP 控制台 18081
```

然后用 `dev:test` / `dev:yushui` 等脚本（已内置 `EXHI_HUB_URL=ws://localhost:18080`）启动客户端，再从第三个终端发指令：

```bash
# 切场景
npm run hub:send -- cmd.gotoScene --sceneId=touch-demo

# 切指定屏
npm run hub:send -- cmd.gotoScene --sceneId=welcome --display=main

# 触发 macro
npm run hub:send -- cmd.macro --name=scenario.opening

# 音量
npm run hub:send -- cmd.volume --value=0.5

# 重载当前场景
npm run hub:send -- cmd.reload
```

---

## 脚本速查

### 开发

| 命令                                | 说明                                              |
| ----------------------------------- | ------------------------------------------------- |
| `npm run dev:test`                  | Electron + 框架测试包（test-pkg，无需构建）       |
| `npm run dev:yushui`                | Electron + 白马渝水新景展区                       |
| `npm run dev:milestone`             | Electron + 白马里程碑滑轨展区                     |
| `npm run dev:online`                | Electron（无 EXHI_DEV_PACKAGE，需已安装包或有槽） |
| `npm run hub`                       | 启动 Mock Hub                                     |
| `npm run hub:send -- <cmd> --k=v`   | 向客户端发指令                                    |
| `npm run hub:goto -- --sceneId=xxx` | 快捷切场景                                        |
| `npm run dev:status`                | 查看当前槽状态                                    |
| `npm run dev:reset`                 | 清空 userData 包槽（重置到 dev fallback）         |

### 构建 & 打包

| 命令                                     | 说明                                                           |
| ---------------------------------------- | -------------------------------------------------------------- |
| `npm run dist:yushui`                    | 完整打包渝水展区 exe（pkg-assemble + 编译 + electron-builder） |
| `npm run dist:milestone`                 | 完整打包里程碑展区 exe                                         |
| `npm run dist:yushui -- --skip-assemble` | 跳过 Vite build（已有 dist/）直接打 exe                        |
| `npm run dist:yushui -- --dir`           | 只打免安装目录，不生成 NSIS                                    |
| `npm run pkg:assemble`                   | 单独运行 pkg-assemble（组装所有项目包）                        |
| `npm run pkg:verify <path>`              | 校验本地包 SHA256 完整性                                       |
| `npm run build`                          | 仅编译 electron-vite（runtime out/）                           |

### 内容服务 & 发布

| 命令                                                  | 说明                                            |
| ----------------------------------------------------- | ----------------------------------------------- |
| `npm run dev:content <dir>`                           | 启动本地内容 HTTP 服务器（测试 hub 推包流程用） |
| `npm run release -- --channel=stable --out=build/ota` | 整理 OTA 频道目录                               |
| `npm run typecheck`                                   | 全量 TS 类型检查                                |
| `npm run lint`                                        | ESLint 检查                                     |
| `npm run format`                                      | Prettier 格式化                                 |

---

## exhibitBridge

任意展项 HTML 头部加一行：

```html
<script src="exhi-pkg://pkg/__exhi__/bridge.js"></script>
```

```js
await window.exhibitBridge.ready

// 切场景（同屏或跨屏）
await window.exhibitBridge.dispatch({
  type: 'cmd.gotoScene',
  payload: { sceneId: 'next', display: 'wall' }
})

// 埋点 / 上报中控
window.exhibitBridge.emit('analytics', { action: 'tap', target: 'btn-1' })

// 订阅事件
window.exhibitBridge.on('scene:changed', (e) => {
  console.log(e.displayId, e.sceneId)
})

// 设备 / 包信息
const info = window.exhibitBridge.getInfo()
// → { deviceId, displayId, runtimeVersion, packageInfo }
```

**bridge 可调指令白名单**：`cmd.gotoScene / cmd.play / cmd.pause / cmd.seek / cmd.setRate / cmd.volume / cmd.reload / cmd.macro`  
`cmd.system.* / cmd.package.* / cmd.runtime.* / cmd.diag.*` 只允许中控下发，bridge 直接拒绝。

---

## bindings.json

```json
{
  "bindings": [
    {
      "on": "cmd.gotoScene",
      "do": "scene.switch",
      "params": { "sceneId": "$payload.sceneId", "display": "$payload.display" }
    }
  ],
  "macros": {
    "scenario.opening": {
      "steps": [
        { "do": "system.setVolume", "params": { "value": 0.8 } },
        { "do": "scene.switchAll", "params": { "sceneId": "welcome" } }
      ]
    },
    "scenario.go-with-args": {
      "steps": [
        {
          "do": "scene.switch",
          "params": { "sceneId": "$args.sceneId", "display": "$args.display" }
        }
      ]
    }
  },
  "standalone": { "onStartup": [] }
}
```

**变量占位符**

| 占位         | 来源                                                  |
| ------------ | ----------------------------------------------------- |
| `$payload.x` | 触发指令的 payload                                    |
| `$args.x`    | macro 调用时的 args 字段                              |
| `$device.x`  | 当前设备信息（deviceId / displayId / runtimeVersion） |

**内置 Action**

| Action                             | 层     | 说明                         |
| ---------------------------------- | ------ | ---------------------------- |
| `scene.switch`                     | 渲染层 | 切单屏（指定 display）       |
| `scene.switchAll`                  | 渲染层 | 切所有屏                     |
| `scene.reload`                     | 渲染层 | 重载当前场景                 |
| `renderer.play/pause/seek/setRate` | 渲染层 | 播放控制                     |
| `system.setVolume`                 | 主进程 | PowerShell 调系统音量        |
| `system.reboot/shutdown`           | 主进程 | Windows shutdown（默认 10s） |
| `system.abortShutdown`             | 主进程 | 取消倒计时                   |
| `system.restartApp`                | 主进程 | 重启 Electron                |
| `macro`                            | 渲染层 | 嵌套调用 macro               |

---

## 项目包机制

### 加载优先级

1. `EXHI_DEV_PACKAGE` 指定的工程目录（仅开发模式）
2. `%APPDATA%/exhi-client/packages/current.txt` 指向的 slot
3. `slot-a` / `slot-b`（自动回滚：激活槽校验失败时切到另一槽）
4. **生产种子**：`<安装目录>/resources/packages/<projectId>/` → 复制到 slot-a

### 双槽结构

```
%APPDATA%/exhi-client/packages/
  ├─ slot-a/        ← 当前激活
  ├─ slot-b/        ← hub 推包时写入
  └─ current.txt    ← "slot-a" 或 "slot-b"
```

切槽流程：下载到 slot-b → SHA256 校验 → 写 current.txt → 重启生效。  
开发时运行 `npm run dev:reset` 可清空所有槽，回到 `EXHI_DEV_PACKAGE` fallback。

---

## 项目包远程更新

完整流程示例（以 baima-yushui-leaders 为例）：

### 1. 组装可部署包

```bash
# 只做 pkg-assemble（Vite build + 组装），不打 exe
npm run pkg:assemble -- --project=baima-yushui-leaders --out=build/baima-yushui-leaders/packages
```

或用完整打包命令（跳过 exe 步骤）：

```bash
npm run dist:yushui -- --dir
```

输出：

```
build/baima-yushui-leaders/packages/baima-yushui-leaders/
  ├─ manifest.json   ← files[] + checksum 已自动写入
  ├─ scenes.json
  ├─ contents/
  └─ ...
```

### 2. 启动本地内容服务器

```bash
npm run dev:content build/baima-yushui-leaders/packages
# [content] 监听 http://127.0.0.1:18090/
# [content] 可用包：
#   - http://127.0.0.1:18090/baima-yushui-leaders/
```

### 3. 通过 hub 推送

终端 1: `npm run hub` · 终端 2: `npm run dev:yushui` · 终端 3:

```bash
# 立即同步切换（会重启客户端）
npm run hub:send -- cmd.package.update --url=http://127.0.0.1:18090/baima-yushui-leaders/ --applyAt=now

# 后台同步，空闲时切（凌晨 4:00）
npm run hub:send -- cmd.package.update --url=http://127.0.0.1:18090/baima-yushui-leaders/

# 取消挂起的切换
npm run hub:send -- cmd.package.cancel
```

hub 终端可观察到：

```
[evt] evt.packageProgress {"phase":"fetch-manifest"}
[evt] evt.packageProgress {"phase":"download","current":1,"total":52,...}
[evt] evt.packageProgress {"phase":"verify-final"}
[evt] evt.packageReady    {"slot":"slot-b","version":"1.0.0"}
[evt] evt.packageChanged  {"slot":"slot-b","version":"1.0.0"}
```

### 4. 校验本地包

```bash
npm run pkg:verify build/baima-yushui-leaders/packages/baima-yushui-leaders
# [pack-cli] verify OK
```

---

## OTA Runtime 更新

### 准备发布频道

```bash
npm run dist:yushui                                   # 先打包（生成 latest.yml）
npm run release -- --channel=stable --out=build/ota  # 整理 OTA 目录
npm run dev:content -- --root=build/ota --port=18090  # 启动 OTA 服务器
```

### 触发更新

```bash
npm run hub:send -- cmd.runtime.update --applyAt=now     # 立即下载安装
npm run hub:send -- cmd.runtime.update --applyAt=idle    # 空闲时安装
npm run hub:send -- cmd.runtime.update --channel=beta    # 切 beta 通道
npm run hub:send -- cmd.runtime.cancel                   # 取消挂起安装
```

`settings.json` 配置更新源：

```json
{
  "updateFeedUrl": "http://127.0.0.1:18090",
  "updateChannel": "stable"
}
```

---

## 自定义 Action（项目包扩展）

在项目包根目录放 `actions.js`：

```js
export default function register(exhi) {
  exhi.registerAction('project.fancy-transition', async ({ params }) => {
    console.log('自定义动作', params)
    return { ok: true }
  })
}
```

`bindings.json` 里直接引用：

```json
{ "on": "cmd.scenario.special", "do": "project.fancy-transition", "params": { "duration": 2000 } }
```

约束：命名空间必须含 `.`，且不能覆盖 `scene.* / renderer.* / system.* / macro`。

---

## 稳定性 & 诊断

### Watchdog 熔断测试

在任意展项窗口的 DevTools Console 运行：

```js
process.crash()
```

连续三次 → 触发熔断 → 窗口进入安全模式（暗色呼吸点）→ 5 分钟后自动解除。

### 远程诊断

```bash
npm run hub:send -- cmd.diag.echo --text=hello             # 回声测试
npm run hub:send -- cmd.diag.logs --lines=50               # 拉主进程日志
npm run hub:send -- cmd.diag.screenshot --display=main     # 远程截图（JPG base64）
```

### 诊断面板

任意窗口聚焦，5 秒内连按 3 次 **Ctrl+Shift+Alt+E** → 弹出诊断面板。

### 退出 Kiosk

**Ctrl+Shift+Alt+Q** → 立即退出客户端（仅打包后生效，开发模式无效）。用于现场运维需要临时关闭程序时使用，不对外公开。

### 健康指标

客户端连线后 hub 终端持续收到：

```
[evt] evt.metrics {"cpu":0.05,"memMB":312,"sysMem":0.61,"uptime":42,...}
```

### Guardian

打包后测试进程守护：

```powershell
$env:EXHI_CLIENT_EXE = "build\baima-yushui-leaders\win-unpacked\白马展厅·渝水领导.exe"
npm run guardian
```

用任务管理器强杀客户端进程，30 秒内 Guardian 自动拉起。  
正式部署用 `guardian/install-task.ps1`（需管理员 PowerShell）。

---

## 运行时数据位置

```
%APPDATA%/exhi-client/
  ├─ logs/main-YYYY-MM-DD.log   # 主进程日志（每日滚动）
  ├─ device-id.txt              # 持久化 deviceId
  ├─ settings.json              # 运行配置（可选）
  ├─ offline-queue.ndjson       # 离线期间缓存的上行事件（10MB 滚动）
  └─ packages/                  # 项目包双槽
       ├─ slot-a/
       ├─ slot-b/
       └─ current.txt
```

---

## settings.json 可选配置

```json
{
  "hubUrl": "wss://hub.example.com/ws",
  "hubToken": "device-token-xxx",
  "hubSecret": "shared-secret-for-hmac",
  "enableSign": false,
  "updateFeedUrl": "https://ota.example.com",
  "updateChannel": "stable",
  "localToken": "device-local-secret",
  "localCmdMaxHz": 30,
  "deviceScaleFactor": 1,
  "disableHardwareAcceleration": false
}
```

---

## 生产部署

详见 [docs/DEPLOY.md](./docs/DEPLOY.md)：Windows 系统准备、Kiosk 模式、Guardian 服务、包预置与远程推送、OTA 服务器搭建、灰度发布、验收清单。
