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
    <Transition name="caption" mode="out-in">
      <span :key="caption" class="footer__caption">{{ caption }}</span>
    </Transition>

    <div class="footer__btns">
      <button
        class="footer__btn"
        :class="{ 'footer__btn--disabled': !canPrev }"
        :disabled="!canPrev"
        aria-label="上一页"
        @click="$emit('prev')"
      >
        <img class="footer__btn-bg" :src="btnBgUrl" alt="" />
        <img class="footer__btn-bg footer__btn-bg--active" :src="btnBgActiveUrl" alt="" />
        <img class="footer__btn-icon" :src="btnPrevUrl" alt="" />
        <img class="footer__btn-icon footer__btn-icon--active" :src="btnPrevActiveUrl" alt="" />
      </button>
      <button
        class="footer__btn"
        :class="{ 'footer__btn--disabled': !canNext }"
        :disabled="!canNext"
        aria-label="下一页"
        @click="$emit('next')"
      >
        <img class="footer__btn-bg" :src="btnBgUrl" alt="" />
        <img class="footer__btn-bg footer__btn-bg--active" :src="btnBgActiveUrl" alt="" />
        <img class="footer__btn-icon" :src="btnNextUrl" alt="" />
        <img class="footer__btn-icon footer__btn-icon--active" :src="btnNextActiveUrl" alt="" />
      </button>
      <button class="footer__btn" aria-label="返回首页" @click="$emit('home')">
        <img class="footer__btn-bg" :src="btnBgUrl" alt="" />
        <img class="footer__btn-bg footer__btn-bg--active" :src="btnBgActiveUrl" alt="" />
        <img class="footer__btn-icon" :src="btnHomeUrl" alt="" />
        <img class="footer__btn-icon footer__btn-icon--active" :src="btnHomeActiveUrl" alt="" />
      </button>
    </div>
  </footer>
</template>

<style scoped lang="scss">
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

/* 标题文字：切换时旧文字左滑离场、新文字右滑进场 */
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
}

.caption-enter-active,
.caption-leave-active {
  transition: all 0.35s cubic-bezier(0.25, 1, 0.5, 1);
}

.caption-enter-from {
  opacity: 0;
  transform: translateX(12px);
}

.caption-leave-to {
  opacity: 0;
  transform: translateX(-12px);
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
    box-shadow 0.25s t.$ease-base;

  /* hover 放大发光仅在支持 hover 的设备生效 */
  @media (hover: hover) {
    &:hover:not(:disabled) {
      transform: scale(1.12) translateY(d.h(-2));
    }
  }

  &:active:not(:disabled) {
    transform: translateY(d.h(4)) scale(0.88);
    transition-duration: 0.15s;

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

/* 底图：normal 慢转 6s，active 加速转 2s */
.footer__btn-bg {
  z-index: 1;
  animation: footer-btn-spin 6s linear infinite;
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

/* hover：底图 + 图标同时切换到 active 态（仅在支持 hover 的设备） */
@media (hover: hover) {
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
