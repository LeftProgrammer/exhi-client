# 白马展厅 · UEC 中控通信协议总览

> 本文件为**唯一权威中控协议文档**，汇总所有项目的中控指令格式、连接配置、交互说明与注意事项。
> 协议基于 WebSocket（UEC 转发服务），消息体为 JSON。
>
> 相关工具：`docs/uec-control-panel.html`（浏览器打开即可在线调试）

---

## 通用约定

- 协议：WebSocket（UEC 转发服务）
- 消息格式：JSON
- 中控只把指令发给主屏，主屏自动转发给副屏
- 心跳间隔：20 秒
- 重连间隔：3 秒

---

## WebSocket 连接配置

项目包 `hub.json` 通用配置：

```json
{
  "url": "wss://www.zzqxs.cn/uec/UECServer/ws/webSocketServer.do",
  "transport": "uec"
}
```

- `id` —— 本设备身份标识（部署时按实际设备分配唯一 ID）
- `target` —— 默认消息接收方（中控平台 ID）
- 心跳间隔：20 秒
- 重连间隔：3 秒（断开后固定间隔重连）

> **注意：** 部署时每个设备的 `id` 需唯一，避免消息串线。科研创新项目部署时通过 `settings.json` 覆盖 `hubId` 来区分 5 个屏（见科研创新章节）。

---

## 多屏互联（通用）

支持主屏向指定副屏发送控制消息，底层通过 UEC WS 转发。

**单设备发送示例：**

```typescript
const control = useControl()
control.sendTo('screen-2', { cmd: 'home' })
```

**广播多设备示例：**

```typescript
;['screen-2', 'screen-3', 'screen-4'].forEach((id) =>
  control.sendTo(id, { cmd: 'home' })
)
```

**WS 转发消息格式：**

```json
{
  "to": "screen-2",
  "msg": { "cmd": "home" }
}
```

接收方副屏的 `useRemoteControl` 会自动解析 `msg` 中的 `cmd` 字段并触发对应 handler。

---

## 一、白马展厅 · 科研创新（baima-research）

### 项目架构（5 屏联动）

| 屏幕 | displayId | hubId | 说明 |
|------|-----------|-------|------|
| 主屏 | `main` | `research-main` | 地图 + 点位详情 + 右侧菜单 |
| 左上副屏 | `top-left` | `research-tl` | 工程点位详情图文展示 |
| 左下副屏 | `bottom-left` | `research-bl` | 图片轮播、卡片堆叠展示 |
| 右上副屏 | `top-right` | `research-tr` | 工程点位详情图文展示 |
| 右下副屏 | `bottom-right` | `research-br` | 图片轮播、卡片堆叠展示 |

**通信链路：**
- 中控 WS 指令**只发给主屏**（目标 `research-main`）。
- main 收到指令后通过 UEC WS 转发到 4 个副屏。
- `home` 指令可群发给所有 5 屏，确保回待机万无一失。
- 副屏收到主屏转发的指令后应用到本屏视图，不再二次转发。

### 中控指令速查

| 操作 | 消息格式 | 说明 |
|------|----------|------|
| 回首页 | `{ "cmd": "home" }` | 返回待机（清空选中点位） |
| 选中点位 | `{ "cmd": "point", "id": "baima-bridge" }` | 选中指定工程点位 |
| 选中点位（兼容） | `{ "cmd": "goto", "id": "baima-bridge" }` | 同上 |
| 播放视频 | `{ "cmd": "video-play" }` | 播放当前点位视频 |
| 暂停视频 | `{ "cmd": "video-pause" }` | 暂停当前点位视频 |
| 快进播放 | `{ "cmd": "video-speed", "rate": 2 }` | 2 倍速快进 |
| 快退播放 | `{ "cmd": "video-speed", "rate": 0.5 }` | 0.5 倍速回看 |
| 恢复正常 | `{ "cmd": "video-speed", "rate": 1 }` | 恢复 1 倍速 |
| 跳时间 | `{ "cmd": "video-seek", "offset": 10 }` | 当前时间 +10 秒（可选） |
| 音量加大 | `{ "cmd": "video-volume", "delta": 0.1 }` | 音量增加 10%（0~1 范围） |
| 音量减小 | `{ "cmd": "video-volume", "delta": -0.1 }` | 音量减小 10% |
| 静音 | `{ "cmd": "video-mute", "muted": true }` | 静音 |
| 恢复音量 | `{ "cmd": "video-mute", "muted": false }` | 取消静音 |

### 字段说明

- `cmd` —— 指令类型：`home` / `point` / `goto` / `video-play` / `video-pause` / `video-speed` / `video-seek` / `video-volume` / `video-mute`
- `id` —— 点位标识，见下表
- `rate` —— 视频播放倍速，如 `0.5`、`1`、`2`
- `offset` —— 视频 seek 偏移量（秒），正数向后跳，负数向前跳
- `delta` —— 音量变化量（0~1），正数加大，负数减小
- `muted` —— 是否静音：`true` 静音，`false` 恢复

### 点位 ID 对照

| ID | 中文名 | 状态 |
|----|--------|------|
| excavation | 绿色开挖料 | 已完成 |
| navigation | 急弯通航 | 进行中 |
| coating | 聚脲涂层 | 进行中 |
| concrete | 抗冲磨混凝土 | 进行中 |
| slope | 高边坡建模 | 进行中 |
| baima-bridge | 白马大桥 | 已完成 |
| blasting | 旧桥爆破 | 已完成 |
| turbine | 水轮机 | 进行中 |

### 无"恢复"按钮的操作逻辑

- 点了快进（2x）→ 点暂停 → 再点播放 → **自动恢复 1 倍速**
- 点了快退（0.5x）→ 点暂停 → 再点播放 → **自动恢复 1 倍速**

### 项目交互说明

**首页（待机态）：** 显示完整地图 + 8 个工程点位标记（已完成为橙色水滴，进行中为蓝色菱形）。

**选中态：** 主屏地图仅保留当前点位并显示详情图文；左上/右上副屏展示该点位详情图文；左下/右下副屏展示图片轮播卡片堆叠。部分点位（baima-bridge、blasting）支持视频播放/暂停。

### 注意事项

1. `point` / `goto` 指令中的 `id` 必须存在于点位对照表中，否则无效。
2. `video-play` / `video-pause` 仅在当前选中的点位有视频素材时生效。
3. 所有消息通过 UEC WebSocket 服务转发，设备仅接收发给自己 `id` 的消息。

---

## 二、白马展厅 · 多维筑安（baima-duowei）

### 中控指令速查

| 操作 | 消息格式 | 说明 |
|------|----------|------|
| 回首页 | `{ "cmd": "home" }` | 回到首页 |
| 进入板块 | `{ "cmd": "goto", "target": "tech" }` | 进入指定板块 |
| 进入板块并定位 | `{ "cmd": "goto", "target": "tech", "index": 2 }` | 进入 tech 板块第 3 页 |
| 下一页 | `{ "cmd": "page", "action": "next" }` | 当前板块向后翻一页 |
| 上一页 | `{ "cmd": "page", "action": "prev" }` | 当前板块向前翻一页 |
| 直接定位 | `{ "cmd": "page", "index": 3 }` | 当前板块直接跳到第 index+1 页 |

### 字段说明

- `cmd` —— 指令类型：`home` / `goto` / `page`
- `target` —— 板块标识：`safety`（安全成效）/ `tech`（智慧技术）/ `activity`（安全活动）/ `standard`（标准化建设）
- `index` —— 页码索引（从 0 开始）
- `action` —— 翻页方向：`next` / `prev`

### 板块页数

| 板块 | 标识 | 总页数 |
|------|------|--------|
| 安全成效 | `safety` | 1 页（无翻页） |
| 智慧技术 | `tech` | 9 页 |
| 安全活动 | `activity` | 6 页 |
| 标准化建设 | `standard` | 4 页 |

### 项目交互说明

**首页：** 4 个按钮（安全成效、智慧技术、安全活动、标准化建设），点击进入对应板块。

**二级页：**
- **安全成效**：静态展示，1 页，无翻页
- **智慧技术**：9 页，支持内部翻页
- **安全活动**：6 页，支持内部翻页
- **标准化建设**：4 页，支持内部翻页

### 注意事项

1. `page` 指令在 `safety` 板块（只有 1 页）无效。
2. `index` 超出板块页数范围会被截断到有效范围。
3. `goto` 时若当前已在目标板块，只执行翻页/定位，不重新加载页面。

---

## 三、白马展厅 · 里程碑滑轨（baima-milestone）

### 中控指令速查

| 操作 | 消息格式 | 说明 |
|------|----------|------|
| 回首页 | `{ "cmd": "home" }` | 回到第 1 页（page1） |
| 跳到指定页 | `{ "cmd": "goto", "index": 2 }` | 跳到第 index+1 页（index 从 0 开始） |
| 下一页 | `{ "cmd": "page", "action": "next" }` | 向后翻一页 |
| 上一页 | `{ "cmd": "page", "action": "prev" }` | 向前翻一页 |
| 直接定位 | `{ "cmd": "page", "index": 3 }` | 直接跳到第 index+1 页 |
| 滚动播放 | `{ "cmd": "scrollPlay" }` | 当前页立即开始自动滚动 |
| 滚动暂停 | `{ "cmd": "scrollPause" }` | 当前页暂停自动滚动 |
| 滚动重置 | `{ "cmd": "scrollReset" }` | 当前页回到顶部并继续自动滚动 |

### 字段说明

- `cmd` —— 指令类型：`home` / `goto` / `page` / `scrollPlay` / `scrollPause` / `scrollReset`
- `index` —— 页码索引（从 0 开始，范围 0~4，对应 page1~page5）
- `action` —— 翻页方向：`next` / `prev`

### 页面索引对照

| 索引 | 页面 | 内容 |
|------|------|------|
| 0 | page1 | 参建单位·科学组织 |
| 1 | page2 | 筹建期 |
| 2 | page3 | 第一阶段 |
| 3 | page4 | 第二阶段 |
| 4 | page5 | 第三阶段 |

### 项目交互说明

本项目为 5 页幻灯片轮播，支持键盘 1~5 直接跳转、左右翻页。页面由滑轨位置决定，无自动回首页。

### 注意事项

1. `index` 超出 0~4 范围会被忽略。
2. 翻到第 5 页后再 `next` 会循环到第 1 页；翻到第 1 页后再 `prev` 会循环到第 5 页。

---

## 四、白马展厅 · 渝水新景 + 领导关怀（baima-yushui-leaders）

### 中控指令速查

| 操作 | 消息格式 | 说明 |
|------|----------|------|
| 回首页 | `{ "cmd": "home" }` | 无论当前在哪，返回首页 |
| 进渝水新景 | `{ "cmd": "goto", "target": "yushui" }` | 进入渝水新景板块 |
| 进领导关怀 | `{ "cmd": "goto", "target": "leaders" }` | 进入领导关怀板块 |
| 切换分类 | `{ "cmd": "category", "id": "1" }` | 在当前板块切换右侧分类菜单 |
| 下一页 | `{ "cmd": "page", "action": "next" }` | 当前分类下一张图片 |
| 上一页 | `{ "cmd": "page", "action": "prev" }` | 当前分类上一张图片 |
| 直接定位 | `{ "cmd": "goto", "target": "leaders", "category": "1", "index": 0 }` | 直接跳到指定板块+分类+条目 |
| 轮播控制 | `{ "cmd": "carousel", "action": "play" }` | `play` 开始 / `pause` 暂停 / `reset` 回到当前分类第一张图并继续轮播 |

### 字段说明

- `cmd` —— 指令类型：`home` / `goto` / `category` / `page` / `carousel`
- `target` —— 板块标识：`yushui`（渝水新景）/ `leaders`（领导关怀）
- `id` —— 分类标识（领导关怀下分类：`1`、`2`）
- `action` —— 翻页方向：`next` / `prev`；轮播控制：`play` / `pause` / `reset`
- `category` —— 分类标识（与 `id` 同义，用于 `goto` 直接定位）
- `index` —— 条目索引（从 0 开始）

### 板块与分类

| target | 板块名 | 分类 |
|--------|--------|------|
| yushui | 渝水新景 | 无分类 |
| leaders | 领导关怀 | `1`（2023-2024）、`2`（2025） |

### 项目交互说明

**首页：** 两个卡片（渝水新景、领导关怀），点击卡片进入对应板块。

**二级页（板块页）：**
- **右侧菜单**（领导关怀有，渝水新景无）：切换分类
- **底部按钮**：上一页 / 下一页 / 回首页
- **自动轮播**：页面进入后自动轮播图片，用户点击/切换分类/翻页后自动停止，不再自动恢复
- **中控轮播控制**：`carousel` 指令支持 `play` 开始 / `pause` 暂停 / `reset` 回到当前分类第一张图并暂停

### 注意事项

1. 中控发送 `category` 和 `page` 指令前，设备需已处于某个板块（二级页），否则忽略。
2. `goto` 指令可直接定位到板块+分类+条目，无需先发送板块跳转。
3. 所有消息通过 UEC WebSocket 服务转发，设备仅接收发给自己 `id` 的消息。

---

## 五、白马展厅 · 职能建设（baima-zhineng）

### 中控指令速查

| 操作 | 消息格式 | 说明 |
|------|----------|------|
| 回首页 | `{ "cmd": "home" }` | 无论当前在哪，返回首页 |
| 进制度建设 | `{ "cmd": "goto", "target": "zhidu" }` | 进入制度建设板块 |
| 进规划计划 | `{ "cmd": "goto", "target": "guihua" }` | 进入规划计划板块 |
| 进行动举措 | `{ "cmd": "goto", "target": "xingdong" }` | 进入行动举措板块 |
| 下一页 | `{ "cmd": "page", "action": "next" }` | 当前板块下一个 tab/页 |
| 上一页 | `{ "cmd": "page", "action": "prev" }` | 当前板块上一个 tab/页 |
| 直接定位 | `{ "cmd": "page", "index": 0 }` | 直接跳到指定 tab 索引 |

### 字段说明

- `cmd` —— 指令类型：`home` / `goto` / `page`
- `target` —— 板块标识：`zhidu`（制度建设）/ `guihua`（规划计划）/ `xingdong`（行动举措）
- `action` —— 翻页方向：`next` / `prev`
- `index` —— tab 索引（从 0 开始，用于 `page` 直接定位）

### 板块标识

| target | 板块名 | 模式 |
|--------|--------|------|
| zhidu | 制度建设 | 翻页 |
| guihua | 规划计划 | 翻页 |
| xingdong | 行动举措 | 滚动 + tab |

### 项目交互说明

**首页：** 3 个模块入口图标（制度建设、规划计划、行动举措），点击图标进入对应板块。

**二级页（板块页）：**
- **制度建设** / **规划计划**：翻页模式（右侧上下翻页按钮）
- **行动举措**：滚动模式（纵向滚动 + 底部 tab 切换）
- **底部 Tab 菜单**：点击切换不同 tab
- **右下角**：回首页按钮

### 注意事项

1. 中控发送 `page` 指令前，设备需已处于某个板块（二级页），否则忽略。
2. `goto` 指令可直接定位到板块，无需先发送板块跳转。
3. 所有消息通过 UEC WebSocket 服务转发，设备仅接收发给自己 `id` 的消息。

---

## 附录：中控调试面板

打开 `docs/uec-control-panel.html`（浏览器直接打开即可），已内置所有项目的常用按钮和一键复制功能，支持连接 WS、发送指令、查看日志。
