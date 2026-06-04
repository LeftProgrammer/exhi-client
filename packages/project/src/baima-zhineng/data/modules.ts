import { resolvePkgUrl } from '@shared/utils/url'

/**
 * 职能建设 · 数据模型
 *
 * 一级待机页展示 3 个模块入口；点击进入对应二级页面。
 * 二级页面通用：顶部标题（含副标题，按 tab 切换）、中部内容（可多页，上下翻页）、
 * 底部 tab 菜单、右下角首页按钮。各模块仅标题 / 内容 / tab 不同，交互一致。
 *
 * 图文更新：替换 deploy/baima-zhineng/contents/zhineng/ 下对应图片即可；
 * 新增 tab / 页内容时在此文件追加配置。
 */

/** 拼接素材 URL（统一前缀 zhineng/ 避免与其它项目素材冲突） */
const url = (p: string) => resolvePkgUrl(`${p}`)

/** 内容块：每张图独立配置位置与大小（设计稿 px） */
export interface ContentBlock {
  src: string
  left: number
  top: number
  width: number
  height: number
}

/** 单页内容（多张图绝对定位叠放） */
export interface ContentPage {
  blocks: ContentBlock[]
}

/** tab 定义 */
export interface TabDef {
  id: string
  /** tab 常态图 */
  tab: string
  /** tab 选中态图 */
  tabActive: string
  /** 顶部标题图（含主标题 + 该 tab 副标题） */
  title: string
  /** 内容页（可多页，空数组表示内容待补充） */
  pages: ContentPage[]
}

/** 模块定义 */
export interface ModuleDef {
  id: string
  /** 模块名（用于无障碍 / 调试） */
  name: string
  /** 路由 name */
  route: string
  /** 待机页图标（含文字标签） */
  icon: string
  /** 待机页图标布局（设计稿 px） */
  layout: { left: number; top: number; width: number; height: number }
  /** tab 列表 */
  tabs: TabDef[]
}

/** 二级页通用素材 */
export const COMMON = {
  bg: url('common/bg.png'),
  frame: url('common/frame.png'),
  arrowUp: url('common/arrow-up.png'),
  arrowDown: url('common/arrow-down.png'),
  home: url('common/home.png')
}

/** 待机页素材 */
export const HOME = {
  bg: url('home/bg.png'),
  title: url('home/title.png')
}

/** 生成 tab 配置（tab 图按约定 tabs/<id>.png 与 -active.png） */
function makeTab(id: string, title: string, pages: ContentPage[] = []): TabDef {
  return {
    id,
    tab: url(`tabs/${id}.png`),
    tabActive: url(`tabs/${id}-active.png`),
    title,
    pages
  }
}

// ── 制度机制 ──
// 已有素材：tab「工作室管理制度和工作职责」首页（标题 + 上下两段内容）。
// 其余 tab 标题暂复用首个 tab 标题，待补充对应素材后替换。
const ZHIDU_TITLE_GZSGL = url('modules/zhidu/title-gzsgl.png')
const ZHIDU_TITLE_GZZ = url('modules/zhidu/gzz-title.png')
const zhidu: ModuleDef = {
  id: 'zhidu',
  name: '制度机制',
  route: 'zhidu',
  icon: url('home/icon-zhidu.png'),
  layout: { left: 840, top: 930, width: 1193, height: 828 },
  tabs: [
    makeTab('zhidu-gzsgl', ZHIDU_TITLE_GZSGL, [
      {
        blocks: [
          {
            src: url('modules/zhidu/gzsgl-p1-a.png'),
            left: 173,
            top: 1151,
            width: 1814,
            height: 890
          },
          {
            src: url('modules/zhidu/gzsgl-p1-b.png'),
            left: 173,
            top: 2211,
            width: 1814,
            height: 947
          }
        ]
      }
    ]),
    makeTab('zhidu-gzz', ZHIDU_TITLE_GZZ, [
      {
        blocks: [
          {
            src: url('modules/zhidu/gzz-p1-a.png'),
            left: 173,
            top: 1151,
            width: 1814,
            height: 890
          },
          {
            src: url('modules/zhidu/gzz-p1-b.png'),
            left: 173,
            top: 2041,
            width: 1814,
            height: 1117
          }
        ]
      },
      {
        blocks: [
          {
            src: url('modules/zhidu/gzz-p2-a.png'),
            left: 173,
            top: 1151,
            width: 1814,
            height: 890
          },
          {
            src: url('modules/zhidu/gzz-p2-b.png'),
            left: 173,
            top: 2041,
            width: 1814,
            height: 1117
          }
        ]
      }
    ]),
    makeTab('zhidu-rygl', url('modules/zhidu/rygl-title.png'), [
      {
        blocks: [
          {
            src: url('modules/zhidu/rygl-p1-a.png'),
            left: 173,
            top: 1151,
            width: 1814,
            height: 890
          },
          {
            src: url('modules/zhidu/rygl-p1-b.png'),
            left: 173,
            top: 2041,
            width: 1814,
            height: 1117
          }
        ]
      },
      {
        blocks: [
          {
            src: url('modules/zhidu/rygl-p2-a.png'),
            left: 173,
            top: 1151,
            width: 1814,
            height: 890
          },
          {
            src: url('modules/zhidu/rygl-p2-b.png'),
            left: 173,
            top: 2041,
            width: 1814,
            height: 1117
          }
        ]
      },
      {
        blocks: [
          {
            src: url('modules/zhidu/rygl-p3-a.png'),
            left: 173,
            top: 1151,
            width: 1814,
            height: 2007
          }
        ]
      }
    ]),
    makeTab('zhidu-jgcx', url('modules/zhidu/jgcx-title.png'), [
      {
        blocks: [
          {
            src: url('modules/zhidu/jgcx-p1.png'),
            left: 173,
            top: 1151,
            width: 1814,
            height: 2007
          }
        ]
      },
      {
        blocks: [
          {
            src: url('modules/zhidu/jgcx-p2.png'),
            left: 173,
            top: 1151,
            width: 1814,
            height: 2007
          }
        ]
      }
    ]),
    makeTab('zhidu-kjcg', url('modules/zhidu/kjcg-title.png'), [
      {
        blocks: [
          {
            src: url('modules/zhidu/kjcg-p1.png'),
            left: 173,
            top: 1151,
            width: 1814,
            height: 2007
          }
        ]
      }
    ])
  ]
}

// ── 规划安排 ──
// 标题为模块级（副标题固定列出两个 tab）；内容为表格，待补充。
const GUIHUA_TITLE = url('modules/guihua/title.png')
const guihua: ModuleDef = {
  id: 'guihua',
  name: '规划安排',
  route: 'guihua',
  icon: url('home/icon-guihua.png'),
  layout: { left: 85, top: 1673, width: 1193, height: 828 },
  tabs: [
    makeTab('guihua-gzjh', GUIHUA_TITLE, [
      {
        blocks: [
          {
            src: url('modules/zhidu/gzsgl-p1-a.png'),
            left: 173,
            top: 1151,
            width: 1814,
            height: 890
          }
        ]
      }
    ]),
    makeTab('guihua-kygh', GUIHUA_TITLE)
  ]
}

// ── 行动举措 ──
// 已有素材：tab「先锋引领 攻坚克难」首页（两段：标题 + 文字 + 照片墙）。
const XINGDONG_TITLE_XFYL = url('modules/xingdong/title-xfyl.png')
const xingdong: ModuleDef = {
  id: 'xingdong',
  name: '行动举措',
  route: 'xingdong',
  icon: url('home/icon-xingdong.png'),
  layout: { left: 831, top: 2427, width: 1193, height: 828 },
  tabs: [
    makeTab('xingdong-aqhh', XINGDONG_TITLE_XFYL),
    makeTab('xingdong-jnqq', XINGDONG_TITLE_XFYL),
    makeTab('xingdong-kycx', XINGDONG_TITLE_XFYL),
    makeTab('xingdong-ljgj', XINGDONG_TITLE_XFYL),
    makeTab('xingdong-xfyl', XINGDONG_TITLE_XFYL, [
      {
        blocks: [
          {
            src: url('modules/xingdong/xfyl-p1-s1-title.png'),
            left: 450,
            top: 1255,
            width: 1260,
            height: 231
          },
          {
            src: url('modules/xingdong/xfyl-p1-s1-text.png'),
            left: 175,
            top: 1399,
            width: 1812,
            height: 290
          },
          {
            src: url('modules/xingdong/xfyl-p1-s1-img1.png'),
            left: 336,
            top: 1702,
            width: 545,
            height: 363
          },
          {
            src: url('modules/xingdong/xfyl-p1-s1-img2.png'),
            left: 925,
            top: 1702,
            width: 545,
            height: 363
          },
          {
            src: url('modules/xingdong/xfyl-p1-s1-img3.png'),
            left: 1514,
            top: 1702,
            width: 308,
            height: 363
          },
          {
            src: url('modules/xingdong/xfyl-p1-s2-title.png'),
            left: 338,
            top: 2221,
            width: 1485,
            height: 231
          },
          {
            src: url('modules/xingdong/xfyl-p1-s2-text.png'),
            left: 175,
            top: 2351,
            width: 1812,
            height: 290
          },
          {
            src: url('modules/xingdong/xfyl-p1-s2-img1.png'),
            left: 336,
            top: 2609,
            width: 711,
            height: 473
          },
          {
            src: url('modules/xingdong/xfyl-p1-s2-img2.png'),
            left: 1108,
            top: 2609,
            width: 711,
            height: 473
          }
        ]
      }
    ]),
    makeTab('xingdong-xssw', XINGDONG_TITLE_XFYL)
  ]
}

export const MODULES: ModuleDef[] = [zhidu, guihua, xingdong]

export function getModule(route: string): ModuleDef | undefined {
  return MODULES.find((m) => m.route === route)
}
