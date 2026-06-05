/**
 * 渝水新景 + 领导关怀 内容数据。
 *
 * 结构：两大主题 → 各自的分类 → 各分类下的条目（图文）。
 * 内容团队交付后，按此数据结构替换 entries 数组即可。
 */

export type SectionId = 'yushui' | 'leaders'

export interface CategoryEntry {
  /** 条目唯一 id（用于路由/key） */
  id: string
  /** 标题（≤24 字，纯图片展示时可省略） */
  title?: string
  /** 副标题 / 时间 / 出处（可选，用于底部文案） */
  caption?: string
  /** 主图，相对项目包 contents/ 的路径 */
  image?: string
}

export interface Category {
  id: string
  /** 分类标题（有右侧菜单时展示，纯图模式可省略） */
  title?: string
  entries: CategoryEntry[]
}

export interface Section {
  id: SectionId
  /** 顶部装饰文案（banner 用图片时可选留空） */
  tagline?: string
  /** banner 底图路径（相对 contents/） */
  bannerFrameImage?: string
  /** banner 标题图路径（相对 contents/） */
  bannerTitleImage?: string
  /** 内容区背景色 */
  contentBgColor?: string
  categories: Category[]
}

// ============ 渝水新景（纯图片轮播，无右侧菜单） ============
const yushui: Section = {
  id: 'yushui',
  bannerFrameImage: 'yushui/header-bg.png',
  bannerTitleImage: 'yushui/header-title.png',
  contentBgColor: '#101b2e',
  categories: [
    {
      id: 'gallery',
      entries: [
        { id: 'yushui-01', image: 'yushui/gallery/1.png' },
        { id: 'yushui-02', image: 'yushui/gallery/2.png' },
        { id: 'yushui-03', image: 'yushui/gallery/3.png' },
        { id: 'yushui-04', image: 'yushui/gallery/4.png' },
        { id: 'yushui-05', image: 'yushui/gallery/5.png' },
        { id: 'yushui-06', image: 'yushui/gallery/6.png' }
      ]
    }
  ]
}

// ============ 领导关怀 ============
const leaders: Section = {
  id: 'leaders',
  bannerFrameImage: 'leader/header-bg.png',
  bannerTitleImage: 'leader/header-title.png',
  contentBgColor: '#003a9a',
  categories: [
    {
      id: '2023',
      entries: [
        {
          id: 'ldr-2023-01',
          caption: '2023 年 11 月 15 日'
        },
        {
          id: 'ldr-2023-02',
          caption: '2023 年'
        }
      ]
    },
    {
      id: '2025',
      entries: [
        {
          id: 'ldr-2025-01',
          caption: '2025 年'
        },
        {
          id: 'ldr-2025-02',
          caption: '2025 年'
        }
      ]
    }
  ]
}

export const sections: Record<SectionId, Section> = {
  yushui,
  leaders
}

export function getSection(id: SectionId): Section {
  return sections[id]
}
