<script setup lang="ts">
import { useRouter } from 'vue-router'
import SecondaryPage from '../components/SecondaryPage.vue'

const props = defineProps<{ title: string }>()
const router = useRouter()

function goHome() { router.push({ name: 'home' }) }
function goPrev() { router.go(-1) }
function goNext() { router.go(1) }
</script>

<template>
  <SecondaryPage>
    <template #header>
      <h1 class="placeholder__title">{{ props.title }}</h1>
    </template>

    <div class="placeholder__body">
      <p class="placeholder__hint">内容建设中</p>

      <nav class="placeholder__nav">
        <button class="placeholder__nav-btn" @click="goPrev">上一页</button>
        <button class="placeholder__nav-btn" @click="goNext">下一页</button>
        <button class="placeholder__nav-btn placeholder__nav-btn--home" @click="goHome">首页</button>
      </nav>
    </div>
  </SecondaryPage>
</template>

<style scoped lang="scss">
.placeholder__title {
  font-size: 3.5vw;
  font-weight: 700;
  color: #7ee8ff;
  letter-spacing: 0.12em;
  text-shadow: 0 0 20px rgba(80, 200, 255, 0.6);
}

.placeholder__body {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 4vh;
  color: #fff;
}

.placeholder__hint {
  font-size: 2vw;
  opacity: 0.5;
}

.placeholder__nav {
  display: flex;
  gap: 1.5vw;
}

.placeholder__nav-btn {
  padding: 1vh 2vw;
  background: rgba(80, 200, 255, 0.12);
  border: 1px solid rgba(80, 200, 255, 0.35);
  border-radius: 4px;
  color: #fff;
  font-size: 1.4vw;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;

  &:hover {
    background: rgba(80, 200, 255, 0.28);
    border-color: rgba(80, 200, 255, 0.75);
  }

  &--home {
    background: rgba(80, 200, 255, 0.22);
  }
}
</style>
