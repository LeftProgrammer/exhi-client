<script setup lang="ts">
import { ref, computed } from 'vue'
import { resolvePkgUrl } from '@shared/utils/url'
import { useScreenSync, getDebugPoint } from '../../composables/useScreenSync'
import { getPoint } from '../../data/points'

const SCREEN = 'top-left'
const { onSyncPoint, onSyncIdle, onSyncVideoPlay, onSyncVideoPause } = useScreenSync()

// dev 调试：可通过 URL ?point=baima-bridge 直接预览选中态
const activeId = ref<string | null>(getDebugPoint())
onSyncPoint((id) => {
  activeId.value = id
  isPaused.value = true
})
onSyncIdle(() => {
  activeId.value = null
  isPaused.value = true
})

onSyncVideoPlay(() => {
  const v = videoRef.value
  if (!v) return
  v.play()
  isPaused.value = false
})

onSyncVideoPause(() => {
  const v = videoRef.value
  if (!v) return
  v.pause()
  isPaused.value = true
})

const point = computed(() => getPoint(activeId.value))

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
      <div
        v-if="activeId === 'baima-bridge' && point?.detail"
        class="tl__content tl__content--baima"
      >
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

    <!-- slope：研究目标 / 技术路线 / 研究课题 -->
    <transition name="fade">
      <div v-if="activeId === 'slope' && point?.detail" class="tl__content tl__content--slope">
        <img class="tl__slope sl-lt-title" :src="asset('left-top-title.png')" alt="" />
        <img class="tl__slope sl-lt-1" :src="asset('left-top-1.png')" alt="" />
        <img class="tl__slope sl-lt-2" :src="asset('left-top-2.png')" alt="" />
        <img class="tl__slope sl-lb-title" :src="asset('left-bottom-title.png')" alt="" />
        <img class="tl__slope sl-lb-1" :src="asset('left-bottom-content-1.png')" alt="" />
        <img class="tl__slope sl-lb-2" :src="asset('left-bottom-content-2.png')" alt="" />
        <img class="tl__slope sl-lb-3" :src="asset('left-bottom-content-3.png')" alt="" />
        <img class="tl__slope sl-lb-4" :src="asset('left-bottom-content-4.png')" alt="" />
        <img class="tl__slope sl-rt-title" :src="asset('right-title.png')" alt="" />
        <img class="tl__slope sl-rt" :src="asset('right-top.png')" alt="" />
        <img class="tl__slope sl-rb" :src="asset('right-bottom.png')" alt="" />
      </div>
    </transition>

    <!-- coating：研究内容 + 技术路线 + 新装备创新点 -->
    <transition name="fade">
      <div v-if="activeId === 'coating' && point?.detail" class="tl__content tl__content--coating">
        <img class="tl__coating ct-top-title" :src="asset('top-title.png')" alt="" />
        <img class="tl__coating ct-top-1" :src="asset('top-1.png')" alt="" />
        <img class="tl__coating ct-top-2" :src="asset('top-2.png')" alt="" />
        <img class="tl__coating ct-top-3" :src="asset('top-3.png')" alt="" />
        <img class="tl__coating ct-bl-title" :src="asset('bottom-left-title.png')" alt="" />
        <img class="tl__coating ct-bl-content" :src="asset('bottom-left-content.png')" alt="" />
        <img class="tl__coating ct-br-title" :src="asset('bottom-right-title.png')" alt="" />
        <img class="tl__coating ct-br-content" :src="asset('bottom-right-content.png')" alt="" />
      </div>
    </transition>

    <!-- concrete：研究内容 + 技术路线 + 新材料创新点 -->
    <transition name="fade">
      <div
        v-if="activeId === 'concrete' && point?.detail"
        class="tl__content tl__content--concrete"
      >
        <img class="tl__concrete cc-top-title" :src="asset('top-title.png')" alt="" />
        <img class="tl__concrete cc-top-1" :src="asset('top-content-1.png')" alt="" />
        <img class="tl__concrete cc-top-2" :src="asset('top-content-2.png')" alt="" />
        <img class="tl__concrete cc-top-3" :src="asset('top-content-3.png')" alt="" />
        <img class="tl__concrete cc-bl-title" :src="asset('bottom-left-title.png')" alt="" />
        <img class="tl__concrete cc-bl-content" :src="asset('bottom-left-content.png')" alt="" />
        <img class="tl__concrete cc-br-title" :src="asset('bottom-right-title.png')" alt="" />
        <img class="tl__concrete cc-br-content" :src="asset('bottom-right-content.png')" alt="" />
      </div>
    </transition>

    <!-- excavation：技术难点 + 研究内容 -->
    <transition name="fade">
      <div
        v-if="activeId === 'excavation' && point?.detail"
        class="tl__content tl__content--excavation"
      >
        <img class="tl__excavation ex-top-title" :src="asset('top-title.png')" alt="" />
        <img class="tl__excavation ex-top-content" :src="asset('top-content.png')" alt="" />
        <img class="tl__excavation ex-top-bg" :src="asset('top-right-bg.png')" alt="" />
        <img class="tl__excavation ex-bottom-title" :src="asset('bottom-title.png')" alt="" />
        <img class="tl__excavation ex-bottom-1" :src="asset('bttom-content-1.png')" alt="" />
        <img class="tl__excavation ex-bottom-2" :src="asset('bttom-content-2.png')" alt="" />
        <img class="tl__excavation ex-bottom-3" :src="asset('bttom-content-3.png')" alt="" />
        <img class="tl__excavation ex-bottom-4" :src="asset('bttom-content-4.png')" alt="" />
        <img class="tl__excavation ex-bottom-5" :src="asset('bttom-content-5.png')" alt="" />
      </div>
    </transition>

    <!-- navigation：研究目标 + 研究课题 + 技术路线 -->
    <transition name="fade">
      <div
        v-if="activeId === 'navigation' && point?.detail"
        class="tl__content tl__content--navigation"
      >
        <img class="tl__navigation nav-lt-title" :src="asset('left-top-title.png')" alt="" />
        <img class="tl__navigation nav-lt-content" :src="asset('left-top-content.png')" alt="" />
        <img class="tl__navigation nav-lb-title" :src="asset('left-bottom-title.png')" alt="" />
        <img class="tl__navigation nav-lb-1" :src="asset('left-bottom-content-1.png')" alt="" />
        <img class="tl__navigation nav-lb-2" :src="asset('left-bottom-content-2.png')" alt="" />
        <img class="tl__navigation nav-lb-3" :src="asset('left-bottom-content-3.png')" alt="" />
        <img class="tl__navigation nav-lb-4" :src="asset('left-bottom-content-4.png')" alt="" />
        <img class="tl__navigation nav-lb-5" :src="asset('left-bottom-content-5.png')" alt="" />
        <img class="tl__navigation nav-rt-title" :src="asset('right-title.png')" alt="" />
        <img class="tl__navigation nav-rt-content" :src="asset('right-content.png')" alt="" />
      </div>
    </transition>

    <!-- turbine：研究内容 -->
    <transition name="fade">
      <div v-if="activeId === 'turbine' && point?.detail" class="tl__content tl__content--turbine">
        <img class="tl__turbine tr-title" :src="asset('title.png')" alt="" />
        <img class="tl__turbine tr-1" :src="asset('content-1.png')" alt="" />
        <img class="tl__turbine tr-2" :src="asset('content-2.png')" alt="" />
      </div>
    </transition>

    <!-- blasting：实施方案 -->
    <transition name="fade">
      <div
        v-if="activeId === 'blasting' && point?.detail"
        class="tl__content tl__content--blasting"
      >
        <img class="tl__blasting bl-title" :src="asset('title.png')" alt="" />
        <img class="tl__blasting bl-ct-title-1" :src="asset('content-title-1.png')" alt="" />
        <img class="tl__blasting bl-ct-1" :src="asset('content-1.png')" alt="" />
        <img class="tl__blasting bl-ct-title-2" :src="asset('content-title-2.png')" alt="" />
        <img class="tl__blasting bl-ct-2" :src="asset('content-2.png')" alt="" />
        <img class="tl__blasting bl-ct-title-3" :src="asset('content-title-3.png')" alt="" />
        <img class="tl__blasting bl-ct-3" :src="asset('content-3.png')" alt="" />
        <img class="tl__blasting bl-video-frame" :src="asset('video-frame.png')" alt="" />
        <div class="tl__blasting bl-video-wrap" @click="toggleVideo">
          <video
            ref="videoRef"
            class="bl-video-player"
            :src="asset('video.mp4')"
            loop
            muted
          ></video>
          <img v-show="isPaused" class="bl-video-pause" :src="asset('play-btn.png')" alt="" />
        </div>
      </div>
    </transition>

    <transition name="fade">
      <div v-if="point && !point.detail" class="tl__placeholder">「{{ point.id }}」内容建设中</div>
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
        top: d.h(274);
        width: d.w(1024);
        height: d.h(96);
      }

      .lt-content {
        left: d.w(161);
        top: d.h(397);
        width: d.w(2093);
        height: d.h(557);
      }

      .lb-title {
        left: d.w(171);
        top: d.h(1032);
        width: d.w(1010);
        height: d.h(96);
      }

      .lb-content {
        left: d.w(170);
        top: d.h(1146);
        width: d.w(2073);
        height: d.h(733);
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

    &--slope {
      display: block;

      .tl__slope {
        position: absolute;
        object-fit: contain;
      }

      .sl-lt-title {
        left: d.w(171);
        top: d.h(183);
        width: d.w(1024);
        height: d.h(96);
      }

      .sl-lt-1 {
        left: d.w(172);
        top: d.h(329);
        width: d.w(2154);
        height: d.h(307);
      }

      .sl-lt-2 {
        left: d.w(172);
        top: d.h(644);
        width: d.w(2154);
        height: d.h(306);
      }

      .sl-lb-title {
        left: d.w(171);
        top: d.h(984);
        width: d.w(1024);
        height: d.h(96);
      }

      .sl-lb-1 {
        left: d.w(135);
        top: d.h(1108);
        width: d.w(1258);
        height: d.h(451);
      }

      .sl-lb-2 {
        left: d.w(135);
        top: d.h(1553);
        width: d.w(1258);
        height: d.h(453);
      }

      .sl-lb-3 {
        left: d.w(1435);
        top: d.h(1108);
        width: d.w(1259);
        height: d.h(451);
      }

      .sl-lb-4 {
        left: d.w(1435);
        top: d.h(1553);
        width: d.w(1259);
        height: d.h(453);
      }

      .sl-rt-title {
        left: d.w(2420);
        top: d.h(184);
        width: d.w(1024);
        height: d.h(96);
      }

      .sl-rt {
        left: d.w(2425);
        top: d.h(309);
        width: d.w(1140);
        height: d.h(678);
      }

      .sl-rb {
        left: d.w(2734);
        top: d.h(1237);
        width: d.w(947);
        height: d.h(680);
      }
    }

    &--coating {
      display: block;

      .tl__coating {
        position: absolute;
        object-fit: contain;
      }

      .ct-top-title {
        left: d.w(171);
        top: d.h(182);
        width: d.w(1024);
        height: d.h(96);
      }

      .ct-top-1 {
        left: d.w(135);
        top: d.h(380);
        width: d.w(1144);
        height: d.h(435);
      }

      .ct-top-2 {
        left: d.w(1289);
        top: d.h(380);
        width: d.w(1152);
        height: d.h(435);
      }

      .ct-top-3 {
        left: d.w(2451);
        top: d.h(380);
        width: d.w(1152);
        height: d.h(435);
      }

      .ct-bl-title {
        left: d.w(171);
        top: d.h(902);
        width: d.w(1024);
        height: d.h(96);
      }

      .ct-bl-content {
        left: d.w(161);
        top: d.h(1074);
        width: d.w(1680);
        height: d.h(867);
      }

      .ct-br-title {
        left: d.w(1898);
        top: d.h(903);
        width: d.w(1024);
        height: d.h(96);
      }

      .ct-br-content {
        left: d.w(1915);
        top: d.h(1074);
        width: d.w(1695);
        height: d.h(867);
      }
    }

    &--concrete {
      display: block;

      .tl__concrete {
        position: absolute;
        object-fit: contain;
      }

      .cc-top-title {
        left: d.w(171);
        top: d.h(187);
        width: d.w(1024);
        height: d.h(96);
      }

      .cc-top-1 {
        left: d.w(134);
        top: d.h(384);
        width: d.w(1124);
        height: d.h(446);
      }

      .cc-top-2 {
        left: d.w(1288);
        top: d.h(384);
        width: d.w(1132);
        height: d.h(446);
      }

      .cc-top-3 {
        left: d.w(2450);
        top: d.h(384);
        width: d.w(1130);
        height: d.h(446);
      }

      .cc-bl-title {
        left: d.w(170);
        top: d.h(907);
        width: d.w(1024);
        height: d.h(96);
      }

      .cc-bl-content {
        left: d.w(157);
        top: d.h(1079);
        width: d.w(1687);
        height: d.h(865);
      }

      .cc-br-title {
        left: d.w(1907);
        top: d.h(907);
        width: d.w(1024);
        height: d.h(96);
      }

      .cc-br-content {
        left: d.w(1922);
        top: d.h(1079);
        width: d.w(1687);
        height: d.h(865);
      }
    }

    &--excavation {
      display: block;

      .tl__excavation {
        position: absolute;
        object-fit: contain;
      }

      .ex-top-title {
        left: d.w(171);
        top: d.h(184);
        width: d.w(1024);
        height: d.h(96);
      }

      .ex-top-content {
        left: d.w(194);
        top: d.h(335);
        width: d.w(2050);
        height: d.h(584);
      }

      .ex-top-bg {
        left: d.w(2428);
        top: d.h(259);
        width: d.w(1076);
        height: d.h(781);
      }

      .ex-bottom-title {
        left: d.w(171);
        top: d.h(984);
        width: d.w(1024);
        height: d.h(96);
      }

      .ex-bottom-1 {
        left: d.w(135);
        top: d.h(1130);
        width: d.w(1258);
        height: d.h(403);
      }

      .ex-bottom-2 {
        left: d.w(1435);
        top: d.h(1130);
        width: d.w(1258);
        height: d.h(403);
      }

      .ex-bottom-3 {
        left: d.w(135);
        top: d.h(1575);
        width: d.w(1258);
        height: d.h(403);
      }

      .ex-bottom-4 {
        left: d.w(1435);
        top: d.h(1576);
        width: d.w(1258);
        height: d.h(403);
      }

      .ex-bottom-5 {
        left: d.w(2791);
        top: d.h(1215);
        width: d.w(815);
        height: d.h(594);
      }
    }

    &--navigation {
      display: block;

      .tl__navigation {
        position: absolute;
        object-fit: contain;
      }

      .nav-lt-title {
        left: d.w(171);
        top: d.h(85);
        width: d.w(1024);
        height: d.h(96);
      }

      .nav-lt-content {
        left: d.w(161);
        top: d.h(229);
        width: d.w(1692);
        height: d.h(412);
      }

      .nav-lb-title {
        left: d.w(171);
        top: d.h(682);
        width: d.w(1024);
        height: d.h(96);
      }

      .nav-lb-1 {
        left: d.w(170);
        top: d.h(862);
        width: d.w(1675);
        height: d.h(466);
      }

      .nav-lb-2 {
        left: d.w(170);
        top: d.h(1408);
        width: d.w(1675);
        height: d.h(466);
      }

      .nav-lb-3 {
        left: d.w(1921);
        top: d.h(820);
        width: d.w(1674);
        height: d.h(400);
      }

      .nav-lb-4 {
        left: d.w(1921);
        top: d.h(1280);
        width: d.w(1674);
        height: d.h(370);
      }

      .nav-lb-5 {
        left: d.w(1921);
        top: d.h(1692);
        width: d.w(1675);
        height: d.h(358);
      }

      .nav-rt-title {
        left: d.w(1964);
        top: d.h(86);
        width: d.w(1024);
        height: d.h(96);
      }

      .nav-rt-content {
        left: d.w(1976);
        top: d.h(253);
        width: d.w(1610);
        height: d.h(374);
      }
    }

    &--turbine {
      display: block;

      .tl__turbine {
        position: absolute;
        object-fit: contain;
      }

      .tr-title {
        left: d.w(170);
        top: d.h(379);
        width: d.w(1024);
        height: d.h(96);
      }

      .tr-1 {
        left: d.w(216);
        top: d.h(587);
        width: d.w(1679);
        height: d.h(1000);
      }

      .tr-2 {
        left: d.w(1945);
        top: d.h(588);
        width: d.w(1676);
        height: d.h(997);
      }
    }

    &--blasting {
      display: block;

      .tl__blasting {
        position: absolute;
        object-fit: contain;
      }

      .bl-title {
        left: d.w(171);
        top: d.h(183);
        width: d.w(1024);
        height: d.h(96);
      }

      .bl-ct-title-1 {
        left: d.w(294);
        top: d.h(423);
        width: d.w(903);
        height: d.h(100);
      }

      .bl-ct-1 {
        left: d.w(219);
        top: d.h(483);
        width: d.w(1054);
        height: d.h(1545);
      }

      .bl-ct-title-2 {
        left: d.w(1471);
        top: d.h(423);
        width: d.w(903);
        height: d.h(100);
      }

      .bl-ct-2 {
        left: d.w(1397);
        top: d.h(483);
        width: d.w(1053);
        height: d.h(1545);
      }

      .bl-ct-title-3 {
        left: d.w(2649);
        top: d.h(423);
        width: d.w(903);
        height: d.h(100);
      }

      .bl-ct-3 {
        left: d.w(2574);
        top: d.h(483);
        width: d.w(1054);
        height: d.h(1545);
      }

      .bl-video-frame {
        left: d.w(2642);
        top: d.h(1150);
        width: d.w(923);
        height: d.h(520);
        z-index: 2;
      }

      .bl-video-wrap {
        left: d.w(2642);
        top: d.h(1150);
        width: d.w(923);
        height: d.h(520);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1;
      }

      .bl-video-player {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }

      .bl-video-pause {
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        width: d.w(187);
        height: d.h(187);
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
