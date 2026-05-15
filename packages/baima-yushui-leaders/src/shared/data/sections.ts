/**
 * 渝水新景 + 领导关怀 内容数据。
 *
 * 结构：两大主题 → 各自的分类 → 各分类下的条目（图文 / 视频）。
 *
 * 暂用占位（图片用 SVG / 视频引用 contents/，文案为示意）。
 * 内容团队交付后，按这个数据结构替换 entries 数组即可。
 *
 * 资源引用约定：
 *  - 图片 / 视频 → 放 contents/<theme>/<category>/ 下，src 写相对路径
 *  - 暂未到位的资源用 'placeholder' 标记，渲染层显示占位 UI
 */

export type SectionId = 'yushui' | 'leaders'

export interface CategoryEntry {
  /** 条目唯一 id（用于路由/key） */
  id: string
  /** 标题（≤24 字） */
  title: string
  /** 副标题 / 时间 / 出处（可选） */
  caption?: string
  /** 正文段落（可多段） */
  body?: string[]
  /** 主图，相对项目包 contents/ 的路径；缺则用 placeholder */
  image?: string
  /** 视频（如有），相对路径；和 image 二选一 */
  video?: string
  /** 占位时的等待提示 */
  placeholder?: string
}

export interface Category {
  id: string
  title: string
  /** 侧边/卡片简短描述（≤30 字） */
  intro?: string
  entries: CategoryEntry[]
}

export interface Section {
  id: SectionId
  title: string
  subtitle: string
  /** 顶部 banner 装饰文案，例如 "和美乌江 福泽渝黔" */
  banner: string
  /** 卡片占位图（一级首页用） */
  cardImage?: string
  categories: Category[]
}

// ============ 渝水新景 ============
const yushui: Section = {
  id: 'yushui',
  title: '渝水新景',
  subtitle: 'YU SHUI XIN JING',
  banner: '和美乌江 福泽渝黔',
  categories: [
    {
      id: 'environment',
      title: '生态环境',
      intro: '办公生活景观、生态护坡、库区风景、交通道路',
      entries: [
        {
          id: 'env-01',
          title: '生态护坡美景',
          caption: '乌江白马段·生态修复成果',
          body: [
            '工程在建设过程中坚持生态优先，采用生态护坡技术，',
            '使施工岸线与自然景观和谐相融，呈现绿水青山的画面。'
          ],
          placeholder: '生态护坡照片（内容团队补充）'
        },
        {
          id: 'env-02',
          title: '办公生活景观',
          caption: '项目部园区',
          placeholder: '园区/办公生活照片'
        },
        {
          id: 'env-03',
          title: '库区风景',
          caption: '清晨的乌江',
          placeholder: '库区航拍照片'
        },
        {
          id: 'env-04',
          title: '交通道路景观',
          caption: '配套工程',
          placeholder: '配套道路照片'
        }
      ]
    },
    {
      id: 'services',
      title: '便民设施',
      intro: '航标导标、过江桥梁、服务区、停车区、收费站、锚泊区',
      entries: [
        {
          id: 'svc-01',
          title: '航标导标设施',
          caption: '现代化助航系统',
          placeholder: '航标照片'
        },
        {
          id: 'svc-02',
          title: '过江桥梁',
          caption: '白马乌江大桥',
          placeholder: '大桥照片'
        },
        {
          id: 'svc-03',
          title: '服务区 / 停车区',
          caption: '便民设施齐全',
          placeholder: '服务区照片'
        },
        {
          id: 'svc-04',
          title: '锚泊区',
          caption: '船只锚泊配套',
          placeholder: '锚泊区照片'
        }
      ]
    },
    {
      id: 'culture',
      title: '水运文旅',
      intro: '水清岸绿、水运繁忙、项目周边文化景观',
      entries: [
        {
          id: 'cul-01',
          title: '水清岸绿',
          caption: '竣工后的美丽画卷',
          placeholder: '美景照片'
        },
        {
          id: 'cul-02',
          title: '水运繁忙',
          caption: '船只通行场景',
          placeholder: '船只航行照片'
        },
        {
          id: 'cul-03',
          title: '文化景观',
          caption: '项目周边文化遗产',
          placeholder: '文化景观照片'
        }
      ]
    }
  ]
}

// ============ 领导关怀 ============
const leaders: Section = {
  id: 'leaders',
  title: '领导关怀',
  subtitle: 'LING DAO GUAN HUAI',
  banner: '情系白马 力通江海',
  categories: [
    {
      id: 'national',
      title: '国家级',
      intro: '中央领导视察记录',
      entries: [
        {
          id: 'nat-01',
          title: '中央领导视察白马枢纽',
          caption: '2023 年 11 月 15 日',
          body: [
            '中共中央政治局常委、全国人大常委会委员长赵乐际同志',
            '到白马航电枢纽工程现场调研，了解工程建设进展。'
          ],
          placeholder: '视察照片（来源：CCTV1 新闻联播）'
        },
        {
          id: 'nat-02',
          title: '国务院领导调研',
          caption: '2024 年',
          placeholder: '调研照片'
        }
      ]
    },
    {
      id: 'provincial',
      title: '市级',
      intro: '重庆市领导关怀记录',
      entries: [
        {
          id: 'pro-01',
          title: '市委领导视察',
          caption: '2024 年春',
          placeholder: '市领导视察照片'
        },
        {
          id: 'pro-02',
          title: '市政府工作调研',
          caption: '2024 年夏',
          placeholder: '调研照片'
        }
      ]
    },
    {
      id: 'corporate',
      title: '企业级',
      intro: '集团及兄弟单位调研',
      entries: [
        {
          id: 'cor-01',
          title: '集团董事长视察',
          caption: '2024 年',
          placeholder: '视察照片'
        },
        {
          id: 'cor-02',
          title: '兄弟单位调研交流',
          caption: '2024 年',
          placeholder: '调研交流照片'
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
