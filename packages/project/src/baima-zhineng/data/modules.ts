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

/** 内容块：每张图独立配置位置与大小（设计稿 ） */
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
  /** 待机页图标布局（设计稿 ） */
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
const XINGDONG_TITLE_XSJW = url('modules/xingdong/xsjw-title.png')
const XINGDONG_TITLE_JNQQ = url('modules/xingdong/jnqq-title.png')
const XINGDONG_TITLE_AQHH = url('modules/xingdong/aqhh-title.png')
const XINGDONG_TITLE_LJGJ = url('modules/xingdong/ljgj-title.png')
const XINGDONG_TITLE_KYCX = url('modules/xingdong/kycx-title.png')
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
          { src: url('modules/xingdong/xfyl-01-subtitle.png'), left: 732, top: 998, width: 696, height: 108 },
          { src: url('modules/xingdong/xfyl-01-1.png'), left: 0, top: 1196, width: 2158, height: 1077 },
          { src: url('modules/xingdong/xfyl-01-2.png'), left: 0, top: 2419, width: 2160, height: 1100 },
          { src: url('modules/xingdong/xfyl-01-3.png'), left: 0, top: 3561, width: 2160, height: 1906 },
          { src: url('modules/xingdong/xfyl-01-4.png'), left: 0, top: 5577, width: 2160, height: 967 },
          { src: url('modules/xingdong/xfyl-01-5.png'), left: 0, top: 6690, width: 2160, height: 818 }
        ]
      }
    ]),
    makeTab('xingdong-xfyl-02', XINGDONG_TITLE_XFYL, [
      {
        blocks: [
          { src: url('modules/xingdong/xfyl-02-subtitle.png'), left: 833, top: 961, width: 494, height: 107 },
          { src: url('modules/xingdong/xfyl-02-subtitle-desc.png'), left: 366, top: 1145, width: 1434, height: 57 },
          { src: url('modules/xingdong/xfyl-02-1.png'), left: 0, top: 1281, width: 2160, height: 2100 },
          { src: url('modules/xingdong/xfyl-02-2.png'), left: 0, top: 3473, width: 1624, height: 965 },
          { src: url('modules/xingdong/xfyl-02-3.png'), left: 612, top: 4588, width: 1548, height: 968 },
          { src: url('modules/xingdong/xfyl-02-4.png'), left: 170, top: 5666, width: 1806, height: 2094 }
        ]
      }
    ]),
    makeTab('xingdong-xfyl-03', XINGDONG_TITLE_XFYL, [
      {
        blocks: [
          { src: url('modules/xingdong/xfyl-03-subtitle.png'), left: 833, top: 963, width: 494, height: 105 },
          { src: url('modules/xingdong/xfyl-03-1.png'), left: 173, top: 1108, width: 1727, height: 1231 },
          { src: url('modules/xingdong/xfyl-03-2.png'), left: 169, top: 2442, width: 1822, height: 549 },
          { src: url('modules/xingdong/xfyl-03-3.png'), left: 117, top: 3017, width: 1872, height: 1546 },
          { src: url('modules/xingdong/xfyl-03-4.png'), left: 186, top: 3974, width: 835, height: 503 }
        ]
      }
    ]),
    makeTab('xingdong-xfyl-04', XINGDONG_TITLE_XFYL, [
      {
        blocks: [
          { src: url('modules/xingdong/xfyl-04-subtitle.png'), left: 833, top: 962, width: 494, height: 106 },
          { src: url('modules/xingdong/xfyl-04-1.png'), left: 171, top: 1095, width: 1818, height: 1056 },
          { src: url('modules/xingdong/xfyl-04-2.png'), left: 89, top: 2290, width: 1922, height: 2078 },
        ]
      }
    ]),
    makeTab('xingdong-xfyl-05', XINGDONG_TITLE_XFYL, [
      {
        blocks: [
          { src: url('modules/xingdong/xfyl-05-subtitle.png'), left: 309, top: 960, width: 1543, height: 108 },
          { src: url('modules/xingdong/xfyl-05-1.png'), left: 174, top: 1160, width: 1815, height: 339 },
          { src: url('modules/xingdong/xfyl-05-2.png'), left: 0, top: 1326, width: 2160, height: 980 },
          { src: url('modules/xingdong/xfyl-05-3.png'), left: 0, top: 2241, width: 2160, height: 1182 },
          { src: url('modules/xingdong/xfyl-05-4.png'), left: 0, top: 3313, width: 2160, height: 1004 }
        ]
      }
    ]),

    // 学思践悟 书香赋能 (4)
    makeTab('xingdong-xsjw', XINGDONG_TITLE_XSJW, [
      {
        blocks: [
          { src: url('modules/xingdong/xsjw-01-bg.png'), left: 0, top: 3535, width: 1426, height: 4445 },
          { src: url('modules/xingdong/xsjw-01-subtitle.png'), left: 817, top: 998, width: 526, height: 108 },
          { src: url('modules/xingdong/xsjw-01-1.png'), left: 0, top: 1198, width: 1869, height: 1265 },
          { src: url('modules/xingdong/xsjw-01-2.png'), left: 174, top: 2483, width: 1822, height: 762 },
          { src: url('modules/xingdong/xsjw-01-3.png'), left: 167, top: 3368, width: 1369, height: 959 },
          { src: url('modules/xingdong/xsjw-01-4.png'), left: 628, top: 4390, width: 1361, height: 959 },
          { src: url('modules/xingdong/xsjw-01-5.png'), left: 162, top: 5412, width: 1360, height: 954 },
          { src: url('modules/xingdong/xsjw-01-6.png'), left: 628, top: 6434, width: 1363, height: 1281 },
          
        ]
      }
    ]),
    makeTab('xingdong-xsjw-02', XINGDONG_TITLE_XSJW, [
      {
        blocks: [
          { src: url('modules/xingdong/xsjw-02-bg.png'), left: 230, top: 1159, width: 76, height: 6603 },
          { src: url('modules/xingdong/xsjw-02-subtitle.png'), left: 817, top: 998, width: 526, height: 108 },
          { src: url('modules/xingdong/xsjw-02-1.png'), left: 402, top: 1146, width: 1353, height: 1100 },
          { src: url('modules/xingdong/xsjw-02-2.png'), left: 401, top: 2403, width: 1359, height: 962 },
          { src: url('modules/xingdong/xsjw-02-3.png'), left: 402, top: 3529, width: 1350, height: 983 },
          { src: url('modules/xingdong/xsjw-02-4.png'), left: 402, top: 4676, width: 1350, height: 876 },
          { src: url('modules/xingdong/xsjw-02-5.png'), left: 402, top: 5709, width: 1353, height: 957 },
          { src: url('modules/xingdong/xsjw-02-6.png'), left: 402, top: 6837, width: 1350, height: 960 },
        ]
      }
    ]),
    makeTab('xingdong-xsjw-03', XINGDONG_TITLE_XSJW, [
      {
        blocks: [
          { src: url('modules/xingdong/xsjw-03-11.png'), left: 901, top: 2460, width: 851, height: 1570 },
          { src: url('modules/xingdong/xsjw-03-12.png'), left: 378, top: 3829, width: 605, height: 1356 },
          { src: url('modules/xingdong/xsjw-03-13.png'), left: 1344, top: 4759, width: 605, height: 1356 },
          { src: url('modules/xingdong/xsjw-03-14.png'), left: 148, top: 6211, width: 548, height: 1297 },
          { src: url('modules/xingdong/xsjw-03-15.png'), left: 1424, top: 6999, width: 498, height: 1336 },
          { src: url('modules/xingdong/xsjw-03-16.png'), left: 211, top: 7987, width: 656, height: 1319 },
          { src: url('modules/xingdong/xsjw-03-subtitle.png'), left: 817, top: 998, width: 526, height: 108 },
          { src: url('modules/xingdong/xsjw-03-1.png'), left: 169, top: 1198, width: 1727, height: 1226 },
          { src: url('modules/xingdong/xsjw-03-2.png'), left: 174, top: 2568, width: 1218, height: 915 },
          { src: url('modules/xingdong/xsjw-03-3.png'), left: 782, top: 3686, width: 1207, height: 905 },
          { src: url('modules/xingdong/xsjw-03-4.png'), left: 196, top: 4840, width: 1509, height: 867 },
          { src: url('modules/xingdong/xsjw-03-5.png'), left: 777, top: 5933, width: 1212, height: 689 },
          { src: url('modules/xingdong/xsjw-03-6.png'), left: 171, top: 6849, width: 1437, height: 881 },
          { src: url('modules/xingdong/xsjw-03-7.png'), left: 462, top: 7909, width: 1527, height: 856 },
          { src: url('modules/xingdong/xsjw-03-8.png'), left: 171, top: 8986, width: 1409, height: 795 },
        ]
      }
    ]),
    makeTab('xingdong-xsjw-04', XINGDONG_TITLE_XSJW, [
      {
        blocks: [
          { src: url('modules/xingdong/xsjw-04-subtitle.png'), left: 817, top: 999, width: 526, height: 107 },
          { src: url('modules/xingdong/xsjw-04-1.png'), left: 224, top: 1193, width: 1712, height: 1508 },
          { src: url('modules/xingdong/xsjw-04-2.png'), left: 194, top: 2799, width: 1706, height: 899 }
        ]
      }
    ]),

    // 技能强企 比武竞赛 (4)
    makeTab('xingdong-jnqq', XINGDONG_TITLE_JNQQ, [
      {
        blocks: [
          { src: url('modules/xingdong/jnqq-01-subtitle.png'), left: 351, top: 995, width: 1458, height: 111 },
          { src: url('modules/xingdong/jnqq-01-1.png'), left: 167, top: 1191, width: 1832, height: 1221 },
          { src: url('modules/xingdong/jnqq-01-2.png'), left: 0, top: 2822, width: 558, height: 163 },
          { src: url('modules/xingdong/jnqq-01-3.png'), left: 636, top: 2442, width: 1524, height: 978 }
        ]
      }
    ]),
    makeTab('xingdong-jnqq-02', XINGDONG_TITLE_JNQQ, [
      {
        blocks: [
          { src: url('modules/xingdong/jnqq-02-subtitle.png'), left: 169, top: 1019, width: 1823, height: 87 },
          { src: url('modules/xingdong/jnqq-02-1.png'), left: 167, top: 1234, width: 1698, height: 996 },
          { src: url('modules/xingdong/jnqq-02-2.png'), left: 167, top: 2347, width: 1829, height: 1073 }
        ]
      }
    ]),
    makeTab('xingdong-jnqq-03', XINGDONG_TITLE_JNQQ, [
      {
        blocks: [
          { src: url('modules/xingdong/jnqq-03-subtitle.png'), left: 169, top: 1020, width: 1823, height: 86 },
          { src: url('modules/xingdong/jnqq-03-1.png'), left: 169, top: 1237, width: 1823, height: 885 },
          { src: url('modules/xingdong/jnqq-03-2.png'), left: 167, top: 2227, width: 1829, height: 641 },
          { src: url('modules/xingdong/jnqq-03-3.png'), left: 168, top: 3001, width: 1823, height: 399 },
          
        ]
      }
    ]),
    makeTab('xingdong-jnqq-04', XINGDONG_TITLE_JNQQ, [
      {
        blocks: [
          { src: url('modules/xingdong/jnqq-04-subtitle.png'), left: 834, top: 999, width: 492, height: 107 },
          { src: url('modules/xingdong/jnqq-04-1.png'), left: 169, top: 1203, width: 1810, height: 740 },
          { src: url('modules/xingdong/jnqq-04-2.png'), left: 172, top: 2126, width: 1824, height: 739 },
          { src: url('modules/xingdong/jnqq-04-3.png'), left: 168, top: 3008, width: 1478, height: 1045 },
          { src: url('modules/xingdong/jnqq-04-4.png'), left: 172, top: 4194, width: 1829, height: 745 }
        ]
      }
    ]),

    // 安全护航 廉洁固本 (4)
    makeTab('xingdong-aqhh', XINGDONG_TITLE_AQHH, [
      {
        blocks: [
          { src: url('modules/xingdong/aqhh-01-subtitle.png'), left: 817, top: 998, width: 526, height: 108 },
          { src: url('modules/xingdong/aqhh-01-1.png'), left: 167, top: 1195, width: 1436, height: 942 },
          { src: url('modules/xingdong/aqhh-01-2.png'), left: 629, top: 2181, width: 1362, height: 893 },
          { src: url('modules/xingdong/aqhh-01-3.png'), left: 167, top: 3134, width: 1822, height: 1336 },
          { src: url('modules/xingdong/aqhh-01-4.png'), left: 168, top: 4563, width: 1821, height: 1130 },
          { src: url('modules/xingdong/aqhh-01-5.png'), left: 170, top: 5826, width: 1819, height: 1391 }
        ]
      }
    ]),
    makeTab('xingdong-aqhh-02', XINGDONG_TITLE_AQHH, [
      {
        blocks: [
          { src: url('modules/xingdong/aqhh-02-subtitle.png'), left: 817, top: 999, width: 526, height: 107 },
          { src: url('modules/xingdong/aqhh-02-1.png'), left: 391, top: 1155, width: 1432, height: 988 },
          { src: url('modules/xingdong/aqhh-02-2.png'), left: 164, top: 2234, width: 1638, height: 942 },
          { src: url('modules/xingdong/aqhh-02-3.png'), left: 0, top: 3277, width: 2160, height: 1981 }
        ]
      }
    ]),
    makeTab('xingdong-aqhh-03', XINGDONG_TITLE_AQHH, [
      {
        blocks: [
          { src: url('modules/xingdong/aqhh-03-subtitle.png'), left: 817, top: 999, width: 526, height: 107 },
          { src: url('modules/xingdong/aqhh-03-1.png'), left: 0, top: 1180, width: 2160, height: 1526 },
          { src: url('modules/xingdong/aqhh-03-2.png'), left: 3, top: 2810, width: 2155, height: 735 },
          { src: url('modules/xingdong/aqhh-03-3.png'), left: 3, top: 3657, width: 2155, height: 1389 }
        ]
      }
    ]),
    makeTab('xingdong-aqhh-04', XINGDONG_TITLE_AQHH, [
      {
        blocks: [
          { src: url('modules/xingdong/aqhh-04-subtitle.png'), left: 817, top: 1001, width: 526, height: 105 },
          { src: url('modules/xingdong/aqhh-04-1.png'), left: 169, top: 1180, width: 1669, height: 905 },
          { src: url('modules/xingdong/aqhh-04-2.png'), left: 180, top: 2160, width: 1809, height: 1446 },
          { src: url('modules/xingdong/aqhh-04-3.png'), left: 169, top: 3722, width: 1958, height: 1113 },
          { src: url('modules/xingdong/aqhh-04-4.png'), left: 396, top: 4989, width: 1593, height: 859 },
          { src: url('modules/xingdong/aqhh-04-5.png'), left: 169, top: 6034, width: 1787, height: 859 },
          { src: url('modules/xingdong/aqhh-04-6.png'), left: 236, top: 7012, width: 1753, height: 765 },
          { src: url('modules/xingdong/aqhh-04-7.png'), left: 169, top: 7895, width: 1806, height: 859 },
          { src: url('modules/xingdong/aqhh-04-8.png'), left: 176, top: 8846, width: 1813, height: 1231 },
          { src: url('modules/xingdong/aqhh-04-9.png'), left: 169, top: 10174, width: 1820, height: 1241 },
          { src: url('modules/xingdong/aqhh-04-10.png'), left: 304, top: 11499, width: 1685, height: 944 },
          { src: url('modules/xingdong/aqhh-04-11.png'), left: 169, top: 12531, width: 1522, height: 902 },
          { src: url('modules/xingdong/aqhh-04-12.png'), left: 203, top: 13522, width: 1786, height: 982 },
          { src: url('modules/xingdong/aqhh-04-13.png'), left: 169, top: 14615, width: 1728, height: 1640 }
        ]
      }
    ]),

    // 联建共建 融合共效 (4)
    makeTab('xingdong-ljgj', XINGDONG_TITLE_LJGJ, [
      {
        blocks: [
          { src: url('modules/xingdong/ljgj-01-subtitle.png'), left: 263, top: 995, width: 1635, height: 111 },
          { src: url('modules/xingdong/ljgj-01-1.png'), left: 164, top: 1201, width: 1654, height: 937 },
          { src: url('modules/xingdong/ljgj-01-2.png'), left: 327, top: 2282, width: 1652, height: 937 }
        ]
      }
    ]),
    makeTab('xingdong-ljgj-02', XINGDONG_TITLE_LJGJ, [
      {
        blocks: [
          { src: url('modules/xingdong/ljgj-02-subtitle.png'), left: 606, top: 999, width: 948, height: 107 },
          { src: url('modules/xingdong/ljgj-02-1.png'), left: 172, top: 1212, width: 1673, height: 1078 },
          { src: url('modules/xingdong/ljgj-02-2.png'), left: 434, top: 2343, width: 1725, height: 984 },
          { src: url('modules/xingdong/ljgj-02-3.png'), left: 172, top: 3474, width: 1849, height: 978 },
          { src: url('modules/xingdong/ljgj-02-4.png'), left: 469, top: 4605, width: 1691, height: 1131 }
        ]
      }
    ]),
    makeTab('xingdong-ljgj-03', XINGDONG_TITLE_LJGJ, [
      {
        blocks: [
          { src: url('modules/xingdong/ljgj-03-subtitle.png'), left: 604, top: 999, width: 953, height: 107 },
          { src: url('modules/xingdong/ljgj-03-1.png'), left: 312, top: 1179, width: 1589, height: 1954 },
          { src: url('modules/xingdong/ljgj-03-2.png'), left: 312, top: 3328, width: 1588, height: 1245 },
          { src: url('modules/xingdong/ljgj-03-3.png'), left: 704, top: 4744, width: 1456, height: 1154 },
          { src: url('modules/xingdong/ljgj-03-4.png'), left: 170, top: 6039, width: 1501, height: 1066 },
          { src: url('modules/xingdong/ljgj-03-5.png'), left: 598, top: 7278, width: 1512, height: 1066 }
        ]
      }
    ]),
    makeTab('xingdong-ljgj-04', XINGDONG_TITLE_LJGJ, [
      {
        blocks: [
          { src: url('modules/xingdong/ljgj-04-subtitle.png'), left: 728, top: 999, width: 704, height: 107 },
          { src: url('modules/xingdong/ljgj-04-1.png'), left: 170, top: 1185, width: 1610, height: 1189 },
          { src: url('modules/xingdong/ljgj-04-2.png'), left: 168, top: 2510, width: 1823, height: 838 },
          { src: url('modules/xingdong/ljgj-04-3.png'), left: 170, top: 3501, width: 1590, height: 1189 },
          { src: url('modules/xingdong/ljgj-04-4.png'), left: 401, top: 4835, width: 1590, height: 1269 },
          { src: url('modules/xingdong/ljgj-04-5.png'), left: 170, top: 6243, width: 1639, height: 1264 },
          { src: url('modules/xingdong/ljgj-04-6.png'), left: 400, top: 7613, width: 1596, height: 1194 },
          { src: url('modules/xingdong/ljgj-04-7.png'), left: 169, top: 8919, width: 1591, height: 1271 }
        ]
      }
    ]),

    // 科研创新 数字赋能 (3)
    makeTab('xingdong-kycx', XINGDONG_TITLE_KYCX, [
      {
        blocks: [
          { src: url('modules/xingdong/kycx-01-bg1.png'), left: 0, top: 2779, width: 705, height: 1000 },
          { src: url('modules/xingdong/kycx-01-bg2.png'), left: 1302, top: 6999, width: 845, height: 1000 },
          { src: url('modules/xingdong/kycx-01-subtitle.png'), left: 796, top: 1000, width: 569, height: 106 },
          { src: url('modules/xingdong/kycx-01-3.png'), left: 164, top: 1201, width: 1653, height: 939 },
          { src: url('modules/xingdong/kycx-01-4.png'), left: 327, top: 2282, width: 1655, height: 1118 },
          { src: url('modules/xingdong/kycx-01-5.png'), left: 171, top: 3519, width: 1646, height: 1144 },
          { src: url('modules/xingdong/kycx-01-6.png'), left: 163, top: 4779, width: 1833, height: 757 },
          { src: url('modules/xingdong/kycx-01-7.png'), left: 344, top: 5654, width: 1645, height: 1144 },
          { src: url('modules/xingdong/kycx-01-8.png'), left: 168, top: 6915, width: 1442, height: 1084 },
          { src: url('modules/xingdong/kycx-01-9.png'), left: 344, top: 8116, width: 1645, height: 1144 }
        ]
      }
    ]),
    makeTab('xingdong-kycx-02', XINGDONG_TITLE_KYCX, [
      {
        blocks: [
          { src: url('modules/xingdong/kycx-02-subtitle.png'), left: 796, top: 998, width: 569, height: 108 },
          { src: url('modules/xingdong/kycx-02-1.png'), left: 171, top: 1201, width: 1743, height: 930 },
          { src: url('modules/xingdong/kycx-02-2.png'), left: 327, top: 2282, width: 1662, height: 1118 },
          { src: url('modules/xingdong/kycx-02-3.png'), left: 173, top: 3529, width: 1592, height: 1134 }
        ]
      }
    ]),
    makeTab('xingdong-kycx-03', XINGDONG_TITLE_KYCX, [
      {
        blocks: [
          { src: url('modules/xingdong/kycx-03-subtitle.png'), left: 796, top: 998, width: 569, height: 108 },
          { src: url('modules/xingdong/kycx-03-1.png'), left: 55, top: 1220, width: 1853, height: 1120 },
          { src: url('modules/xingdong/kycx-03-2.png'), left: 246, top: 2248, width: 1635, height: 1123 },
          { src: url('modules/xingdong/kycx-03-3.png'), left: 55, top: 3367, width: 1914, height: 739 },
          { src: url('modules/xingdong/kycx-03-4.png'), left: 246, top: 4059, width: 1635, height: 797 },
          { src: url('modules/xingdong/kycx-03-5.png'), left: 171, top: 4961, width: 1818, height: 1529 },
          { src: url('modules/xingdong/kycx-03-6.png'), left: 55, top: 6628, width: 1914, height: 743 },
          { src: url('modules/xingdong/kycx-03-7.png'), left: 281, top: 7313, width: 1699, height: 1100 },
          { src: url('modules/xingdong/kycx-03-8.png'), left: 103, top: 8332, width: 1866, height: 760 },
          { src: url('modules/xingdong/kycx-03-9.png'), left: 169, top: 9127, width: 1739, height: 699 },
          { src: url('modules/xingdong/kycx-03-10.png'), left: 169, top: 9984, width: 1820, height: 1176 }
        ]
      }
    ])
  ]
}

export const MODULES: ModuleDef[] = [zhidu, guihua, xingdong]

export function getModule(route: string): ModuleDef | undefined {
  return MODULES.find((m) => m.route === route)
}
