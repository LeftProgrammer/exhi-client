import { defineStore } from 'pinia'
import type { BootInfo } from '@shared/types'

interface DeviceState {
  boot: BootInfo | null
  ready: boolean
}

export const useDeviceStore = defineStore('device', {
  state: (): DeviceState => ({
    boot: null,
    ready: false
  }),
  actions: {
    async init() {
      this.boot = await window.exhibit.getBootInfo()
      this.ready = true
      window.exhibit.log('info', `渲染层初始化完成: display=${this.boot.displayId}`)
    }
  },
  getters: {
    displayId: (s) => s.boot?.displayId ?? '',
    designBase: (s) => s.boot?.display.designBase ?? { width: 1920, height: 1080 },
    fitPolicy: (s) => s.boot?.display.fitPolicy ?? 'scale'
  }
})
