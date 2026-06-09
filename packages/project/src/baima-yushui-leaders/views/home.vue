<script setup lang="ts">
import EntryCard from '@baima-yushui/components/EntryCard.vue'
import { usePageLeave } from '@shared/composables/usePageLeave'
import { useProjectSfx } from '@shared/composables/useProjectSfx'
import { resolvePkgUrl } from '@shared/utils/url'

const bgVideoUrl = resolvePkgUrl('common/bg.mp4')
const headerBgUrl = resolvePkgUrl('home/header-bg.png')
const headerTextUrl = resolvePkgUrl('home/header-title.png')
const cardBgYushui = resolvePkgUrl('home/card-bg-yushui.png')
const cardBgLeaders = resolvePkgUrl('home/card-bg-leaders.png')

// 500ms 让离场动画完整跑完再切路由
const { leaving, leaveTo } = usePageLeave({ duration: 500 })

const sfx = useProjectSfx()

function enterSection(sectionId: 'yushui' | 'leaders') {
  console.log('[home] 点击卡片:', sectionId)
  // 先跳转，音效失败不阻塞
  leaveTo({ name: 'section', params: { sectionId } })
  try { sfx.play('nav') } catch { /* 音效文件缺失，静默忽略 */ }
}
</script>

<template>
  <main class="home" :class="{ leaving }">
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

    <!-- 顶部装饰栏：底纹 + 文字标题 -->
    <header class="home__header">
      <img class="home__header-bg" :src="headerBgUrl" alt="" />
      <img class="home__header-text" :src="headerTextUrl" alt="情系白马 力通江海" />
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

/* 底纹图：通栏横向铺满，从上轻滑淡入 */
.home__header-bg {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
  width: 100%;
  height: d.h(185);
  object-fit: fill;
  pointer-events: none;
  user-select: none;
  -webkit-user-drag: none;
  opacity: 0;
  animation: home-bg-enter 0.8s cubic-bezier(0.25, 1, 0.5, 1) 0.15s both;
}

/* 底纹离场：轻滑淡出 */
.home.leaving .home__header-bg {
  animation: home-bg-leave 0.5s cubic-bezier(0.55, 0, 1, 1) forwards;
}

/* 文字标题图：居中，淡入+下滑+微缩放，0.6s 延迟 */
.home__header-text {
  position: relative;
  z-index: 2;
  width: 100%;
  height: d.h(143);
  margin-top: d.h(27);
  object-fit: fill;
  pointer-events: none;
  user-select: none;
  -webkit-user-drag: none;
  opacity: 0;
  animation: home-title-enter 0.8s cubic-bezier(0.25, 1, 0.5, 1) 0.4s both;
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

/* 进场动画：左右卡片与标题同时开始，持续时间稍长 */
.home__card-wrap--left {
  opacity: 0;
  animation: fx-enter-from-left 1s cubic-bezier(0.25, 1, 0.5, 1) 0.4s both;
}
.home__card-wrap--right {
  opacity: 0;
  animation: fx-enter-from-right 1s cubic-bezier(0.25, 1, 0.5, 1) 0.4s both;
}

/* 悬浮呼吸微动：缓慢上下浮动 + 微缩放 */
.home__card-float {
  @include fx.float-breath;
}

/* 离场动画：左卡飞回左侧，右卡飞回右侧 */
.home__cards.leaving .home__card-wrap--left {
  @include fx.exit-to-left($duration: 0.5s);
}
.home__cards.leaving .home__card-wrap--right {
  @include fx.exit-to-right($duration: 0.5s);
}

/* 标题离场：与入场相反，淡出+上滑+微缩放 */
.home.leaving .home__header-text {
  animation: home-title-leave 0.5s cubic-bezier(0.55, 0, 1, 1) forwards;
}

/* 标题入场：淡入+下滑+微缩放 */
@keyframes home-title-enter {
  from {
    opacity: 0;
    transform: translateY(d.h(-60)) scale(0.92);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* 标题离场：淡出+上滑+微缩放 */
@keyframes home-title-leave {
  from {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  to {
    opacity: 0;
    transform: translateY(d.h(-60)) scale(0.92);
  }
}

/* 底纹入场：从上轻滑淡入 */
@keyframes home-bg-enter {
  from {
    opacity: 0;
    transform: translateY(d.h(-40));
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 底纹离场：从下轻滑淡出 */
@keyframes home-bg-leave {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(d.h(-40));
  }
}
</style>
