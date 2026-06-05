/**
 * 展厅 UI 操作反馈音效（Web Audio API）。
 *
 * - 单例 AudioContext，全应用共享，零延迟、可叠加播放。
 * - 双模音源：合成音（默认，零素材）+ 文件音（register 后同名覆盖合成音）。
 * - 自动播放策略：需在首次手势调用 unlock()（通常在 App.vue 挂一次）。
 *
 * 用法：
 *   const { unlock } = useSfx(); onMounted(() => unlock())
 *   const sfx = useSfx()
 *   sfx.play('nav')   // 菜单/路由切换
 *   sfx.play('page')  // 内容翻页
 *   sfx.play('tap')   // 普通点击
 *   sfx.play('back')  // 返回/首页
 *   sfx.register('nav', url); sfx.preload()  // 换真实音频文件
 */

/** 单个振荡器层：可叠加多层做出丰富音色。 */
interface OscLayer {
  type: OscillatorType
  freq: number
  /** 结束频率，做滑音；不填等于 freq */
  freqTo?: number
  /** 该层音量 0~1 */
  gain: number
  /** 微失谐（音分），让叠加更厚 */
  detune?: number
  /** 该层延迟起音（秒），做出先后顺序的过渡 */
  delay?: number
}

/** 合成音预设：多振荡器 + 可选噪声摩擦层 + 滤波扫频 + 起/释音包络。 */
interface SynthPreset {
  layers: OscLayer[]
  /** 时长（秒） */
  duration: number
  /** 总峰值音量 0~1 */
  gain: number
  /** 起音时间（秒），越大越柔和有过渡感 */
  attack?: number
  /** 噪声比例 0~1（模拟纸张/摩擦声） */
  noise?: number
  /** 噪声带通滤波起始频率 */
  noiseFreq?: number
  /** 噪声带通滤波结束频率（扫频出"唰"感） */
  noiseFreqTo?: number
  /** 全局低通滤波起始频率 */
  filterFreq?: number
  /** 全局低通滤波结束频率 */
  filterFreqTo?: number
}

/** 内置合成音预设（语义化命名，按动作类型区分音色）。 */
const SYNTH_PRESETS: Record<string, SynthPreset> = {
  // 普通点击：柔和的塑料按键感，短但不生硬
  tap: {
    layers: [
      { type: 'triangle', freq: 480, freqTo: 380, gain: 0.32 },
      { type: 'sine', freq: 960, gain: 0.1, detune: 6 }
    ],
    duration: 0.1,
    gain: 0.28,
    attack: 0.004,
    noise: 0.12,
    noiseFreq: 7000,
    noiseFreqTo: 2500
  },
  // 菜单/路由切换：上扬确认音，明亮有过渡
  nav: {
    layers: [
      { type: 'sine', freq: 440, freqTo: 880, gain: 0.34 },
      { type: 'triangle', freq: 880, freqTo: 1320, gain: 0.16, detune: -5, delay: 0.04 }
    ],
    duration: 0.26,
    gain: 0.32,
    attack: 0.012,
    filterFreq: 700,
    filterFreqTo: 3200
  },
  // 翻页：两档纸张摩擦扫频 + 轻微低频“推过”感，模拟翻书“唰—喔”
  page: {
    layers: [
      { type: 'triangle', freq: 520, freqTo: 180, gain: 0.22 },
      { type: 'sine', freq: 240, freqTo: 120, gain: 0.18, delay: 0.06 }
    ],
    duration: 0.3,
    gain: 0.32,
    attack: 0.006,
    noise: 0.2,
    noiseFreq: 5500,
    noiseFreqTo: 900
  },
  // 返回：沉稳下行音，带低通收尾的“回落”过渡
  back: {
    layers: [
      { type: 'sine', freq: 560, freqTo: 280, gain: 0.36 },
      { type: 'triangle', freq: 280, freqTo: 130, gain: 0.18, delay: 0.05 }
    ],
    duration: 0.28,
    gain: 0.3,
    attack: 0.01,
    filterFreq: 2200,
    filterFreqTo: 360
  }
}

let ctx: AudioContext | null = null
let master: GainNode | null = null
let unlocked = false
let enabled = true
let masterVolume = 0.6

const fileUrls = new Map<string, string>()
const fileBuffers = new Map<string, AudioBuffer>()

function ensureCtx(): AudioContext | null {
  if (ctx) return ctx
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  ctx = new Ctor()
  master = ctx.createGain()
  master.gain.value = masterVolume
  master.connect(ctx.destination)
  return ctx
}

/** 首次用户手势解锁音频（监听一次 pointerdown，自动 resume）。 */
function unlock() {
  if (unlocked) return
  const handler = () => {
    const c = ensureCtx()
    if (c && c.state === 'suspended') void c.resume()
    unlocked = true
    window.removeEventListener('pointerdown', handler, true)
  }
  window.addEventListener('pointerdown', handler, { capture: true, once: true })
}

/** 注册文件音源（同名会覆盖合成音）。 */
function register(name: string, url: string) {
  fileUrls.set(name, url)
}

async function loadBuffer(name: string): Promise<AudioBuffer | null> {
  const c = ensureCtx()
  const url = fileUrls.get(name)
  if (!c || !url) return null
  if (fileBuffers.has(name)) return fileBuffers.get(name)!
  try {
    const res = await fetch(url)
    const arr = await res.arrayBuffer()
    const buf = await c.decodeAudioData(arr)
    fileBuffers.set(name, buf)
    return buf
  } catch (e) {
    console.warn('[useSfx] 解码失败:', name, e)
    return null
  }
}

/** 预解码所有已注册文件音源（可选，避免首次播放延迟）。 */
async function preload() {
  await Promise.all([...fileUrls.keys()].map((n) => loadBuffer(n)))
}

function playBuffer(buf: AudioBuffer) {
  const c = ensureCtx()
  if (!c || !master) return
  const src = c.createBufferSource()
  src.buffer = buf
  src.connect(master)
  src.start()
}

/** 生成并播放一段带通滤波的白噪声，模拟纸张/摩擦声，接入 dest。 */
function playNoise(c: AudioContext, dest: AudioNode, p: SynthPreset, now: number) {
  if (!p.noise) return
  const bufSize = Math.floor(c.sampleRate * p.duration)
  const buffer = c.createBuffer(1, bufSize, c.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1

  const src = c.createBufferSource()
  src.buffer = buffer

  const f = c.createBiquadFilter()
  f.type = 'bandpass'
  f.Q.value = 1.1
  f.frequency.setValueAtTime(p.noiseFreq ?? 4000, now)
  if (p.noiseFreqTo) {
    f.frequency.exponentialRampToValueAtTime(Math.max(60, p.noiseFreqTo), now + p.duration)
  }

  const g = c.createGain()
  g.gain.setValueAtTime(0.0001, now)
  g.gain.exponentialRampToValueAtTime(p.noise * p.gain, now + (p.attack ?? 0.008))
  g.gain.exponentialRampToValueAtTime(0.0001, now + p.duration)

  src.connect(f)
  f.connect(g)
  g.connect(dest)
  src.start(now)
  src.stop(now + p.duration + 0.02)
}

function playSynth(p: SynthPreset) {
  const c = ensureCtx()
  if (!c || !master) return
  const now = c.currentTime
  const attack = p.attack ?? 0.005

  // 总总线：可选全局低通滤波扫频后接入 master，所有层都汇入这里
  const bus = c.createGain()
  bus.gain.value = 1
  if (p.filterFreq && p.filterFreqTo) {
    const filter = c.createBiquadFilter()
    filter.type = 'lowpass'
    filter.Q.value = 0.6
    filter.frequency.setValueAtTime(p.filterFreq, now)
    filter.frequency.exponentialRampToValueAtTime(Math.max(80, p.filterFreqTo), now + p.duration)
    bus.connect(filter)
    filter.connect(master)
  } else {
    bus.connect(master)
  }

  // 噪声摩擦层
  playNoise(c, bus, p, now)

  // 多振荡器叠加，每层独立延迟/包络，做出过渡感
  for (const layer of p.layers) {
    const start = now + (layer.delay ?? 0)
    const end = now + p.duration
    const osc = c.createOscillator()
    const g = c.createGain()
    osc.type = layer.type
    osc.frequency.setValueAtTime(layer.freq, start)
    if (layer.freqTo && layer.freqTo !== layer.freq) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, layer.freqTo), end)
    }
    if (layer.detune) osc.detune.value = layer.detune
    // 起音 + 指数衰减包络
    g.gain.setValueAtTime(0.0001, start)
    g.gain.exponentialRampToValueAtTime(layer.gain * p.gain, start + attack)
    g.gain.exponentialRampToValueAtTime(0.0001, end)
    osc.connect(g)
    g.connect(bus)
    osc.start(start)
    osc.stop(end + 0.02)
  }
}

/** 播放音效：优先已加载的文件音；否则合成音；都没有则忽略。 */
function play(name: string) {
  if (!enabled) return
  const c = ensureCtx()
  if (!c) return
  if (c.state === 'suspended') void c.resume()

  const buf = fileBuffers.get(name)
  if (buf) {
    playBuffer(buf)
    return
  }
  // 已注册文件但未解码：异步加载后播放（首次可能略有延迟）
  if (fileUrls.has(name)) {
    void loadBuffer(name).then((b) => {
      if (b) playBuffer(b)
      else if (SYNTH_PRESETS[name]) playSynth(SYNTH_PRESETS[name])
    })
    return
  }
  const preset = SYNTH_PRESETS[name]
  if (preset) playSynth(preset)
}

function setVolume(v: number) {
  masterVolume = Math.max(0, Math.min(1, v))
  if (master) master.gain.value = masterVolume
}

function setEnabled(v: boolean) {
  enabled = v
}

export interface UseSfxReturn {
  play: (name: string) => void
  unlock: () => void
  register: (name: string, url: string) => void
  preload: () => Promise<void>
  setVolume: (v: number) => void
  setEnabled: (v: boolean) => void
}

export function useSfx(): UseSfxReturn {
  return { play, unlock, register, preload, setVolume, setEnabled }
}
