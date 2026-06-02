import { ref, readonly } from 'vue'
import { useBridge } from '@shared/composables/useBridge'

export type DetailPhase = 'difficulty' | 'core' | 'patent' | 'honor'

export interface ScreenState {
  activePointId: string | null
  detailPhase: DetailPhase
}

const state = ref<ScreenState>({
  activePointId: null,
  detailPhase: 'difficulty'
})

export function useScreenSync() {
  const { emit, on } = useBridge()

  function syncPoint(id: string) {
    state.value.activePointId = id
    state.value.detailPhase = 'difficulty'
    emit('research:point', { id })
  }

  function syncPhase(phase: DetailPhase) {
    state.value.detailPhase = phase
    emit('research:phase', { phase })
  }

  function syncIdle() {
    state.value.activePointId = null
    state.value.detailPhase = 'difficulty'
    emit('research:idle', {})
  }

  function onSyncPoint(cb: (id: string) => void) {
    on('research:point', (payload) => {
      if (payload && typeof payload === 'object' && 'id' in payload) {
        const p = payload as { id: string }
        state.value.activePointId = p.id
        cb(p.id)
      }
    })
  }

  function onSyncPhase(cb: (phase: DetailPhase) => void) {
    on('research:phase', (payload) => {
      if (payload && typeof payload === 'object' && 'phase' in payload) {
        const p = payload as { phase: DetailPhase }
        state.value.detailPhase = p.phase
        cb(p.phase)
      }
    })
  }

  function onSyncIdle(cb: () => void) {
    on('research:idle', () => {
      state.value.activePointId = null
      state.value.detailPhase = 'difficulty'
      cb()
    })
  }

  return {
    state: readonly(state),
    syncPoint,
    syncPhase,
    syncIdle,
    onSyncPoint,
    onSyncPhase,
    onSyncIdle
  }
}
