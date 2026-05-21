<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getSection, type Category, type SectionId } from '@shared/data/sections'
import { resolvePkgUrl } from '@shared/utils/url'
import { useCanvasTransition } from '@shared/composables/useCanvasTransition'

const props = defineProps<{
  sectionId: string
  categoryId?: string
  entryIndex: number
}>()

const router = useRouter()

const section = computed(() => {
  const id = props.sectionId as SectionId
  return getSection(id)
})

const currentCategory = computed(() => {
  const list = section.value.categories
  return list.find((c) => c.id === props.categoryId) ?? list[0]
})

const currentEntry = computed(() => {
  const entries = currentCategory.value.entries
  const safeIndex = Math.max(0, Math.min(props.entryIndex, entries.length - 1))
  return entries[safeIndex]
})

const total = computed(() => currentCategory.value.entries.length)
const canPrev = computed(() => total.value > 1)
const canNext = computed(() => total.value > 1)

/** 当前展区的切图目录前缀 */
const slicesDir = computed(() =>
  props.sectionId === 'leaders' ? 'leader-slices' : 'yushui-slices'
)

/**
 * 右侧 tab 图片：每个分类一张完整 PNG（自带文字 + 选中态边框）。
 * 文件名约定：tab-{categoryId}-active.png。
 * 未选中视觉用 CSS opacity: 0.4 弱化；选中态原图。
 */
const tabAssets = computed<Record<string, string>>(() =>
  Object.fromEntries(
    section.value.categories.map((c: Category) => [
      c.id,
      resolvePkgUrl(`${slicesDir.value}/tab-${c.id}-active.png`)
    ])
  )
)

/** 一级首页同一段背景视频 */
const bgVideoUrl = resolvePkgUrl('home/bg.mp4')

const bannerFrameUrl = computed(() => {
  if (props.sectionId === 'leaders') return resolvePkgUrl('leader-slices/header-bg.png')
  return resolvePkgUrl('yushui-slices/banner-frame.png')
})

const bannerTitleUrl = computed(() => {
  if (props.sectionId === 'leaders') return resolvePkgUrl('leader-slices/header.png')
  return resolvePkgUrl('yushui-slices/banner-title.png')
})

const footerFrameUrl = resolvePkgUrl('yushui-slices/footer-frame.png')

/** 圆形按钮底图（normal 态，领导关怀用专属图，选中态复用渝水） */
const btnBgUrl = computed(() => resolvePkgUrl(`${slicesDir.value}/btn-bg.png`))
const btnBgActiveUrl = resolvePkgUrl('yushui-slices/btn-bg-active.png')
const btnPrevUrl = computed(() => resolvePkgUrl(`${slicesDir.value}/btn-left.png`))
const btnPrevActiveUrl = resolvePkgUrl('yushui-slices/btn-left-active.png')
const btnNextUrl = computed(() => resolvePkgUrl(`${slicesDir.value}/btn-right.png`))
const btnNextActiveUrl = resolvePkgUrl('yushui-slices/btn-right-active.png')
const btnHomeUrl = computed(() => resolvePkgUrl(`${slicesDir.value}/btn-home.png`))
const btnHomeActiveUrl = resolvePkgUrl('yushui-slices/btn-home-active.png')

/** 内容图（业务素材到位前显示占位） */
const stageImageUrl = computed(() => {
  if (currentEntry.value.image) return resolvePkgUrl(currentEntry.value.image)
  return null
})

const transitionType = ref<'category' | 'entry'>('category')
const { onLeave, onEnter } = useCanvasTransition(transitionType)

/** 自动轮播间隔（ms） */
const AUTOPLAY_INTERVAL = 6000
let autoplayTimer: number | null = null

function selectCategory(id: string) {
  if (id === currentCategory.value.id) return
  transitionType.value = 'category'
  router.replace({
    name: 'section',
    params: { sectionId: props.sectionId, categoryId: id, entryIndex: 0 }
  })
}

function next() {
  if (!canNext.value) return
  transitionType.value = 'entry'
  const len = total.value
  const ni = (props.entryIndex + 1) % len
  router.replace({
    name: 'section',
    params: { sectionId: props.sectionId, categoryId: currentCategory.value.id, entryIndex: ni }
  })
}

function prev() {
  if (!canPrev.value) return
  transitionType.value = 'entry'
  const len = total.value
  const ni = (props.entryIndex - 1 + len) % len
  router.replace({
    name: 'section',
    params: { sectionId: props.sectionId, categoryId: currentCategory.value.id, entryIndex: ni }
  })
}

function home() {
  router.push({ name: 'home' })
}

/**
 * 自动轮播：
 *   - 每 AUTOPLAY_INTERVAL ms 走一步
 *   - 同分类还有下一张 → 切下一张（小动画）
 *   - 已是最后一张 → 跳到下一个分类的第一张（大动画 + 菜单联动）
 *   - 走到最后一个分类的最后一张 → 回到第一个分类
 * 用户手动操作（点菜单 / 左右按钮）会自动重启计时器。
 */
function autoplayStep() {
  const cats = section.value.categories
  const curCatIdx = cats.findIndex((c) => c.id === currentCategory.value.id)
  const len = total.value
  const isLastEntry = props.entryIndex >= len - 1

  if (!isLastEntry) {
    // 同分类内推进
    transitionType.value = 'entry'
    router.replace({
      name: 'section',
      params: {
        sectionId: props.sectionId,
        categoryId: currentCategory.value.id,
        entryIndex: props.entryIndex + 1
      }
    })
  } else {
    // 跳到下一个分类的第 0 张（首尾循环）
    const nextCat = cats[(curCatIdx + 1) % cats.length]
    transitionType.value = 'category'
    router.replace({
      name: 'section',
      params: { sectionId: props.sectionId, categoryId: nextCat.id, entryIndex: 0 }
    })
  }
}

function startAutoplay() {
  stopAutoplay()
  autoplayTimer = window.setInterval(autoplayStep, AUTOPLAY_INTERVAL)
}

function stopAutoplay() {
  if (autoplayTimer != null) {
    window.clearInterval(autoplayTimer)
    autoplayTimer = null
  }
}

// 路由参数变化（手动 / 自动）→ 重置计时器，保证「最后一次切换后 6s 再走下一步」
watch(
  () => [props.categoryId, props.entryIndex] as const,
  () => {
    startAutoplay()
  }
)

onMounted(() => {
  startAutoplay()
})

onBeforeUnmount(() => {
  stopAutoplay()
})

/**
 * 路由变化时兜底：
 *   - 没有 categoryId → 默认选中第一个分类
 *   - 有 categoryId 但匹配不上 → 也回退到第一个
 */
watch(
  () => [props.sectionId, props.categoryId] as const,
  ([sid, cid]) => {
    if (!sid) return
    const cats = section.value.categories
    const first = cats[0]
    const matched = cid ? cats.find((c) => c.id === cid) : null
    if (!matched) {
      router.replace({
        name: 'section',
        params: { sectionId: sid, categoryId: first.id, entryIndex: 0 }
      })
    }
  },
  { immediate: true }
)
</script>

<template>
  <main class="section-view">
    <!-- ===== 全屏背景视频 (跟首页同款) ===== -->
    <video
      class="section-view__bg"
      :src="bgVideoUrl"
      autoplay
      muted
      loop
      playsinline
      preload="auto"
      disablepictureinpicture
      disableremoteplayback
      @contextmenu.prevent
    />

    <!--
      ===== 顶部 banner：通栏装饰 + 居中标题图 =====
      标题图外面包一层 .banner__title-wrap：外层 absolute 居中定位（占住 transform
      的 translate），内层 img 跑 reveal-shine-lr 揭幕扫光动画——两层 transform
      互不冲突。
    -->
    <header class="banner">
      <img class="banner__frame" :src="bannerFrameUrl" alt="" aria-hidden="true" />
      <div class="banner__title-wrap">
        <img class="banner__title" :src="bannerTitleUrl" :alt="section.banner" />
      </div>
    </header>

    <!--
      ===== 中部三层叠框 =====
      .content-frame 是外层包装：内含两个真实 div 当外框（A 宽矮、B 高窄），
      互相交叉。再之上盖 .content-frame__inner（蓝黑色填充层），正好遮住
      两条外框的交叉角。
      右侧菜单跟内框平级，绝对定位向 frame 右边外溢，可以盖到外框右段上。

      用真实 div（替代之前的 ::before/::after）是为了**预留挂载流光组件**
      （MovingDot）的位置——伪元素无法承载 Vue 子组件。
    -->
    <section class="content-frame">
      <!-- 外框 A：宽矮（露左右两边）。后续可以在这里挂 MovingDot 跑流光 -->
      <div class="content-frame__outer content-frame__outer--a" aria-hidden="true" />
      <!-- 外框 B：高窄（露上下两边）。后续可以在这里挂 MovingDot 跑流光 -->
      <div class="content-frame__outer content-frame__outer--b" aria-hidden="true" />

      <div class="content-frame__inner">
        <!--
          左侧 / 中部：内容画布。
          :key 变化 → Vue 重挂载元素，触发 <Transition> JS 钩子；
          onEnter 根据 transitionType 分派光圈展开（category）或景深滑入（entry）。
        -->
        <div class="canvas">
          <Transition :css="false" @enter="onEnter" @leave="onLeave">
            <div :key="`${currentCategory.id}-${currentEntry.id}`" class="canvas__media">
              <img
                v-if="stageImageUrl"
                class="canvas__image"
                :src="stageImageUrl"
                :alt="currentEntry.title"
              />
              <div v-else class="canvas__placeholder">
                <span class="canvas__placeholder-icon">📷</span>
                <p class="canvas__placeholder-title">{{ currentEntry.title }}</p>
                <p class="canvas__placeholder-hint">
                  {{ currentEntry.placeholder ?? '资源待补充' }}
                </p>
              </div>
            </div>
          </Transition>
        </div>

        <!-- 底部：贴 frame 内侧底边 -->
        <footer class="footer" :style="{ backgroundImage: `url(${footerFrameUrl})` }">
          <span :key="currentEntry.id" class="footer__caption">
            {{ currentEntry.caption ?? currentEntry.title }}
          </span>

          <!--
            底部 3 个圆形按钮：
              - 共享底图 btn-bg / btn-bg-active（外圈光环），自动旋转
              - 中央叠加各自图标（左/右/首页，normal & active 两态）
              - hover 时切到 active 态
          -->
          <div class="footer__btns">
            <button
              class="footer__btn"
              :class="{ 'footer__btn--disabled': !canPrev }"
              :disabled="!canPrev"
              aria-label="上一页"
              @click="prev"
            >
              <img class="footer__btn-bg" :src="btnBgUrl" alt="" aria-hidden="true" />
              <img
                class="footer__btn-bg footer__btn-bg--active"
                :src="btnBgActiveUrl"
                alt=""
                aria-hidden="true"
              />
              <img class="footer__btn-icon" :src="btnPrevUrl" alt="" aria-hidden="true" />
              <img
                class="footer__btn-icon footer__btn-icon--active"
                :src="btnPrevActiveUrl"
                alt=""
                aria-hidden="true"
              />
            </button>
            <button
              class="footer__btn"
              :class="{ 'footer__btn--disabled': !canNext }"
              :disabled="!canNext"
              aria-label="下一页"
              @click="next"
            >
              <img class="footer__btn-bg" :src="btnBgUrl" alt="" aria-hidden="true" />
              <img
                class="footer__btn-bg footer__btn-bg--active"
                :src="btnBgActiveUrl"
                alt=""
                aria-hidden="true"
              />
              <img class="footer__btn-icon" :src="btnNextUrl" alt="" aria-hidden="true" />
              <img
                class="footer__btn-icon footer__btn-icon--active"
                :src="btnNextActiveUrl"
                alt=""
                aria-hidden="true"
              />
            </button>
            <button class="footer__btn" aria-label="返回首页" @click="home">
              <img class="footer__btn-bg" :src="btnBgUrl" alt="" aria-hidden="true" />
              <img
                class="footer__btn-bg footer__btn-bg--active"
                :src="btnBgActiveUrl"
                alt=""
                aria-hidden="true"
              />
              <img class="footer__btn-icon" :src="btnHomeUrl" alt="" aria-hidden="true" />
              <img
                class="footer__btn-icon footer__btn-icon--active"
                :src="btnHomeActiveUrl"
                alt=""
                aria-hidden="true"
              />
            </button>
          </div>
        </footer>
      </div>

      <!--
        右侧菜单：每个分类一张完整 PNG（自带文字 + 边框）。
        外层 .menu__slot 承担入场 animation（transform / opacity 进场）；
        内层 .menu__item 只管 hover / active / 选中态——避免 animation 的
        `fill-mode: both` 永久占住 transform/opacity，hover 反馈失效。
      -->
      <nav class="menu" aria-label="分类">
        <div
          v-for="(cat, i) in section.categories"
          :key="cat.id"
          class="menu__slot"
          :style="{ '--enter-delay': `${0.4 + i * 0.2}s` }"
        >
          <button
            class="menu__item"
            :class="{ 'menu__item--active': cat.id === currentCategory.id }"
            :aria-label="cat.title"
            :aria-pressed="cat.id === currentCategory.id"
            @click="selectCategory(cat.id)"
          >
            <img class="menu__img" :src="tabAssets[cat.id]" :alt="cat.title" />
          </button>
        </div>
      </nav>
    </section>
  </main>
</template>

<style scoped lang="scss">
@use '@shared/styles/tokens' as t;
@use '@shared/styles/transitions' as fx;

/**
   * 根容器：不再用 flex column 布局！
   * 改成纯 position 定位锚——banner / content-frame 各自 absolute 层叠，
   * banner 浮在顶部不占文档流高度、不挤压 content-frame。
   */
.section-view {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: t.$color-bg-primary;
}

/* ===== 全屏背景视频 =====
   * 跟首页同款。translateZ(0) 强制独立 GPU 合成层，避免视频解码 I 帧
   * 时拖累上层动画节奏（流光/扫光每圈卡顿的根因）。
   */
.section-view__bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 0;
  pointer-events: none;
  user-select: none;
  -webkit-user-drag: none;
  will-change: transform;
  transform: translateZ(0);
  isolation: isolate;
}

/* ===== Banner =====
 * absolute 浮在顶部、不占文档流，自身高度由内部 banner__frame 自然撑开。
 * z-index: 4 永远在 content-frame 上方。
 */
.banner {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 4;
  pointer-events: none; /* banner 仅装饰，不拦截 content-frame 区域的点击 */
}

.banner__frame {
  display: block;
  width: 100%;
  height: auto;
  object-fit: contain;
  pointer-events: none;
  user-select: none;
  -webkit-user-drag: none;
  @include fx.enter-fade-down($duration: 0.8s, $delay: 0s);
}

/**
   * 标题图外层 wrap：absolute 居中（占住 translate -50%）。
   * 内层 img 自由跑 reveal-shine-lr，两层 transform 互不冲突。
   */
.banner__title-wrap {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1;
  pointer-events: none;
}

.banner__title {
  display: block;
  height: 5.5vh;
  width: auto;
  pointer-events: none;
  user-select: none;
  -webkit-user-drag: none;
  /**
   * delay 0.9s：避开 App.vue 的 720ms 整页淡入。
   * 之前 0.3s 时整页还在淡入中，揭幕动画前半段被淡入盖住——
   * 肉眼看到的是"前面几个字已经显出来了，最后两个字才在揭幕"。
   * 推到 0.9s 让整页先稳定，再开始揭幕。
   */
  @include fx.reveal-shine-lr($duration: 1.4s, $delay: 0.9s);
}

/* ===== 中部三层叠框 =====
 * 设计稿是**三层交叉**结构：
 *   外框 A（::before）：横向更宽、纵向更窄  → 露出左右两边
 *   外框 B（::after）：横向更窄、纵向更高  → 露出上下两边
 *   内层（.content-frame 本体）：蓝黑色填充 + 自身描边，
 *     尺寸介于两外框之间，正好盖住 A、B 的四个交叉角
 *
 * 视觉效果：四角看到是内框压在两条外框线交叉处之上，左右只露 A 的描边段，
 * 上下只露 B 的描边段——科技感"双框错位"。
 */
/**
   * content-frame：absolute 占满 banner 下方到屏底的全部区域。
   * top: 11vh 给 banner 留出空间（按 banner__frame 实际高度估）；
   * 实际渲染时如果 banner 偏矮也无所谓——它只是个挡光的视觉条，下方
   * content-frame 占满到屏底就行。
   */
.content-frame {
  position: absolute;
  top: 8vh;
  left: 6vh;
  right: 6vh;
  bottom: 3vh;
  z-index: 2;
  display: flex;
  flex-direction: column;
  animation: content-frame-fade-in 0.6s 0.5s ease-out both;
}

/**
 * 两个外框公共样式：纯描边、不挡点击、垫在 inner 之下。
 * 各自的尺寸 / 位置走 modifier。
 */
.content-frame__outer {
  position: absolute;
  border: 1px solid rgba(0, 229, 212, 0.5);
  border-radius: 2px;
  pointer-events: none;
  z-index: 0;
}

/** 外框 A：宽（横向更长）& 矮（纵向更短）→ 露左右两边描边 */
.content-frame__outer--a {
  top: 1.6vh;
  bottom: 1.6vh;
  left: -1.8vh;
  right: -1.8vh;
}

/** 外框 B：窄（横向更短）& 高（纵向更长）→ 露上下两边描边 */
.content-frame__outer--b {
  top: -1.6vh;
  bottom: -1.6vh;
  left: 1.8vh;
  right: 1.8vh;
}

/**
   * 内框：蓝黑色填充层，盖在两个外框的交叉角上方。
   * 子元素 canvas / footer 都用 absolute 定位：
   *   - canvas 铺满整个 inner（图片占满）
   *   - footer 贴 inner 底部、z-index 更高 → 浮在图片下沿之上
   */
.content-frame__inner {
  position: relative;
  z-index: 1;
  flex: 1 1 auto;
  min-height: 0;
  background: #121822;
  border: none;
  overflow: hidden; // 图片占满时裁掉超出部分
}

@keyframes content-frame-fade-in {
  from {
    opacity: 0;
    transform: scale(0.985);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* 内容画布：absolute 铺满 inner 整块；图片占满（cover 填充） */
.canvas {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  perspective: 1400px;
  perspective-origin: 50% 50%;
}

.canvas__media {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  /* GSAP 动画使用 will-change 提示 GPU 层合成 */
  will-change: transform, opacity, filter;
}

.canvas__image {
  width: 100%;
  height: 100%;
  object-fit: cover; // 铺满整块画布；要保留完整图改回 contain
}

.canvas__placeholder {
  text-align: center;
  color: t.$color-text-muted;
  padding: 4vh;
}

.canvas__placeholder-icon {
  font-size: 8vh;
  display: block;
  margin-bottom: 2vh;
  opacity: 0.45;
}

.canvas__placeholder-title {
  font-size: t.$fs-h2;
  color: t.$color-text-primary;
  letter-spacing: 0.15em;
  margin: 0 0 1vh;
}

.canvas__placeholder-hint {
  font-size: t.$fs-body;
  letter-spacing: 0.1em;
  opacity: 0.65;
  margin: 0;
}

/* ===== 右侧菜单 =====
 * 绝对定位贴在 frame 右边，让按钮一部分跨在 frame 内、一部分溢出 frame 右外侧。
 * right: 负值让整组按钮往外探出。
 */
.menu {
  position: absolute;
  top: 50%;
  right: -3vw; /* 按钮约 14vh 宽，让右 1/4 露在 frame 外 */
  transform: translateY(-50%);
  z-index: 3;
  display: flex;
  flex-direction: column;
  gap: 3vh;
  align-items: flex-start;
}

/**
   * 外层 wrap：只承担入场动画（错峰从右滑入）。
   * animation-fill-mode: both 占住 transform，但**不影响内部的 button**——
   * hover/active 的 transform/opacity 都挂在 .menu__item 上互不冲突。
   */
.menu__slot {
  @include fx.enter-from-right($duration: 0.6s, $delay: 0.4s);
  animation-delay: var(--enter-delay, 0.4s);
}

.menu__item {
  position: relative;
  background: transparent;
  border: 0;
  padding: 0;
  cursor: pointer;
  outline: none;
  -webkit-tap-highlight-color: transparent;
  display: inline-block;
  /* 默认未选中：透明度 0.4 弱化 */
  opacity: 0.4;
  transition:
    transform t.$dur-base t.$ease-base,
    opacity t.$dur-base t.$ease-base,
    filter t.$dur-base t.$ease-base;

  &:hover {
    opacity: 1;
    transform: translateX(-12px);
    filter: drop-shadow(0 0 12px rgba(0, 229, 212, 0.5));
  }
  &:active {
    transform: scale(0.96);
  }

  /* 选中态：完全显示 + 微微上浮显眼 */
  &--active {
    opacity: 1;
    filter: drop-shadow(0 0 14px rgba(0, 229, 212, 0.6));
  }
}

.menu__img {
  display: block;
  height: 8vh;
  width: auto;
  pointer-events: none;
  user-select: none;
  -webkit-user-drag: none;
}

/* ===== 底部 footer =====
   * 绝对定位贴 inner 底边，z-index 高于 canvas → 浮在图片下沿之上。
   * footer-frame.png 作为 footer 的 background-image 铺底。
   */
.footer {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2vw;
  padding: 1.5vh 2vw 1.5vh 3vh;
  min-height: 7vh;
  background-repeat: no-repeat;
  background-size: 100% 100%;
  background-position: center;
  @include fx.enter-fade-up($duration: 0.7s, $delay: 0.6s);
}

.footer__caption {
  flex: 1 1 auto;
  min-width: 0;
  font-size: t.$fs-h3;
  color: t.$color-text-primary;
  letter-spacing: 0.1em;
  text-shadow: 0 0 8px rgba(0, 229, 212, 0.5);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  /* entry 切换时 caption 淡入 */
  animation: caption-fade-in 0.5s ease-out both;
}

@keyframes caption-fade-in {
  from {
    opacity: 0;
    transform: translateX(-12px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.footer__btns {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 1.2vw;
}

/**
   * 圆形按钮：底图（btn-bg / btn-bg-active）一直缓慢旋转 + 上层图标居中。
   *
   * 视觉层叠（4 张图都绝对定位铺满 button）：
   *   z=1  btn-bg              normal 底图（持续旋转，hover/active 时淡出）
   *   z=2  btn-bg--active      hover/active 底图（默认隐藏，hover/active 时淡入）
   *   z=3  btn-icon            normal 图标（默认显示，hover/active 时淡出）
   *   z=4  btn-icon--active    hover/active 图标（默认隐藏，hover/active 时淡入）
   *
   * 用 opacity 切换两套图层比 :src 切换更平滑（不会闪一下）。
   */
.footer__btn {
  position: relative;
  width: 7vh;
  height: 7vh;
  background: transparent;
  border: 0;
  padding: 0;
  cursor: pointer;
  outline: none;
  -webkit-tap-highlight-color: transparent;
  transition:
    transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1),
    filter 0.25s t.$ease-base;

  &:hover:not(:disabled) {
    transform: scale(1.18) translateY(-3px);
    filter: drop-shadow(0 0 10px rgba(0, 229, 212, 0.75))
      drop-shadow(0 4px 12px rgba(0, 229, 212, 0.35));
  }

  &:active:not(:disabled) {
    transform: scale(0.94);
    filter: drop-shadow(0 0 6px rgba(0, 229, 212, 0.5));
    transition-duration: 0.1s;
  }

  /* 禁用态：整体灰度 + 半透明 */
  &--disabled,
  &:disabled {
    cursor: not-allowed;
    filter: grayscale(0.7) brightness(0.55);
    opacity: 0.5;
  }
}

.footer__btn-bg,
.footer__btn-icon {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  user-select: none;
  -webkit-user-drag: none;
  transition: opacity t.$dur-base t.$ease-base;
}

/* 底图 normal：慢转 10s；active 层：hover 时淡入，加速转 2s */
.footer__btn-bg {
  z-index: 1;
  animation: footer-btn-spin 10s linear infinite;
}
.footer__btn-bg--active {
  z-index: 2;
  opacity: 0;
  animation: footer-btn-spin 2s linear infinite;
}

/* 图标：normal 默认显示，active 默认隐藏 */
.footer__btn-icon {
  z-index: 3;
}
.footer__btn-icon--active {
  z-index: 4;
  opacity: 0;
}

/* hover：切换到 active 一套（底图 + 图标各自淡入）*/
.footer__btn:hover:not(:disabled) {
  .footer__btn-bg {
    opacity: 0;
  }
  .footer__btn-bg--active {
    opacity: 1;
  }
  .footer__btn-icon {
    opacity: 0;
  }
  .footer__btn-icon--active {
    opacity: 1;
  }
}

@keyframes footer-btn-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
