import '@shared/styles/reset.scss'
import { createProjectApp } from '@shared/utils/createProjectApp'
import { router } from './router'
import App from './App.vue'

// 竖屏 55 寸触摸一体机：1920×1080 竖置展示，设计基准 2160×3840
createProjectApp({ designWidth: 2160, designHeight: 3840, rootComponent: App, router })
