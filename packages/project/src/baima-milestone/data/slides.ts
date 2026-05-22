export interface SlideConfig {
  id: string
  label: string
}

export const slides: SlideConfig[] = [
  { id: 'participants', label: '参建单位·科学组织' },
  { id: 'planning', label: '筹建期' },
  { id: 'slide-03', label: '（占位）' },
  { id: 'slide-04', label: '（占位）' },
  { id: 'slide-05', label: '（占位）' }
]

export const IDLE_MS = 20_000
export const STAGGER_MS = 300
export const SCROLL_HOLD_MS = 10_000
