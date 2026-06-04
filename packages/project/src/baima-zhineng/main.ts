import { initDesignBase } from '@shared/utils/initDesignBase'

// 竖屏 55 寸触摸一体机：1920×1080 竖置展示，设计基准 2160×3840
initDesignBase(2160, 3840)

import { createApp } from 'vue'
import '@shared/styles/reset.scss'
import { router } from './router'
import App from './App.vue'

createApp(App).use(router).mount('#app')
