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
  /** 中文名（展示用） */
  name: string
  /** 工程状态（决定地图标记颜色） */
  status: PointStatus
  /** 头部文字图片位置（设计稿原始像素，相对 3840×2160） */
  map: { top: number; left: number }
  /** 主屏详情三张子图的位置与大小（设计稿原始像素） */
  detail?: {
    zoom: Layout
    desc?: Layout
    desc2?: Layout
    desc3?: Layout
    project: Layout
    /** 科研需求图（部分点位有） */
    needs?: Layout
    /** 指线图（所有点位有） */
    guide?: Layout
  }
  /** 各屏幕的文件列表（如 bottom-left 的相册图片） */
  images?: Record<string, string[][]>
}

export const POINTS: ResearchPoint[] = [
  {
    id: 'baima-bridge',
    name: '白马大桥',
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
    name: '绿色开挖料',
    status: 'done',
    map: { top: 634, left: 891 },
    detail: {
      zoom: { top: 565, left: 743, width: 514, height: 514 },
      needs: { top: 123, left: 1650, width: 996, height: 1297 },
      project: { top: 1482, left: 161, width: 956, height: 375 }
    },
    images: {
      'bottom-right': [['files/file-1-1.png'], ['files/file-2-1.png'], ['files/file-2-2.png']]
    }
  },
  {
    id: 'slope',
    name: '高边坡建模',
    status: 'ongoing',
    map: { top: 634, left: 1255 },
    detail: {
      zoom: { top: 565, left: 1109, width: 513, height: 514 },
      desc: { top: 946, left: 385, width: 962, height: 599 },
      project: { top: 239, left: 161, width: 1009, height: 359 },
      needs: { top: 276, left: 1966, width: 995, height: 1341 },
      guide: { top: 485, left: 1370, width: 566, height: 82 }
    }
  },
  {
    id: 'navigation',
    name: '急弯通航',
    status: 'ongoing',
    map: { top: 1019, left: 1497 },
    detail: {
      zoom: { top: 948, left: 1349, width: 515, height: 515 },
      desc: { top: 458, left: 1293, width: 751, height: 397 },
      desc2: { top: 365, left: 316, width: 934, height: 921 },
      desc3: { top: 569, left: 2199, width: 301, height: 243 },
      project: { top: 267, left: 2565, width: 1025, height: 375 },
      guide: { top: 871, left: 1261, width: 321, height: 81 }
    }
  },
  {
    id: 'concrete',
    name: '抗冲磨混凝土',
    status: 'ongoing',
    map: { top: 572, left: 1933 },
    detail: {
      zoom: { top: 502, left: 1785, width: 515, height: 515 },
      needs: { top: 270, left: 480, width: 1071, height: 1535 },
      project: { top: 273, left: 2351, width: 942, height: 375 },
      guide: { top: 925, left: 1565, width: 481, height: 213 }
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
    id: 'coating',
    name: '聚脲涂层',
    status: 'ongoing',
    map: { top: 439, left: 2220 },
    detail: {
      zoom: { top: 502, left: 1785, width: 515, height: 515 },
      needs: { top: 270, left: 480, width: 1071, height: 1535 },
      project: { top: 273, left: 2351, width: 942, height: 375 },
      guide: { top: 925, left: 1565, width: 481, height: 213 }
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
    name: '水轮机',
    status: 'ongoing',
    map: { top: 915, left: 2814 },
    detail: {
      zoom: { top: 846, left: 2667, width: 515, height: 515 },
      desc: { top: 373, left: 2499, width: 667, height: 379 },
      project: { top: 281, left: 161, width: 909, height: 377 },
      needs: { top: 318, left: 1169, width: 1292, height: 1219 },
      guide: { top: 801, left: 2497, width: 429, height: 65 }
    }
  },
  {
    id: 'blasting',
    name: '旧桥爆破',
    status: 'done',
    map: { top: 1877, left: 2381 },
    detail: {
      zoom: { top: 1808, left: 2234, width: 515, height: 352 },
      desc: { top: 1012, left: 1684, width: 731, height: 463 },
      needs: { top: 257, left: 464, width: 1155, height: 1591 },
      project: { top: 595, left: 1650, width: 776, height: 375 },
      guide: { top: 1520, left: 1672, width: 819, height: 304 }
    }
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
