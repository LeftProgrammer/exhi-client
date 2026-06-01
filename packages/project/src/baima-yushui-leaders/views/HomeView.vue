<script setup lang="ts">
import EntryCard from '@baima-yushui/components/EntryCard.vue'
import { usePageLeave } from '@shared/composables/usePageLeave'
import { resolvePkgUrl } from '@shared/utils/url'

const bgVideoUrl = resolvePkgUrl('shared/bg.mp4')
const headerBgUrl = resolvePkgUrl('home/header-bg.png')
const headerTextUrl = resolvePkgUrl('home/header-title.png')
const cardBgYushui = resolvePkgUrl('home/card-bg-yushui.png')
const cardBgLeaders = resolvePkgUrl('home/card-bg-leaders.png')

// 180ms 让卡片先动起来再切路由，避免中间黑屏
const { leaving, leaveTo } = usePageLeave({ duration: 180 })

function enterSection(sectionId: 'yushui' | 'leaders') {
  leaveTo({ name: 'section', params: { sectionId } })
}
</script>

<template>
  <main class="home">
    <!-- 背景视频 -->
    <video
      class="home__bg-video"
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
    <!-- 暗角遮罩：突出前景元素 -->
    <div class="home__bg-veil" />

    <!-- 顶部装饰栏：底纹 + 文字标题 + 扫光特效 -->
    <header class="home__header">
      <img class="home__header-bg" :src="headerBgUrl" alt="" aria-hidden="true" />
      <img class="home__header-text" :src="headerTextUrl" alt="情系白马 力通江海" />
      <div class="home__header-shine" aria-hidden="true" />
    </header>

    <!--
      卡片区三层嵌套避免 transform 冲突：
        card-wrap  → 进/出场滑动动画
        card-float → 悬浮呼吸微动
        EntryCard  → hover 交互抬起
    -->
    <section class="home__cards" :class="{ leaving }">
      <div class="home__card-wrap home__card-wrap--left">
        <div class="home__card-float">
          <EntryCard
            :bg-url="cardBgYushui"
            direction="ccw"
            :dot-inset="{ top: 3.3, right: 3.3, bottom: 3.3, left: 9 }"
            @enter="enterSection('yushui')"
          />
        </div>
      </div>
      <div class="home__card-wrap home__card-wrap--right">
        <div class="home__card-float">
          <EntryCard
            :bg-url="cardBgLeaders"
            direction="cw"
            shine-direction="rl"
            :dot-inset="{ top: 3.3, right: 9, bottom: 3.3, left: 3.3 }"
            @enter="enterSection('leaders')"
          />
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped lang="scss">
// @use '@shared/styles/tokens' as t;
// @use '@shared/styles/transitions' as fx;

.home {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: t.$color-bg-primary;
}

/* 背景视频：translateZ(0) 隔离 GPU 合成层，避免视频 I 帧解码时阻塞同层 canvas 动画 */
.home__bg-video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: fill;
  z-index: 0;
  pointer-events: none;
  will-change: transform;
  transform: translateZ(0);
  isolation: isolate;
}

/* 暗角遮罩：径向渐变 + 上下压暗 */
.home__bg-veil {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background:
    radial-gradient(circle at center, transparent 0%, rgba(5, 11, 26, 0.35) 70%),
    linear-gradient(180deg, rgba(5, 11, 26, 0.2) 0%, transparent 30%, rgba(5, 11, 26, 0.4) 100%);
}

/* 顶部装饰栏 */
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

/* 底纹图：通栏横向铺满，淡入 */
.home__header-bg {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
  width: 100%;
  height: auto;
  object-fit: contain;
  pointer-events: none;
  user-select: none;
  -webkit-user-drag: none;
  @include fx.enter-fade-in($duration: 0.8s, $delay: 0.1s);
}

/* 文字标题图：居中，从上滑下淡入 */
.home__header-text {
  position: relative;
  z-index: 2;
  width: 100%;
  height: auto;
  object-fit: contain;
  pointer-events: none;
  user-select: none;
  -webkit-user-drag: none;
  @include fx.enter-fade-down($duration: 0.9s, $delay: 0.4s);
}

/* 扫光特效层：从中心向两侧扫过，半透明掠过文字 */
.home__header-shine {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 100%;
  z-index: 3;
  pointer-events: none;
  @include fx.auto-shine-from-center($duration: 1.4s, $interval: 5s, $width: 25%);
}

/* 卡片容器：flex 居中布局 */
.home__cards {
  position: relative;
  z-index: 2;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9vw;
}

/* 进场动画：左卡从左侧滑入，右卡从右侧滑入 */
.home__card-wrap--left {
  @include fx.enter-from-left;
}
.home__card-wrap--right {
  @include fx.enter-from-right;
}

/* 悬浮呼吸微动：缓慢上下浮动 + 微缩放 */
.home__card-float {
  @include fx.float-breath;
}

/* 离场动画：左卡飞回左侧，右卡飞回右侧 */
.home__cards.leaving .home__card-wrap--left {
  @include fx.exit-to-left;
}
.home__cards.leaving .home__card-wrap--right {
  @include fx.exit-to-right;
}
</style>
