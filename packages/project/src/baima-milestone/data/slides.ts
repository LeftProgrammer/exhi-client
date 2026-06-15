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
