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
const ZHIDU_TITLE_GZSGL = url('modules/zhidu/gzsgl-title.png')
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
    makeTab('zhidu-gzz', url('modules/zhidu/gzz-title.png'), [
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
const GUIHUA_TITLE = url('modules/guihua/gzjh-title.png')
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
            src: url('modules/guihua/gzjh-p1.png'),
            left: 173,
            top: 1151,
            width: 1814,
            height: 890
          }
        ]
      }
    ]),
    makeTab('guihua-kygh', url('modules/guihua/kygh-title.png'), [
      {
        blocks: [
          {
            src: url('modules/guihua/kygh-p1.png'),
            left: 173,
            top: 1151,
            width: 1814,
            height: 890
          }
        ]
      }
    ])
  ]
}

// ── 行动举措 ──
// 已有素材：tab「先锋引领 攻坚克难」首页（两段：标题 + 文字 + 照片墙）。
const XINGDONG_TITLE_XFYL = url('modules/xingdong/xfyl-title.png')
const xingdong: ModuleDef = {
  id: 'xingdong',
  name: '行动举措',
  route: 'xingdong',
  icon: url('home/icon-xingdong.png'),
  layout: { left: 831, top: 2427, width: 1193, height: 828 },
  tabs: [
    // 先锋引领 攻坚克难 (5)
    makeTab('xingdong-xfyl', XINGDONG_TITLE_XFYL, [
      {
        blocks: [
          { src: url('modules/xingdong/xfyl-01-subtitle.png'), left: 732, top: 1000, width: 696, height: 108 },
          { src: url('modules/xingdong/xfyl-01-1.png'), left: 1, top: 1150, width: 2158, height: 1077 },
          { src: url('modules/xingdong/xfyl-01-2.png'), left: 0, top: 2250, width: 2160, height: 1100 },
          { src: url('modules/xingdong/xfyl-01-3.png'), left: 0, top: 3400, width: 2160, height: 1906 },
          { src: url('modules/xingdong/xfyl-01-4.png'), left: 0, top: 5356, width: 2160, height: 818 },
          { src: url('modules/xingdong/xfyl-01-5.png'), left: 883, top: 1130, width: 394, height: 109 }
        ]
      }
    ]),
    makeTab('xingdong-xfyl-02', XINGDONG_TITLE_XFYL, [
      {
        blocks: [
          { src: url('modules/xingdong/xfyl-02-subtitle.png'), left: 833, top: 1000, width: 494, height: 107 },
          { src: url('modules/xingdong/xfyl-02-subtitle-desc.png'), left: 363, top: 1130, width: 1434, height: 57 },
          { src: url('modules/xingdong/xfyl-02-1.png'), left: 0, top: 1250, width: 2160, height: 2100 },
          { src: url('modules/xingdong/xfyl-02-2.png'), left: 268, top: 3400, width: 1624, height: 965 },
          { src: url('modules/xingdong/xfyl-02-3.png'), left: 306, top: 4415, width: 1548, height: 968 },
          { src: url('modules/xingdong/xfyl-02-4.png'), left: 177, top: 5433, width: 1806, height: 2094 }
        ]
      }
    ]),
    makeTab('xingdong-xfyl-03', XINGDONG_TITLE_XFYL, [
      {
        blocks: [
          { src: url('modules/xingdong/xfyl-03-subtitle.png'), left: 830, top: 1000, width: 500, height: 100 },
          { src: url('modules/xingdong/xfyl-03-1.png'), left: 216, top: 1150, width: 1727, height: 1231 },
          { src: url('modules/xingdong/xfyl-03-2.png'), left: 169, top: 2431, width: 1822, height: 549 },
          { src: url('modules/xingdong/xfyl-03-3.png'), left: 144, top: 3030, width: 1872, height: 1546 },
          { src: url('modules/xingdong/xfyl-03-4.png'), left: 662, top: 4626, width: 835, height: 503 }
        ]
      }
    ]),
    makeTab('xingdong-xfyl-04', XINGDONG_TITLE_XFYL),
    makeTab('xingdong-xfyl-05', XINGDONG_TITLE_XFYL),

    // 学思践悟 书香赋能 (4)
    makeTab('xingdong-xsjw', XINGDONG_TITLE_XFYL),
    makeTab('xingdong-xsjw-02', XINGDONG_TITLE_XFYL),
    makeTab('xingdong-xsjw-03', XINGDONG_TITLE_XFYL),
    makeTab('xingdong-xsjw-04', XINGDONG_TITLE_XFYL),

    // 技能强企 比武竞赛 (4)
    makeTab('xingdong-jnqq', XINGDONG_TITLE_XFYL),
    makeTab('xingdong-jnqq-02', XINGDONG_TITLE_XFYL),
    makeTab('xingdong-jnqq-03', XINGDONG_TITLE_XFYL),
    makeTab('xingdong-jnqq-04', XINGDONG_TITLE_XFYL),

    // 安全护航 廉洁固本 (4)
    makeTab('xingdong-aqhh', XINGDONG_TITLE_XFYL),
    makeTab('xingdong-aqhh-02', XINGDONG_TITLE_XFYL),
    makeTab('xingdong-aqhh-03', XINGDONG_TITLE_XFYL),
    makeTab('xingdong-aqhh-04', XINGDONG_TITLE_XFYL),

    // 联建共建 融合共效 (4)
    makeTab('xingdong-ljgj', XINGDONG_TITLE_XFYL),
    makeTab('xingdong-ljgj-02', XINGDONG_TITLE_XFYL),
    makeTab('xingdong-ljgj-03', XINGDONG_TITLE_XFYL),
    makeTab('xingdong-ljgj-04', XINGDONG_TITLE_XFYL),

    // 科研创新 数字赋能 (3)
    makeTab('xingdong-kycx', XINGDONG_TITLE_XFYL),
    makeTab('xingdong-kycx-02', XINGDONG_TITLE_XFYL),
    makeTab('xingdong-kycx-03', XINGDONG_TITLE_XFYL)
  ]
}

export const MODULES: ModuleDef[] = [zhidu, guihua, xingdong]

export function getModule(route: string): ModuleDef | undefined {
  return MODULES.find((m) => m.route === route)
}
