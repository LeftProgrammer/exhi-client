<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useIdleReset } from '@shared/composables/useIdleReset'
import TabBar from './TabBar.vue'
import { COMMON, type ModuleDef } from '../data/modules'

const props = defineProps<{ module: ModuleDef }>()

const router = useRouter()

const activeTab = ref(0)
const activePage = ref(0)

const currentTab = computed(() => props.module.tabs[activeTab.value])
const pages = computed(() => currentTab.value?.pages ?? [])
const currentPage = computed(() => pages.value[activePage.value] ?? null)
const pageCount = computed(() => pages.value.length)
const tabCount = computed(() => props.module.tabs.length)

const showPager = computed(() => tabCount.value > 1 || pageCount.value > 1)
const canPrev = computed(() => activePage.value > 0 || activeTab.value > 0)
const canNext = computed(
  () => activePage.value < pageCount.value - 1 || activeTab.value < tabCount.value - 1
)

// 切换 tab 时回到首页内容
watch(activeTab, () => {
  activePage.value = 0
})

function prevPage() {
  if (activePage.value > 0) {
    activePage.value -= 1
  } else if (activeTab.value > 0) {
    activeTab.value -= 1
    nextTick(() => {
      activePage.value = Math.max(0, pages.value.length - 1)
    })
  }
}
function nextPage() {
  if (activePage.value < pageCount.value - 1) {
    activePage.value += 1
  } else if (activeTab.value < tabCount.value - 1) {
    activeTab.value += 1
  }
}

function goHome() {
  router.push({ name: 'home' })
}

// TODO:触摸屏空闲超时回首页
// useIdleReset(() => router.push({ name: 'home' }))
</script>

<template>
  <main class="sec">
    <img class="sec__bg" :src="COMMON.bg" alt="" />

    <!-- 顶部标题（含副标题，按 tab 切换） -->
    <transition name="fade" mode="out-in">
      <img :key="currentTab?.id" class="sec__title" :src="currentTab?.title" alt="" />
    </transition>

    <!-- 内容区：覆盖整个页面，图片使用页面绝对坐标（基于设计稿 2160×3840） -->
    <div class="sec__content">
      <transition name="page-slide" mode="out-in">
        <div v-if="currentPage" :key="`${currentTab?.id}-${activePage}`" class="sec__page">
          <img
            v-for="(block, bi) in currentPage.blocks"
            :key="bi"
            class="sec__img"
            :src="block.src"
            alt=""
            :style="{
              left: `calc(${block.left} / var(--design-w) * 100vw)`,
              top: `calc(${block.top} / var(--design-h) * 100vh)`,
              width: `calc(${block.width} / var(--design-w) * 100vw)`,
              height: `calc(${block.height} / var(--design-h) * 100vh)`
            }"
          />
        </div>
        <div v-else :key="`empty-${currentTab?.id}`" class="sec__empty">内容建设中</div>
      </transition>
    </div>

    <!-- 边框 -->
    <div class="sec__frame">
      <img class="sec__frame-bg" :src="COMMON.frame" alt="" />
    </div>

    <!-- 右侧上下翻页按钮（多页时显示） -->
    <div v-if="showPager" class="sec__pager">
      <button class="sec__pager-btn" :disabled="!canPrev" @click="prevPage">
        <img :src="COMMON.arrowUp" alt="上一页" />
      </button>
      <button class="sec__pager-btn" :disabled="!canNext" @click="nextPage">
        <img :src="COMMON.arrowDown" alt="下一页" />
      </button>
    </div>

    <!-- 底部 tab 菜单 -->
    <div class="sec__tabs">
      <TabBar v-model="activeTab" :tabs="module.tabs" />
    </div>

    <!-- 右下角首页按钮 -->
    <button class="sec__home" @click="goHome">
      <img :src="COMMON.home" alt="首页" />
    </button>
  </main>
</template>

<style scoped lang="scss">
.sec {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #020617;

  &__bg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: fill;
    z-index: 0;
  }

  &__title {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: d.h(865);
    object-fit: fill;
    z-index: 2;
    pointer-events: none;
  }

  // 内容边框区：1834×2470，水平居中，标题之下
  &__frame {
    position: absolute;
    left: 50%;
    top: d.h(926);
    transform: translateX(-50%);
    width: d.w(1834);
    height: d.h(2470);
    z-index: 2;

    &-bg {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: fill;
      pointer-events: none;
      z-index: 1;
    }
  }

  // 内容区：覆盖整个页面，图片使用页面绝对坐标
  &__content {
    position: absolute;
    inset: 0;
    overflow: hidden;
    z-index: 3;
    pointer-events: none;
  }

  &__page {
    position: absolute;
    inset: 0;
  }

  &__img {
    position: absolute;
    object-fit: fill;
    pointer-events: none;
  }

  &__empty {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(180, 220, 255, 0.7);
    font-size: d.w(64);
    letter-spacing: d.w(6);
  }

  // 右侧翻页按钮
  &__pager {
    position: absolute;
    right: d.w(87);
    top: d.h(1879);
    display: flex;
    flex-direction: column;
    gap: d.h(90);
    z-index: 3;
  }

  &__pager-btn {
    width: d.w(168);
    height: d.w(168);
    padding: 0;
    border: none;
    background: none;
    cursor: pointer;
    transition:
      transform 0.2s ease,
      opacity 0.2s ease;

    img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: fill;
    }

    &:active {
      transform: scale(0.92);
    }

    &:disabled {
      opacity: 0.35;
      cursor: default;
    }
  }

  // 底部 tab
  &__tabs {
    position: absolute;
    left: d.w(171);
    right: d.w(400);
    bottom: d.h(196);
    height: d.h(181);
    z-index: 4;
  }

  // 首页按钮
  &__home {
    position: absolute;
    right: d.w(148);
    bottom: d.h(120);
    width: d.w(222);
    height: d.h(278);
    padding: 0;
    border: none;
    background: none;
    cursor: pointer;
    z-index: 5;
    transition: transform 0.2s ease;

    img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: fill;
    }

    &:active {
      transform: scale(0.94);
    }
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.page-slide-enter-active,
.page-slide-leave-active {
  transition:
    opacity 0.35s ease,
    transform 0.35s ease;
}
.page-slide-enter-from {
  opacity: 0;
  transform: translateY(d.h(40));
}
.page-slide-leave-to {
  opacity: 0;
  transform: translateY(d.h(-40));
}
</style>
