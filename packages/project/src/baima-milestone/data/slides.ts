/**
 * 里程碑滑轨屏幻灯片数据。
 *
 * 每张幻灯片对应一个竖屏展示面板。
 * 无交互，内容纯展示——由运行时指令或自动轮播驱动。
 *
 * 资源约定：
 *  - 图片放 contents/slides/<id>.png 下，src 写相对路径
 *  - 视频放 contents/slides/<id>.mp4
 *  - 暂用 placeholder 标记未到位资源
 */

export interface Slide {
  id: string
  /** 背景图（全屏覆盖），相对 contents/ 的路径 */
  bg?: string
  /** 背景视频（循环播放），优先级高于 bg */
  bgVideo?: string
  /** 占位时的提示 */
  placeholder?: string
}

export const slides: Slide[] = [
  {
    id: 'slide-01',
    bg: 'slides/slide-01.png',
    placeholder: '参建单位·科学组织（内容团队补充）'
  },
  {
    id: 'slide-02',
    bg: 'slides/slide-02.png',
    placeholder: '筹建期·里程碑时间线（内容团队补充）'
  },
  {
    id: 'slide-03',
    bg: 'slides/slide-03.png',
    placeholder: '第三面板（内容团队补充）'
  }
]
