# packages/test-pkg · 框架测试包

用于验证 Runtime 框架本身是否正常工作。纯 HTML，无需构建，直接由 Runtime 加载。

不包含任何业务内容，专门用于：

- 本地开发时快速启动一个可用的客户端环境
- 验证协议层、bridge 注入、场景渲染、指令绑定是否正常
- 端到端测试 hub 推包、槽切换等流程

---

## 启动

```bash
# 在项目根目录
npm run dev:test
```

打开后默认展示 `welcome`（框架诊断）页面。

---

## 目录结构

```
packages/test-pkg/
├── manifest.json      # projectId: test-pkg
├── displays.json      # main（主屏）+ side（副屏）
├── scenes.json        # 5 个测试场景
├── bindings.json      # 完整指令绑定 + macro 示例
├── actions.js         # 自定义 action 测试（test.hello / test.fail）
└── contents/
    ├── welcome/index.html   # 诊断面板
    ├── touch/index.html     # bridge 交互测试
    ├── black.svg            # 纯黑屏
    └── sample.svg           # 图片场景示例
```

---

## 场景说明

| 场景 ID          | 类型      | 验证内容                                                         |
| ---------------- | --------- | ---------------------------------------------------------------- |
| `welcome`        | web       | bridge 注入、`getInfo()`、`on('scene:changed')`、环境信息显示    |
| `image-demo`     | image     | ImageRenderer、`fit: contain`                                    |
| `touch-demo`     | web       | `dispatch()` 切场景、触发 macro、调音量、自定义 action、`emit()` |
| `composite-demo` | composite | stack 布局、WebRenderer 透明叠加 ImageRenderer                   |
| `blank`          | image     | 纯黑屏，闭馆场景验证                                             |

---

## 指令测试（配合 Mock Hub）

启动后加一个 hub 终端（已内置于 `dev:test` 脚本）：

```bash
npm run hub   # 另开终端
```

### 切场景

```bash
npm run hub:send -- cmd.gotoScene --sceneId=touch-demo
npm run hub:send -- cmd.gotoScene --sceneId=welcome --display=main
```

### 触发 macro

```bash
npm run hub:send -- cmd.macro --name=scenario.opening      # 音量 80% + 切 welcome
npm run hub:send -- cmd.macro --name=scenario.touch-mode   # 全屏切 touch-demo
npm run hub:send -- cmd.macro --name=scenario.closing      # 黑屏 + 静音
npm run hub:send -- cmd.macro --name=scenario.nested-macro # 嵌套 macro
```

### 自定义 action

```bash
npm run hub:send -- test.hello --name=框架           # → { greeted: "框架" }
npm run hub:send -- test.fail                        # 预期 error（验证错误路径）
```

### 系统指令

```bash
npm run hub:send -- cmd.volume --value=0.3
npm run hub:send -- cmd.reload
npm run hub:send -- cmd.system.restartApp
```

---

## touch-demo 页面内测试

打开 `touch-demo` 场景，页面上的按钮可直接点击：

- **场景切换**：验证 `exhibitBridge.dispatch()` → `cmd.gotoScene`
- **Macro 触发**：验证 bindings.json 里的 macro 定义
- **音量调节**：验证 `system.setVolume`
- **自定义 action**：验证 `actions.js` 注册的 `test.hello` 和 `test.fail`
- **emit analytics**：验证 `exhibitBridge.emit()`，主进程日志和 hub 终端均可见

所有操作结果实时显示在右侧日志面板。

---

## welcome 页面读取的信息

| 字段           | 来源                              | 验证内容                             |
| -------------- | --------------------------------- | ------------------------------------ |
| bridge.js 加载 | `window.exhibitBridge` 是否存在   | `injectBridge: true` 是否生效        |
| ready          | `exhibitBridge.ready`             | bridge 初始化流程                    |
| displayId      | `getInfo().displayId`             | displays.json 的屏幕 ID 是否正确透传 |
| packageId      | `getInfo().packageInfo.projectId` | 包加载是否正确                       |
| version        | `getInfo().packageInfo.version`   | manifest.json 读取是否正常           |
