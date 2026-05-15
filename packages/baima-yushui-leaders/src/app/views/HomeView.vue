<script setup lang="ts">
import { useRouter } from 'vue-router'
import EntryCard from '@shared/components/EntryCard.vue'
import { resolvePkgUrl } from '@shared/utils/url'

const router = useRouter()

const bgUrl = resolvePkgUrl('shared/bg-mountain.svg')
const iconYushui = resolvePkgUrl('shared/icon-mountain.svg')
const iconLeaders = resolvePkgUrl('shared/icon-leaders.svg')

function enterSection(sectionId: 'yushui' | 'leaders') {
  router.push({ name: 'section', params: { sectionId } })
}
</script>

<template>
  <main class="home">
    <!-- 背景层（直接走 exhi-pkg:// 协议，不经 Vite 静态资源解析） -->
    <img class="home__bg" :src="bgUrl" alt="" aria-hidden="true" />

    <!-- 顶部 banner -->
    <header class="home__banner">
      <span class="ornament ornament--left" />
      <h1 class="home__title">情系白马 力通江海</h1>
      <span class="ornament ornament--right" />
    </header>

    <!-- 中央两个入口卡片 -->
    <section class="home__cards">
      <EntryCard
        title="渝水新景"
        subtitle="YU SHUI XIN JING"
        :icon-url="iconYushui"
        @enter="enterSection('yushui')"
      />
      <EntryCard
        title="领导关怀"
        subtitle="LING DAO GUAN HUAI"
        :icon-url="iconLeaders"
        @enter="enterSection('leaders')"
      />
    </section>

    <!-- 底部装饰文字 -->
    <footer class="home__footer">
      <span>BAIMA NAVIGATION AND POWER HUB</span>
      <span class="dot">·</span>
      <span>PARTY-BUILDING LEADS</span>
      <span class="dot">·</span>
      <span>CRAFTSMANSHIP BAIMA</span>
    </footer>

    <!-- 角落装饰 -->
    <div class="home__corners">
      <div class="bracket bracket--tl">
        <span class="bracket__h" />
        <span class="bracket__v" />
        <span class="bracket__label">FK-80</span>
        <span class="bracket__sub">BGH</span>
      </div>
      <div class="bracket bracket--tr">
        <span class="bracket__h" />
        <span class="bracket__v" />
      </div>
      <div class="bracket bracket--bl">
        <span class="bracket__h" />
        <span class="bracket__v" />
      </div>
      <div class="bracket bracket--br">
        <span class="bracket__h" />
        <span class="bracket__v" />
      </div>
    </div>
  </main>
</template>

<style scoped lang="scss">
@use '@shared/styles/tokens' as t;
@use '@shared/styles/mixins' as m;

.home {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: t.$color-bg-primary;

  &__bg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    z-index: 0;
    opacity: 0.6;
  }
}

/* ===== Banner ===== */
.home__banner {
  position: relative;
  z-index: 2;
  padding-top: 4vh;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: t.$space-md;
}

.home__title {
  font-size: t.$fs-display;
  font-weight: t.$fw-medium;
  letter-spacing: 0.5em;
  color: t.$color-text-primary;
  text-shadow: 0 0 20px t.$color-accent-glow;
  margin: 0;
}

.ornament {
  width: 24vh;
  height: 2px;
  background: linear-gradient(90deg, transparent 0%, t.$color-accent 50%, transparent 100%);
  position: relative;
  &::before {
    content: '';
    position: absolute;
    top: -4px;
    width: 8px;
    height: 8px;
    background: t.$color-accent;
    transform: rotate(45deg);
    box-shadow: 0 0 10px t.$color-accent-glow;
  }
  &--left::before {
    right: 0;
  }
  &--right::before {
    left: 0;
  }
}

/* ===== 卡片区 ===== */
.home__cards {
  position: relative;
  z-index: 2;
  width: 100%;
  height: calc(100vh - 24vh);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8vw;
  animation: cards-in 1s t.$ease-base both;
}

@keyframes cards-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ===== 底部 ===== */
.home__footer {
  position: absolute;
  bottom: 2.4vh;
  left: 0;
  right: 0;
  text-align: center;
  z-index: 2;
  font-size: t.$fs-small;
  letter-spacing: 0.3em;
  color: t.$color-text-muted;

  .dot {
    margin: 0 t.$space-sm;
    color: t.$color-accent;
  }
}

/* ===== 角落装饰 ===== */
.home__corners {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
}
.bracket {
  position: absolute;
  width: 8vh;
  height: 8vh;

  &__h,
  &__v {
    position: absolute;
    background: t.$color-accent;
    box-shadow: 0 0 6px t.$color-accent-glow;
  }
  &__h {
    width: 100%;
    height: 1px;
  }
  &__v {
    width: 1px;
    height: 100%;
  }

  &__label {
    position: absolute;
    font-size: t.$fs-mini;
    letter-spacing: 0.2em;
    color: t.$color-text-muted;
  }
  &__sub {
    position: absolute;
    font-size: t.$fs-mini;
    letter-spacing: 0.2em;
    color: t.$color-text-muted;
    top: 4vh;
  }

  &--tl {
    top: 2vh;
    left: 2vh;
    .bracket__h {
      top: 0;
      left: 0;
    }
    .bracket__v {
      top: 0;
      left: 0;
    }
    .bracket__label {
      top: 1.5vh;
      left: 1.5vh;
    }
    .bracket__sub {
      top: 5vh;
      left: 1.5vh;
    }
  }
  &--tr {
    top: 2vh;
    right: 2vh;
    .bracket__h {
      top: 0;
      right: 0;
    }
    .bracket__v {
      top: 0;
      right: 0;
    }
  }
  &--bl {
    bottom: 2vh;
    left: 2vh;
    .bracket__h {
      bottom: 0;
      left: 0;
    }
    .bracket__v {
      bottom: 0;
      left: 0;
    }
  }
  &--br {
    bottom: 2vh;
    right: 2vh;
    .bracket__h {
      bottom: 0;
      right: 0;
    }
    .bracket__v {
      bottom: 0;
      right: 0;
    }
  }
}
</style>
