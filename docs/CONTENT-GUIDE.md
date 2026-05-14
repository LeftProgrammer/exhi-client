# 项目包内容制作规范

> 面向**内容团队**（视频剪辑、UI 设计、前端切图）的硬性要求。
> 不按这份规范交付 → 现场必糊、必裁、必比例错乱。
> 客户端 Runtime 已经做到最好，剩下的就在内容侧。

适用范围：展厅展示端项目包（`packages/<project>/contents/`）下所有可视素材。

---

## 0. 一句话总则

**按目标屏物理分辨率制作；HTML 内容用响应式单位；不要给客户端机会做缩放。**

---

## 1. 先看 displays.json 知道目标屏

每个项目的 `packages/<project>/displays.json` 列出了所有屏。例：

```json
{
  "displays": [
    { "id": "wall",  "match": { "size": "5760x1080" }, "designBase": { "width": 5760, "height": 1080 } },
    { "id": "touch", "match": { "size": "1080x1920" }, "designBase": { "width": 1080, "height": 1920 } },
    { "id": "side",  "match": { "size": "1920x1080" }, "designBase": { "width": 1920, "height": 1080 } }
  ]
}
```

**`designBase` 就是你制作内容的分辨率基准**。`scenes.json` 把场景指给某块屏，那个场景的视频/图文都按这块屏的 designBase 出。

---

## 2. 视频规范

### 2.1 硬性要求

| 项 | 要求 | 不达标会怎样 |
|---|---|---|
| 编码 | **H.264 + AAC** | H.265 完全播不出来（Chromium 不支持） |
| 容器 | MP4 | mkv/mov 可能解码异常 |
| 颜色 | BT.709 / yuv420p | yuv444 一些场景会偏色 |
| 分辨率 | **= 目标屏 designBase** | 大了浪费带宽，小了被放大变糊 |
| 帧率 | 25 或 30 fps（视频墙建议 30）| 50/60 fps 在低配工控机会掉帧 |
| 码率 | 1080p ≤10 Mbps、5760×1080 ≤30 Mbps | 太高低配工控机解码不过来 |
| 关键帧间隔 | 2 秒一个 I 帧 | 太长 seek 会卡 |
| 时长 | 单段 ≤10 分钟 | 太长内存占用高 |

### 2.2 推荐 ffmpeg 转码命令

```bash
# 1080p 标准视频
ffmpeg -i 源.mp4 ^
  -c:v libx264 -preset slow -crf 20 -profile:v high -pix_fmt yuv420p ^
  -g 60 -keyint_min 60 ^
  -c:a aac -b:a 192k ^
  -movflags +faststart ^
  目标.mp4

# 5760×1080 拼接屏视频
ffmpeg -i 源.mp4 ^
  -c:v libx264 -preset slow -crf 22 -profile:v high -pix_fmt yuv420p ^
  -vf "scale=5760:1080:flags=lanczos" ^
  -g 60 -keyint_min 60 ^
  -c:a aac -b:a 192k ^
  -movflags +faststart ^
  目标-5760.mp4
```

### 2.3 怎么验证

```bash
# 看编码、分辨率、码率
ffprobe -v error -show_format -show_streams 目标.mp4 | grep -E "codec_name|width|height|bit_rate|r_frame_rate"
```

期望输出含 `codec_name=h264`, `codec_name=aac`, 分辨率正确。

### 2.4 视频内容设计

- **拼接屏**（5760×1080）：构图考虑屏与屏的物理缝隙（一般每块屏宽度 1920，缝隙位置在 1920/3840 px 处），重要主体不要正好压在缝隙上
- **触摸屏竖屏**（1080×1920）：摄像/剪辑就按竖屏构图
- **首帧静态画面**：开头 1 秒做成静帧或缓慢入场，避免切换瞬间观众看到"突然跳动"

---

## 3. 图片规范

| 项 | 要求 |
|---|---|
| 格式 | JPG（照片）/ PNG（含透明）/ WebP（推荐） |
| 分辨率 | 全屏图 = 目标屏 designBase；局部图按设计稿尺寸 |
| 单图大小 | ≤5MB，超过用 WebP 或降低画质 |
| 色彩空间 | sRGB（不要用 P3） |
| DPI | 72（屏幕显示，不要按印刷 300 出） |

**关键**：4K 屏的全屏图就出 3840×2160，**不要出 1920×1080 让客户端放大**。

---

## 4. HTML 内容规范（触摸屏 / 互动页）

### 4.1 必须响应式

**绝对禁止**写法：

```css
/* ❌ 禁止 */
.title { font-size: 96px; }
.container { width: 1200px; padding: 40px; }
.icon { width: 80px; height: 80px; }
```

**强制**写法：

```css
/* ✅ 推荐 */
.title { font-size: 5vh; }              /* 按屏高 */
.container { width: 60vw; padding: 2vw; }  /* 按屏宽 */
.icon { width: 4vw; height: 4vw; }       /* 按屏宽，正方形 */
```

### 4.2 单位选择对照

| 场景 | 推荐单位 |
|---|---|
| 字号 | `vh`（按屏高，更稳定，不受拼接屏宽度影响） |
| 横向尺寸 | `vw` |
| 纵向尺寸 | `vh` |
| 间距 | `vw` / `vh` 视方向 |
| 组件内部相对尺寸 | `em` / `rem` |
| 边框、阴影 | `px` 可接受（细微差异不敏感）|

### 4.3 用 designBase 写换算（如果实在习惯像素思维）

每个屏的 designBase 通过 CSS 变量暴露：

```css
:root {
  /* 由 Runtime 注入 */
  /* --exhi-design-w: 5760px; */
  /* --exhi-design-h: 1080px; */
}

.title {
  /* 设计稿里写的是 96px，按 1080 高 → 8.89vh */
  font-size: 8.89vh;
}
```

可以让设计稿出 1920×1080 / 5760×1080，前端按比例换算到 vw/vh。

### 4.4 字体

```css
/* ❌ 禁止：依赖系统字体 */
font-family: '思源黑体', 'Microsoft YaHei', sans-serif;
/* 部署机器没有思源黑体就掉到雅黑，雅黑没有掉到默认，设计稿白做 */

/* ✅ 推荐：项目包内嵌字体 */
@font-face {
  font-family: 'BaimaFont';
  src: url('./fonts/SourceHanSans-Bold.woff2') format('woff2');
  font-display: block;  /* 等字体加载完再显示，避免闪烁 */
}
body { font-family: 'BaimaFont', sans-serif; }
```

字体文件放在 `contents/<exhibit>/fonts/` 下，跟 HTML 同级目录。

### 4.5 触摸交互

- **禁用文本选中**：`user-select: none`
- **禁用图片拖拽**：`-webkit-user-drag: none`
- **禁用右键菜单**：JS `oncontextmenu="return false"`
- **触摸目标 ≥ 88px × 88px**（指尖友好）
- **避免 hover 状态**：触摸屏没有 hover，用 `:active`

最小样板：

```html
<style>
  html, body {
    margin: 0; width: 100vw; height: 100vh;
    overflow: hidden;
    user-select: none; -webkit-user-select: none;
    -webkit-user-drag: none;
  }
  img, a { -webkit-user-drag: none; pointer-events: none; }
  button { pointer-events: auto; }
</style>
<body oncontextmenu="return false">
  <!-- 内容 -->
</body>
```

### 4.6 与客户端交互（exhibitBridge）

如果要从触摸内容控制其他屏（如点按钮让主屏切视频），加载 bridge：

```html
<script src="exhi-pkg://pkg/__exhi__/bridge.js"></script>
<script>
  exhibitBridge.dispatch({
    type: 'cmd.gotoScene',
    payload: { display: 'wall', sceneId: 'leaders-video' }
  })
</script>
```

详见 README 的 exhibitBridge 章节。

---

## 5. 命名规范

```
contents/
  ├─ wall/                     ← 按屏分目录
  │   ├─ opening.mp4           ← 用英文/拼音，不要中文路径
  │   ├─ video-01.mp4
  │   └─ video-02.mp4
  ├─ touch-yushui/
  │   ├─ index.html
  │   ├─ css/main.css
  │   ├─ js/main.js
  │   ├─ images/
  │   └─ fonts/
  └─ shared/                   ← 跨屏共用资源
      └─ logo.svg
```

**禁忌**：
- ❌ 文件名带中文（曾经踩过 URL 编码坑）
- ❌ 文件名带空格
- ❌ 大写文件名（Windows 下不区分大小写，但 NSIS 安装和 OTA 同步会受影响）
- ❌ 文件名以 `.` 或 `_` 开头

---

## 6. 项目包大小约束

| 项 | 上限 |
|---|---|
| 单个视频 | ≤200MB（拼接屏视频例外，可到 800MB） |
| 单个图片 | ≤5MB |
| 单个 HTML 资源包（含 js/css/字体/图片） | ≤100MB |
| 整个项目包 | **≤2GB**，超过要拆分 |

太大的项目包：
- 首次部署同步慢
- OTA 升级慢
- 万一损坏重新下载成本高

---

## 7. 交付前自检清单

提交项目包给运维之前，自己跑一遍：

- [ ] `npm run pkg:verify packages/<project>` 通过（SHA256 校验）
- [ ] 所有视频 `ffprobe` 看编码是 H.264 + AAC
- [ ] 视频分辨率 = displays.json 对应屏的 designBase
- [ ] 触摸 HTML 全部用 vw/vh/em，没有硬编码 px（grep 检查）
- [ ] 字体内嵌进项目包，不依赖系统字体
- [ ] 文件名无中文、无空格
- [ ] 在 dev 模式下完整跑一遍所有场景：`npm run dev:online` + 中控触发
- [ ] 项目包总大小 ≤2GB

---

## 8. 常见踩坑

### 8.1 视频播放黑屏但有声音

- **原因**：视频是 H.265/HEVC 编码，Chromium 不支持
- **修复**：用 ffmpeg 转 H.264（见 §2.2）

### 8.2 拼接屏视频显示在中间一小块

- **原因**：视频只有 1920×1080，但屏是 5760×1080，`object-fit: contain` 留黑边
- **修复**：重制视频为 5760×1080；或场景配 `fit: cover` 接受裁切

### 8.3 4K 屏文字看着很小

- **原因**：HTML 用了 `font-size: 32px`，4K 屏物理像素更密
- **修复**：改用 `font-size: 1.5vh` 或类似响应式单位

### 8.4 视频边缘有缝隙

- **原因**：scale 路径触发亚像素采样（已被 M9 修复）
- **验证**：DevTools Console 跑 `getComputedStyle(document.querySelector('.adaptive-stage')).transform` 应该是 `none`

### 8.5 字体闪烁（FOIT）

- **原因**：自定义字体加载中，浏览器先显示默认字体再切换
- **修复**：`font-display: block` 等字体加载完再显示；或字体 preload

---

## 9. 想偷懒？给个最快工作流

```bash
# 1. 准备源视频（你的素材或客户提供的原片）
ls 源素材/
# opening-raw.mp4 (4K 60fps)
# wall-bg-raw.mov

# 2. 用 ffmpeg 转 1080p H.264
ffmpeg -i 源素材/opening-raw.mp4 -c:v libx264 -crf 20 -c:a aac packages/baima/contents/wall/opening.mp4

# 3. 用模板写触摸页（参考 packages/demo-hall/contents/touch/index.html）

# 4. 在 dev 跑一遍
npm run dev:online
npm run hub:goto -- --sceneId=intro-video --display=wall

# 5. 自检
npm run pkg:verify packages/baima

# 6. 提交
git add packages/baima
git commit -m "feat(baima): content v1.0"
```

---

## 10. 还有问题？

- 视频编码问题 → 联系前端工程师
- 排版 / 触摸交互问题 → 参考 `packages/demo-hall/contents/touch/index.html` 作为模板
- 拼接屏视频做不出 5760×1080 → 跟硬件商要原始分辨率素材或求助专业剪辑
