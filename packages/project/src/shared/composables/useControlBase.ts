import { useRemoteControl } from './useRemoteControl'
import { useBrowserFallback } from './useBrowserFallback'
import { useProjectSfx } from './useProjectSfx'

/**
 * Shared control-layer primitives used by every project's useControl().
 *
 * Extracts the duplicated `sendTo` + `startFallback` boilerplate that was
 * copy-pasted across baima-duowei, baima-milestone, baima-yushui-leaders,
 * and baima-zhineng.
 *
 * Each project still defines its own `setupCommands()` (project-specific
 * command handlers), but now gets the common plumbing for free.
 */
export function useControlBase() {
  const rc = useRemoteControl()
  const fallback = useBrowserFallback()
  const sfx = useProjectSfx()

  return {
    rc,
    fallback,
    sfx,

    /** Send a message to a specific device (multi-screen relay). */
    sendTo(target: string, payload: unknown) {
      rc.sendTo(target, payload)
    },

    /** Start browser-dev WS fallback connection (no exhibitBridge). */
    startFallback(hubId: string) {
      fallback.start({
        hubId,
        onDispatch: (cmd, payload) => rc.dispatch(cmd, payload)
      })
    }
  }
}
