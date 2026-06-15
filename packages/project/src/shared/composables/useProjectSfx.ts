/**
 * 展厅项目通用音效封装（自动注册 + 预加载文件音源）。
 *
 * 约定：全项目共享音效文件放到 deploy/shared/contents/audio/ 下，文件名固定为：
 *   tap.mp3  /  nav.mp3  /  page.mp3  /  back.mp3
 *
 *   打包时 pkg-assemble 会自动复制 shared/contents/ 到每个项目包内。
 *   某项目想单独覆盖时，只需在 deploy/<项目>/contents/audio/ 放同名文件。
 *
 * 用法（App.vue）：
 *   import { useProjectSfx } from '@shared/composables/useProjectSfx'
 *   const { unlock } = useProjectSfx()
 *   onMounted(() => unlock())
 *
 * 文件不存在时会静默忽略，自动回退到 useSfx 内置合成音。
 */

import { useSfx } from './useSfx'
import { resolvePkgUrl } from '@shared/utils/url'

/** 默认音效文件映射：name → contents 下的相对路径（pkg-assemble 后位于各包 contents/ 内） */
const DEFAULT_SOUND_MAP: Record<string, string> = {
  tap: 'audio/tap.mp3',
  nav: 'audio/nav.mp3',
  page: 'audio/page.mp3',
  back: 'audio/back.mp3'
}

let registered = false

/**
 * 注册项目默认音效文件，并预加载。
 * 幂等：多次调用不会重复注册。
 */
export function useProjectSfx(): ReturnType<typeof useSfx> {
  const sfx = useSfx()

  if (!registered) {
    Object.entries(DEFAULT_SOUND_MAP).forEach(([name, path]) => {
      sfx.register(name, resolvePkgUrl(path))
    })

    // 静默预加载（失败的会 fallback 合成音，不阻断流程）
    sfx.preload().catch(() => {
      /* 预加载失败也没关系，play 时会走合成音兜底 */
    })

    registered = true
  }

  return sfx
}

/**
 * 自定义路径注册（适合不想按默认路径放文件的项目）。
 *
 * 例：useProjectSfxWith({ page: 'assets/sfx/flip.mp3' })
 */
export function useProjectSfxWith(
  overrides: Partial<Record<string, string>>
): ReturnType<typeof useSfx> {
  const sfx = useSfx()

  const map = { ...DEFAULT_SOUND_MAP, ...overrides }
  Object.entries(map)
    .filter((entry): entry is [string, string] => !!entry[1])
    .forEach(([name, path]) => {
      sfx.register(name, resolvePkgUrl(path))
    })

  sfx.preload().catch(() => {
    /* 预加载失败不影响使用，play 会走合成音兜底 */
  })
  return sfx
}
