<script setup lang="ts">
interface Props {
  /** 操作栏背景图 URL */
  frameUrl: string
  /** 按钮底图 */
  btnBgUrl: string
  /** 按钮底图激活态 */
  btnBgActiveUrl: string
  /** 上一页图标 */
  btnPrevUrl: string
  btnPrevActiveUrl: string
  /** 下一页图标 */
  btnNextUrl: string
  btnNextActiveUrl: string
  /** 首页图标 */
  btnHomeUrl: string
  btnHomeActiveUrl: string
  /** 是否可翻页 */
  canPrev?: boolean
  canNext?: boolean
  /** 底部标题文案 */
  caption: string
}

defineProps<Props>()
defineEmits<{
  (e: 'prev'): void
  (e: 'next'): void
  (e: 'home'): void
}>()
</script>

<template>
  <footer class="footer" :style="{ backgroundImage: `url(${frameUrl})` }">
    <span :key="caption" class="footer__caption">{{ caption }}</span>

    <div class="footer__btns">
      <button
        class="footer__btn"
        :class="{ 'footer__btn--disabled': !canPrev }"
        :disabled="!canPrev"
        aria-label="上一页"
        @click="$emit('prev')"
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
        @click="$emit('next')"
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
      <button class="footer__btn" aria-label="返回首页" @click="$emit('home')">
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
</template>

<style scoped lang="scss">
// @use '@shared/styles/tokens' as t;

/* 底部操作栏：贴内框底边，浮于画布之上 */
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
  padding: 0 4vw;
  height: d.h(200);
  background-repeat: no-repeat;
  background-size: 100% 100%;
  background-position: center;
  @include fx.enter-fade-up($duration: 0.7s, $delay: 0.6s);
}

/* 标题文字：切换时从左淡入 */
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
}

/*
  圆形按钮：4 层叠加（底图 normal/active + 图标 normal/active）
  底图持续旋转，hover 时切换到 active 层（用 opacity 平滑过渡）
*/
.footer__btn {
  position: relative;
  width: d.w(265);
  aspect-ratio: 1;
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

/* 底图：normal 慢转 10s，active 加速转 2s */
.footer__btn-bg {
  z-index: 1;
  animation: footer-btn-spin 10s linear infinite;
}
.footer__btn-bg--active {
  z-index: 2;
  opacity: 0;
  animation: footer-btn-spin 2s linear infinite;
}

.footer__btn-icon {
  z-index: 3;
}
.footer__btn-icon--active {
  z-index: 4;
  opacity: 0;
}

/* hover：底图 + 图标同时切换到 active 态 */
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
