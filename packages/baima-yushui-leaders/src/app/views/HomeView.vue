<script setup lang="ts">
import { useRouter } from 'vue-router'
import EntryCard from '@shared/components/EntryCard.vue'
import { resolvePkgUrl } from '@shared/utils/url'

const router = useRouter()

const bgVideoUrl = resolvePkgUrl('home/bg.mp4')
/** 顶部装饰底纹（带光带/线条的底框，当前缺图时浏览器报 404，丢图后自动生效） */
const headerBgUrl = resolvePkgUrl('home/header-bg.png')
/** 顶部文字图（"情系白马 力通江海"） */
const headerTextUrl = resolvePkgUrl('home/header.png')
const cardBgYushui = resolvePkgUrl('home/card-bg-yushui.png')
const cardBgLeaders = resolvePkgUrl('home/card-bg-leaders.png')
const titleYushuiUrl = resolvePkgUrl('home/card-title-yushui.png')
const titleLeadersUrl = resolvePkgUrl('home/card-title-leaders.png')

function enterSection(sectionId: 'yushui' | 'leaders') {
  router.push({ name: 'section', params: { sectionId } })
}
</script>

<template>
  <main class="home">
    <!-- 背景视频层 -->
    <video
      class="home__bg-video"
      :src="bgVideoUrl"
      autoplay
      muted
      loop
      playsinline
      preload="auto"
      @contextmenu.prevent
    />
    <!-- 视频上方的轻度暗化（让前景元素更突出） -->
    <div class="home__bg-veil" />

    <!-- 顶部装饰栏：底纹 + 文字（双层结构）-->
    <header class="home__header">
      <!-- 底层：装饰栏底纹（科技感线条/光带），图缺时不显示 -->
      <img class="home__header-bg" :src="headerBgUrl" alt="" aria-hidden="true" />
      <!-- 上层：文字标题 -->
      <img class="home__header-text" :src="headerTextUrl" alt="情系白马 力通江海" />
    </header>

    <!-- 中央两张卡片 -->
    <section class="home__cards">
      <EntryCard
        :bg-url="cardBgYushui"
        :title-image="titleYushuiUrl"
        title-fallback="渝水新景"
        subtitle-fallback="YU SHUI XIN JING"
        title-left="22%"
        @enter="enterSection('yushui')"
      />
      <EntryCard
        :bg-url="cardBgLeaders"
        :title-image="titleLeadersUrl"
        title-fallback="领导关怀"
        subtitle-fallback="LING DAO GUAN HUAI"
        title-left="15%"
        title-width="60%"
        @enter="enterSection('leaders')"
      />
    </section>
  </main>
</template>

<style scoped lang="scss">
@use '@shared/styles/tokens' as t;

.home {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: t.$color-bg-primary;
}

/* ===== 背景视频 ===== */
.home__bg-video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 0;
  pointer-events: none;
}

.home__bg-veil {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background:
    radial-gradient(circle at center, transparent 0%, rgba(5, 11, 26, 0.35) 70%),
    linear-gradient(180deg, rgba(5, 11, 26, 0.2) 0%, transparent 30%, rgba(5, 11, 26, 0.4) 100%);
}

/* ===== 顶部装饰栏 =====
   * 双层：底层是装饰栏底纹（横跨整屏宽），上层是居中的文字标题。
   * header-bg.png 缺失时 img 自然不显示（broken icon 也不出，因为我们隐藏 alt）。
   */
.home__header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

/* 底纹：通栏宽度，按图本身高度 */
.home__header-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: auto;
  object-fit: contain;
  user-select: none;
  -webkit-user-drag: none;
  pointer-events: none;
}

/* 文字：居中、相对底纹叠加 */
.home__header-text {
  position: relative;
  width: 32%;
  max-width: 800px;
  height: auto;
  object-fit: contain;
  user-select: none;
  -webkit-user-drag: none;
  pointer-events: none;
}

/* ===== 卡片区 ===== */
.home__cards {
  position: relative;
  z-index: 2;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6vw;
  animation: cards-in 1.4s 0.4s t.$ease-base both;
}

@keyframes cards-in {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
