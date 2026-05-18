<script setup lang="ts">
import EntryCard from '@shared/components/EntryCard.vue'
import { usePageLeave } from '@shared/composables/usePageLeave'
import { resolvePkgUrl } from '@shared/utils/url'

const bgVideoUrl = resolvePkgUrl('home/bg.mp4')
/** 顶部装饰底纹（带光带/线条的底框，当前缺图时浏览器报 404，丢图后自动生效） */
const headerBgUrl = resolvePkgUrl('home/header-bg.png')
/** 顶部文字图（"情系白马 力通江海"） */
const headerTextUrl = resolvePkgUrl('home/header.png')
const cardBgYushui = resolvePkgUrl('home/card-bg-yushui.png')
const cardBgLeaders = resolvePkgUrl('home/card-bg-leaders.png')
const titleYushuiUrl = resolvePkgUrl('home/card-title-yushui.png')
const titleLeadersUrl = resolvePkgUrl('home/card-title-leaders.png')

/**
 * 离场动画状态机：leaving 翻 true 触发卡片飞出 → 短暂延迟后切路由。
 *
 * 延迟时长不再等卡片飞完——全局 transition 会在 router.push 后
 * 立刻同时跑新旧页的淡入淡出（mode 不再是 out-in），新页跟卡片飞出
 * 几乎同步进行 → 用户看到的是「卡片飞走 + 新页从远处浮现」叠加效果，
 * 中间没有黑屏。
 *
 * 这里 180ms 是让卡片先动起来一点点（视觉先有反馈），再切路由。
 */
const { leaving, leaveTo } = usePageLeave({ duration: 180 })

function enterSection(sectionId: 'yushui' | 'leaders') {
  leaveTo({ name: 'section', params: { sectionId } })
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
      disablepictureinpicture
      disableremoteplayback
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

    <!--
      中央两张卡片
      - 进入：左卡从左侧滑入、右卡从右侧滑入（不对称仪式感）
      - 离开：点击后两张卡分别飞回各自来的方向 + 淡出，动画完再跳路由
      - dot-inset 是实测两张 PNG 描边位置的百分比（左右镜像不对称）
    -->
    <section class="home__cards" :class="{ leaving }">
      <!--
        每张卡片用一个 div 包一层：
          - 外层 .home__card-wrap 承担"进/出场动画"（transform 被 animation 占用）
          - 内层 EntryCard 完全自由，hover 缩放/位移不会被外层 animation 顶掉
        这是处理"动画 transform 跟 hover transform 冲突"的标准做法。
      -->
      <div class="home__card-wrap home__card-wrap--left">
        <EntryCard
          :bg-url="cardBgYushui"
          direction="ccw"
          :dot-inset="{ top: 4, right: 3.8, bottom: 5, left: 11.6 }"
          @enter="enterSection('yushui')"
        >
          <img class="card-title card-title--yushui" :src="titleYushuiUrl" alt="渝水新景" />
        </EntryCard>
      </div>
      <div class="home__card-wrap home__card-wrap--right">
        <EntryCard
          :bg-url="cardBgLeaders"
          direction="cw"
          shine-direction="rl"
          :dot-inset="{ top: 4, right: 11.6, bottom: 5, left: 3.8 }"
          @enter="enterSection('leaders')"
        >
          <img class="card-title card-title--leaders" :src="titleLeadersUrl" alt="领导关怀" />
        </EntryCard>
      </div>
    </section>
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

/* ===== 背景视频 =====
   * 用 translateZ(0) 强制把 video 隔离到独立 GPU 合成层。
   *
   * 为什么这样能根治"每圈卡顿"：
   * 视频元素和 canvas 默认共享一个合成层（z-index/绝对定位共栈）。视频
   * 每隔几秒解码一个 I 帧时主线程会去做层合成 → 同层的 canvas 跟着被
   * "暂停"一帧，肉眼看就是流光每圈一丝丝卡。
   * 加 translateZ(0) 后视频走 GPU 直出，合成开销独立，跟 canvas 完全解耦。
   *
   * isolation:isolate 防止 video 跟其它兄弟元素被合并到同一个 stacking ctx。
   */
.home__bg-video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 0;
  pointer-events: none;
  will-change: transform;
  transform: translateZ(0);
  isolation: isolate;
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

/* ===== 卡片区 =====
   * 容器只管布局，不挂动画。进/出场动画落在 .home__card 上，
   * 这样两张卡可以各自从不同方向飞入/飞出。
   */
.home__cards {
  position: relative;
  z-index: 2;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6vw;
}

/* ===== 进/出场动画 =====
   * 挂在外层 wrap 上（不影响内部 EntryCard 的 hover 效果）。
   * 时长跟 usePageLeave 的 duration 对齐：
   *   - 进场 1.6s + 0.2s delay：仪式感缓入
   *   - 离场 0.6s：干脆飞出（HomeView 那边 usePageLeave duration: 620）
   */
.home__card-wrap--left {
  @include fx.enter-from-left;
}
.home__card-wrap--right {
  @include fx.enter-from-right;
}

.home__cards.leaving .home__card-wrap--left {
  @include fx.exit-to-left;
}
.home__cards.leaving .home__card-wrap--right {
  @include fx.exit-to-right;
}

/* ===== 卡片标题图 =====
   * 通过 EntryCard 的默认 slot 注入；位置/尺寸跟蓝湖切图一一对应，
   * 两张卡片左右镜像所以 left/width 分别设。
   */
.card-title {
  position: absolute;
  top: 18%;
  height: auto;
  object-fit: contain;
  user-select: none;
  -webkit-user-drag: none;
  pointer-events: none;
  display: block;
}

.card-title--yushui {
  left: 22%;
  width: 50%;
}

.card-title--leaders {
  left: 15%;
  width: 60%;
}
</style>
