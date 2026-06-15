export interface SlideConfig {
  id: string
  label: string
}

export const slides: SlideConfig[] = [
  { id: 'page1', label: '参建单位·科学组织' },
  { id: 'page2', label: '筹建期' },
  { id: 'page3', label: '第一阶段' },
  { id: 'page4', label: '第二阶段' },
  { id: 'page5', label: '第三阶段' }
]

/** 时间线卡片配置（相对 contents/ 的路径 + 设计稿尺寸 + dot 位置） */
export interface EntryConfig {
  src: string
  width: number
  height: number
  dotX: number
  dotY: number
  dotSize: number
}

export const page2Entries: EntryConfig[] = Array.from({ length: 10 }, (_, i) => ({
  src: `page2/entry-${String(i + 1).padStart(2, '0')}.png`,
  width: 1670,
  height: 652,
  dotX: 80,
  dotY: 170,
  dotSize: 70
}))

export const page3Entries: EntryConfig[] = Array.from({ length: 8 }, (_, i) => ({
  src: `page3/entry-${String(i + 1).padStart(2, '0')}.png`,
  width: 1670,
  height: 744,
  dotX: 80,
  dotY: 64,
  dotSize: 70
}))

export const page4Entries: EntryConfig[] = Array.from({ length: 4 }, (_, i) => ({
  src: `page4/entry-${String(i + 1).padStart(2, '0')}.png`,
  width: 1670,
  height: 340,
  dotX: 80,
  dotY: 64,
  dotSize: 70
}))

export const page5Entries: EntryConfig[] = [
  { src: 'page5/entry-01.png', width: 1670, height: 340, dotX: 80, dotY: 64, dotSize: 70 },
  { src: 'page5/entry-02.png', width: 1670, height: 340, dotX: 80, dotY: 64, dotSize: 70 },
  { src: 'page5/entry-03.png', width: 1670, height: 340, dotX: 80, dotY: 64, dotSize: 70 },
  { src: 'page5/entry-04.png', width: 1670, height: 1174, dotX: 80, dotY: 64, dotSize: 70 }
]

/** 无操作多少毫秒后回到首页（一级待机） */
export const IDLE_MS = 20_000

/**
 * 自动滚动「停顿时长」：安排滚动后，再静止多少毫秒才真正开始滚动。
 * 给用户一个静止阅读的瞬间。
 */
export const SCROLL_HOLD_MS = 1_000

/**
 * 自动滚动「起算时刻」默认值（秒）：从页面入场动画开始算起，固定多少秒后安排自动滚动。
 *
 * 采用「绝对时刻」而非「入场结束后」，目的是与行数 / 数据量解耦——
 * 首屏可见的前几行此时已入场完，后续行随滚动进入视口时再补入即可。
 * 这样无论页面有多少条数据，滚动启动时刻恒定，不会数据越多等越久。
 *
 * 各页面默认用此值；特殊页面（入场更慢 / 首屏行数更多）可在自己的组件里
 * 用局部常量覆盖，传入更大的值即可。
 *
 * 注意：别设太小（如 0.5s），否则首屏第一行还在滑入时就开始滚动，观感会乱。
 */
export const SCROLL_ARM_AT = 1.8
