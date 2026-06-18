<script setup lang="ts">
import { onMounted } from 'vue'
import { useVideoControl } from '../composables/useVideoControl'

/**
 * 通用视频播放器：封装中控同步控制 + 自定义暂停图标 + 玻璃态操作提示。
 *  - 充满父容器；尺寸/圆角差异由父级通过 CSS 变量覆盖：
 *      --vp-video-w（默认 100%）/ --vp-video-h（默认 100%）/ --vp-radius（默认 0）
 *  - 中控指令、hover 显隐 controls、点击 toggle 等逻辑见 useVideoControl。
 */
const props = withDefaults(
  defineProps<{
    src: string
    pauseIcon: string
    loop?: boolean
    muted?: boolean
  }>(),
  {
    loop: true,
    muted: false
  }
)

const {
  videoRef,
  isPaused,
  showControls,
  tipState,
  onVideoMouseEnter,
  onVideoMouseLeave,
  toggleVideo
} = useVideoControl()

// Vue 的 :muted 只设 attribute 不设 property，静音需手动同步到 DOM property
onMounted(() => {
  if (videoRef.value) videoRef.value.muted = props.muted
})
</script>

<template>
  <div class="vp" @mouseenter="onVideoMouseEnter" @mouseleave="onVideoMouseLeave">
    <video
      ref="videoRef"
      class="vp__video"
      :src="src"
      :loop="loop"
      :muted="muted"
      :controls="showControls"
      @play="isPaused = false"
      @pause="isPaused = true"
      @click.prevent.stop="toggleVideo"
    ></video>
    <img v-show="isPaused" class="vp__pause" :src="pauseIcon" alt="" />
    <div :class="['vp__tip', { 'vp__tip--show': tipState.show }]">{{ tipState.text }}</div>
  </div>
</template>

<style scoped lang="scss">
.vp {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  &__video {
    width: var(--vp-video-w, 100%);
    height: var(--vp-video-h, 100%);
    object-fit: fill;
    border-radius: var(--vp-radius, 0);
  }

  &__pause {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: d.w(186);
    height: d.h(186);
    object-fit: fill;
    pointer-events: none;
    z-index: 3;
  }

  /* 中控操作提示：玻璃态浮窗，仿原生 controls 风格 */
  &__tip {
    position: absolute;
    left: 50%;
    bottom: d.h(120);
    transform: translateX(-50%);
    padding: d.h(16) d.w(36);
    background: rgba(30, 30, 30, 0.82);
    backdrop-filter: blur(d.w(8));
    border-radius: d.w(12);
    color: #fff;
    font-size: d.h(32);
    font-weight: 500;
    pointer-events: none;
    z-index: 4;
    opacity: 0;
    transition: opacity 0.35s ease, transform 0.35s ease;
    white-space: nowrap;
    box-shadow: 0 d.h(4) d.w(16) rgba(0, 0, 0, 0.3);

    &--show {
      opacity: 1;
    }
  }

  /* 隐藏浏览器扩展注入的倍速控件 */
  :deep(vsc-controller) {
    display: none !important;
  }
}
</style>
