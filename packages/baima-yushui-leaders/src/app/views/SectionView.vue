<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getSection, type SectionId } from '@shared/data/sections'
import CategoryTabs from '@shared/components/CategoryTabs.vue'
import ContentViewer from '@shared/components/ContentViewer.vue'
import { resolvePkgUrl } from '@shared/utils/url'

const bgUrl = resolvePkgUrl('shared/bg-mountain.svg')

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

function selectCategory(id: string) {
  router.replace({
    name: 'section',
    params: { sectionId: props.sectionId, categoryId: id, entryIndex: 0 }
  })
}

function next() {
  if (!canNext.value) return
  const len = total.value
  const ni = (props.entryIndex + 1) % len
  router.replace({
    name: 'section',
    params: { sectionId: props.sectionId, categoryId: currentCategory.value.id, entryIndex: ni }
  })
}

function prev() {
  if (!canPrev.value) return
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

// 路由变化时，如果没有 categoryId，规整一次
watch(
  () => [props.sectionId, props.categoryId] as const,
  ([sid, cid]) => {
    if (sid && !cid) {
      const first = section.value.categories[0]
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
    <img class="bg" :src="bgUrl" alt="" aria-hidden="true" />

    <!-- 顶部 banner -->
    <header class="banner">
      <span class="ornament ornament--left" />
      <h1 class="banner__title">{{ section.banner }}</h1>
      <span class="ornament ornament--right" />
    </header>

    <!-- 中部：左侧大画布 + 右侧分类 tabs -->
    <div class="stage">
      <div class="stage__viewer">
        <ContentViewer :entry="currentEntry" />
      </div>
      <aside class="stage__tabs">
        <CategoryTabs
          :categories="section.categories"
          :active-id="currentCategory.id"
          @select="selectCategory"
        />
      </aside>
    </div>

    <!-- 底部控制：左右切换 + 返回 -->
    <footer class="controls">
      <button class="ctrl-btn" :disabled="!canPrev" aria-label="上一页" @click="prev">
        <svg viewBox="0 0 32 32" width="48" height="48">
          <path
            d="M20 8 L12 16 L20 24"
            stroke="currentColor"
            stroke-width="2.5"
            fill="none"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
      <button class="ctrl-btn" :disabled="!canNext" aria-label="下一页" @click="next">
        <svg viewBox="0 0 32 32" width="48" height="48">
          <path
            d="M12 8 L20 16 L12 24"
            stroke="currentColor"
            stroke-width="2.5"
            fill="none"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
      <button class="ctrl-btn ctrl-btn--home" aria-label="返回首页" @click="home">
        <svg viewBox="0 0 32 32" width="48" height="48">
          <path
            d="M6 16 L16 6 L26 16 M9 14 L9 26 L23 26 L23 14"
            stroke="currentColor"
            stroke-width="2.5"
            fill="none"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>

      <span class="counter">{{ entryIndex + 1 }} / {{ total }}</span>
    </footer>
  </main>
</template>

<style scoped lang="scss">
@use '@shared/styles/tokens' as t;
@use '@shared/styles/transitions' as fx;

.section-view {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: t.$color-bg-primary;
  display: flex;
  flex-direction: column;
}

.bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 0;
  opacity: 0.4;
  pointer-events: none;
}

/* ===== 进场动画 =====
 * 错峰淡入，营造"内容从远到近、从中心展开"的纵深感：
 *   - banner 从顶部滑下                  delay 100ms
 *   - 左侧 viewer 从左侧滑入             delay 250ms
 *   - 右侧 tabs 从右侧滑入               delay 350ms
 *   - 底部 controls 从底部托起           delay 450ms
 * 配合全局页面切换（淡入 720ms），整套节奏舒展不仓促。
 */
.banner {
  @include fx.enter-fade-up($duration: 0.7s, $delay: 0.1s);
}
.stage__viewer {
  animation: fx-slide-in-left 0.8s 0.25s fx.$ease-enter both;
}
.stage__tabs {
  animation: fx-slide-in-right 0.8s 0.35s fx.$ease-enter both;
}
.controls {
  animation: fx-rise-up 0.7s 0.45s fx.$ease-enter both;
}

@keyframes fx-slide-in-left {
  from {
    opacity: 0;
    transform: translateX(-40px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
@keyframes fx-slide-in-right {
  from {
    opacity: 0;
    transform: translateX(40px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
@keyframes fx-rise-up {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ===== Banner ===== */
.banner {
  position: relative;
  z-index: 2;
  padding: 3vh 0 2vh;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: t.$space-md;
  flex: 0 0 auto;

  &__title {
    font-size: t.$fs-display;
    font-weight: t.$fw-medium;
    letter-spacing: 0.5em;
    color: t.$color-text-primary;
    text-shadow: 0 0 20px t.$color-accent-glow;
    margin: 0;
  }
}

.ornament {
  width: 22vh;
  height: 2px;
  background: linear-gradient(90deg, transparent 0%, t.$color-accent 50%, transparent 100%);
  position: relative;
  &::before {
    content: '';
    position: absolute;
    top: -4px;
    width: 8px;
    height: 8px;
    background: t.$color-accent;
    transform: rotate(45deg);
    box-shadow: 0 0 10px t.$color-accent-glow;
  }
  &--left::before {
    right: 0;
  }
  &--right::before {
    left: 0;
  }
}

/* ===== Stage ===== */
.stage {
  position: relative;
  z-index: 2;
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  gap: 0;
  padding: 0 4vh 0 6vh;
}

.stage__viewer {
  flex: 1 1 auto;
  min-width: 0;
  padding: t.$space-md;
}

.stage__tabs {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  padding-top: t.$space-sm;
}

/* ===== Controls ===== */
.controls {
  position: relative;
  z-index: 2;
  flex: 0 0 auto;
  padding: t.$space-md 0 t.$space-lg;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: t.$space-md;
}

.ctrl-btn {
  width: 9vh;
  height: 9vh;
  border-radius: 50%;
  background: radial-gradient(
    circle at 30% 30%,
    rgba(0, 229, 212, 0.4) 0%,
    rgba(0, 229, 212, 0.18) 60%,
    rgba(0, 229, 212, 0.05) 100%
  );
  border: 2px solid t.$color-border-strong;
  color: t.$color-text-primary;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all t.$dur-fast t.$ease-base;
  box-shadow:
    0 0 16px rgba(0, 229, 212, 0.3),
    inset 0 0 12px rgba(0, 229, 212, 0.2);
  padding: 0;

  svg {
    width: 60%;
    height: 60%;
  }

  &:hover:not(:disabled) {
    box-shadow:
      0 0 28px t.$color-accent-glow,
      inset 0 0 18px rgba(0, 229, 212, 0.3);
    border-color: t.$color-border-glow;
  }

  &:active:not(:disabled) {
    transform: scale(0.92);
  }

  &:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  &--home {
    background: radial-gradient(
      circle at 30% 30%,
      rgba(0, 229, 212, 0.6) 0%,
      rgba(0, 229, 212, 0.3) 60%,
      rgba(0, 229, 212, 0.1) 100%
    );
  }
}

.counter {
  position: absolute;
  right: 6vh;
  font-size: t.$fs-body;
  letter-spacing: 0.2em;
  color: t.$color-text-muted;
  font-family: 'Consolas', monospace;
}
</style>
