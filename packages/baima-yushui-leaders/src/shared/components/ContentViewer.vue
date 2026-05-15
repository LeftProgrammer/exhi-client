<script setup lang="ts">
import { computed } from 'vue'
import type { CategoryEntry } from '@shared/data/sections'
import { resolvePkgUrl } from '@shared/utils/url'

const props = defineProps<{ entry: CategoryEntry }>()

const mediaUrl = computed(() => {
  if (props.entry.video) return resolvePkgUrl(props.entry.video)
  if (props.entry.image) return resolvePkgUrl(props.entry.image)
  return null
})
const isVideo = computed(() => !!props.entry.video)
</script>

<template>
  <article class="viewer" :key="entry.id">
    <!-- 媒体区 -->
    <div class="viewer__media">
      <template v-if="mediaUrl && isVideo">
        <video
          class="viewer__video"
          :src="mediaUrl"
          autoplay
          muted
          loop
          playsinline
          @contextmenu.prevent
        />
      </template>
      <template v-else-if="mediaUrl">
        <img class="viewer__image" :src="mediaUrl" :alt="entry.title" />
      </template>
      <template v-else>
        <div class="viewer__placeholder">
          <span class="viewer__placeholder-icon">📷</span>
          <p>{{ entry.placeholder ?? '资源待补充' }}</p>
        </div>
      </template>
    </div>

    <!-- 文案区 -->
    <div class="viewer__text">
      <div class="viewer__head">
        <h2 class="viewer__title">{{ entry.title }}</h2>
        <p v-if="entry.caption" class="viewer__caption">{{ entry.caption }}</p>
      </div>
      <div v-if="entry.body?.length" class="viewer__body">
        <p v-for="(p, i) in entry.body" :key="i">{{ p }}</p>
      </div>
    </div>
  </article>
</template>

<style scoped lang="scss">
@use '@shared/styles/tokens' as t;

.viewer {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: t.$space-md;
  animation: fade-in t.$dur-page t.$ease-base both;
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ===== 媒体区 ===== */
.viewer__media {
  position: relative;
  flex: 1 1 70%;
  min-height: 0;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid t.$color-border-soft;
  border-radius: t.$radius-md;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;

  /* 内侧光晕 */
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    box-shadow: inset 0 0 40px rgba(0, 229, 212, 0.12);
  }
}

.viewer__image,
.viewer__video {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.viewer__placeholder {
  text-align: center;
  color: t.$color-text-muted;
  padding: t.$space-xl;

  &-icon {
    font-size: 8vh;
    display: block;
    margin-bottom: t.$space-md;
    opacity: 0.4;
  }

  p {
    font-size: t.$fs-h3;
    letter-spacing: 0.15em;
    opacity: 0.6;
  }
}

/* ===== 文案 ===== */
.viewer__text {
  flex: 0 0 auto;
  padding: 0 t.$space-md;
}

.viewer__head {
  display: flex;
  align-items: baseline;
  gap: t.$space-md;
  margin-bottom: t.$space-sm;
}

.viewer__title {
  font-size: t.$fs-h1;
  font-weight: t.$fw-medium;
  color: t.$color-text-primary;
  letter-spacing: 0.1em;
  margin: 0;
}

.viewer__caption {
  font-size: t.$fs-body;
  color: t.$color-accent;
  letter-spacing: 0.2em;
}

.viewer__body {
  font-size: t.$fs-body;
  color: t.$color-text-secondary;
  line-height: 1.8;
  letter-spacing: 0.05em;

  p {
    margin: 0 0 t.$space-xs;
  }
}
</style>
