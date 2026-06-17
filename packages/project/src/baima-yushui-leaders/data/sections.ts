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
  contentBgColor: 'transparent',
  categories: [
    {
      id: '1',
      entries: [
        {
          id: 'ldr-2023-01',
          image: 'leader/gallery/1/ldr-2023-01.png',
          caption: '2023年11月15日，中共中央政治局常委，全国人大常委会委员长赵乐际到白马枢纽工程现场调研。'
        },
        {
          id: 'ldr-2023-02',
          image: 'leader/gallery/1/ldr-2023-02.jpeg',
          caption: '2023年1月10日，高速集团董事长滕英明进工地宣讲党的二十大精神，慰问工程建设者。'
        },
        {
          id: 'ldr-2023-03',
          image: 'leader/gallery/1/ldr-2023-03.jpeg',
          caption: '2023年3月28日，重庆市发改委副主任范立新带队调研乌江白马航电枢纽工程建设。'
        },
        {
          id: 'ldr-2023-04',
          image: 'leader/gallery/1/ldr-2023-04.jpeg',
          caption: '2023年7月6日，区委书记何庆调研工程左岸螃蟹溪渣场大窝凼（排水干涵K1+117~K1+320段）滑坡现场。'
        },
        {
          id: 'ldr-2023-05',
          image: 'leader/gallery/1/ldr-2023-05.jpeg',
          caption: '2023年7月24日，白马航电枢纽工程接受交通运输部水运局检查。'
        },
        {
          id: 'ldr-2023-06',
          image: 'leader/gallery/1/ldr-2023-06.jpeg',
          caption: '2024年3月8日，重庆市副市长郑向东调研乌江白马航电枢纽工程建设。'
        },
        {
          id: 'ldr-2023-07',
          image: 'leader/gallery/1/ldr-2023-07.jpeg',
          caption: '2024年3月12日，长江委水旱灾害防御局副局长郑静一行调研乌江白马航电枢纽工程建设。'
        },
        {
          id: 'ldr-2023-08',
          image: 'leader/gallery/1/ldr-2023-08.jpeg',
          caption: '2024年3月25日，武隆区纪委书记蒋孟轩深化推进白马航电枢纽"组地企"廉洁共建。'
        },
        {
          id: 'ldr-2023-09',
          image: 'leader/gallery/1/ldr-2023-09.jpeg',
          caption: '2024年3月27日，市交通运输综合行政执法总队工程质量监督支队纪委书记丁玮到白马航电枢纽工程交流廉洁共建工作。'
        },
        {
          id: 'ldr-2023-10',
          image: 'leader/gallery/1/ldr-2023-10.jpeg',
          caption: '2024年3月27日，航发集团总经理蒋江松指导白马航电枢纽工程建设工作。'
        },
        {
          id: 'ldr-2023-11',
          image: 'leader/gallery/1/ldr-2023-11.jpeg',
          caption: '2024年4月18日，航发集团董事长廖劲松调研指导白马航电枢纽工程建设。'
        },
        {
          id: 'ldr-2023-12',
          image: 'leader/gallery/1/ldr-2023-12.jpeg',
          caption: '2024年4月19日，自然资源部用途管制司副司长韩石调研乌江白马航电枢纽工程建设用地情况。'
        },
        {
          id: 'ldr-2023-13',
          image: 'leader/gallery/1/ldr-2023-13.jpeg',
          caption: '2024年5月9日，航发集团副总经理吴四飞在乌江白马枢纽工程开展工作调研。'
        }
      ]
    },
    {
      id: '2',
      entries: [
        {
          id: 'ldr-2025-01',
          image: 'leader/gallery/2/ldr-2025-01.jpeg',
          caption: '2025年7月15日，重庆市委国安办常务副主任马奇柯带队调研白马航电枢纽工程建设工作。'
        },
        {
          id: 'ldr-2025-02',
          image: 'leader/gallery/2/ldr-2025-02.jpeg',
          caption: '2025年7月16日，重庆市规资局用地事务中心主任傅继明带队调研白马航电枢纽项目建设工作。'
        },
        {
          id: 'ldr-2025-03',
          image: 'leader/gallery/2/ldr-2025-03.jpeg',
          caption: '2025年7月24日，重庆市交通运输委员会副主任陈永忠率队调研白马航电枢纽工程建设。'
        },
        {
          id: 'ldr-2025-04',
          image: 'leader/gallery/2/ldr-2025-04.jpeg',
          caption: '2025年7月24日，航发集团董事长廖劲松指导乌江白马航电枢纽工程建设工作。'
        },
        {
          id: 'ldr-2025-05',
          image: 'leader/gallery/2/ldr-2025-05.jpeg',
          caption: '2025年8月22日，航发集团副总经理杨桥培带队到白马航电枢纽现场开展汛期安全专项检查。'
        },
        {
          id: 'ldr-2025-06',
          image: 'leader/gallery/2/ldr-2025-06.jpeg',
          caption: '2025年10月16日，高速集团董事长周业军调研白马航电枢纽。'
        },
        {
          id: 'ldr-2025-07',
          image: 'leader/gallery/2/ldr-2025-07.jpeg',
          caption: '2025年10月28日，航发集团副总经理杨桥培带队到白马航电枢纽工程开展安全督导。'
        },
        {
          id: 'ldr-2025-08',
          image: 'leader/gallery/2/ldr-2025-08.jpeg',
          caption: '2025年11月28日，武隆区政府党组书记、代理区长魏兴贵调研白马航电枢纽工程建设工作。'
        },
        {
          id: 'ldr-2025-09',
          image: 'leader/gallery/2/ldr-2025-09.png',
          caption: '2026年1月14日，市质监支队党委书记、支队长王兵开展专题党课。'
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
