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

export const IDLE_MS = 20_000
export const STAGGER_MS = 300
export const SCROLL_HOLD_MS = 10_000
