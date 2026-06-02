# 科研创新 - 资源文件清单

## 全局通用资源

放置在 `deploy/baima-research/contents/` 下：

- `standby-bg.png` - 待机页背景
- `logo.png` - 待机页 logo
- `tap-hint.png` - 待机页点击提示
- `header-title.png` - 主屏顶部标题
- `map-bg.png` - 主屏全景地图背景
- `detail-bg.png` - 详情页背景
- `top-left-bg.png` - 左上角副屏背景
- `top-left-title.png` - 左上角副屏标题
- `bottom-left-bg.png` - 左下角副屏背景
- `bottom-left-title.png` - 左下角副屏标题
- `top-right-bg.png` - 右上角副屏背景
- `top-right-title.png` - 右上角副屏标题
- `bottom-right-bg.png` - 右下角副屏背景
- `bottom-right-title.png` - 右下角副屏标题

## 工程点位资源

每个工程点位（p01 ~ p12）在 `deploy/baima-research/contents/<pointId>/` 下放置：

### 主屏详情页
- `difficulty.png` / `difficulty.mp4` - 科研难点媒体
- `difficulty-text.png` - 科研难点文字说明
- `core.png` / `core.mp4` - 核心科研媒体
- `core-text.png` - 核心科研文字说明
- `patent.png` / `patent.mp4` - 专利技术媒体
- `patent-text.png` - 专利技术文字说明
- `honor.png` / `honor.mp4` - 荣誉效益媒体
- `honor-text.png` - 荣誉效益文字说明

### 副屏展示
- `difficulty-overview.png` - 左上角副屏展示图
- `difficulty-core.png` - 左下角副屏展示图
- `difficulty-patent.png` - 右上角副屏展示图
- `difficulty-honor.png` - 右下角副屏展示图
- `core-overview.png` - ...（依此类推，每种 phase 对应4张副屏图）
- `patent-overview.png`
- `patent-core.png`
- `patent-patent.png`
- `patent-honor.png`
- `honor-overview.png`
- `honor-core.png`
- `honor-patent.png`
- `honor-honor.png`

## 屏幕分辨率对照

| 屏幕 | 路由 | 分辨率 | 设计稿基准 |
|------|------|--------|-----------|
| 中间主屏(4x55拼接) | `/` 或 `/detail/:id` | 3840x2160 | d.w()/d.h() |
| 左上角86寸触摸 | `/top-left` | 3840x2160 | d.w()/d.h() |
| 左下49寸触摸 | `/bottom-left` | 1920x1080 | d.w()/d.h() |
| 右上49寸触摸 | `/top-right` | 1920x1080 | d.w()/d.h() |
| 右下55寸屏 | `/bottom-right` | 1920x1080 | d.w()/d.h() |

## 开发启动

```bash
cd packages/project
npm run dev
# 访问 http://localhost:5174/baima-research/
```
