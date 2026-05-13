import { defineStore } from 'pinia'
import type { Command } from '@shared/types'

interface CommandState {
  /** 最近 50 条已处理指令（调试用） */
  recent: Command[]
  /** 总数 */
  totalCount: number
}

export const useCommandStore = defineStore('command', {
  state: (): CommandState => ({ recent: [], totalCount: 0 }),
  actions: {
    push(cmd: Command) {
      this.recent.unshift(cmd)
      if (this.recent.length > 50) this.recent.pop()
      this.totalCount++
    }
  }
})
