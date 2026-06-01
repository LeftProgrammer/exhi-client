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
  /** 标题（≤24 字） */
  title: string
  /** 副标题 / 时间 / 出处（可选，用于底部文案） */
  caption?: string
  /** 主图，相对项目包 contents/ 的路径 */
  image?: string
}

export interface Category {
  id: string
  title: string
  entries: CategoryEntry[]
}

export interface Section {
  id: SectionId
  /** 顶部装饰文案，例如 "和美乌江 福泽渝黔" */
  tagline: string
  categories: Category[]
}

// ============ 渝水新景 ============
const yushui: Section = {
  id: 'yushui',
  tagline: '和美乌江 福泽渝黔',
  categories: [
    {
      id: 'environment',
      title: '生态环境',
      entries: [
        {
          id: 'env-01',
          title: '生态护坡美景',
          caption: '乌江白马段·生态修复成果',
          image: 'yushui/images/environment/env-01.svg'
        },
        {
          id: 'env-02',
          title: '办公生活景观',
          caption: '项目部园区',
          image: 'yushui/images/environment/env-02.svg'
        },
        {
          id: 'env-03',
          title: '库区风景',
          caption: '清晨的乌江',
          image: 'yushui/images/environment/env-03.svg'
        },
        {
          id: 'env-04',
          title: '交通道路景观',
          caption: '配套工程',
          image: 'yushui/images/environment/env-04.svg'
        }
      ]
    },
    {
      id: 'services',
      title: '便民设施',
      entries: [
        {
          id: 'svc-01',
          title: '航标导标设施',
          caption: '现代化助航系统',
          image: 'yushui/images/services/svc-01.svg'
        },
        {
          id: 'svc-02',
          title: '过江桥梁',
          caption: '白马乌江大桥',
          image: 'yushui/images/services/svc-02.svg'
        },
        {
          id: 'svc-03',
          title: '服务区 / 停车区',
          caption: '便民设施齐全',
          image: 'yushui/images/services/svc-03.svg'
        },
        {
          id: 'svc-04',
          title: '锚泊区',
          caption: '船只锚泊配套',
          image: 'yushui/images/services/svc-04.svg'
        }
      ]
    },
    {
      id: 'culture',
      title: '水运文旅',
      entries: [
        {
          id: 'cul-01',
          title: '水清岸绿',
          caption: '竣工后的美丽画卷',
          image: 'yushui/images/culture/cul-01.svg'
        },
        {
          id: 'cul-02',
          title: '水运繁忙',
          caption: '船只通行场景',
          image: 'yushui/images/culture/cul-02.svg'
        },
        {
          id: 'cul-03',
          title: '文化景观',
          caption: '项目周边文化遗产',
          image: 'yushui/images/culture/cul-03.svg'
        }
      ]
    }
  ]
}

// ============ 领导关怀 ============
const leaders: Section = {
  id: 'leaders',
  tagline: '情系白马 力通江海',
  categories: [
    {
      id: '2023',
      title: '2023',
      entries: [
        {
          id: 'ldr-2023-01',
          title: '中央领导视察白马枢纽',
          caption: '2023 年 11 月 15 日'
        },
        {
          id: 'ldr-2023-02',
          title: '市委领导视察调研',
          caption: '2023 年'
        }
      ]
    },
    {
      id: '2025',
      title: '2025',
      entries: [
        {
          id: 'ldr-2025-01',
          title: '领导关怀慰问',
          caption: '2025 年'
        },
        {
          id: 'ldr-2025-02',
          title: '集团领导调研交流',
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
