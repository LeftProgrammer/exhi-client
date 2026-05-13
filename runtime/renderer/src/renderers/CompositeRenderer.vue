<script setup lang="ts">
import { computed } from 'vue'
import type { CompositeScene } from '@shared/types'
import { resolveRenderer } from './registry'

const props = defineProps<{ scene: CompositeScene }>()

const layout = computed(() => props.scene.layout ?? 'stack')

interface Child {
  comp: ReturnType<typeof resolveRenderer>
  scene: CompositeScene['children'][number]
  idx: number
}

const children = computed<Child[]>(() =>
  props.scene.children.map((c, idx) => ({
    comp: resolveRenderer(c.type),
    scene: c,
    idx
  }))
)
</script>

<template>
  <div class="composite" :class="`composite--${layout}`">
    <div
      v-for="child in children"
      :key="child.idx"
      class="composite__child"
      :class="`composite__child--${layout}`"
    >
      <component v-if="child.comp" :is="child.comp" :scene="child.scene" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.composite {
  position: relative;
  width: 100%;
  height: 100%;

  // stack：所有子层叠加（z-index 顺序按数组顺序）
  &--stack {
    .composite__child--stack {
      position: absolute;
      inset: 0;
    }
  }

  // row：横向均分
  &--row {
    display: flex;
    flex-direction: row;
    .composite__child--row {
      flex: 1;
      position: relative;
      overflow: hidden;
    }
  }

  // column：纵向均分
  &--column {
    display: flex;
    flex-direction: column;
    .composite__child--column {
      flex: 1;
      position: relative;
      overflow: hidden;
    }
  }

  // grid：自动 2x2（更多自定义可后续扩展）
  &--grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 1fr;
    .composite__child--grid {
      position: relative;
      overflow: hidden;
    }
  }
}
</style>
