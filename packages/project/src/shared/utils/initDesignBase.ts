/**
 * 在应用入口注入 designBase CSS 变量。
 * 与 displays.json 的 designBase 保持一致。
 */
export function initDesignBase(w: number, h: number) {
  document.documentElement.style.setProperty('--design-w', String(w))
  document.documentElement.style.setProperty('--design-h', String(h))
}
