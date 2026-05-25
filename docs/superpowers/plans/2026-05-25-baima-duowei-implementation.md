# 多维筑安 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新建 `baima-duowei` 展区项目，实现横屏 1920×1080 触摸交互程序，包含首页待机页（视频背景 + 4 个选项按钮）和安全成效二级页（完整内容 + 导航按钮），其他三个二级页为占位页。

**Architecture:** 复用 `baima-yushui-leaders` 的架构模式：独立 Vue 3 项目包，Vue Router 管理首页/二级页跳转，`useIdleReset` 管理 20s 无操作回首页，图片资源放在 `deploy/baima-duowei/contents/` 下。

**Tech Stack:** Vue 3 + TypeScript + Vue Router + GSAP + SCSS，复用 `@shared` 工具和动效 mixin。

---

## 文件结构

**新建文件：**

```
packages/project/src/baima-duowei/
  index.html
  main.ts
  App.vue
  router.ts
  views/
    HomeView.vue          ← 首页/待机页
    SafetyView.vue        ← 安全成效二级页
    PlaceholderView.vue   ← 其他三个二级页共用占位

deploy/baima-duowei/
  manifest.json
  displays.json           ← 1920×1080 横屏
  scenes.json
  bindings.json
  contents/
    home/
      bg.mp4
      header-bg.png
      header-title.png
      btn-safety.png
      btn-tech.png
      btn-activity.png
      btn-standard.png
    safety/
      header-title.png
      block-title-bg.png
      block-title-text.png
      content-bg.png
      content-bottom-title.png
      left-1.png ~ left-3.png
      right-1.png ~ right-6.png
      btn-prev-normal.png
      btn-prev-active.png
      btn-outer-normal.png
      btn-outer-active.png
      btn-inner-normal.png
      btn-inner-active.png
      btn-home-normal.png
      btn-home-active.png
    shared/
      line-flow.mp4

packages/project/vite.config.ts   ← 修改：新增 baima-duowei 入口
package.json                       ← 修改：新增 dev:duowei 和 dist:duowei 脚本
electron-builder.config.mjs       ← 修改：新增 baima-duowei 命名
```

---

## Task 1: 复制图片资源并重命名

**Files:**

- Create: `deploy/baima-duowei/contents/home/` (目录 + 文件)
- Create: `deploy/baima-duowei/contents/safety/` (目录 + 文件)
- Create: `deploy/baima-duowei/contents/shared/` (目录 + 文件)

- [ ] **Step 1: 创建目录结构**

```bash
mkdir -p "packages/project/deploy/baima-duowei/contents/home"
mkdir -p "packages/project/deploy/baima-duowei/contents/safety"
mkdir -p "packages/project/deploy/baima-duowei/contents/shared"
```

- [ ] **Step 2: 复制首页资源**

```bash
cp "packages/project/src/多维筑安-首页_slices/背景板.mp4" "packages/project/deploy/baima-duowei/contents/home/bg.mp4"
cp "packages/project/src/多维筑安-首页_slices/header-bg.png" "packages/project/deploy/baima-duowei/contents/home/header-bg.png"
cp "packages/project/src/多维筑安-首页_slices/header-title.png" "packages/project/deploy/baima-duowei/contents/home/header-title.png"
cp "packages/project/src/多维筑安-首页_slices/安全机制 .png" "packages/project/deploy/baima-duowei/contents/home/btn-safety.png"
cp "packages/project/src/多维筑安-首页_slices/智慧技术 .png" "packages/project/deploy/baima-duowei/contents/home/btn-tech.png"
cp "packages/project/src/多维筑安-首页_slices/安全活动 .png" "packages/project/deploy/baima-duowei/contents/home/btn-activity.png"
cp "packages/project/src/多维筑安-首页_slices/标准化建设.png" "packages/project/deploy/baima-duowei/contents/home/btn-standard.png"
```

- [ ] **Step 3: 复制安全成效资源**

```bash
cp "packages/project/src/多维筑安-安全成效 _slices/header-title.png" "packages/project/deploy/baima-duowei/contents/safety/header-title.png"
cp "packages/project/src/多维筑安-安全成效 _slices/块标题背景.png" "packages/project/deploy/baima-duowei/contents/safety/block-title-bg.png"
cp "packages/project/src/多维筑安-安全成效 _slices/块标题文字.png" "packages/project/deploy/baima-duowei/contents/safety/block-title-text.png"
cp "packages/project/src/多维筑安-安全成效 _slices/中部内容背景.png" "packages/project/deploy/baima-duowei/contents/safety/content-bg.png"
cp "packages/project/src/多维筑安-安全成效 _slices/中部内容底部标题.png" "packages/project/deploy/baima-duowei/contents/safety/content-bottom-title.png"
cp "packages/project/src/多维筑安-安全成效 _slices/左内容1.png" "packages/project/deploy/baima-duowei/contents/safety/left-1.png"
cp "packages/project/src/多维筑安-安全成效 _slices/左内容2.png" "packages/project/deploy/baima-duowei/contents/safety/left-2.png"
cp "packages/project/src/多维筑安-安全成效 _slices/左内容3.png" "packages/project/deploy/baima-duowei/contents/safety/left-3.png"
cp "packages/project/src/多维筑安-安全成效 _slices/右内容1.png" "packages/project/deploy/baima-duowei/contents/safety/right-1.png"
cp "packages/project/src/多维筑安-安全成效 _slices/右内容2.png" "packages/project/deploy/baima-duowei/contents/safety/right-2.png"
cp "packages/project/src/多维筑安-安全成效 _slices/右内容3.png" "packages/project/deploy/baima-duowei/contents/safety/right-3.png"
cp "packages/project/src/多维筑安-安全成效 _slices/右内容4.png" "packages/project/deploy/baima-duowei/contents/safety/right-4.png"
cp "packages/project/src/多维筑安-安全成效 _slices/右内容5.png" "packages/project/deploy/baima-duowei/contents/safety/right-5.png"
cp "packages/project/src/多维筑安-安全成效 _slices/右内容6.png" "packages/project/deploy/baima-duowei/contents/safety/right-6.png"
cp "packages/project/src/多维筑安-安全成效 _slices/左箭头按钮-未选中.png" "packages/project/deploy/baima-duowei/contents/safety/btn-prev-normal.png"
cp "packages/project/src/多维筑安-安全成效 _slices/左箭头按钮-选中.png" "packages/project/deploy/baima-duowei/contents/safety/btn-prev-active.png"
cp "packages/project/src/多维筑安-安全成效 _slices/按钮做外部边框背景-未选中.png" "packages/project/deploy/baima-duowei/contents/safety/btn-outer-normal.png"
cp "packages/project/src/多维筑安-安全成效 _slices/按钮做外部边框背景-选中.png" "packages/project/deploy/baima-duowei/contents/safety/btn-outer-active.png"
cp "packages/project/src/多维筑安-安全成效 _slices/按钮内部背景-未选中.png" "packages/project/deploy/baima-duowei/contents/safety/btn-inner-normal.png"
cp "packages/project/src/多维筑安-安全成效 _slices/按钮内部背景-选中.png" "packages/project/deploy/baima-duowei/contents/safety/btn-inner-active.png"
cp "packages/project/src/多维筑安-安全成效 _slices/首页按钮-未选中.png" "packages/project/deploy/baima-duowei/contents/safety/btn-home-normal.png"
cp "packages/project/src/多维筑安-安全成效 _slices/首页按钮-选中.png" "packages/project/deploy/baima-duowei/contents/safety/btn-home-active.png"
```

- [ ] **Step 4: 复制共用视频**

```bash
cp "packages/project/src/线条流动.mp4" "packages/project/deploy/baima-duowei/contents/shared/line-flow.mp4"
```

- [ ] **Step 5: 验证文件数量**

```bash
ls packages/project/deploy/baima-duowei/contents/home/ | wc -l
# 期望: 7
ls packages/project/deploy/baima-duowei/contents/safety/ | wc -l
# 期望: 23
ls packages/project/deploy/baima-duowei/contents/shared/
# 期望: line-flow.mp4
```

- [ ] **Step 6: Commit**

```bash
git add packages/project/deploy/baima-duowei/contents/
git commit -m "feat(baima-duowei): 复制并重命名图片/视频资源"
```

---

## Task 2: 创建 deploy 配置文件

**Files:**

- Create: `packages/project/deploy/baima-duowei/manifest.json`
- Create: `packages/project/deploy/baima-duowei/displays.json`
- Create: `packages/project/deploy/baima-duowei/scenes.json`
- Create: `packages/project/deploy/baima-duowei/bindings.json`

- [ ] **Step 1: 创建 manifest.json**

```json
// packages/project/deploy/baima-duowei/manifest.json
{
  "projectId": "baima-duowei",
  "name": "白马展厅 · 多维筑安",
  "version": "1.0.0",
  "runtimeRange": ">=1.0.0 <2.0.0",
  "createdAt": "2026-05-25T00:00:00Z",
  "author": "exhi-team"
}
```

- [ ] **Step 2: 创建 displays.json（横屏 1920×1080）**

```json
// packages/project/deploy/baima-duowei/displays.json
{
  "displays": [
    {
      "id": "main",
      "match": { "primary": true },
      "designBase": { "width": 1920, "height": 1080 },
      "defaultScene": "app",
      "fitPolicy": "scale"
    }
  ]
}
```

- [ ] **Step 3: 创建 scenes.json**

```json
// packages/project/deploy/baima-duowei/scenes.json
{
  "scenes": {
    "app": {
      "type": "web",
      "src": "contents/baima-duowei/index.html",
      "allowInteraction": true,
      "injectBridge": true
    }
  }
}
```

- [ ] **Step 4: 创建 bindings.json（空配置）**

```json
// packages/project/deploy/baima-duowei/bindings.json
{
  "bindings": []
}
```

- [ ] **Step 5: Commit**

```bash
git add packages/project/deploy/baima-duowei/manifest.json packages/project/deploy/baima-duowei/displays.json packages/project/deploy/baima-duowei/scenes.json packages/project/deploy/baima-duowei/bindings.json
git commit -m "feat(baima-duowei): 新增 deploy 配置文件"
```

---

## Task 3: 更新构建配置

**Files:**

- Modify: `packages/project/vite.config.ts`
- Modify: `package.json`
- Modify: `electron-builder.config.mjs`

- [ ] **Step 1: 查看当前 vite.config.ts 的 input 配置**

```bash
grep -n "input\|baima-milestone\|baima-yushui" packages/project/vite.config.ts | head -20
```

- [ ] **Step 2: 在 vite.config.ts 的 rollupOptions.input 里新增 baima-duowei 入口**

找到 `input` 对象，新增一行（格式与已有条目相同）：

```ts
'baima-duowei': resolve(__dirname, 'src/baima-duowei/index.html'),
```

- [ ] **Step 3: 在 package.json 的 scripts 里新增 dev 和 dist 命令**

找到 `"dev:milestone"` 行，在其后新增：

```json
"dev:duowei": "chcp 65001 >nul && set EXHI_HUB_URL=ws://localhost:18080&& set EXHI_DEV_PACKAGE=project/deploy/baima-duowei&& electron-vite dev",
```

找到 `"dist:milestone"` 行，在其后新增：

```json
"dist:duowei": "chcp 65001 >nul && node tools/dist-cli/bin.mjs baima-duowei",
```

同时更新 `"dist"` 脚本，在末尾追加 `&& node tools/dist-cli/bin.mjs baima-duowei`。

- [ ] **Step 4: 在 electron-builder.config.mjs 新增命名映射**

```js
// APP_IDS 对象新增：
'baima-duowei': 'com.exhi.baima.duowei',

// PRODUCT_NAMES 对象新增：
'baima-duowei': 'Exhi Baima Duowei',
```

- [ ] **Step 5: Commit**

```bash
git add packages/project/vite.config.ts package.json electron-builder.config.mjs
git commit -m "feat(baima-duowei): 更新构建配置，新增 dev/dist 脚本"
```

---

## Task 4: 创建项目入口文件

**Files:**

- Create: `packages/project/src/baima-duowei/index.html`
- Create: `packages/project/src/baima-duowei/main.ts`
- Create: `packages/project/src/baima-duowei/router.ts`
- Create: `packages/project/src/baima-duowei/App.vue`

- [ ] **Step 1: 创建 index.html**

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>白马展厅 · 多维筑安</title>
    <script src="exhi-pkg://pkg/__exhi__/bridge.js"></script>
  </head>
  <body oncontextmenu="return false">
    <div id="app"></div>
    <script type="module" src="./main.ts"></script>
  </body>
</html>
```

- [ ] **Step 2: 创建 main.ts**

```ts
import { createApp } from 'vue'
import '@shared/styles/reset.scss'
import { router } from './router'
import App from './App.vue'

createApp(App).use(router).mount('#app')
```

- [ ] **Step 3: 创建 router.ts**

```ts
import { createRouter, createMemoryHistory, type RouteRecordRaw } from 'vue-router'
import HomeView from './views/HomeView.vue'
import SafetyView from './views/SafetyView.vue'
import PlaceholderView from './views/PlaceholderView.vue'

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/safety', name: 'safety', component: SafetyView },
  { path: '/tech', name: 'tech', component: PlaceholderView, props: { title: '智慧技术' } },
  { path: '/activity', name: 'activity', component: PlaceholderView, props: { title: '安全活动' } },
  {
    path: '/standard',
    name: 'standard',
    component: PlaceholderView,
    props: { title: '标准化建设' }
  },
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

export const router = createRouter({
  history: createMemoryHistory(),
  routes
})
```

- [ ] **Step 4: 创建 App.vue**

```vue
<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useBridge } from '@shared/composables/useBridge'
import { useIdleReset } from '@shared/composables/useIdleReset'

const router = useRouter()
const { on } = useBridge()

useIdleReset(() => {
  if (router.currentRoute.value.name !== 'home') {
    router.push({ name: 'home' })
  }
}, 20_000)

on('app:home', () => router.push({ name: 'home' }))
</script>

<template>
  <router-view v-slot="{ Component, route }">
    <transition name="page">
      <component :is="Component" :key="route.name" />
    </transition>
  </router-view>
</template>

<style lang="scss">
@use '@shared/styles/tokens' as t;
@use '@shared/styles/reset';

* {
  box-sizing: border-box;
}

.page-enter-active {
  transition:
    opacity 600ms t.$ease-base,
    transform 600ms t.$ease-base;
}
.page-leave-active {
  transition:
    opacity 400ms t.$ease-base,
    transform 400ms t.$ease-base;
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}
.page-enter-from {
  opacity: 0;
  transform: scale(1.03);
}
.page-leave-to {
  opacity: 0;
  transform: scale(0.97);
}
</style>
```

- [ ] **Step 5: 验证入口能启动**

```bash
npm run dev:duowei
# 在浏览器访问 http://localhost:5174/baima-duowei/ 应看到空白蓝屏（app 挂载成功）
```

- [ ] **Step 6: Commit**

```bash
git add packages/project/src/baima-duowei/
git commit -m "feat(baima-duowei): 新增项目入口 index.html / main.ts / router / App"
```

---

## Task 5: 实现首页 HomeView

**Files:**

- Create: `packages/project/src/baima-duowei/views/HomeView.vue`

- [ ] **Step 1: 创建 HomeView.vue**

```vue
<script setup lang="ts">
import { useRouter } from 'vue-router'
import { resolvePkgUrl } from '@shared/utils/url'

const router = useRouter()

const bgVideo = resolvePkgUrl('home/bg.mp4')
const headerBg = resolvePkgUrl('home/header-bg.png')
const headerTitle = resolvePkgUrl('home/header-title.png')

const buttons = [
  { name: 'safety', img: resolvePkgUrl('home/btn-safety.png'), label: '安全成效' },
  { name: 'tech', img: resolvePkgUrl('home/btn-tech.png'), label: '智慧技术' },
  { name: 'activity', img: resolvePkgUrl('home/btn-activity.png'), label: '安全活动' },
  { name: 'standard', img: resolvePkgUrl('home/btn-standard.png'), label: '标准化建设' }
]

function goTo(name: string) {
  router.push({ name })
}
</script>

<template>
  <main class="home">
    <video
      class="home__video"
      :src="bgVideo"
      autoplay
      muted
      loop
      playsinline
      preload="auto"
      disablepictureinpicture
      disableremoteplayback
      @contextmenu.prevent
    />
    <div class="home__veil" />

    <header class="home__header">
      <img class="home__header-bg" :src="headerBg" alt="" aria-hidden="true" />
      <img class="home__header-title" :src="headerTitle" alt="多维筑安" />
      <div class="home__header-shine" aria-hidden="true" />
    </header>

    <nav class="home__nav">
      <button v-for="btn in buttons" :key="btn.name" class="home__btn" @click="goTo(btn.name)">
        <img :src="btn.img" :alt="btn.label" />
      </button>
    </nav>
  </main>
</template>

<style scoped lang="scss">
@use '@shared/styles/tokens' as t;
@use '@shared/styles/transitions' as fx;

.home {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: t.$color-bg-primary;
}

.home__video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 0;
  pointer-events: none;
  will-change: transform;
  transform: translateZ(0);
}

.home__veil {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background: radial-gradient(circle at center, transparent 0%, rgba(5, 11, 26, 0.3) 70%);
}

.home__header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 2;
  pointer-events: none;
}

.home__header-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: auto;
  @include fx.enter-fade-in($duration: 0.8s, $delay: 0.1s);
}

.home__header-title {
  position: relative;
  display: block;
  width: 100%;
  height: auto;
  @include fx.enter-fade-in($duration: 0.9s, $delay: 0.3s);
}

.home__header-shine {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 100%;
  z-index: 3;
  pointer-events: none;
  @include fx.auto-shine-from-center($duration: 1.2s, $interval: 6s, $width: 30%);
}

.home__nav {
  position: absolute;
  right: 5%;
  top: 50%;
  transform: translateY(-50%);
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 2vh;
}

.home__btn {
  display: block;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    filter 0.2s ease;

  img {
    display: block;
    width: 32vw;
    height: auto;
  }

  &:hover {
    transform: scale(1.04) translateX(-4px);
    filter: brightness(1.15) drop-shadow(0 0 12px rgba(80, 200, 255, 0.6));
  }

  &:active {
    transform: scale(0.97);
  }

  @include fx.enter-from-right;
}
</style>
```

- [ ] **Step 2: 验证首页**

```bash
npm run dev:duowei
# 访问 http://localhost:5174/baima-duowei/
# 应看到：视频背景循环播放，顶部标题渐显，右侧四个按钮从右滑入
```

- [ ] **Step 3: Commit**

```bash
git add packages/project/src/baima-duowei/views/HomeView.vue
git commit -m "feat(baima-duowei): 实现首页 HomeView（视频背景 + 4 选项按钮）"
```

---

## Task 6: 实现安全成效页 SafetyView

**Files:**

- Create: `packages/project/src/baima-duowei/views/SafetyView.vue`

- [ ] **Step 1: 创建 SafetyView.vue**

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { resolvePkgUrl } from '@shared/utils/url'

const router = useRouter()

const bgVideo = resolvePkgUrl('shared/line-flow.mp4')
const headerTitle = resolvePkgUrl('safety/header-title.png')
const blockTitleBg = resolvePkgUrl('safety/block-title-bg.png')
const blockTitleText = resolvePkgUrl('safety/block-title-text.png')
const contentBg = resolvePkgUrl('safety/content-bg.png')
const contentBottom = resolvePkgUrl('safety/content-bottom-title.png')
const leftItems = [1, 2, 3].map((n) => resolvePkgUrl(`safety/left-${n}.png`))
const rightItems = [1, 2, 3, 4, 5, 6].map((n) => resolvePkgUrl(`safety/right-${n}.png`))

const btnPrevNormal = resolvePkgUrl('safety/btn-prev-normal.png')
const btnPrevActive = resolvePkgUrl('safety/btn-prev-active.png')
const btnOuterNormal = resolvePkgUrl('safety/btn-outer-normal.png')
const btnOuterActive = resolvePkgUrl('safety/btn-outer-active.png')
const btnInnerNormal = resolvePkgUrl('safety/btn-inner-normal.png')
const btnInnerActive = resolvePkgUrl('safety/btn-inner-active.png')
const btnHomeNormal = resolvePkgUrl('safety/btn-home-normal.png')
const btnHomeActive = resolvePkgUrl('safety/btn-home-active.png')

const prevHover = ref(false)
const nextHover = ref(false)
const homeHover = ref(false)

// 导航：左箭头=上一页（回到其他板块），右箭头=下一页，首页=回主页
// 当前只有安全成效有内容，左右箭头暂时切到相邻占位页
function goPrev() {
  router.push({ name: 'standard' })
}
function goNext() {
  router.push({ name: 'tech' })
}
function goHome() {
  router.push({ name: 'home' })
}
</script>

<template>
  <main class="safety">
    <video
      class="safety__video"
      :src="bgVideo"
      autoplay
      muted
      loop
      playsinline
      preload="auto"
      disablepictureinpicture
      disableremoteplayback
      @contextmenu.prevent
    />
    <div class="safety__veil" />

    <!-- 顶部标题 -->
    <header class="safety__header">
      <img class="safety__header-title" :src="headerTitle" alt="安全成效" />
      <div class="safety__header-shine" aria-hidden="true" />
    </header>

    <!-- 主内容区 -->
    <section class="safety__content">
      <!-- 顶部"2025 零事故零伤亡"标题块 -->
      <div class="safety__block-title">
        <img class="safety__block-title-bg" :src="blockTitleBg" alt="" aria-hidden="true" />
        <img class="safety__block-title-text" :src="blockTitleText" alt="2025 零事故 零伤亡" />
      </div>

      <!-- 中部内容：背景 + 左右内容图层 -->
      <div class="safety__body">
        <img class="safety__body-bg" :src="contentBg" alt="" aria-hidden="true" />
        <div class="safety__body-left">
          <img v-for="(src, i) in leftItems" :key="i" :src="src" alt="" />
        </div>
        <div class="safety__body-right">
          <img v-for="(src, i) in rightItems" :key="i" :src="src" alt="" />
        </div>
      </div>

      <!-- 底部"安全生产目标全面达成"标题 -->
      <div class="safety__bottom-title">
        <img :src="contentBottom" alt="安全生产目标全面达成" />
      </div>
    </section>

    <!-- 底部导航按钮 -->
    <nav class="safety__nav">
      <!-- 上一页按钮：左箭头 -->
      <button
        class="safety__nav-btn"
        @mouseenter="prevHover = true"
        @mouseleave="prevHover = false"
        @touchstart="prevHover = true"
        @touchend="prevHover = false"
        @click="goPrev"
      >
        <img :src="btnOuterNormal" class="btn-layer btn-outer" alt="" aria-hidden="true" />
        <img
          :src="prevHover ? btnOuterActive : btnOuterNormal"
          class="btn-layer btn-outer btn-outer--hover"
          alt=""
          aria-hidden="true"
        />
        <img
          :src="prevHover ? btnInnerActive : btnInnerNormal"
          class="btn-layer btn-inner"
          alt=""
          aria-hidden="true"
        />
        <img
          :src="prevHover ? btnPrevActive : btnPrevNormal"
          class="btn-layer btn-icon"
          alt="上一页"
        />
      </button>

      <!-- 下一页按钮：右箭头（镜像左箭头） -->
      <button
        class="safety__nav-btn"
        @mouseenter="nextHover = true"
        @mouseleave="nextHover = false"
        @touchstart="nextHover = true"
        @touchend="nextHover = false"
        @click="goNext"
      >
        <img :src="btnOuterNormal" class="btn-layer btn-outer" alt="" aria-hidden="true" />
        <img
          :src="nextHover ? btnOuterActive : btnOuterNormal"
          class="btn-layer btn-outer btn-outer--hover"
          alt=""
          aria-hidden="true"
        />
        <img
          :src="nextHover ? btnInnerActive : btnInnerNormal"
          class="btn-layer btn-inner"
          alt=""
          aria-hidden="true"
        />
        <img
          :src="nextHover ? btnPrevActive : btnPrevNormal"
          class="btn-layer btn-icon btn-icon--flip"
          alt="下一页"
        />
      </button>

      <!-- 首页按钮 -->
      <button
        class="safety__nav-btn"
        @mouseenter="homeHover = true"
        @mouseleave="homeHover = false"
        @touchstart="homeHover = true"
        @touchend="homeHover = false"
        @click="goHome"
      >
        <img :src="btnOuterNormal" class="btn-layer btn-outer" alt="" aria-hidden="true" />
        <img
          :src="homeHover ? btnOuterActive : btnOuterNormal"
          class="btn-layer btn-outer btn-outer--hover"
          alt=""
          aria-hidden="true"
        />
        <img
          :src="homeHover ? btnInnerActive : btnInnerNormal"
          class="btn-layer btn-inner"
          alt=""
          aria-hidden="true"
        />
        <img
          :src="homeHover ? btnHomeActive : btnHomeNormal"
          class="btn-layer btn-icon"
          alt="首页"
        />
      </button>
    </nav>
  </main>
</template>

<style scoped lang="scss">
@use '@shared/styles/tokens' as t;
@use '@shared/styles/transitions' as fx;

.safety {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: t.$color-bg-primary;
  display: flex;
  flex-direction: column;
}

.safety__video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 0;
  pointer-events: none;
  will-change: transform;
  transform: translateZ(0);
}

.safety__veil {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background: rgba(5, 11, 26, 0.45);
}

// ── 标题 ──────────────────────────────────────────────────────
.safety__header {
  position: relative;
  z-index: 2;
  flex-shrink: 0;
  pointer-events: none;
}

.safety__header-title {
  display: block;
  width: 100%;
  height: auto;
  @include fx.enter-fade-in($duration: 0.9s, $delay: 0.2s);
}

.safety__header-shine {
  position: absolute;
  inset: 0;
  z-index: 3;
  pointer-events: none;
  @include fx.auto-shine-from-center($duration: 1.2s, $interval: 6s, $width: 30%);
}

// ── 内容区 ────────────────────────────────────────────────────
.safety__content {
  position: relative;
  z-index: 2;
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0 3% 1%;
}

.safety__block-title {
  position: relative;
  flex-shrink: 0;
  margin-bottom: 1%;

  img {
    display: block;
    width: 100%;
    height: auto;
  }

  .safety__block-title-text {
    position: absolute;
    top: 50%;
    left: 3%;
    transform: translateY(-50%);
    width: 60%;
    @include fx.reveal-shine-lr($duration: 1.2s, $delay: 0.6s);
  }
}

.safety__body {
  position: relative;
  flex: 1;

  .safety__body-bg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: fill;
  }

  .safety__body-left {
    position: absolute;
    top: 5%;
    left: 2%;
    width: 30%;
    display: flex;
    flex-direction: column;
    gap: 3%;

    img {
      display: block;
      width: 100%;
      height: auto;
      @include fx.enter-fade-in($duration: 0.7s, $delay: 0.8s);
    }
  }

  .safety__body-right {
    position: absolute;
    top: 5%;
    right: 2%;
    width: 22%;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 3%;

    img {
      display: block;
      width: 100%;
      height: auto;
      @include fx.enter-fade-in($duration: 0.7s, $delay: 1s);
    }
  }
}

.safety__bottom-title {
  flex-shrink: 0;
  margin-top: 1%;

  img {
    display: block;
    width: 100%;
    height: auto;
    @include fx.reveal-shine-lr($duration: 1.2s, $delay: 1.2s);
  }
}

// ── 导航按钮 ──────────────────────────────────────────────────
.safety__nav {
  position: absolute;
  bottom: 3%;
  right: 3%;
  z-index: 3;
  display: flex;
  gap: 1.5vw;
}

.safety__nav-btn {
  position: relative;
  width: 6vw;
  height: 6vw;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;

  .btn-layer {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: contain;
    transition: opacity 0.2s ease;
  }

  .btn-outer--hover {
    opacity: 0;
  }
  .btn-icon--flip {
    transform: scaleX(-1);
  }

  &:hover .btn-outer--hover {
    opacity: 1;
  }
  &:active {
    transform: scale(0.93);
  }
}
</style>
```

- [ ] **Step 2: 验证安全成效页**

```bash
npm run dev:duowei
# 访问 http://localhost:5174/baima-duowei/
# 点击"安全成效"按钮 → 进入安全成效页
# 检查：视频背景、标题扫光、内容渐显、底部三个导航按钮
# 点"首页"按钮 → 回首页
```

- [ ] **Step 3: Commit**

```bash
git add packages/project/src/baima-duowei/views/SafetyView.vue
git commit -m "feat(baima-duowei): 实现安全成效二级页"
```

---

## Task 7: 实现占位页 PlaceholderView

**Files:**

- Create: `packages/project/src/baima-duowei/views/PlaceholderView.vue`

- [ ] **Step 1: 创建 PlaceholderView.vue**

```vue
<script setup lang="ts">
import { useRouter } from 'vue-router'
import { resolvePkgUrl } from '@shared/utils/url'

defineProps<{ title: string }>()

const router = useRouter()
const bgVideo = resolvePkgUrl('shared/line-flow.mp4')

function goHome() {
  router.push({ name: 'home' })
}
function goPrev() {
  router.go(-1)
}
function goNext() {
  router.go(1)
}
</script>

<template>
  <main class="placeholder">
    <video
      class="placeholder__video"
      :src="bgVideo"
      autoplay
      muted
      loop
      playsinline
      preload="auto"
      disablepictureinpicture
      disableremoteplayback
      @contextmenu.prevent
    />
    <div class="placeholder__veil" />

    <div class="placeholder__center">
      <h1 class="placeholder__title">{{ title }}</h1>
      <p class="placeholder__hint">内容建设中</p>
    </div>

    <nav class="placeholder__nav">
      <button class="placeholder__nav-btn" @click="goPrev">上一页</button>
      <button class="placeholder__nav-btn" @click="goNext">下一页</button>
      <button class="placeholder__nav-btn placeholder__nav-btn--home" @click="goHome">首页</button>
    </nav>
  </main>
</template>

<style scoped lang="scss">
@use '@shared/styles/tokens' as t;

.placeholder {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: t.$color-bg-primary;
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder__video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 0;
  pointer-events: none;
  transform: translateZ(0);
}

.placeholder__veil {
  position: absolute;
  inset: 0;
  z-index: 1;
  background: rgba(5, 11, 26, 0.6);
}

.placeholder__center {
  position: relative;
  z-index: 2;
  text-align: center;
  color: #fff;
}

.placeholder__title {
  font-size: 4vw;
  font-weight: 700;
  color: #7ee8ff;
  margin-bottom: 2vh;
}

.placeholder__hint {
  font-size: 2vw;
  opacity: 0.6;
}

.placeholder__nav {
  position: absolute;
  bottom: 4%;
  right: 3%;
  z-index: 3;
  display: flex;
  gap: 1.5vw;
}

.placeholder__nav-btn {
  padding: 1vh 2vw;
  background: rgba(80, 200, 255, 0.15);
  border: 1px solid rgba(80, 200, 255, 0.4);
  border-radius: 4px;
  color: #fff;
  font-size: 1.4vw;
  cursor: pointer;
  transition:
    background 0.2s,
    border-color 0.2s;

  &:hover {
    background: rgba(80, 200, 255, 0.3);
    border-color: rgba(80, 200, 255, 0.8);
  }

  &--home {
    background: rgba(80, 200, 255, 0.25);
  }
}
</style>
```

- [ ] **Step 2: 验证占位页**

```bash
npm run dev:duowei
# 首页点"智慧技术" → 看到"智慧技术 / 内容建设中" + 导航按钮
# 首页点"安全活动" → 看到"安全活动 / 内容建设中"
# 首页点"标准化建设" → 看到"标准化建设 / 内容建设中"
# 各页点"首页"按钮均能回首页
```

- [ ] **Step 3: Commit**

```bash
git add packages/project/src/baima-duowei/views/PlaceholderView.vue
git commit -m "feat(baima-duowei): 新增占位页（智慧技术/安全活动/标准化建设）"
```

---

## Task 8: 整体联调与打包

- [ ] **Step 1: 完整流程测试**

```bash
npm run dev:duowei
```

逐项验证：

- 首页：视频循环、标题扫光渐显、右侧4按钮从右滑入、hover 发光
- 点「安全成效」→ 淡出过渡 → 安全成效页入场：标题扫光、内容渐显
- 标题块从左向右扫描展开（`reveal-shine-lr`）
- 底部标语从左向右扫描展开
- 三个导航按钮 hover 状态切换正确
- 点「首页」按钮 → 回首页
- 等待 20 秒无操作 → 自动回首页
- 点其他3个按钮 → 占位页正常显示，能回首页

- [ ] **Step 2: 打包验证**

```bash
npm run dist:duowei
# 期望输出：build/baima-duowei/exhi-baima-duowei-1.0.0-x64.exe
```

- [ ] **Step 3: 最终 Commit**

```bash
git add .
git commit -m "feat(baima-duowei): 多维筑安项目完整实现

- 首页待机页：视频背景 + 4选项按钮 + 光带扫光
- 安全成效页：线条流动背景 + 标题/内容/导航按钮
- 占位页：智慧技术/安全活动/标准化建设
- 20s 无操作自动回首页
- 打包配置接入 dist:duowei"
```
