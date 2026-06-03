/**
 * 科研创新 - 工程点位配置。
 *
 * 8 个工程点位，每个点位在地图上有一个标记，右侧菜单也有对应按钮。
 * 目前仅「白马大桥」(baima-bridge) 有完整内容素材，其余点位待补充。
 *
 * 素材约定（contents/ 下）：
 *  - 标记图标：buttons/<id>.png（常态）、buttons/<id>-active.png（选中）
 *  - 地点名：  buttons/<id>-name.png
 *  - 状态按钮：buttons/done.png、buttons/ongoing.png
 *  - 点位内容：points/<id>/<screen>/...
 */
/** 工程状态：done=已完成（橙色水滴）、ongoing=进行中（蓝色菱形） */
export type PointStatus = 'done' | 'ongoing'

export interface Layout {
  top: number
  left: number
  width: number
  height: number
}

export interface ResearchPoint {
  /** 英文 id，用于素材路径、同步消息与 labels/ 图片文件名 */
  id: string
  /** 是否已有完整内容素材 */
  hasContent: boolean
  /** 工程状态（决定地图标记颜色） */
  status: PointStatus
  /** 头部文字图片位置（设计稿原始像素，相对 3840×2160） */
  map: { top: number; left: number }
  /** 主屏详情三张子图的位置与大小（设计稿原始像素） */
  detail?: {
    zoom: Layout
    desc?: Layout
    project: Layout
    /** 科研需求图（部分点位有） */
    needs?: Layout
  }
  /** 各屏幕的文件列表（如 bottom-left 的相册图片） */
  images?: Record<string, string[][]>
}

export const POINTS: ResearchPoint[] = [
  {
    id: 'baima-bridge',
    hasContent: true,
    status: 'done',
    map: { top: 757, left: 138 },
    detail: {
      zoom: { top: 688, left: 0, width: 505, height: 515 },
      desc: { top: 167, left: 519, width: 1295, height: 950 },
      project: { top: 1495, left: 154, width: 1453, height: 375 }
    }
  },
  {
    id: 'excavation',
    hasContent: false,
    status: 'done',
    map: { top: 634, left: 891 }
  },
  {
    id: 'slope',
    hasContent: true,
    status: 'ongoing',
    map: { top: 634, left: 1255 },
    detail: {
      zoom: { top: 565, left: 1109, width: 513, height: 514 },
      desc: { top: 946, left: 385, width: 962, height: 599 },
      project: { top: 239, left: 161, width: 1009, height: 359 },
      needs: { top: 276, left: 1966, width: 995, height: 1341 }
    }
  },
  {
    id: 'navigation',
    hasContent: false,
    status: 'ongoing',
    map: { top: 1019, left: 1497 }
  },
  {
    id: 'concrete',
    hasContent: false,
    status: 'ongoing',
    map: { top: 572, left: 1933 }
  },
  {
    id: 'coating',
    hasContent: true,
    status: 'ongoing',
    map: { top: 439, left: 2220 },
    detail: {
      zoom: { top: 1200, left: 100, width: 800, height: 800 },
      needs: { top: 150, left: 100, width: 1500, height: 1700 },
      project: { top: 450, left: 1700, width: 1000, height: 1200 }
    },
    images: {
      'bottom-left': [
        ['files/file-1-1.png'],
        ['files/file-2-1.png', 'files/file-2-2.png'],
        ['files/file-3-1.png', 'files/file-3-2.png', 'files/file-3-3.png', 'files/file-3-4.png']
      ]
    }
  },
  {
    id: 'turbine',
    hasContent: false,
    status: 'ongoing',
    map: { top: 915, left: 2814 }
  },
  {
    id: 'blasting',
    hasContent: false,
    status: 'done',
    map: { top: 1877, left: 2381 }
  }
]

/** 右侧导航菜单顺序（自上而下，对应设计稿） */
export const MENU_ORDER = [
  'excavation',
  'navigation',
  'coating',
  'concrete',
  'slope',
  'baima-bridge',
  'blasting',
  'turbine'
]

export const MENU_POINTS = MENU_ORDER.map((id) => POINTS.find((p) => p.id === id)!).filter(Boolean)

export function getPoint(id: string | null): ResearchPoint | undefined {
  return POINTS.find((p) => p.id === id)
}
