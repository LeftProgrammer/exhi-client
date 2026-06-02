/**
 * 科研创新 - 工程点位配置。
 *
 * 8 个工程点位，每个点位在地图上有一个标记，右侧菜单也有对应按钮。
 * 目前仅「白马大桥」(baima-bridge) 有完整内容素材，其余点位待补充。
 *
 * 素材约定（contents/ 下）：
 *  - 标记图标：buttons/<id>.png（常态）、buttons/<id>-active.png（选中）
 *  - 地点名：  buttons/<id>-name.png
 *  - 点位内容：points/<id>/<screen>/...
 */
/** 工程状态：done=已完成（橙色水滴）、ongoing=进行中（蓝色菱形） */
export type PointStatus = 'done' | 'ongoing'

export interface ResearchPoint {
  /** 英文 id，用于素材路径与同步消息 */
  id: string
  /** 中文名 */
  name: string
  /** 是否已有完整内容素材 */
  hasContent: boolean
  /** 工程状态（决定地图标记颜色） */
  status: PointStatus
  /** 地图标记位置（占比 %，相对 3840x2160 全景图，锚点为水滴尖部） */
  map: { top: number; left: number }
}

export const POINTS: ResearchPoint[] = [
  {
    id: 'baima-bridge',
    name: '白马大桥',
    hasContent: true,
    status: 'done',
    map: { top: 40, left: 7 }
  },
  {
    id: 'excavation',
    name: '绿色开挖料',
    hasContent: false,
    status: 'done',
    map: { top: 33, left: 25 }
  },
  {
    id: 'slope',
    name: '高边坡建模',
    hasContent: false,
    status: 'ongoing',
    map: { top: 30, left: 34 }
  },
  {
    id: 'navigation',
    name: '急弯通航',
    hasContent: false,
    status: 'ongoing',
    map: { top: 50, left: 39 }
  },
  {
    id: 'concrete',
    name: '抗冲磨混凝土',
    hasContent: false,
    status: 'done',
    map: { top: 27, left: 48 }
  },
  {
    id: 'coating',
    name: '聚脲涂层',
    hasContent: false,
    status: 'ongoing',
    map: { top: 22, left: 60 }
  },
  {
    id: 'turbine',
    name: '水轮机',
    hasContent: false,
    status: 'ongoing',
    map: { top: 43, left: 73 }
  },
  {
    id: 'blasting',
    name: '旧桥爆破',
    hasContent: false,
    status: 'done',
    map: { top: 86, left: 62 }
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
