<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getSection, type Category, type SectionId } from '@baima-yushui/data/sections'
import { resolvePkgUrl } from '@shared/utils/url'
import { useViewTransition } from '@shared/composables/useViewTransition'
import { useAutoplay } from '@baima-yushui/composables/useAutoplay'
import StageFooter from '@baima-yushui/components/StageFooter.vue'
import {
  blurDissolveOut,
  slidePushOut,
  vortexRevealIn,
  slideInFromRight
} from '@shared/effects/gsapPresets'

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

const slicesDir = computed(() => (props.sectionId === 'leaders' ? 'leader' : 'yushui'))

/* tab 图片：每个分类一张 PNG（自带文字+选中态边框），未选中用 CSS opacity 弱化 */
const tabAssets = computed<Record<string, string>>(() =>
  Object.fromEntries(
    section.value.categories.map((c: Category) => [
      c.id,
      resolvePkgUrl(`${slicesDir.value}/tab-${c.id}-active.png`)
    ])
  )
)

const bgVideoUrl = resolvePkgUrl('shared/bg.mp4')

const bannerFrameUrl = computed(() => {
  if (props.sectionId === 'leaders') return resolvePkgUrl('leader/header-bg.png')
  return resolvePkgUrl('yushui/header-bg.png')
})

const bannerTitleUrl = computed(() => {
  if (props.sectionId === 'leaders') return resolvePkgUrl('leader/header-title.png')
  return resolvePkgUrl('yushui/header-title.png')
})

const footerFrameUrl = resolvePkgUrl('yushui/footer-frame.png')

const btnBgUrl = computed(() => resolvePkgUrl(`${slicesDir.value}/btn-bg.png`))
const btnBgActiveUrl = resolvePkgUrl('shared/btn-bg-active.png')
const btnPrevUrl = computed(() => resolvePkgUrl(`${slicesDir.value}/btn-left.png`))
const btnPrevActiveUrl = resolvePkgUrl('shared/btn-left-active.png')
const btnNextUrl = computed(() => resolvePkgUrl(`${slicesDir.value}/btn-right.png`))
const btnNextActiveUrl = resolvePkgUrl('shared/btn-right-active.png')
const btnHomeUrl = computed(() => resolvePkgUrl(`${slicesDir.value}/btn-home.png`))
const btnHomeActiveUrl = resolvePkgUrl('shared/btn-home-active.png')

const stageImageUrl = computed(() => {
  if (currentEntry.value.image) return resolvePkgUrl(currentEntry.value.image)
  return null
})

const transitionType = ref<'category' | 'entry'>('category')
const { onLeave, onEnter } = useViewTransition(transitionType, {
  category: { enter: vortexRevealIn, leave: blurDissolveOut },
  entry: { enter: slideInFromRight, leave: slidePushOut }
})

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

/* 自动轮播：同分类内逐张推进，到末尾跳下一分类首张，循环 */
useAutoplay(
  () => [props.categoryId, props.entryIndex] as const,
  () => {
    const cats = section.value.categories
    const curCatIdx = cats.findIndex((c) => c.id === currentCategory.value.id)
    const len = total.value
    const isLastEntry = props.entryIndex >= len - 1

    if (!isLastEntry) {
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
      const nextCat = cats[(curCatIdx + 1) % cats.length]
      transitionType.value = 'category'
      router.replace({
        name: 'section',
        params: { sectionId: props.sectionId, categoryId: nextCat.id, entryIndex: 0 }
      })
    }
  },
  6000
)

// 兜底：categoryId 不存在时回退到第一个分类
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
    <!-- 全屏背景视频 -->
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

    <!-- 顶部 banner：装饰底图 + 居中标题（揭幕扫光动画） -->
    <header class="banner">
      <img class="banner__frame" :src="bannerFrameUrl" alt="" aria-hidden="true" />
      <div class="banner__title-wrap">
        <img class="banner__title" :src="bannerTitleUrl" :alt="section.tagline" />
      </div>
    </header>

    <!--
      中部内容区：三层叠框结构（双外框交叉 + 内框填充）
      外框 A 宽矮露左右，外框 B 窄高露上下，内框盖住交叉角
    -->
    <section class="content-frame">
      <div class="content-frame__outer content-frame__outer--a" aria-hidden="true" />
      <div class="content-frame__outer content-frame__outer--b" aria-hidden="true" />

      <div class="content-frame__inner">
        <!-- 内容画布：key 变化触发 GSAP 转场（光圈展开 / 景深滑入） -->
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
                <p class="canvas__placeholder-title">{{ currentEntry.title }}</p>
                <p class="canvas__placeholder-hint">资源待补充</p>
              </div>
            </div>
          </Transition>
        </div>

        <!-- 底部操作栏：标题文字 + 翻页/首页按钮 -->
        <StageFooter
          :frame-url="footerFrameUrl"
          :btn-bg-url="btnBgUrl"
          :btn-bg-active-url="btnBgActiveUrl"
          :btn-prev-url="btnPrevUrl"
          :btn-prev-active-url="btnPrevActiveUrl"
          :btn-next-url="btnNextUrl"
          :btn-next-active-url="btnNextActiveUrl"
          :btn-home-url="btnHomeUrl"
          :btn-home-active-url="btnHomeActiveUrl"
          :can-prev="canPrev"
          :can-next="canNext"
          :caption="currentEntry.caption ?? currentEntry.title"
          @prev="prev"
          @next="next"
          @home="home"
        />
      </div>
    </section>

    <!-- 右侧分类菜单：贴 section-view 右侧边框，偏下排列 -->
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
  </main>
</template>

<style scoped lang="scss">
/* @use '@shared/styles/tokens' as t;
@use '@shared/styles/transitions' as fx; */

/* 根容器：absolute 层叠布局，banner 浮于顶部不占流 */
.section-view {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: t.$color-bg-primary;
}

/* 背景视频：GPU 独立合成层，避免 I 帧解码阻塞上层动画 */
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

/* Banner：absolute 浮于顶部，z-index 高于内容区 */
.banner {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: d.h(185); /* 2 倍图，设计图标注高度 185px */
  z-index: 4;
  pointer-events: none;
}

.banner__frame {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
  user-select: none;
  -webkit-user-drag: none;
  @include fx.enter-fade-down($duration: 0.8s, $delay: 0s);
}

/* 标题图：外层 wrap 居中定位，内层 img 跑揭幕扫光动画，两层 transform 互不冲突 */
.banner__title-wrap {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  height: 100%;
  z-index: 1;
  pointer-events: none;
}

.banner__title {
  display: block;
  height: 100%; /* 继承 .banner 的 d.h(185) */
  width: auto;
  pointer-events: none;
  user-select: none;
  -webkit-user-drag: none;
  /* delay 0.9s：等整页淡入完成后再开始揭幕 */
  @include fx.reveal-shine-lr($duration: 1.4s, $delay: 0.9s);
}

/*
  三层叠框：外框 A（宽矮）+ 外框 B（窄高）交叉，内框盖住交叉角
  视觉效果：科技感"双框错位"
*/
.content-frame {
  position: absolute;
  top: d.h(164);
  left: d.w(245);
  right: d.w(245);
  bottom: d.h(119);
  z-index: 2;
  display: flex;
  flex-direction: column;
  animation: content-frame-fade-in 0.6s 0.5s ease-out both;
}

.content-frame__outer {
  position: absolute;
  border: 1px solid rgba(0, 229, 212, 0.5);
  border-radius: 2px;
  pointer-events: none;
  z-index: 0;
}

/* 外框 A：横向更宽纵向更矮 → 露左右边 */
.content-frame__outer--a {
  top: d.h(51);
  left: d.w(-55);
  right: d.w(-55);
  bottom: d.h(50);
}

/* 外框 B：横向更窄纵向更高 → 露上下边 */
.content-frame__outer--b {
  top: d.h(-53);
  left: d.w(29);
  right: d.w(29);
  bottom: d.h(-54);
}

/* 内框：蓝黑填充，盖住两外框交叉角 */
.content-frame__inner {
  position: relative;
  z-index: 1;
  flex: 1 1 auto;
  min-height: 0;
  background: #121822;
  border: none;
  overflow: hidden;
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

/* 内容画布：perspective 为 GSAP 3D 转场提供透视 */
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
  will-change: transform, opacity, filter;
}

.canvas__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
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

/* 右侧分类菜单：贴 section-view 右侧边框，偏下排列，固定间距 */
.menu {
  position: absolute;
  bottom: d.h(580);
  right: 0;
  transform: none;
  z-index: 3;
  display: flex;
  flex-direction: column;
  gap: d.h(46);
  align-items: flex-start;
}

/* 外层 slot：承担入场动画（错峰从右滑入） */
.menu__slot {
  @include fx.enter-from-right($duration: 0.6s, $delay: 0.4s);
  animation-delay: var(--enter-delay, 0.4s);
}

/* 菜单项：未选中 opacity 0.4，hover 高亮左移，选中态常亮 */
.menu__item {
  position: relative;
  background: transparent;
  border: 0;
  padding: 0;
  cursor: pointer;
  outline: none;
  -webkit-tap-highlight-color: transparent;
  display: inline-block;
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
  &--active {
    opacity: 1;
    filter: drop-shadow(0 0 14px rgba(0, 229, 212, 0.6));
  }
}

.menu__img {
  display: block;
  width: d.w(496);
  height: d.h(284);
  pointer-events: none;
  user-select: none;
  -webkit-user-drag: none;
}
</style>
