/**
 * 渝水新景 + 领导关怀 项目控制配置。
 * 从 @shared/config 独立出来，便于本项目单独调整。
 */

/** 全局无操作超时后自动回首页（毫秒）。 */
export const IDLE_RESET_MS = 300_000

/** 自动轮播单张停留时间（毫秒）。 */
export const AUTOPLAY_INTERVAL_MS = 6_000

/** 分类切换后内容框脉冲锁定时间（毫秒），与 CSS 过渡匹配 */
export const CATEGORY_SWITCH_LOCK_MS = 600

/** 离场返回首页动画时长（毫秒） */
export const PAGE_LEAVE_DURATION_MS = 500
