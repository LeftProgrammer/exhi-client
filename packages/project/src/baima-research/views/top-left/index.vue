<script setup lang="ts">
import { ref, computed } from 'vue'
import { resolvePkgUrl } from '@shared/utils/url'
import { useScreenSync, getDebugPoint } from '../../composables/useScreenSync'
import { getPoint } from '../../data/points'

const SCREEN = 'top-left'
const { onSyncPoint, onSyncIdle } = useScreenSync()

// dev 调试：可通过 URL ?point=baima-bridge 直接预览选中态
const activeId = ref<string | null>(getDebugPoint())
onSyncPoint((id) => (activeId.value = id))
onSyncIdle(() => (activeId.value = null))

const point = computed(() => getPoint(activeId.value))
const hasContent = computed(() => !!point.value?.hasContent)

const videoRef = ref<HTMLVideoElement | null>(null)
const isPaused = ref(true)

function toggleVideo() {
  const v = videoRef.value
  if (!v) return
  if (v.paused) {
    v.play()
    isPaused.value = false
  } else {
    v.pause()
    isPaused.value = true
  }
}

const bg = resolvePkgUrl(`common/${SCREEN}-bg.png`)
const text = resolvePkgUrl(`common/${SCREEN}-text.png`)

function asset(name: string) {
  return resolvePkgUrl(`points/${activeId.value}/${SCREEN}/${name}`)
}
</script>

<template>
  <main class="tl">
    <img class="tl__bg" :src="bg" alt="" />

    <!-- 待机：说明文字 -->
    <transition name="fade">
      <img v-if="!activeId" class="tl__text" :src="text" alt="" />
    </transition>

    <!-- baima-bridge：项目简介 + 创新技术 + 视频播放器 -->
    <transition name="fade">
      <div v-if="activeId === 'baima-bridge' && hasContent" class="tl__content tl__content--baima">
        <img class="tl__baima lt-title" :src="asset('left-top-title.png')" alt="" />
        <img class="tl__baima lt-content" :src="asset('left-top-content.png')" alt="" />
        <img class="tl__baima lb-title" :src="asset('left-bottom-title.png')" alt="" />
        <img class="tl__baima lb-content" :src="asset('left-bottom-content.png')" alt="" />
        <img class="tl__baima rt-1" :src="asset('right-top-1.png')" alt="" />
        <img class="tl__baima rt-2" :src="asset('right-top-2.png')" alt="" />
        <img class="tl__baima video-deco" :src="asset('video-deco.png')" alt="" />
        <img class="tl__baima video-frame" :src="asset('video-frame.png')" alt="" />
        <div class="tl__baima video-wrap" @click="toggleVideo">
          <video
            ref="videoRef"
            class="tl__video-player"
            :src="asset('video.mp4')"
            loop
            muted
          ></video>
          <img v-show="isPaused" class="tl__video-pause" :src="asset('play-btn.png')" alt="" />
        </div>
      </div>
    </transition>

    <!-- 其他点位：研究目标 / 技术路线 / 研究课题 -->
    <transition name="fade">
      <div v-if="activeId === 'slope' && hasContent" class="tl__content tl__content--default">
        <div class="tl__col tl__col--left">
          <section class="tl__block tl__block--goal">
            <img class="tl__title" :src="asset('left-top-title.png')" alt="研究目标" />
            <div class="tl__row">
              <img :src="asset('left-top-1.png')" alt="" />
              <img :src="asset('left-top-2.png')" alt="" />
            </div>
          </section>
          <section class="tl__block tl__block--topic">
            <img class="tl__title" :src="asset('left-bottom-title.png')" alt="研究课题" />
            <img class="tl__fill" :src="asset('left-bottom.png')" alt="" />
          </section>
        </div>
        <div class="tl__col tl__col--right">
          <section class="tl__block">
            <img class="tl__title" :src="asset('right-title.png')" alt="技术路线" />
            <img class="tl__fill" :src="asset('right-top.png')" alt="" />
          </section>
          <section class="tl__block">
            <img class="tl__fill" :src="asset('right-bottom.png')" alt="" />
          </section>
        </div>
      </div>
    </transition>

    <transition name="fade">
      <div v-if="point && !hasContent" class="tl__placeholder">「{{ point.id }}」内容建设中</div>
    </transition>
  </main>
</template>

<style scoped lang="scss">
.tl {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #061024;

  &__bg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: fill;
    z-index: 0;
  }

  &__text {
    position: absolute;
    top: d.h(280);
    left: d.w(397);
    width: d.w(2031);
    height: d.h(1174);
    z-index: 5;
  }

  &__content {
    position: absolute;
    inset: 0;
    z-index: 6;
    display: flex;
    gap: d.w(60);
    padding: d.h(160) d.w(100) d.h(100);

    &--baima {
      display: block;

      .tl__baima {
        position: absolute;
        object-fit: contain;
      }

      .lt-title {
        left: d.w(171);
        top: d.h(287);
        width: d.w(1010);
        height: d.h(91);
      }

      .lt-content {
        left: d.w(161);
        top: d.h(397);
        width: d.w(2093);
        height: d.h(557);
      }

      .lb-title {
        left: d.w(171);
        top: d.h(1000);
        width: d.w(1010);
        height: d.h(91);
      }

      .lb-content {
        left: d.w(170);
        top: d.h(1147);
        width: d.w(2073);
        height: d.h(731);
      }

      .rt-1 {
        left: d.w(2323);
        top: d.h(399);
        width: d.w(658);
        height: d.h(433);
      }

      .rt-2 {
        left: d.w(3022);
        top: d.h(399);
        width: d.w(658);
        height: d.h(433);
      }

      .video-deco {
        left: d.w(2329);
        top: d.h(1538);
        width: d.w(1346);
        height: d.h(305);
      }

      .video-frame {
        left: d.w(2322);
        top: d.h(889);
        width: d.w(1355);
        height: d.h(774);
        z-index: 2;
        pointer-events: none;
      }

      .video-wrap {
        left: d.w(2322);
        top: d.h(889);
        width: d.w(1355);
        height: d.h(774);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 1;
      }

      .tl__video-player {
        width: 96%;
        height: 90%;
        object-fit: cover;
        border-radius: d.w(20);
      }

      .tl__video-pause {
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        width: d.w(186);
        height: d.h(186);
        object-fit: contain;
        pointer-events: none;
        z-index: 3;
      }
    }
  }

  &__col {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: d.h(50);
    min-width: 0;

    &--left {
      flex: 1.05;
    }
  }

  &__block {
    display: flex;
    flex-direction: column;
    gap: d.h(20);
    min-height: 0;

    &--goal {
      flex: 0.9;
    }
    &--topic {
      flex: 1.1;
    }
  }

  &__title {
    height: d.h(70);
    width: auto;
    object-fit: contain;
    align-self: flex-start;
  }

  &__fill {
    flex: 1;
    width: 100%;
    min-height: 0;
    object-fit: contain;
    object-position: left top;
  }

  &__row {
    display: flex;
    gap: d.w(40);
    flex: 1;
    min-height: 0;

    img {
      flex: 1;
      min-width: 0;
      object-fit: contain;
    }
  }

  &__video {
    position: relative;
    flex: 1;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 0;
  }

  &__video-frame {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: contain;
    z-index: 2;
    pointer-events: none;
  }

  &__video-player {
    width: 90%;
    height: 90%;
    object-fit: cover;
    z-index: 1;
  }

  &__video-deco {
    height: d.h(60);
    width: auto;
    object-fit: contain;
  }

  &__placeholder {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 8;
    padding: d.h(40) d.w(80);
    background: rgba(2, 6, 23, 0.8);
    border: 1px solid rgba(0, 212, 255, 0.3);
    border-radius: d.w(12);
    color: #00d4ff;
    font-size: d.h(56);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
