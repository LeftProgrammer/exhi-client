<script setup lang="ts">
import { ref, watch, nextTick, onMounted } from 'vue'
import type { TabDef } from '../data/modules'

const props = defineProps<{
  tabs: TabDef[]
  modelValue: number
}>()

const emit = defineEmits<{ 'update:modelValue': [index: number] }>()

const viewportEl = ref<HTMLElement | null>(null)
const stripEl = ref<HTMLElement | null>(null)
const itemEls = ref<HTMLElement[]>([])
const offset = ref(0)

function setItemRef(el: Element | null, i: number) {
  if (el) itemEls.value[i] = el as HTMLElement
}

/**
 * 选中左移：选中项左缘对齐视口左侧；
 * 但整体滚动量被夹在 [0, 最大可滚动距离]，
 * 因此尾部 tab（或 tab 总宽不足一屏）时停在最右 / 不滚动。
 */
function updateOffset() {
  const vp = viewportEl.value
  const strip = stripEl.value
  const item = itemEls.value[props.modelValue]
  if (!vp || !strip || !item) return
  const maxScroll = Math.max(0, strip.scrollWidth - vp.clientWidth)
  offset.value = Math.min(item.offsetLeft, maxScroll)
}

function select(i: number) {
  emit('update:modelValue', i)
}

watch(
  () => props.modelValue,
  () => nextTick(updateOffset)
)
watch(
  () => props.tabs,
  () => nextTick(updateOffset)
)
onMounted(() => nextTick(updateOffset))
</script>

<template>
  <div ref="viewportEl" class="tabbar">
    <div ref="stripEl" class="tabbar__strip" :style="{ transform: `translateX(${-offset}px)` }">
      <button
        v-for="(t, i) in tabs"
        :key="t.id"
        :ref="(el) => setItemRef(el as Element | null, i)"
        class="tabbar__item"
        :class="{ 'is-active': i === modelValue }"
        @click="select(i)"
      >
        <img :src="i === modelValue ? t.tabActive : t.tab" alt="" />
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.tabbar {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;

  &__strip {
    display: flex;
    align-items: center;
    height: 100%;
    gap: d.w(1);
    transition: transform 0.45s cubic-bezier(0.25, 1, 0.5, 1);
    will-change: transform;
  }

  &__item {
    flex: 0 0 auto;
    height: 100%;
    padding: 0;
    border: none;
    background: none;
    cursor: pointer;
    transition: transform 0.2s ease;

    img {
      display: block;
      height: 100%;
      width: auto;
      object-fit: contain;
    }

    &:active {
      transform: scale(0.97);
    }
  }
}
</style>
