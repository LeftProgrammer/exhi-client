<script setup lang="ts">
/**
 * 沿任意 SVG path 移动的"流星"光点（每帧全清 + N 点拖尾方案）。
 *
 * 为什么不再用累积残影：
 *   累积法（destination-out 衰减 + lighter 叠加）有 8-bit alpha 整数
 *   舍入卡死的死结：旧像素降到 α=1 后永远归不了零，下一圈头部走过同一点
 *   又把它加亮回去 → 路径上慢慢累积出一道"幽灵描边"，肉眼就是"画布留下了
 *   走过的痕迹"。任何 source-over / lighter 都救不回来——sprite 软边缘还会
 *   把 floor 重新拉高。
 *
 * 当前方案（业内最稳）：
 *   1) 每帧 clearRect 全清画布 → 不依赖任何残影机制 → 永远不会有幽灵
 *   2) 拖尾 = 沿路径反向采样 N 个点，每点画同一头部 sprite，
 *      用 globalAlpha 给每点设递减透明度（指数衰减）→ 拖尾视觉自然
 *   3) drawImage + globalAlpha 都是 GPU 原生路径，零 JS 分配
 *   4) path 坐标统一按 0~100 百分比，跟容器实际像素解耦——
 *      调用方只写 "M 50,5 L 95,5 ..." 即可，不管元素是多少 px
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

/**
 * 内置的圆角矩形 inset 配置。
 *   - number     四边一致的内缩百分比（0~50，相对 100×100 viewBox）
 *   - { ... }    四边分别可调（适配不对称背景图）
 */
type Inset =
  | number
  | {
      top?: number
      right?: number
      bottom?: number
      left?: number
    }

/** 速度预设档位：调过手感的常用值 */
type SpeedPreset = 'slow' | 'normal' | 'fast'
const SPEED_PRESETS: Record<SpeedPreset, number> = {
  slow: 100, // 静谧、装饰性
  normal: 180, // 默认，舒适
  fast: 300 // 抓眼球、强调
}

/** 拖尾长度预设档位：相对路径周长的比例 */
type TailPreset = 'short' | 'medium' | 'long'
const TAIL_PRESETS: Record<TailPreset, number> = {
  short: 0.06, // 流星感，划过即逝
  medium: 0.1, // 默认，平衡
  long: 0.3 // 长尾光环、装饰强
}

interface Props {
  /**
   * 自定义 SVG path（坐标按 0~100 百分比）。
   * 不传时按 inset / radius 自动生成圆角矩形——大多数沿元素边框走的场景
   * 都不需要手写 path。
   */
  path?: string
  /**
   * 内置矩形路径的内缩量。默认 0 = 紧贴元素边。
   * 传 number 时四边一致；传对象 { top,right,bottom,left } 时分边。
   */
  inset?: Inset
  /** 内置矩形路径的圆角半径（百分比，相对 100×100），默认 2 */
  radius?: number
  /**
   * 流光运动速度。
   *   - 预设档位：'slow' | 'normal' | 'fast'（推荐，跨组件一致）
   *   - 自定义数字：CSS px/秒，用于精细调校
   * 关键设计：用速度而非 duration（绕一圈秒数），让同一个值在任何元素
   * 大小上都看着匀速。
   */
  speed?: SpeedPreset | number
  direction?: 'cw' | 'ccw'
  /** 光带粗细 / 头部光斑直径（CSS px） */
  thickness?: number
  /** 主色：任何 CSS 颜色（hex / rgb / hsl / 颜色关键字），内部用 canvas 归一化 */
  color?: string
  /**
   * 拖尾长度。
   *   - 预设档位：'short' | 'medium' | 'long'（推荐）
   *   - 自定义数字：占整条路径的比例（0~1）
   */
  tailLength?: TailPreset | number
}

const props = withDefaults(defineProps<Props>(), {
  path: undefined,
  inset: 0,
  radius: 2,
  speed: 'normal',
  direction: 'cw',
  thickness: 9,
  color: '#00e5d4',
  tailLength: 'medium'
})

/** 子像素采样间距（内部常量，CSS px）。<sprite 直径让相邻 sprite 大面积重叠 */
const DOT_SPACING = 2

/**
 * 帧热路径用的预解析值。
 * 不在 frame() 里反复读 props 跑函数 —— Vue Proxy 访问 + 字符串分支判断
 * 看着便宜，但帧循环里跑万次后会拖慢 V8 内联优化。
 * watch 在 props 变化时刷新缓存，frame 里直接读裸 number 字段。
 */
let cachedSpeed = SPEED_PRESETS.normal
let cachedTailFrac = TAIL_PRESETS.medium
let cachedDirSign = -1 // cw=-1 / ccw=+1

function recomputeAnimCache() {
  const s = props.speed
  cachedSpeed = typeof s === 'number' ? s : (SPEED_PRESETS[s] ?? SPEED_PRESETS.normal)
  const t = props.tailLength
  cachedTailFrac = typeof t === 'number' ? t : (TAIL_PRESETS[t] ?? TAIL_PRESETS.medium)
  cachedDirSign = props.direction === 'ccw' ? 1 : -1
}

/**
 * 决定最终用哪条 path：
 *   - 显式 path 优先（freeform 用法，如圆、不规则形状）
 *   - 否则按 inset + radius 生成圆角矩形（最常见场景：沿元素边框）
 */
const resolvedPath = computed(() => {
  if (props.path) return props.path
  const ins = props.inset
  const top = typeof ins === 'number' ? ins : (ins.top ?? 0)
  const right = typeof ins === 'number' ? ins : (ins.right ?? 0)
  const bottom = typeof ins === 'number' ? ins : (ins.bottom ?? 0)
  const left = typeof ins === 'number' ? ins : (ins.left ?? 0)
  const t = top
  const r = 100 - right
  const b = 100 - bottom
  const l = left
  const cr = Math.max(0, Math.min(props.radius, (r - l) / 2, (b - t) / 2))
  return [
    `M ${(l + r) / 2},${t}`,
    `L ${r - cr},${t} Q ${r},${t} ${r},${t + cr}`,
    `L ${r},${b - cr} Q ${r},${b} ${r - cr},${b}`,
    `L ${l + cr},${b} Q ${l},${b} ${l},${b - cr}`,
    `L ${l},${t + cr} Q ${l},${t} ${l + cr},${t}`,
    `L ${(l + r) / 2},${t} Z`
  ].join(' ')
})

const root = ref<HTMLDivElement | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)
/** 隐藏 SVGPathElement，仅作 getPointAtLength 计算器（resize 时调用） */
const probe = ref<SVGPathElement | null>(null)

let ctx: CanvasRenderingContext2D | null = null
let rafId = 0
let resizeObserver: ResizeObserver | null = null
let dpr = 1

/**
 * 时间锚点（ms）。
 * 进度永远算 `(now - startTime) * speed / totalLength % 1`——
 * 绝对时间寻址 → rAF 间隔抖动不会引起位置抖动（迟到的帧自动追上）。
 *
 * 但是 now 一直增大，跑很久后 `(now - startTime) * speed` 会变成大数，
 * 跟 totalLength 取模时浮点精度会被尾数吃掉 → 每圈接缝处看着卡一下。
 * 修法：每跑完整数圈就把 startTime 前移对应整数圈的时间，
 * 让 `(now - startTime)` 永远保持在「一圈耗时」量级 → 精度恒定。
 */
let startTime = 0

/** 头部 sprite（离屏 canvas） */
let headSprite: HTMLCanvasElement | null = null
let spriteHalf = 0

/** 路径预采样（resize 时一次性填充） */
const SAMPLE_COUNT = 2048
let sampleX: Float32Array | null = null
let sampleY: Float32Array | null = null

/**
 * 元素内容区尺寸（w,h）+ 画布向外溢出量 pad（CSS px）。
 *
 * 关键设计：当 path 走在元素边沿时，sprite 的光晕半径会向外溢出元素边界，
 * 如果画布只有元素大小、且父级 overflow:hidden，光晕外圈就被裁掉。
 * 解决：画布在元素四边各扩 pad px（默认 sprite 半径 + 1），用 CSS 负偏移
 * 把扩出来的部分摆到元素外侧。path 坐标整体平移 +pad，让 path 仍贴在
 * 元素真正的边界上，溢出部分留给光晕。
 */
const canvasSize = ref({ w: 0, h: 0, pad: 0 })

/**
 * 把 resolvedPath（0~100 百分比）按当前 canvasSize 缩放 + pad 平移成像素坐标。
 * 同步调用，不走 Vue computed —— 避免 ResizeObserver 中途连续 fire 时
 * Vue 异步 flush 跟 rAF 抢时序导致 SVG path 没刷新就被 buildSamples 采到。
 */
function buildScaledPathString(): string {
  const { w, h, pad } = canvasSize.value
  const src = resolvedPath.value
  if (!w || !h) return src
  const sx = w / 100
  const sy = h / 100
  let i = 0
  return src.replace(/-?\d+(\.\d+)?/g, (n) => {
    const v = parseFloat(n)
    const even = i % 2 === 0
    const px = even ? v * sx + pad : v * sy + pad
    i++
    return px.toFixed(2)
  })
}

/** 直接写 SVGPathElement.d，不走 Vue 模板 binding —— 立即生效，无异步窗口 */
function applyPath() {
  if (!probe.value) return
  probe.value.setAttribute('d', buildScaledPathString())
}

/**
 * 取容器当前尺寸。两种来源：
 *   - 优先用 ResizeObserverEntry.contentRect（不受父级 transform/animation 影响）
 *   - 否则用 element.clientWidth/Height（也是 content-box 尺寸，不带 transform）
 * 故意**不用** getBoundingClientRect —— 它返回的是带 transform 的视觉矩形，
 * 父级在做 cards-in keyframe 时会读到偏小/偏移的值。
 */
function readSize(el: HTMLElement, entry?: ResizeObserverEntry): { w: number; h: number } {
  if (entry) {
    const cb = entry.contentBoxSize
    if (cb && cb.length > 0) {
      return {
        w: Math.max(1, Math.floor(cb[0].inlineSize)),
        h: Math.max(1, Math.floor(cb[0].blockSize))
      }
    }
    return {
      w: Math.max(1, Math.floor(entry.contentRect.width)),
      h: Math.max(1, Math.floor(entry.contentRect.height))
    }
  }
  return {
    w: Math.max(1, el.clientWidth || 1),
    h: Math.max(1, el.clientHeight || 1)
  }
}

function measure(entry?: ResizeObserverEntry) {
  if (!root.value || !canvas.value) return
  const { w, h } = readSize(root.value, entry)
  // 四边各扩 pad px 给光晕留位置（取 sprite 半径 + 抗锯齿余量）
  const pad = Math.ceil(props.thickness / 2) + 2
  canvasSize.value = { w, h, pad }
  dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2))
  const cw = w + pad * 2
  const ch = h + pad * 2
  canvas.value.width = cw * dpr
  canvas.value.height = ch * dpr
  canvas.value.style.width = `${cw}px`
  canvas.value.style.height = `${ch}px`
  canvas.value.style.left = `${-pad}px`
  canvas.value.style.top = `${-pad}px`
  ctx = canvas.value.getContext('2d')
  if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
}

/**
 * 解析任意 CSS 颜色 → [r,g,b]（0~255）。
 * 借用一个 1×1 离屏 canvas：fillStyle 接受任何 CSS color，
 * 然后 getImageData 读出标准 RGB —— 比手写正则覆盖所有格式（hex / rgb /
 * hsl / 关键字）健壮得多。结果只算一次，缓存在闭包里。
 */
let cachedRgb: [number, number, number] = [0, 229, 212]
let cachedColorInput = ''
function resolveColor(input: string): [number, number, number] {
  if (input === cachedColorInput) return cachedRgb
  const probe = document.createElement('canvas')
  probe.width = probe.height = 1
  const pc = probe.getContext('2d')
  if (!pc) return cachedRgb
  pc.fillStyle = input
  pc.fillRect(0, 0, 1, 1)
  const d = pc.getImageData(0, 0, 1, 1).data
  cachedRgb = [d[0], d[1], d[2]]
  cachedColorInput = input
  return cachedRgb
}
function rgba(input: string, a: number) {
  const [r, g, b] = resolveColor(input)
  return `rgba(${r},${g},${b},${a})`
}

/** 预渲染头部 sprite：中心硬白核 + 主色 + 软边缘 */
function buildHeadSprite() {
  const r = props.thickness / 2
  const halfCSS = r + 1
  const buf = document.createElement('canvas')
  buf.width = Math.ceil(halfCSS * 2 * dpr)
  buf.height = Math.ceil(halfCSS * 2 * dpr)
  const c = buf.getContext('2d')
  if (!c) return
  c.scale(dpr, dpr)
  const cx = halfCSS
  const cy = halfCSS
  const g = c.createRadialGradient(cx, cy, 0, cx, cy, r)
  /**
   * 三段渐变：硬白核 + 实色环 + 陡降外缘。
   * 0.50 之内全部不透明 → 大量重叠后中心仍像一根**实心光带**而不是糊团；
   * 0.50→1.0 陡降 → 外圈 1px 抗锯齿不糊。
   */
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.4, rgba(props.color, 1))
  g.addColorStop(0.5, rgba(props.color, 0.95))
  g.addColorStop(1, rgba(props.color, 0))
  c.fillStyle = g
  c.beginPath()
  c.arc(cx, cy, r, 0, Math.PI * 2)
  c.fill()
  headSprite = buf
  spriteHalf = halfCSS
}

/** 路径总长度（CSS px），帧循环用来按弧长计算拖尾点数 */
let totalLength = 0

/**
 * 路径预采样：把 SAMPLE_COUNT 个等距弧长点的 (x,y) 存进 Float32Array。
 *
 * 内置的圆角矩形走**纯数学计算**（buildRectSamplesAnalytic）：
 *   完全不碰 SVG/DOM —— 彻底回避 Chromium 在隐藏 SVG 上的 getPointAtLength
 *   path-geometry 缓存失效问题（resize 后右/下边采样位置不更新）。
 *
 * 仅当调用方显式传 path（自定义形状如圆、不规则）时才走 SVG 采样。
 */
function buildSamples() {
  if (props.path) {
    buildSamplesFromSvg()
  } else {
    buildRectSamplesAnalytic()
  }
}

function buildSamplesFromSvg() {
  if (!probe.value) return
  const total = probe.value.getTotalLength()
  if (!total || !isFinite(total)) return
  totalLength = total
  ensureSampleBuffers()
  const xs = sampleX!
  const ys = sampleY!
  for (let i = 0; i < SAMPLE_COUNT; i++) {
    const d = (i / SAMPLE_COUNT) * total
    const pt = probe.value.getPointAtLength(d)
    xs[i] = pt.x
    ys[i] = pt.y
  }
}

function ensureSampleBuffers() {
  if (!sampleX || sampleX.length !== SAMPLE_COUNT) {
    sampleX = new Float32Array(SAMPLE_COUNT)
    sampleY = new Float32Array(SAMPLE_COUNT)
  }
}

/**
 * 圆角矩形路径的解析采样（不依赖 SVG）。
 *
 * 路径由 9 段组成（顺时针，起点顶边中点）：
 *   1) 半段顶边（中点 → 右上圆角起点）
 *   2) 右上 Q 圆角
 *   3) 右边
 *   4) 右下 Q 圆角
 *   5) 底边
 *   6) 左下 Q 圆角
 *   7) 左边
 *   8) 左上 Q 圆角
 *   9) 半段顶边（左上圆角终点 → 中点）
 *
 * 每段先算自身弧长（直线用 hypot；Q 用 K 段折线累加近似）→ 累计得 total。
 * 采样时按 d/total 找到所在段，在段内按 localT 取点（直线线性、Q 抛物线参数）。
 */
function buildRectSamplesAnalytic() {
  const { w, h, pad } = canvasSize.value
  if (!w || !h) return

  const ins = props.inset
  const topPct = typeof ins === 'number' ? ins : (ins.top ?? 0)
  const rightPct = typeof ins === 'number' ? ins : (ins.right ?? 0)
  const bottomPct = typeof ins === 'number' ? ins : (ins.bottom ?? 0)
  const leftPct = typeof ins === 'number' ? ins : (ins.left ?? 0)

  const sx = w / 100
  const sy = h / 100

  const t = topPct * sy + pad
  const r = (100 - rightPct) * sx + pad
  const b = (100 - bottomPct) * sy + pad
  const l = leftPct * sx + pad

  const crPct = Math.max(
    0,
    Math.min(props.radius, (100 - rightPct - leftPct) / 2, (100 - topPct - bottomPct) / 2)
  )
  const crX = crPct * sx
  const crY = crPct * sy
  const midX = (l + r) / 2

  // 9 段，每段 [start_d, end_d, type] + 端点/控制点
  type Seg =
    | { kind: 'L'; start: number; len: number; ax: number; ay: number; bx: number; by: number }
    | {
        kind: 'Q'
        start: number
        len: number
        ax: number
        ay: number
        cx: number
        cy: number
        bx: number
        by: number
      }
  const segs: Seg[] = []
  let cursor = 0

  function pushL(ax: number, ay: number, bx: number, by: number) {
    const len = Math.hypot(bx - ax, by - ay)
    if (len <= 0) return
    segs.push({ kind: 'L', start: cursor, len, ax, ay, bx, by })
    cursor += len
  }

  function pushQ(ax: number, ay: number, cx: number, cy: number, bx: number, by: number) {
    // 用 K 段折线累加估算 Q 的弧长（K=24 对 90° 圆角误差 < 0.1%）
    const K = 24
    let len = 0
    let px = ax
    let py = ay
    for (let i = 1; i <= K; i++) {
      const tt = i / K
      const u = 1 - tt
      const x = u * u * ax + 2 * u * tt * cx + tt * tt * bx
      const y = u * u * ay + 2 * u * tt * cy + tt * tt * by
      len += Math.hypot(x - px, y - py)
      px = x
      py = y
    }
    if (len <= 0) return
    segs.push({ kind: 'Q', start: cursor, len, ax, ay, cx, cy, bx, by })
    cursor += len
  }

  pushL(midX, t, r - crX, t)
  pushQ(r - crX, t, r, t, r, t + crY)
  pushL(r, t + crY, r, b - crY)
  pushQ(r, b - crY, r, b, r - crX, b)
  pushL(r - crX, b, l + crX, b)
  pushQ(l + crX, b, l, b, l, b - crY)
  pushL(l, b - crY, l, t + crY)
  pushQ(l, t + crY, l, t, l + crX, t)
  pushL(l + crX, t, midX, t)

  totalLength = cursor
  if (totalLength <= 0) return

  ensureSampleBuffers()
  const xs = sampleX!
  const ys = sampleY!
  // 用游标避免每次二分查段
  let segIdx = 0
  for (let i = 0; i < SAMPLE_COUNT; i++) {
    const d = (i / SAMPLE_COUNT) * totalLength
    // 推进到 d 所在段
    while (segIdx < segs.length - 1 && d > segs[segIdx].start + segs[segIdx].len) {
      segIdx++
    }
    const s = segs[segIdx]
    const localT = (d - s.start) / s.len
    if (s.kind === 'L') {
      xs[i] = s.ax + (s.bx - s.ax) * localT
      ys[i] = s.ay + (s.by - s.ay) * localT
    } else {
      const u = 1 - localT
      xs[i] = u * u * s.ax + 2 * u * localT * s.cx + localT * localT * s.bx
      ys[i] = u * u * s.ay + 2 * u * localT * s.cy + localT * localT * s.by
    }
  }
}

/** 查表 + lerp，零分配 */
function lookupX(t: number): number {
  const xs = sampleX!
  const f = t * SAMPLE_COUNT
  const i = f | 0
  const frac = f - i
  const i0 = i % SAMPLE_COUNT
  const i1 = (i0 + 1) % SAMPLE_COUNT
  return xs[i0] + (xs[i1] - xs[i0]) * frac
}
function lookupY(t: number): number {
  const ys = sampleY!
  const f = t * SAMPLE_COUNT
  const i = f | 0
  const frac = f - i
  const i0 = i % SAMPLE_COUNT
  const i1 = (i0 + 1) % SAMPLE_COUNT
  return ys[i0] + (ys[i1] - ys[i0]) * frac
}

function frame(now: number) {
  rafId = requestAnimationFrame(frame)
  if (!ctx || !headSprite || !sampleX) return
  const { w, h, pad } = canvasSize.value
  if (!w || !h) return

  /**
   * 绝对时间寻址：p = ((now - startTime) * speed / totalLength) % 1
   *
   * 用绝对时间（不是逐帧增量累加）的好处：
   *   - rAF 间隔抖动不会引起位置抖动——某帧迟到，下一帧位置直接「按当前 now 算」
   *     自动追上，不会累计漂移
   *   - 增量累加在帧间隔抖动时会出现"小步抖动"（用户刚反馈的抖动就是这个）
   *
   * 浮点精度问题：now 跑半小时后 ~1.8e6 ms，(now - startTime) * speed 会变大数，
   * 跟 totalLength 取模时尾数被吃掉 → 每圈接缝处亚像素跳一下（你最初说的"每
   * 圈卡顿"）。修法：每跑一整圈把 startTime 前移一圈耗时，让差值永远保持
   * 在「一圈耗时」量级——精度永远稳。
   */
  if (!startTime) startTime = now
  let p = 0
  if (totalLength > 0 && cachedSpeed > 0) {
    const lapMs = (totalLength / cachedSpeed) * 1000 // 一圈耗时
    let elapsed = now - startTime
    if (elapsed >= lapMs) {
      // 把 startTime 前移整数圈对应的时间，让 elapsed 永远 < 一圈耗时
      const laps = Math.floor(elapsed / lapMs)
      startTime += laps * lapMs
      elapsed -= laps * lapMs
    }
    p = elapsed / lapMs
  }
  if (cachedDirSign > 0) p = 1 - p

  // 每帧全清整张画布（含 pad 溢出区）：彻底无累积、无幽灵
  ctx.clearRect(0, 0, w + pad * 2, h + pad * 2)

  /**
   * 拖尾按弧长定密度：每 DOT_SPACING CSS px 一个采样点。
   * DOT_SPACING 远小于 sprite 直径 → 相邻 sprite 大面积重叠，融合成连续光带。
   *
   * 方向修正（关键）：
   *   p = 1 - p 已经把"前进方向"反过来了，但拖尾还得**继续落在头部身后**，
   *   即原始路径方向上的"前方"——所以 cw 时 tp = p - 偏移，ccw 时 tp = p + 偏移。
   */
  const tailArc = totalLength * cachedTailFrac
  const N = Math.max(2, Math.ceil(tailArc / DOT_SPACING))
  const lastIdx = N - 1
  const sw = spriteHalf * 2

  // 从拖尾最远端向头部画 → head 最后落笔在最上层；不需要任何混合模式
  for (let i = N - 1; i >= 0; i--) {
    const t = i / lastIdx // 0=头部 / 1=尾端
    let tp = p + cachedDirSign * t * cachedTailFrac
    tp = ((tp % 1) + 1) % 1
    // 指数衰减：头部 1 → 尾端 ≈0，曲线更接近真实彗星余晖
    const a = 1 - t
    ctx.globalAlpha = a * a
    const x = lookupX(tp)
    const y = lookupY(tp)
    ctx.drawImage(headSprite, x - spriteHalf, y - spriteHalf, sw, sw)
  }
  ctx.globalAlpha = 1
}

/**
 * 整链路同步刷新：尺寸 → sprite → 写 path → 采样。
 * 全部同步执行，没有任何 rAF 异步窗口 —— ResizeObserver 中途多次 fire 也
 * 不会出现"采样用的还是旧 path"的情况。
 */
function refreshAll(entry?: ResizeObserverEntry) {
  measure(entry)
  buildHeadSprite()
  applyPath()
  buildSamples()
  // resize 后 totalLength 变了，重置时间锚点让进度从当前位置自然继续
  startTime = 0
  if (ctx) {
    const { w, h, pad } = canvasSize.value
    ctx.clearRect(0, 0, w + pad * 2, h + pad * 2)
  }
}

function handleWindowResize() {
  refreshAll()
}

onMounted(() => {
  recomputeAnimCache()
  /**
   * 首挂载时父级 cards-in 动画正在播（1.4s + 0.4s delay），
   * 用 rAF 等一帧再 measure，避免读到 transform 中态的尺寸。
   */
  requestAnimationFrame(() => {
    refreshAll()
    rafId = requestAnimationFrame(frame)
  })
  if (root.value) {
    resizeObserver = new ResizeObserver((entries) => {
      // 用 entry 自带的 contentBox/contentRect，**不**走 getBoundingClientRect()
      refreshAll(entries[0])
    })
    resizeObserver.observe(root.value)
  }
  // 兜底：某些场景（如 zoom 改 dpr）RO 不会 fire，监听 window resize
  window.addEventListener('resize', handleWindowResize)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(rafId)
  resizeObserver?.disconnect()
  resizeObserver = null
  window.removeEventListener('resize', handleWindowResize)
  ctx = null
  headSprite = null
  sampleX = null
  sampleY = null
})

// color 改变 → 重建 sprite；thickness 改变还会影响 pad，要重新跑整链
watch(() => props.color, buildHeadSprite)
watch(
  () => props.thickness,
  () => refreshAll()
)
// path / inset / radius 改变 → 重写 path + 重新采样
watch([() => props.path, () => props.inset, () => props.radius], () => {
  applyPath()
  buildSamples()
})
// speed / tailLength / direction 改变 → 刷新帧循环热路径用的裸值缓存
watch([() => props.speed, () => props.tailLength, () => props.direction], recomputeAnimCache)
</script>

<template>
  <div ref="root" class="moving-dot-track">
    <canvas ref="canvas" class="moving-dot-canvas" />
    <!--
      隐藏 SVG，仅用作 getPointAtLength 计算器。
      d 属性不走 Vue binding，由 measure()/applyPath() 同步写入；
      viewBox 也不需要 reactive 绑定，path 坐标已经是绝对像素。
    -->
    <svg class="moving-dot-probe" aria-hidden="true">
      <path ref="probe" fill="none" stroke="none" />
    </svg>
  </div>
</template>

<style scoped lang="scss">
.moving-dot-track {
  position: absolute;
  inset: 0;
  pointer-events: none;
  /* 关键：让 canvas 的 pad 溢出区可见，否则父级 overflow:hidden 会裁掉光晕 */
  overflow: visible;
}

.moving-dot-canvas {
  position: absolute;
  /* 尺寸/位置由 measure() 用负 left/top 摆出溢出效果，不再用 inset:0 */
  background: transparent;
  pointer-events: none;
}

.moving-dot-probe {
  position: absolute;
  width: 0;
  height: 0;
  overflow: hidden;
  opacity: 0;
  pointer-events: none;
}
</style>
