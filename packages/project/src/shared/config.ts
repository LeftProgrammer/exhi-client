/**
 * 展厅项目通用时间配置。
 *
 * 各项目可按需修改，集中在一处方便统一管理。
 */

/** 全局无操作超时后自动回首页（毫秒）。默认 5 分钟。 */
export const IDLE_RESET_MS = 300_000

/** 自动轮播单张停留时间（毫秒）。 */
export const AUTOPLAY_INTERVAL_MS = 6_000

/** 轮播被用户/中控暂停后，空闲多久自动恢复（毫秒）。 */
export const AUTOPLAY_RESUME_MS = 20_000
