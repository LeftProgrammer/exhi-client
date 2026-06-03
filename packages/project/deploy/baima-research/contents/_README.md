# 科研创新 - 素材结构说明

素材直接放在 `deploy/baima-research/contents/` 下（contents 本身已按包隔离，无需再套 `baima-research/` 子目录）。

代码里用 `resolvePkgUrl('common/main-bg.png')` 引用，命名规范如下。

## common/ —— 各屏待机背景与文字

| 文件 | 用途 |
|------|------|
| `main-bg.png` | 主屏全景地图背景 |
| `main-text.png` | 主屏顶部说明文字（待机展示） |
| `top-left-bg.png` / `top-left-text.png` | 左上屏待机背景 / 文字 |
| `bottom-left-bg.png` / `bottom-left-text.png` | 左下屏待机背景 / 文字 |
| `top-right-bg.png` / `top-right-text.png` | 右上屏待机背景 / 文字 |
| `bottom-right-bg.png` / `bottom-right-text.png` | 右下屏待机背景 / 文字 |

## buttons/ —— 主屏地图标记 + 右侧菜单

每个点位三张图：`<id>.png`（常态）、`<id>-active.png`（选中）、`<id>-name.png`（地点名）。

点位 id 对照：

| id | 名称 |
|----|------|
| `baima-bridge` | 白马大桥 |
| `excavation` | 绿色开挖料 |
| `slope` | 高边坡建模 |
| `navigation` | 急弯通航 |
| `concrete` | 抗冲磨混凝土 |
| `coating` | 聚脲涂层 |
| `turbine` | 水轮机 |
| `blasting` | 旧桥爆破 |

另有 `home.png` / `home-active.png`（首页按钮）及装饰件 `frame/orange-base/orange-dots/blue-base/icon-sample`。

## points/<id>/ —— 各点位内容（按屏分目录）

目前仅 `baima-bridge` 有完整内容。

- `main/` 主屏详情：`zoom.png`（区域放大图）、`minsheng.png`（民生痛点）、`project.png`（科研项目）、`play.png` / `pause.png`（视频按钮，预留）
- `top-left/` 研究目标·技术路线·研究课题：`left-top-title/left-top-1/left-top-2/left-bottom-title/left-bottom/right-title/right-top/right-bottom`
- `bottom-left/` 核心创新点：`title` + `left-1~3` / `right-1~3`
- `top-right/` 工程效益：`title` + `content-1~3`
- `bottom-right/` 科研成果：`title` + `content-1~4`

## 新增点位内容步骤

1. 把该点位 8 张/类切片按上面结构放入 `points/<id>/<screen>/`
2. 在 `src/baima-research/data/points.ts` 给对应点位添加 `detail` 配置（含坐标与尺寸）

## 副屏调试（浏览器 dev）

`npm run dev` 后访问 `http://127.0.0.1:5174/baima-research/`，各屏路由：

| 屏 | 地址 |
|----|------|
| 主屏 | `/baima-research/#/` |
| 左上 | `/baima-research/#/top-left` |
| 左下 | `/baima-research/#/bottom-left` |
| 右上 | `/baima-research/#/top-right` |
| 右下 | `/baima-research/#/bottom-right` |

两种联动方式：

1. **跨标签自动同步**：在不同标签页打开主屏和各副屏，主屏点击点位后，副屏会通过
   `BroadcastChannel` 自动同步切换（仅 dev；runtime 由主进程中转 bridge 事件）。
2. **URL 直接指定**：给副屏地址加 `?point=baima-bridge` 即可直接预览该点位的选中态，
   例如 `/baima-research/#/top-left?point=baima-bridge`，无需主屏。
